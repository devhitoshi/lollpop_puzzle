import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createRng } from '../js/rng.js';
import { createPhysicsField } from '../js/field-physics.js';

const MIN = CONFIG.game.minChain;

function settle(field, maxSeconds = 20) {
  const dt = 1 / 60;
  for (let t = 0; t < maxSeconds; t += dt) {
    field.step(dt);
    if (field.isSettled()) return t;
  }
  return Infinity;
}

const make = (seed, extra = {}) => createPhysicsField({ config: CONFIG, rng: createRng(seed), ...extra });

test('settles and stays inside the box', () => {
  const field = make(1);
  assert.ok(settle(field) < 20, 'did not settle');
  for (const p of field.pieces) {
    assert.ok(p.x >= p.r - 1e-3 && p.x <= field.width - p.r + 1e-3, `x out of bounds: ${p.x}`);
    assert.ok(p.y <= field.height - p.r + 1e-3, `below floor: ${p.y}`);
    assert.ok(p.y >= 0, `above the top after settling: ${p.y}`);
  }
});

test('same seed gives the same board', () => {
  const a = make(42);
  const b = make(42);
  settle(a);
  settle(b);
  const snap = (f) => f.pieces.map((p) => [p.color, p.x.toFixed(4), p.y.toFixed(4)]).join('|');
  assert.equal(snap(a), snap(b));
});

test('findChain returns a connected same-color path', () => {
  const field = make(7);
  settle(field);
  if (!field.hasMove(MIN)) field.shuffle(MIN);
  const chain = field.findChain(MIN);
  assert.ok(chain, 'no chain found after shuffle');
  assert.equal(chain.length, MIN);
  assert.equal(new Set(chain.map((p) => p.color)).size, 1);
  for (let i = 1; i < chain.length; i++) assert.ok(field.isAdjacent(chain[i - 1], chain[i]));
});

test('remove clears and refills to the same count', () => {
  const field = make(3);
  settle(field);
  if (!field.hasMove(MIN)) field.shuffle(MIN);
  const before = field.pieces.length;
  const chain = field.findChain(MIN);
  const removed = field.remove(chain.map((p) => p.id));
  assert.equal(removed.length, MIN);
  assert.equal(field.pieces.length, before);
  for (const p of chain) assert.ok(!field.pieces.includes(p));
  assert.ok(settle(field) < 20, 'did not settle after refill');
});

test('blast removes neighbors too', () => {
  const field = make(5);
  settle(field);
  const center = field.pick(field.width / 2, field.height - 2, 1);
  const removed = field.remove([center.id], { blast: CONFIG.fever.blastFactor });
  assert.ok(removed.length > 1, `blast removed only ${removed.length}`);
});

test('shuffle always leaves a move', () => {
  for (let seed = 100; seed < 110; seed++) {
    const field = make(seed);
    settle(field);
    field.shuffle(MIN);
    assert.ok(field.hasMove(MIN), `seed ${seed}`);
  }
});

test('result does not depend on frame rate', () => {
  const a = make(11);
  const b = make(11);
  for (let i = 0; i < 60 * 4; i++) a.step(1 / 60);
  for (let i = 0; i < 120 * 4; i++) b.step(1 / 120);
  const worst = Math.max(...a.pieces.map((p, i) => Math.hypot(p.x - b.pieces[i].x, p.y - b.pieces[i].y)));
  assert.ok(worst < 1e-6, `drift ${worst}`);
});

test('kick pushes candies away and they settle back inside the box', () => {
  const field = make(12);
  settle(field);
  const cx = field.width / 2;
  const cy = field.height - 1.5;
  const near = field.pieces.filter((p) => Math.hypot(p.x - cx, p.y - cy) < 2);
  const before = near.map((p) => [p.x, p.y]);
  field.kick(cx, cy, { radius: 3, strength: CONFIG.fx.kickStar, up: CONFIG.fx.kickFever });
  for (let i = 0; i < 6; i++) field.step(1 / 60);
  const moved = near.filter((p, i) => Math.hypot(p.x - before[i][0], p.y - before[i][1]) > 0.02);
  assert.ok(moved.length >= near.length / 2, `only ${moved.length}/${near.length} moved`);
  assert.ok(settle(field) < 20, 'did not settle after a kick');
  for (const p of field.pieces) {
    assert.ok(p.x >= p.r - 1e-3 && p.x <= field.width - p.r + 1e-3, `x out of bounds: ${p.x}`);
    assert.ok(p.y <= field.height - p.r + 1e-3, `below floor: ${p.y}`);
  }
});
