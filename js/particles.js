// A fixed-size particle pool: confetti, sparkles, stars and hearts.
// Coordinates are whatever the caller uses (field units on the board, CSS px on the result overlay);
// `draw` gets a mapping to canvas pixels. Dead slots are reused, so bursts never allocate.

const TAU = Math.PI * 2;

export function createParticles(max) {
  const pool = Array.from({ length: max }, () => ({ alive: false }));
  let cursor = 0;
  let alive = 0;

  function spawn(o) {
    // Find a free slot; if the pool is full, overwrite the oldest-ish slot at the cursor
    let p = null;
    for (let i = 0; i < max; i++) {
      const slot = pool[(cursor + i) % max];
      if (!slot.alive) {
        p = slot;
        cursor = (cursor + i + 1) % max;
        break;
      }
    }
    if (!p) {
      p = pool[cursor];
      cursor = (cursor + 1) % max;
      alive--;
    }
    Object.assign(p, {
      alive: true,
      x: o.x,
      y: o.y,
      vx: o.vx ?? 0,
      vy: o.vy ?? 0,
      gravity: o.gravity ?? 0,
      drag: o.drag ?? 0.6,
      life: o.life ?? 1,
      t: 0,
      size: o.size ?? 0.1,
      color: o.color ?? '#fff',
      shape: o.shape ?? 'dot', // dot | confetti | star | heart
      angle: o.angle ?? Math.random() * TAU,
      spin: o.spin ?? (Math.random() - 0.5) * 12,
      wobble: Math.random() * TAU,
    });
    alive++;
  }

  function step(dt) {
    if (alive === 0 || dt <= 0) return;
    for (const p of pool) {
      if (!p.alive) continue;
      p.t += dt;
      if (p.t >= p.life) {
        p.alive = false;
        alive--;
        continue;
      }
      const k = Math.max(0, 1 - p.drag * dt);
      p.vx *= k;
      p.vy = p.vy * k + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
      p.wobble += dt * 6;
    }
  }

  // toX/toY map to canvas pixels, unit = canvas pixels per coordinate unit
  function draw(ctx, toX, toY, unit) {
    if (alive === 0) return;
    for (const p of pool) {
      if (!p.alive) continue;
      const k = p.t / p.life;
      ctx.globalAlpha = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
      ctx.fillStyle = p.color;
      const s = p.size * unit;
      const x = toX(p.x);
      const y = toY(p.y);
      if (p.shape === 'dot') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath();
        ctx.arc(x, y, s, 0, TAU);
        ctx.fill();
        continue;
      }
      const c = Math.cos(p.angle);
      const sn = Math.sin(p.angle);
      if (p.shape === 'confetti') {
        // A paper strip flipping over: its width follows the wobble
        const w = Math.abs(Math.cos(p.wobble));
        ctx.setTransform(c, sn, -sn, c, x, y);
        ctx.fillRect(-s * w, -s * 0.5, s * 2 * w, s);
      } else if (p.shape === 'star') {
        ctx.setTransform(c, sn, -sn, c, x, y);
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const r = i % 2 === 0 ? s * 1.3 : s * 0.55;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.fill();
      } else if (p.shape === 'heart') {
        ctx.setTransform(c * s, sn * s, -sn * s, c * s, x, y);
        ctx.beginPath();
        ctx.moveTo(0, 0.9);
        ctx.bezierCurveTo(-1.4, -0.1, -0.7, -1.2, 0, -0.45);
        ctx.bezierCurveTo(0.7, -1.2, 1.4, -0.1, 0, 0.9);
        ctx.fill();
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
  }

  return {
    spawn,
    step,
    draw,
    clear() {
      for (const p of pool) p.alive = false;
      alive = 0;
    },
    get count() {
      return alive;
    },
  };
}
