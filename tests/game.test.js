import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createRng } from '../js/rng.js';
import { createPhysicsField } from '../js/field-physics.js';
import { createGame } from '../js/game.js';

const MIN = CONFIG.game.minChain;

function settle(field) {
  for (let i = 0; i < 60 * 20 && !field.isSettled(); i++) field.step(1 / 60);
}

const make = (seed) => createPhysicsField({ config: CONFIG, rng: createRng(seed) });

test('rescue clears the bottom, refills, and costs one use', () => {
  const field = make(21);
  settle(field);
  const game = createGame({ config: CONFIG, field });
  const before = field.pieces.length;
  const bottom = field.pieces.filter((p) => p.y > field.height - CONFIG.rescue.physicsDepth);
  const result = game.rescue();
  assert.ok(result);
  assert.equal(result.removed.length, bottom.length);
  assert.ok(result.removed.length >= 7, `removed only ${result.removed.length}`);
  for (const p of bottom) assert.ok(!field.pieces.includes(p));
  assert.equal(field.pieces.length, before);
  assert.equal(game.state.rescuesLeft, CONFIG.rescue.count - 1);
  settle(field);
  game.update(1 / 60); // stuck check runs once the board has landed
  assert.ok(field.hasMove(MIN));
});

test(`rescue gives no score or "!", keeps the combo, stops after ${CONFIG.rescue.count}`, () => {
  const field = make(22);
  settle(field);
  const game = createGame({ config: CONFIG, field });
  if (!field.hasMove(MIN)) field.shuffle(MIN);
  game.commit(field.findChain(MIN));
  settle(field);
  if (!field.hasMove(MIN)) field.shuffle(MIN);
  game.state.sinceClear = 0;
  game.commit(field.findChain(MIN));
  const { score, bangs, combo, totalCleared } = game.state;
  assert.equal(combo, 2);
  game.state.sinceClear = CONFIG.combo.window - 0.1;

  for (let i = 0; i < CONFIG.rescue.count; i++) assert.ok(game.rescue());
  assert.equal(game.rescue(), null);
  assert.equal(game.state.rescuesLeft, 0);
  assert.equal(game.state.score, score);
  assert.equal(game.state.bangs, bangs);
  assert.equal(game.state.totalCleared, totalCleared);
  assert.equal(game.state.combo, combo);
  assert.equal(game.state.sinceClear, 0, 'combo window restarts');
});

test('rescue does nothing after the match ends', () => {
  const field = make(23);
  const game = createGame({ config: CONFIG, field, duration: 1 });
  game.state.timerRunning = true;
  game.update(2);
  assert.equal(game.state.phase, 'end');
  assert.equal(game.rescue(), null);
  assert.equal(game.state.rescuesLeft, CONFIG.rescue.count);
});

// ---- fever by cleared pieces, time bonus

// A board where every candy is the same color, so any traced run can be cleared on demand.
function mono(seed = 1) {
  const field = make(seed);
  settle(field);
  for (const p of field.pieces) p.color = 0;
  return field;
}
const run = (field, n) => {
  const chain = field.findChain(n);
  assert.ok(chain, `no chain of ${n}`);
  return chain;
};

test('"!" fills by cleared pieces and fever starts at 7 × piecesPerBang', () => {
  const field = mono(31);
  const game = createGame({ config: CONFIG, field });
  const per = CONFIG.fever.piecesPerBang;
  const recolor = () => {
    settle(field); // refills land first, so they can link
    for (const p of field.pieces) if (!p.special) p.color = 0;
  };
  game.commit(run(field, per * 3));
  assert.equal(game.state.bangs, 3);
  recolor();
  for (let i = 0; i < 4 && !game.state.fever.active; i++) {
    game.commit(run(field, per));
    recolor();
  }
  assert.ok(game.state.fever.active, `bangs=${game.state.bangs} progress=${game.state.bangProgress}`);
  assert.equal(game.state.bangs, 0);
});

test('fever adds time in the timed mode', () => {
  const field = make(32);
  settle(field);
  const game = createGame({ config: CONFIG, field });
  game.state.timeLeft = 20;
  game.startFever();
  assert.equal(game.state.timeLeft, 20 + CONFIG.fever.timeBonus);
});

// ---- star candy

