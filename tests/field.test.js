import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createRng } from '../js/rng.js';
import { createGridField } from '../js/field-grid.js';
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

const makers = {
  grid: (seed, extra = {}) => createGridField({ config: CONFIG, rng: createRng(seed), ...extra }),
  physics: (seed, extra = {}) => createPhysicsField({ config: CONFIG, rng: createRng(seed), ...extra }),
};

for (const [kind, make] of Object.entries(makers)) {
  test(`${kind}: settles and stays inside the box`, () => {
    const field = make(1);
    assert.ok(settle(field) < 20, 'did not settle');
    for (const p of field.pieces) {
      assert.ok(p.x >= p.r - 1e-3 && p.x <= field.width - p.r + 1e-3, `x out of bounds: ${p.x}`);
      assert.ok(p.y <= field.height - p.r + 1e-3, `below floor: ${p.y}`);
      assert.ok(p.y >= 0, `above the top after settling: ${p.y}`);
    }
  });

  test(`${kind}: same seed gives the same board`, () => {
    const a = make(42);
    const b = make(42);
    settle(a);
    settle(b);
    const snap = (f) => f.pieces.map((p) => [p.color, p.x.toFixed(4), p.y.toFixed(4)]).join('|');
    assert.equal(snap(a), snap(b));
  });

  test(`${kind}: findChain returns a connected same-color path`, () => {
    const field = make(7);
    settle(field);
    if (!field.hasMove(MIN)) field.shuffle(MIN);
    const chain = field.findChain(MIN);
    assert.ok(chain, 'no chain found after shuffle');
    assert.equal(chain.length, MIN);
    assert.equal(new Set(chain.map((p) => p.color)).size, 1);
    for (let i = 1; i < chain.length; i++) assert.ok(field.isAdjacent(chain[i - 1], chain[i]));
  });

  test(`${kind}: remove clears and refills to the same count`, () => {
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

  test(`${kind}: blast removes neighbors too`, () => {
    const field = make(5);
    settle(field);
    const center = field.pick(field.width / 2, field.height - 2, 1);
    const blast = kind === 'grid' ? CONFIG.fever.blastCells : CONFIG.fever.blastFactor;
    const removed = field.remove([center.id], { blast });
    assert.ok(removed.length > 1, `blast removed only ${removed.length}`);
  });

  test(`${kind}: shuffle always leaves a move`, () => {
    for (let seed = 100; seed < 110; seed++) {
      const field = make(seed);
      settle(field);
      field.shuffle(MIN);
      assert.ok(field.hasMove(MIN), `seed ${seed}`);
    }
  });
}

test('grid: 4-way adjacency rejects diagonals, 8-way accepts', () => {
  const layout = ['0000000', '0000000', '0000000', '0000000', '0000000', '0000000', '0000000', '0000000'];
  const f4 = makers.grid(1, { layout, adjacency: 4, dropIn: false });
  const f8 = makers.grid(1, { layout, adjacency: 8, dropIn: false });
  const at = (f, col, row) => f.cells[row][col];
  assert.equal(f4.isAdjacent(at(f4, 0, 0), at(f4, 1, 1)), false);
  assert.equal(f8.isAdjacent(at(f8, 0, 0), at(f8, 1, 1)), true);
  assert.equal(f4.isAdjacent(at(f4, 0, 0), at(f4, 0, 1)), true);
  assert.equal(f8.isAdjacent(at(f8, 0, 0), at(f8, 2, 0)), false);
});

test('grid: pieces above a cleared cell fall into it', () => {
  const layout = ['0123401', '1234012', '2340123', '3401234', '4012340', '0123401', '1234012', '2340123'];
  const field = makers.grid(1, { layout, dropIn: false });
  const above = field.cells[6][3];
  const target = field.cells[7][3];
  field.remove([target.id]);
  assert.equal(above.row, 7);
  settle(field);
  assert.equal(field.cells[7][3], above);
  assert.equal(above.y, 7.5);
});

test('grid: landing squashes then recovers', () => {
  const field = makers.grid(9);
  let squashed = false;
  for (let i = 0; i < 600; i++) {
    field.step(1 / 60);
    if (field.pieces.some((p) => p.squash.x < 0.9)) squashed = true;
  }
  assert.ok(squashed, 'never squashed');
  for (const p of field.pieces) assert.ok(Math.abs(p.squash.x - 1) < 0.01);
});

test('physics: result does not depend on frame rate', () => {
  const a = makers.physics(11);
  const b = makers.physics(11);
  for (let i = 0; i < 60 * 4; i++) a.step(1 / 60);
  for (let i = 0; i < 120 * 4; i++) b.step(1 / 120);
  const worst = Math.max(...a.pieces.map((p, i) => Math.hypot(p.x - b.pieces[i].x, p.y - b.pieces[i].y)));
  assert.ok(worst < 1e-6, `drift ${worst}`);
});
