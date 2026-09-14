import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createRng } from '../js/rng.js';
import { createGridField } from '../js/field-grid.js';
import { createPhysicsField } from '../js/field-physics.js';
import { createGame } from '../js/game.js';

const MIN = CONFIG.game.minChain;

function settle(field) {
  for (let i = 0; i < 60 * 20 && !field.isSettled(); i++) field.step(1 / 60);
}

const makers = {
  grid: (seed) => createGridField({ config: CONFIG, rng: createRng(seed) }),
  physics: (seed) => createPhysicsField({ config: CONFIG, rng: createRng(seed) }),
};

for (const [kind, make] of Object.entries(makers)) {
  test(`${kind}: rescue clears the bottom, refills, and costs one use`, () => {
    const field = make(21);
    settle(field);
    const game = createGame({ config: CONFIG, field });
    const before = field.pieces.length;
    const bottom = field.pieces.filter((p) => (kind === 'grid'
      ? p.row >= field.height - CONFIG.rescue.gridRows
      : p.y > field.height - CONFIG.rescue.physicsDepth));
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

  test(`${kind}: rescue gives no score or "!", keeps the combo, stops after ${CONFIG.rescue.count}`, () => {
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
}

test('rescue does nothing after the match ends', () => {
  const field = makers.grid(23);
  const game = createGame({ config: CONFIG, field, duration: 1 });
  game.state.timerRunning = true;
  game.update(2);
  assert.equal(game.state.phase, 'end');
  assert.equal(game.rescue(), null);
  assert.equal(game.state.rescuesLeft, CONFIG.rescue.count);
});
