// Helpers for the board (js/field-physics.js), kept apart so tests and tools can reuse them.
//
// The field contract — what game.js, input.js and render.js rely on:
//   width, height              size in candy units (one candy ≈ 1 unit across)
//   pieces                     live pieces: { id, color, x, y, r, angle, squash, alive, special? }
//                              a star candy has special: 'star' and color: null — it never links and is never recolored
//   pick(x, y, radius)         nearest piece whose center is within radius
//   isAdjacent(a, b)           spatial link only; color is checked by the caller
//   remove(ids, { blast, special })  clears pieces (plus neighbors when blast) and refills; returns removed pieces.
//                              special: { x, y } turns one refill into a star candy at that spot
//   step(dt)                   advances animation / simulation
//   isSettled()                nothing is moving
//   hasMove(min)               some same-color chain of `min` exists
//   findChain(min)             one such chain as an array of pieces (hints, tutorial, tests)
//   shuffle()                  recolors until a move exists
//   blastBottom(depth)         rescue: clears the bottom of the board, refills and remixes colors
//   kick(x, y, { radius, strength, up })  effects only: pushes candies within radius away from (x, y), plus `up`

import { Spring } from './spring.js';

let nextId = 1;
export const newId = () => nextId++;

export function makeSquash(params) {
  return new Spring(params, 1);
}

// Impact → squash. The spring then wobbles back to 1, which reads as a soft candy landing.
export function hitSquash(piece, speed, { squashPerSpeed, squashMax }) {
  const amount = Math.min(squashMax, speed * squashPerSpeed);
  if (amount < 0.02) return;
  piece.squash.x = Math.min(piece.squash.x, 1 - amount);
  piece.squash.v = 0;
}

// Depth-first search for a simple path of `min` same-color pieces.
export function findChain(pieces, isAdjacent, min) {
  const neighbors = new Map();
  for (const a of pieces) neighbors.set(a, []);
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      const a = pieces[i];
      const b = pieces[j];
      if (a.color !== null && a.color === b.color && isAdjacent(a, b)) {
        neighbors.get(a).push(b);
        neighbors.get(b).push(a);
      }
    }
  }
  const path = [];
  const used = new Set();
  const dfs = (p) => {
    path.push(p);
    used.add(p);
    if (path.length >= min) return true;
    for (const n of neighbors.get(p)) {
      if (!used.has(n) && dfs(n)) return true;
    }
    path.pop();
    used.delete(p);
    return false;
  };
  for (const p of pieces) {
    if (neighbors.get(p).length === 0 && min > 1) continue;
    if (dfs(p)) return path.slice();
  }
  return null;
}

export function pickNearest(pieces, x, y, radius) {
  let best = null;
  let bestD = radius * radius;
  for (const p of pieces) {
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d <= bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

// Recolor everything until a move exists. Colors change in place, so the pile keeps its shape.
export function recolorUntilMove(field, rng, colorCount, min) {
  for (let attempt = 0; attempt < 60; attempt++) {
    for (const p of field.pieces) if (!p.special) p.color = Math.floor(rng() * colorCount);
    if (field.hasMove(min)) break;
  }
  if (!field.hasMove(min)) forceChain(field, min);
  for (const p of field.pieces) {
    p.squash.x = 0.7;
    p.squash.v = 0;
  }
}

// Last resort: paint a connected run one color. Walks neighbors greedily from the first piece.
function forceChain(field, min) {
  const first = field.pieces.find((p) => !p.special);
  if (!first) return;
  const run = [first];
  while (run.length < min) {
    const last = run[run.length - 1];
    const next = field.pieces.find((p) => !p.special && !run.includes(p) && field.isAdjacent(last, p));
    if (!next) break;
    run.push(next);
  }
  for (const p of run) p.color = first.color;
}