test(`a chain of ${CONFIG.special.minChain} makes one star where the finger lifted; ${CONFIG.special.minChain - 1} does not`, () => {
  const field = mono(33);
  const game = createGame({ config: CONFIG, field });
  const before = field.pieces.length;
  game.commit(run(field, CONFIG.special.minChain - 1));
  assert.equal(field.pieces.filter((p) => p.special).length, 0);
  for (const p of field.pieces) if (!p.special) p.color = 0;
  const chain = run(field, CONFIG.special.minChain);
  const last = chain.at(-1);
  const result = game.commit(chain);
  const stars = field.pieces.filter((p) => p.special);
  assert.equal(result.traced, chain, 'the clear event keeps the traced path (main.js reads it)');
  assert.equal(result.star, 'made');
  assert.equal(stars.length, 1);
  assert.equal(stars[0].color, null);
  assert.ok(Math.hypot(stars[0].x - Math.min(field.width - 0.5, Math.max(0.5, last.x)), stars[0].y - last.y) < 1e-9);
  assert.equal(field.pieces.length, before);
});

test(`no more than ${CONFIG.special.max} stars on the board`, () => {
  const field = mono(34);
  const game = createGame({ config: CONFIG, field });
  for (let i = 0; i < CONFIG.special.max + 2; i++) {
    for (const p of field.pieces) if (!p.special) p.color = 0;
    const chain = field.findChain(CONFIG.special.minChain);
    if (!chain) break;
    game.commit(chain);
    settle(field);
  }
  assert.ok(field.pieces.filter((p) => p.special).length <= CONFIG.special.max);
});

test('stars never link, and shuffle leaves them alone', () => {
  const layout = [];
  for (let i = 0; i < 7; i++) layout.push({ x: 0.5 + i, y: 7.5, special: 'star' });
  for (let i = 0; i < 7; i++) layout.push({ x: 0.5 + i, y: 6.5, color: i % 5 });
  const field = createPhysicsField({ config: CONFIG, rng: createRng(1), layout });
  settle(field);
  const stars = field.pieces.filter((p) => p.special);
  assert.equal(stars.length, 7);
  const chain = field.findChain(MIN);
  assert.ok(!chain || chain.every((p) => !p.special));
  field.shuffle(MIN);
  assert.ok(stars.every((p) => p.special && p.color === null));
  assert.ok(field.findChain(MIN).every((p) => !p.special));
});

test('tapping a star clears its neighbors and scores like a clear', () => {
  const layout = [{ x: 3.5, y: 7.5, special: 'star' }];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) {
    if (row === 0 && col === 3) continue;
    layout.push({ x: col + 0.5, y: 7.5 - row, color: (col + row) % 5 });
  }
  const field = createPhysicsField({ config: CONFIG, rng: createRng(2), layout });
  settle(field);
  const game = createGame({ config: CONFIG, field });
  const star = field.pieces.find((p) => p.special);
  const result = game.commit([star]);
  assert.equal(result.star, 'detonated');
  assert.deepEqual(result.traced, [star]);
  assert.ok(result.removed.length > 4, `removed only ${result.removed.length}`);
  assert.ok(!field.pieces.includes(star));
  assert.equal(game.state.score, result.points);
  assert.ok(game.state.timerRunning);
  assert.equal(game.state.totalCleared, result.removed.length);
});

// ---- endless

test('endless: life does not drain before the first clear', () => {
  const game = createGame({ config: CONFIG, field: make(40), mode: 'endless' });
  game.update(5);
  assert.equal(game.state.timeLeft, CONFIG.endless.start);
});

test('endless: without clears the life runs out and it is game over', () => {
  const game = createGame({ config: CONFIG, field: make(41), mode: 'endless' });
  game.state.timerRunning = true;
  const events = [];
  game.on((e) => events.push(e));
  for (let i = 0; i < 60 * 30 && game.state.phase === 'play'; i++) game.update(1 / 60);
  assert.equal(game.state.phase, 'end');
  assert.equal(game.state.endReason, 'gameover');
  assert.ok(events.some((e) => e.type === 'end' && e.reason === 'gameover'));
  assert.ok(game.state.elapsed < CONFIG.endless.start, 'drain should be at least 1 per second');
});

test('endless: clearing refills life by pieces, capped', () => {
  const field = mono(42);
  const game = createGame({ config: CONFIG, field, mode: 'endless' });
  game.state.timeLeft = 2;
  game.commit(run(field, 4));
  assert.ok(Math.abs(game.state.timeLeft - (2 + 4 * CONFIG.endless.perPiece)) < 1e-9);
  for (const p of field.pieces) if (!p.special) p.color = 0;
  game.state.timeLeft = CONFIG.endless.max - 0.1;
  game.commit(run(field, 5));
  assert.equal(game.state.timeLeft, CONFIG.endless.max);
});

