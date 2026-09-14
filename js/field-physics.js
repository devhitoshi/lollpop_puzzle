// ?feel=physics — round candies in a box, piling up and rolling like the real thing.
// Verlet integration with a fixed step: velocity is implied by (position − previous position),
// collisions just push positions apart. Piles stay calm, and the result is identical at 30 or 120 fps.
// No DOM access, so tests run it in Node.

import {
  newId, makeSquash, hitSquash, findChain, pickNearest, recolorUntilMove,
} from './field-common.js';

// layout: optional array of { x, y, color } for fixed boards (tutorial, tests).
export function createPhysicsField({ config, rng, colorCount = 5, layout = null, count = config.physics.count }) {
  const c = config.physics;
  const W = c.width;
  const H = c.height;
  const h = c.step;
  const pieces = [];
  let accumulator = 0;
  let restTime = 0;

  function spawn(x, y, color) {
    const r = c.radius * (1 + (rng() * 2 - 1) * c.radiusJitter);
    const p = {
      id: newId(),
      color,
      x,
      y,
      px: x,
      py: y,
      r,
      angle: rng() * 0.6 - 0.3,
      squash: makeSquash(c.squashSpring),
      alive: true,
    };
    pieces.push(p);
    return p;
  }

  if (layout) {
    for (const { x, y, color } of layout) spawn(x, y, color);
  } else {
    // Loose rows starting above the box: they rain in and settle into a pile.
    const perRow = Math.floor(W);
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const x = col + 0.5 + (rng() - 0.5) * 0.3;
      const y = H - 0.5 - row * 1.05 - H * 0.6;
      spawn(x, y, Math.floor(rng() * colorCount));
    }
  }

  const isAdjacent = (a, b) => {
    if (a === b) return false;
    const reach = (a.r + b.r) * c.linkFactor;
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= reach * reach;
  };

  function simulate() {
    const drag = 1 - c.airDrag * h;
    for (const p of pieces) {
      const vx = (p.x - p.px) * drag;
      const vy = (p.y - p.py) * drag;
      p.px = p.x;
      p.py = p.y;
      p.x += vx;
      p.y += vy + c.gravity * h * h;
    }

    for (let it = 0; it < c.iterations; it++) {
      const first = it === 0;
      for (let i = 0; i < pieces.length; i++) {
        const a = pieces[i];
        for (let j = i + 1; j < pieces.length; j++) {
          const b = pieces[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const min = a.r + b.r;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min || d2 < 1e-9) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          const push = (min - d) / 2;

          if (first) {
            // Closing speed along the normal, before separation → squash on hard hits.
            const closing = ((a.x - a.px) - (b.x - b.px)) * nx + ((a.y - a.py) - (b.y - b.py)) * ny;
            const speed = closing / h;
            if (speed > 2) {
              hitSquash(a, speed, c);
              hitSquash(b, speed, c);
            }
          }

          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;

          // Friction: bleed a little tangential relative motion so piles don't slide forever.
          const tx = -ny;
          const ty = nx;
          const rel = ((b.x - b.px) - (a.x - a.px)) * tx + ((b.y - b.py) - (a.y - a.py)) * ty;
          const f = rel * c.friction * 0.5;
          a.px -= tx * f;
          a.py -= ty * f;
          b.px += tx * f;
          b.py += ty * f;
        }
      }

      for (const p of pieces) {
        if (p.x < p.r) {
          const v = p.x - p.px;
          p.x = p.r;
          p.px = p.x + v * c.restitution;
        } else if (p.x > W - p.r) {
          const v = p.x - p.px;
          p.x = W - p.r;
          p.px = p.x + v * c.restitution;
        }
        if (p.y > H - p.r) {
          const v = p.y - p.py;
          if (first) hitSquash(p, v / h, c);
          p.y = H - p.r;
          p.py = p.y + v * c.restitution;
          // Rolling on the floor
          p.px += (p.x - p.px) * c.friction;
        }
      }
    }

    let fastest = 0;
    for (const p of pieces) {
      const vx = (p.x - p.px) / h;
      const vy = (p.y - p.py) / h;
      fastest = Math.max(fastest, Math.abs(vx), Math.abs(vy));
      p.angle += (p.x - p.px) / p.r * 0.5;
      p.squash.step(h);
    }
    restTime = fastest < c.settleSpeed ? restTime + h : 0;
  }

  const field = {
    kind: 'physics',
    width: W,
    height: H,
    pieces,

    pick: (x, y, radius) => pickNearest(pieces, x, y, radius),
    isAdjacent,

    remove(ids, { blast = 0 } = {}) {
      const doomed = new Set(pieces.filter((p) => ids.includes(p.id)));
      if (blast > 0) {
        for (const p of [...doomed]) {
          for (const q of pieces) {
            const reach = (p.r + q.r) * blast;
            if ((p.x - q.x) ** 2 + (p.y - q.y) ** 2 <= reach * reach) doomed.add(q);
          }
        }
      }
      if (doomed.size === 0) return [];
      for (const p of doomed) p.alive = false;
      for (let i = pieces.length - 1; i >= 0; i--) if (!pieces[i].alive) pieces.splice(i, 1);

      // Refill from above the box, staggered so new candies don't spawn inside each other.
      const top = Math.min(0, ...pieces.map((p) => p.y - p.r));
      let i = 0;
      for (const gone of doomed) {
        const x = Math.min(W - 0.5, Math.max(0.5, gone.x + (rng() - 0.5) * 1.2));
        spawn(x, top - 0.6 - i * c.spawnGap, Math.floor(rng() * colorCount));
        i++;
      }
      restTime = 0;
      return [...doomed];
    },

    // depth = distance from the floor. The stuck check in game.js guarantees a move once things land.
    blastBottom(depth = config.rescue.physicsDepth, min = config.game.minChain) {
      const ids = pieces.filter((p) => p.y > H - depth).map((p) => p.id);
      const removed = field.remove(ids);
      field.shuffle(min);
      return removed;
    },

    step(dt) {
      accumulator += dt;
      let n = 0;
      while (accumulator >= h && n < c.maxSubsteps) {
        simulate();
        accumulator -= h;
        n++;
      }
      if (n === c.maxSubsteps) accumulator = 0; // a long stall (tab switch) doesn't fast-forward
    },

    isSettled: () => restTime >= c.settleTime,

    findChain: (min) => findChain(pieces, isAdjacent, min),
    hasMove: (min) => findChain(pieces, isAdjacent, min) !== null,
    shuffle: (min) => recolorUntilMove(field, rng, colorCount, min),
  };

  return field;
}
