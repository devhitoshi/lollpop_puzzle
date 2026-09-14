// ?feel=grid — candies sit in a 7 × 8 grid. Rules are exact (cells), motion is soft:
// candies fall under gravity, flatten on landing and wobble back on a spring.
// No DOM access, so tests run it in Node.

import {
  newId, makeSquash, hitSquash, findChain, pickNearest, recolorUntilMove,
} from './field-common.js';

// layout: optional array of strings, one per row from the top, digits = color index.
export function createGridField({ config, rng, colorCount = 5, adjacency = config.grid.adjacency, layout = null, dropIn = true }) {
  const g = config.grid;
  const { cols, rows } = g;
  const cells = Array.from({ length: rows }, () => Array(cols).fill(null));
  const pieces = [];

  function spawn(col, row, color, y) {
    const p = {
      id: newId(),
      color,
      col,
      row,
      x: col + 0.5,
      y,
      vy: 0,
      r: 0.5,
      angle: 0,
      squash: makeSquash(g.squashSpring),
      alive: true,
    };
    cells[row][col] = p;
    pieces.push(p);
    return p;
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const color = layout ? Number(layout[row][col]) : Math.floor(rng() * colorCount);
      // Drop-in intro: the whole board falls from above, bottom rows first.
      const y = dropIn ? row + 0.5 - rows - 1 - (rows - row) * 0.35 : row + 0.5;
      spawn(col, row, color, y);
    }
  }

  const isAdjacent = (a, b) => {
    if (a === b) return false;
    const dc = Math.abs(a.col - b.col);
    const dr = Math.abs(a.row - b.row);
    return adjacency === 8 ? dc <= 1 && dr <= 1 : dc + dr === 1;
  };

  const field = {
    kind: 'grid',
    width: cols,
    height: rows,
    pieces,
    adjacency,
    cells,

    pick: (x, y, radius) => pickNearest(pieces, x, y, radius),
    isAdjacent,

    remove(ids, { blast = 0 } = {}) {
      const doomed = new Set();
      for (const p of pieces) if (ids.includes(p.id)) doomed.add(p);
      if (blast > 0) {
        for (const p of [...doomed]) {
          for (let dr = -blast; dr <= blast; dr++) {
            for (let dc = -blast; dc <= blast; dc++) {
              const q = cells[p.row + dr]?.[p.col + dc];
              if (q) doomed.add(q);
            }
          }
        }
      }
      if (doomed.size === 0) return [];

      for (const p of doomed) {
        p.alive = false;
        cells[p.row][p.col] = null;
      }
      for (let i = pieces.length - 1; i >= 0; i--) if (!pieces[i].alive) pieces.splice(i, 1);

      for (let col = 0; col < cols; col++) {
        // Compact the column downward; survivors keep their visual y and fall to the new row.
        let write = rows - 1;
        let topY = Infinity;
        for (let row = rows - 1; row >= 0; row--) {
          const p = cells[row][col];
          if (!p) continue;
          cells[row][col] = null;
          cells[write][col] = p;
          p.row = write;
          topY = Math.min(topY, p.y);
          write--;
        }
        const missing = write + 1;
        const base = Math.min(0.5, topY);
        for (let row = 0; row < missing; row++) {
          const y = base - (missing - row) * g.spawnGap;
          spawn(col, row, Math.floor(rng() * colorCount), y);
        }
      }
      return [...doomed];
    },

    // depth = rows from the bottom
    blastBottom(depth = config.rescue.gridRows, min = config.game.minChain) {
      const ids = pieces.filter((p) => p.row >= rows - depth).map((p) => p.id);
      const removed = field.remove(ids);
      field.shuffle(min);
      return removed;
    },

    step(dt) {
      for (const p of pieces) {
        const target = p.row + 0.5;
        if (p.y < target || p.vy !== 0) {
          p.vy = Math.min(p.vy + g.gravity * dt, g.maxFall);
          p.y += p.vy * dt;
          if (p.y >= target && p.vy > 0) {
            const impact = p.vy;
            p.y = target;
            hitSquash(p, impact, g);
            const up = impact * g.bounce;
            p.vy = up > 1.2 ? -up : 0;
          }
        }
        p.squash.step(dt);
      }
    },

    isSettled() {
      return pieces.every((p) => p.vy === 0 && p.y === p.row + 0.5 && p.squash.isSettled(2e-3));
    },

    findChain: (min) => findChain(pieces, isAdjacent, min),
    hasMove: (min) => findChain(pieces, isAdjacent, min) !== null,
    shuffle: (min) => recolorUntilMove(field, rng, colorCount, min),
  };

  if (!layout && !field.hasMove(config.game.minChain)) field.shuffle(config.game.minChain);
  return field;
}