test('endless: drain speeds up with time and stops at drainMax', () => {
  const game = createGame({ config: CONFIG, field: make(43), mode: 'endless' });
  game.state.timerRunning = true;
  game.update(0.01);
  const early = game.state.drainRate;
  game.state.elapsed = 10000;
  game.state.timeLeft = 1000;
  game.update(0.01);
  assert.ok(early < CONFIG.endless.drain * 1.01);
  assert.equal(game.state.drainRate, CONFIG.endless.drainMax);
});

test('timed mode ends with timeup', () => {
  const game = createGame({ config: CONFIG, field: make(44), duration: 1 });
  game.state.timerRunning = true;
  game.update(2);
  assert.equal(game.state.endReason, 'timeup');
});

// ---- last spurt and bonus time (timed mode)

test('last spurt: the same clear fills more "!" once the clock is under lastSpurt.at', () => {
  const clearSix = (timeLeft) => {
    const field = mono(50);
    const game = createGame({ config: CONFIG, field });
    game.state.timerRunning = true;
    game.state.timeLeft = timeLeft;
    game.update(1 / 60);
    game.commit(run(field, 6));
    return game.state.bangProgress;
  };
  const normal = clearSix(40);
  const spurt = clearSix(CONFIG.lastSpurt.at - 1);
  assert.ok(Math.abs(normal - 6 / CONFIG.fever.piecesPerBang) < 1e-9);
  assert.ok(Math.abs(spurt - 6 / CONFIG.lastSpurt.piecesPerBang) < 1e-9);
});

test('last spurt: entering it does not turn earlier clears into extra "!"', () => {
  const field = mono(51);
  const game = createGame({ config: CONFIG, field });
  game.state.timerRunning = true;
  game.state.timeLeft = CONFIG.lastSpurt.at + 0.5;
  game.commit(run(field, 7));
  const before = { bangs: game.state.bangs, progress: game.state.bangProgress };
  const events = [];
  game.on((e) => events.push(e.type));
  game.update(1);
  assert.ok(game.state.lastSpurt);
  assert.ok(events.includes('lastSpurt'));
  assert.equal(game.state.bangs, before.bangs);
  assert.equal(game.state.bangProgress, before.progress);
});

test('bonus time: a fever running at 0 keeps the match going until the fever ends', () => {
  const game = createGame({ config: CONFIG, field: make(52) });
  game.state.timerRunning = true;
  game.state.timeLeft = 1;
  game.startFever();
  game.state.timeLeft = 1; // ignore the time bonus for this check
  const events = [];
  game.on((e) => events.push(e.type));
  game.update(1.5);
  assert.equal(game.state.phase, 'play');
  assert.ok(game.state.bonusTime);
  assert.equal(game.state.timeLeft, 0);
  assert.ok(events.includes('bonusStart'));
  for (let i = 0; i < 60 * (CONFIG.fever.duration + 1) && game.state.phase === 'play'; i++) game.update(1 / 60);
  assert.equal(game.state.phase, 'end');
  assert.equal(game.state.endReason, 'timeup');
  assert.ok(game.summary().bonusTime);
});

test('bonus time: without a fever, time up ends the match at once', () => {
  const game = createGame({ config: CONFIG, field: make(53) });
  game.state.timerRunning = true;
  game.state.timeLeft = 0.5;
  game.update(1);
  assert.equal(game.state.phase, 'end');
  assert.equal(game.state.bonusTime, false);
});

test('endless has no last spurt or bonus time', () => {
  const game = createGame({ config: CONFIG, field: make(54), mode: 'endless' });
  game.state.timerRunning = true;
  game.state.timeLeft = 1;
  game.startFever();
  game.state.timeLeft = 0.2;
  game.update(1);
  assert.equal(game.state.lastSpurt, false);
  assert.equal(game.state.phase, 'end');
  assert.equal(game.state.endReason, 'gameover');
});

test('a fever that starts in the last spurt adds no time, so it runs into bonus time', () => {
  const game = createGame({ config: CONFIG, field: make(55) });
  game.state.timerRunning = true;
  game.state.timeLeft = CONFIG.lastSpurt.at - 0.5;
  game.update(1 / 60);
  assert.ok(game.state.lastSpurt);
  const before = game.state.timeLeft;
  game.startFever();
  assert.equal(game.state.timeLeft, before);
  for (let i = 0; i < 60 * CONFIG.lastSpurt.at && !game.state.bonusTime; i++) game.update(1 / 60);
  assert.ok(game.state.bonusTime, 'fever should still be running when the clock hits 0');
});
