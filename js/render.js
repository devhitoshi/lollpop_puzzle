// Canvas drawing. Pieces are pre-drawn once per color into offscreen canvases and stamped with
// drawImage, so a frame is ~60 image draws plus a few lines — cheap even on older phones.
// What a piece looks like comes from the skin (js/skin.js): drawn candy, or piece art scaled once.

import { createParticles } from './particles.js';

const TAU = Math.PI * 2;
const GOLD = ['#ffd44d', '#ffe98a', '#ffb300', '#ffffff'];

export function createRenderer(canvas, { config, colors, reducedMotion = false }) {
  const ctx = canvas.getContext('2d');
  const R = config.render;
  const FX = config.fx;
  const particles = createParticles(FX.maxParticles);
  const many = (n) => Math.max(1, Math.round(n * (reducedMotion ? FX.reducedParticleScale : 1)));
  let flashLeft = 0;
  let flashTotal = 0;
  let flashAlpha = 0;
  let flashColor = '#ffffff';
  let shakeAmp = 0.18;
  let sparkleDebt = 0; // fractional particles owed by the per-second emitters
  let goldDebt = 0;
  let dpr = 1;
  let cssW = 0;
  let cssH = 0;
  let scale = 1; // CSS px per field unit
  let ox = 0;
  let oy = 0;
  let field = null;
  let sprites = []; // per color: { normal, happy, pop, fever, radius (field units for a 0.5-radius piece), stick }
  let starSprite = null; // the star candy (made by long chains), same shape for every skin
  const STAR_COLOR = '#ff4f9a';
  let skin = null;
  const effects = [];
  let shakeLeft = 0;
  let shakeTotal = 0;
  // Colors that follow the UI theme (js/theme.js reads them from CSS). Defaults are the old dark look.
  let theme = { boardBg: '#1a1113', boardTint: 'rgba(255,245,249,0.04)', textStroke: '#1a1113', textFill: '#fff5f9', traceEdge: 'transparent', font: 'sans-serif', display: 'sans-serif', feverRay: 'rgba(255,79,154,0.14)' };
  const visible = (c) => c && c !== 'transparent' && c !== 'none';
  // White candies vanish on a light board, so their effects use the accent band color
  const effectColor = (c) => (c.fill === '#ffffff' ? c.band ?? c.rim : c.fill);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = rect.width;
    cssH = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, R.maxDpr);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    if (!field) return;
    scale = Math.min(cssW / field.width, cssH / field.height);
    ox = (cssW - field.width * scale) / 2;
    oy = (cssH - field.height * scale) / 2;
    buildSprites();
  }

  const spriteOf = (p) => (p.special ? starSprite : sprites[p.color]);
  // Drawn radius of a piece, in field units
  const candyR = (p) => ((spriteOf(p)?.radius ?? R.candyRadius) / 0.5) * p.r;

  function buildSprites() {
    sprites = colors.map((c, i) => {
      const art = skin?.pieces[i];
      if (art?.image) {
        const px = R.artRadius * scale * dpr;
        const face = (img) => (img ? drawArt(img, px) : null);
        const normal = drawArt(art.image, px);
        const happy = face(art.happy);
        // Missing faces fall back so every piece always has something to show
        return { normal, happy, pop: face(art.pop) ?? happy ?? normal, fever: face(art.fever) ?? normal, radius: R.artRadius, stick: skin.stick };
      }
      const candy = drawCandy(c, R.candyRadius * scale * dpr);
      return { normal: candy, happy: null, pop: candy, fever: candy, radius: R.candyRadius, stick: true };
    });
    const star = drawStar(R.starRadius * scale * dpr);
    starSprite = { normal: star, happy: null, pop: star, fever: star, radius: R.starRadius, stick: false };
  }

  // Star candy: a glowing pink star with a white rim and a "!" — reads as "tap me" on any skin
  function drawStar(radius) {
    const size = Math.ceil(radius * 2.6);
    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const g = off.getContext('2d');
    const c = size / 2;
    const glow = g.createRadialGradient(c, c, radius * 0.4, c, c, size / 2);
    glow.addColorStop(0, 'rgba(255,214,232,0.9)');
    glow.addColorStop(1, 'rgba(255,214,232,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, size, size);

    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? radius * 1.08 : radius * 0.56;
      const x = c + Math.cos(a) * rr;
      const y = c + Math.sin(a) * rr * 1.02 + radius * 0.04;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.lineJoin = 'round';
    g.lineWidth = radius * 0.2;
    g.strokeStyle = '#ffffff';
    g.stroke();
    const fill = g.createLinearGradient(0, c - radius, 0, c + radius);
    fill.addColorStop(0, '#ff9ec8');
    fill.addColorStop(1, STAR_COLOR);
    g.fillStyle = fill;
    g.fill();

    g.font = `900 ${radius * 0.9}px sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = radius * 0.14;
    g.strokeStyle = '#3b1f35';
    g.strokeText('!', c, c + radius * 0.1);
    g.fillStyle = '#ffffff';
    g.fillText('!', c, c + radius * 0.1);
    return off;
  }

  // Piece art is 512 × 512 with the character in a centered 460 box (assets/skins/README.md),
  // so the 460 box maps to the piece diameter.
  function drawArt(img, radius) {
    const size = Math.ceil((radius * 2 * 512) / 460);
    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const g = off.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, size, size);
    return off;
  }

  function drawCandy(color, radius) {
    const pad = Math.ceil(radius * 0.12);
    const size = Math.ceil(radius * 2 + pad * 2);
    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const g = off.getContext('2d');
    const c = size / 2;

    g.save();
    g.beginPath();
    g.arc(c, c, radius, 0, TAU);
    g.fillStyle = color.fill;
    g.fill();
    g.clip();

    // Swirl: a fat spiral stroke in a lighter tone, the classic lollipop look
    g.strokeStyle = color.swirl;
    g.lineWidth = radius * 0.2;
    g.lineCap = 'round';
    g.beginPath();
    const turns = 2.2;
    for (let t = 0; t <= 1; t += 0.01) {
      const a = t * turns * TAU;
      const rr = radius * 0.95 * t;
      const x = c + Math.cos(a) * rr;
      const y = c + Math.sin(a) * rr;
      if (t === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();

    // Gloss
    const gloss = g.createRadialGradient(c - radius * 0.35, c - radius * 0.4, 0, c - radius * 0.35, c - radius * 0.4, radius * 0.7);
    gloss.addColorStop(0, 'rgba(255,255,255,0.75)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gloss;
    g.fillRect(0, 0, size, size);
    g.restore();

    g.beginPath();
    g.arc(c, c, radius - radius * 0.04, 0, TAU);
    g.strokeStyle = color.rim;
    g.lineWidth = radius * 0.08;
    g.stroke();
    return off;
  }

  const X = (x) => (ox + x * scale) * dpr;
  const Y = (y) => (oy + y * scale) * dpr;

  function drawBackground(t, feverLevel) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (visible(theme.boardBg)) {
      ctx.fillStyle = theme.boardBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (feverLevel > 0) {
      // Five member colors drifting across the box
      const phase = reducedMotion ? 0 : t * 0.9;
      const grad = ctx.createLinearGradient(0, Y(0), canvas.width, Y(field.height));
      colors.forEach((c, i) => {
        const k = ((i / colors.length + phase * 0.2) % 1 + 1) % 1;
        grad.addColorStop(k, c.fill);
      });
      ctx.globalAlpha = 0.32 * feverLevel * (reducedMotion ? 1 : 0.75 + 0.25 * Math.sin(t * 8));
      ctx.fillStyle = grad;
      ctx.fillRect(X(0), Y(0), field.width * scale * dpr, field.height * scale * dpr);
      ctx.globalAlpha = 1;
    }

    if (visible(theme.boardTint)) {
      ctx.fillStyle = theme.boardTint;
      ctx.fillRect(X(0), Y(0), field.width * scale * dpr, field.height * scale * dpr);
    }

    if (feverLevel > 0.05) {
      // Light rays turning slowly behind the candies
      const cx = X(field.width / 2);
      const cy = Y(field.height * 0.55);
      const len = Math.hypot(field.width, field.height) * scale * dpr;
      const turn = reducedMotion ? 0 : t * 0.35;
      ctx.save();
      ctx.beginPath();
      ctx.rect(X(0), Y(0), field.width * scale * dpr, field.height * scale * dpr);
      ctx.clip();
      ctx.globalAlpha = feverLevel;
      ctx.fillStyle = theme.feverRay;
      for (let i = 0; i < 12; i++) {
        const a = turn + (i / 12) * TAU;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a - 0.09) * len, cy + Math.sin(a - 0.09) * len);
        ctx.lineTo(cx + Math.cos(a + 0.09) * len, cy + Math.sin(a + 0.09) * len);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  // Emitters that run while a mode is on: sparkles rising in fever, gold confetti raining in bonus time
  function emitAmbient(dt, feverLevel, bonus) {
    if (dt <= 0) return;
    if (bonus) {
      goldDebt += dt * many(FX.bonusConfettiPerSecond);
      for (; goldDebt >= 1; goldDebt--) {
        particles.spawn({
          x: Math.random() * field.width, y: -0.4, vx: (Math.random() - 0.5) * 1.5, vy: 2 + Math.random() * 2.5,
          gravity: 1.5, drag: 0.3, life: 2.8, size: 0.13, shape: 'confetti', color: GOLD[Math.floor(Math.random() * GOLD.length)],
        });
      }
    } else if (feverLevel > 0.5) {
      sparkleDebt += dt * many(FX.sparklesPerSecond) * feverLevel;
      for (; sparkleDebt >= 1; sparkleDebt--) {
        const c = colors[Math.floor(Math.random() * colors.length)];
        particles.spawn({
          x: Math.random() * field.width, y: field.height + 0.2, vx: (Math.random() - 0.5) * 0.6, vy: -(2.5 + Math.random() * 2.5),
          gravity: 0.6, drag: 0.2, life: 1.6, size: 0.07 + Math.random() * 0.06, shape: Math.random() < 0.5 ? 'star' : 'dot', color: Math.random() < 0.4 ? '#ffffff' : effectColor(c),
        });
      }
    }
  }

  function pieceTransform(p, extraScale = 1) {
    const sy = p.squash.x;
    const sx = 1 + (1 - sy) * 0.9;
    const rr = candyR(p);
    // Squash around the bottom of the candy so it flattens onto whatever it landed on
    const bx = X(p.x);
    const by = Y(p.y + rr);
    return { sx: sx * extraScale, sy: sy * extraScale, bx, by, rr };
  }

  function drawSticks(pieces, selected) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineCap = 'round';
    for (const p of pieces) {
      if (!sprites[p.color]?.stick) continue;
      const { sx, sy, bx, by, rr } = pieceTransform(p, selected.has(p) ? R.selectedScale : 1);
      const cx = bx;
      const cy = by - rr * sy * scale * dpr;
      const a = p.angle + Math.PI * 0.62;
      const len = R.stickLength * (p.r / 0.5) * scale * dpr;
      const ex = cx + Math.cos(a) * len * sx;
      const ey = cy + Math.sin(a) * len * sy;
      ctx.strokeStyle = '#6f5a64';
      ctx.lineWidth = 0.13 * scale * dpr;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.strokeStyle = '#f7efe9';
      ctx.lineWidth = 0.08 * scale * dpr;
      ctx.stroke();
    }
  }

  function drawCandies(pieces, selected, t, feverLevel) {
    const inFever = feverLevel > 0.5;
    for (const p of pieces) {
      const isSel = selected.has(p);
      const pulse = p.special && !reducedMotion ? 1 + 0.07 * Math.sin(t * 5 + p.id) : 1;
      const { sx, sy, bx, by } = pieceTransform(p, (isSel ? R.selectedScale : 1) * pulse);
      const sprite = spriteOf(p);
      const img = isSel ? sprite.happy ?? sprite.normal : inFever ? sprite.fever : sprite.normal;
      const k = p.r / 0.5;
      ctx.setTransform(sx * k, 0, 0, sy * k, bx, by);
      const half = img.width / 2;
      // Sprite center sits one radius above the anchor (in unscaled sprite pixels)
      const lift = sprite.radius * scale * dpr;
      ctx.drawImage(img, -half, -lift - half);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Tsum-style trace: a white outlined capsule running through the selected candies.
  // Drawn under the candies, so only the rim and the bridges between candies show.
  function drawTraceBand(trace, t) {
    if (trace.length === 0) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const color = colors[trace[0].color] ?? { rim: STAR_COLOR };
    const r = candyR(trace[0]) * R.selectedScale;
    const pulse = reducedMotion ? 0 : Math.sin(t * 7) * R.traceOutlinePulse;
    const layers = [
      ...(visible(theme.traceEdge) ? [[r + R.traceOutline + R.traceEdge + pulse, theme.traceEdge]] : []),
      [r + R.traceOutline + pulse, '#ffffff'],
      [r + R.traceInset, color.band ?? color.rim],
    ];
    for (const [radius, style] of layers) {
      ctx.strokeStyle = style;
      ctx.lineWidth = radius * 2 * scale * dpr;
      ctx.beginPath();
      trace.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y))));
      if (trace.length === 1) ctx.lineTo(X(trace[0].x) + 0.01, Y(trace[0].y));
      ctx.stroke();
    }
  }

  function drawEffects(dt) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = effects.length - 1; i >= 0; i--) {
      const e = effects[i];
      e.t += dt;
      const k = e.t / e.life;
      if (k >= 1) {
        effects.splice(i, 1);
        continue;
      }
      if (e.kind === 'ghost') {
        // The cleared candy, swelling with its pop face for a moment before the confetti takes over
        const sprite = e.special ? starSprite : sprites[e.color];
        if (sprite) {
          const grow = reducedMotion ? 1 : 1 + (R.popGhostScale - 1) * (1 - (1 - k) ** 2);
          const s = (e.r / 0.5) * grow;
          ctx.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
          ctx.setTransform(s, 0, 0, s, X(e.x), Y(e.y));
          const img = sprite.pop;
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
      } else if (e.kind === 'pop') {
        const r = (e.r + k * 0.45) * scale * dpr;
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 0.12 * (1 - k) * scale * dpr;
        ctx.beginPath();
        ctx.arc(X(e.x), Y(e.y), r, 0, TAU);
        ctx.stroke();
      } else if (e.kind === 'boom') {
        // Rescue: a flash rising from the floor (the sparks are particles)
        const flashH = field.height * 0.55 * scale * dpr;
        const grad = ctx.createLinearGradient(0, Y(field.height), 0, Y(field.height) - flashH);
        grad.addColorStop(0, `rgba(255,245,200,${0.85 * (1 - k)})`);
        grad.addColorStop(1, 'rgba(255,245,200,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(X(0), Y(field.height) - flashH, field.width * scale * dpr, flashH);
      } else if (e.kind === 'burst') {
        // Star candy: a ring growing to the blast reach (the sparks are particles)
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = STAR_COLOR;
        ctx.lineWidth = 0.18 * (1 - k) * scale * dpr;
        ctx.beginPath();
        ctx.arc(X(e.x), Y(e.y), e.reach * (0.3 + 0.7 * Math.sqrt(k)) * scale * dpr, 0, TAU);
        ctx.stroke();
        // A second, white ring a moment later
        const k2 = Math.max(0, k - 0.15) / 0.85;
        if (k2 > 0) {
          ctx.globalAlpha = 1 - k2;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.12 * (1 - k2) * scale * dpr;
          ctx.beginPath();
          ctx.arc(X(e.x), Y(e.y), e.reach * 1.15 * Math.sqrt(k2) * scale * dpr, 0, TAU);
          ctx.stroke();
        }
      } else if (e.kind === 'text') {
        const rise = reducedMotion || e.impact ? 0 : k * 0.9;
        ctx.globalAlpha = (k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3) * e.alpha;
        // impact: lands big and settles (1.8× → 1×); normal: grows in quickly
        const grow = e.impact ? 1 + 0.8 * Math.max(0, 1 - k / 0.14) : Math.min(1, 0.6 + k * 4);
        const size = e.size * scale * dpr * (reducedMotion ? 1 : grow);
        ctx.font = e.impact ? `400 ${size}px ${theme.display}` : `800 ${size}px ${theme.font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = size * 0.18;
        ctx.strokeStyle = theme.textStroke;
        const x = Math.min(Math.max(X(e.x), size * e.text.length * 0.5), canvas.width - size * e.text.length * 0.5);
        ctx.strokeText(e.text, x, Y(e.y - rise));
        ctx.fillStyle = e.color;
        ctx.fillText(e.text, x, Y(e.y - rise));
      }
      ctx.globalAlpha = 1;
    }
  }

  return {
    setField(f) {
      field = f;
      resize();
    },

    setTheme(t) {
      theme = { ...theme, ...t };
    },

    setSkin(s) {
      skin = s;
      if (field) buildSprites();
    },
    resize,

    toField(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      return { x: (clientX - rect.left - ox) / scale, y: (clientY - rect.top - oy) / scale };
    },

    // Board rectangle in CSS px relative to the canvas (for DOM overlays and the tutorial finger)
    fieldToCss(x, y) {
      return { x: ox + x * scale, y: oy + y * scale };
    },

    clearEffects() {
      effects.length = 0;
      particles.clear();
    },

    blast(removed) {
      this.pop(removed);
      const n = many(70);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const speed = 4 + Math.random() * 9;
        particles.spawn({
          x: Math.random() * field.width, y: field.height - Math.random() * 0.8, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
          gravity: 9, drag: 0.8, life: R.boomDuration, size: 0.05 + Math.random() * 0.1, shape: i % 4 === 0 ? 'confetti' : 'dot', color: effectColor(colors[i % colors.length]),
        });
      }
      effects.push({ kind: 'boom', t: 0, life: R.boomDuration });
    },

    // Star candy: two rings and a shower of stars and confetti
    burst(x, y, reach) {
      const n = many(FX.starParticles);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU;
        const speed = 3 + Math.random() * 8;
        particles.spawn({
          x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 2, gravity: 8, drag: 1.2, life: 0.9 + Math.random() * 0.5,
          size: 0.08 + Math.random() * 0.08, shape: ['star', 'confetti', 'heart', 'dot'][i % 4], color: i % 3 === 0 ? STAR_COLOR : effectColor(colors[i % colors.length]),
        });
      }
      effects.push({ kind: 'burst', x, y, reach, t: 0, life: R.boomDuration * 0.8 });
    },

    // A clear: confetti from each removed candy, more for longer chains
    celebrate(removed, tracedLength) {
      const cp = FX.clearParticles;
      const total = many(Math.min(cp.max, cp.base + Math.max(0, tracedLength - 3) * cp.perExtra));
      const src = removed.length ? removed : [];
      for (let i = 0; i < total && src.length; i++) {
        const p = src[i % src.length];
        const a = Math.random() * TAU;
        const speed = 2 + Math.random() * (2 + tracedLength * 0.5);
        const c = p.special ? null : colors[p.color];
        particles.spawn({
          x: p.x, y: p.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 2.5, gravity: 9, drag: 1.4, life: 0.6 + Math.random() * 0.4,
          size: 0.06 + Math.random() * 0.07, shape: i % 5 === 0 ? 'star' : 'confetti', color: i % 5 === 0 ? '#ffffff' : c ? effectColor(c) : STAR_COLOR,
        });
      }
    },

    // Fever start: confetti fountains from the two bottom corners
    feverConfetti() {
      const n = many(FX.feverConfetti);
      for (let i = 0; i < n; i++) {
        const left = i % 2 === 0;
        const a = -Math.PI / 2 + (left ? 0.45 : -0.45) + (Math.random() - 0.5) * 0.5;
        const speed = 9 + Math.random() * 7;
        particles.spawn({
          x: left ? 0.2 : field.width - 0.2, y: field.height, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, gravity: 10, drag: 1.1,
          life: 1.4 + Math.random() * 0.6, size: 0.1 + Math.random() * 0.06, shape: i % 6 === 0 ? 'heart' : 'confetti', color: effectColor(colors[i % colors.length]),
        });
      }
    },

    shake(seconds, amp = 0.18) {
      if (reducedMotion) return;
      shakeLeft = seconds;
      shakeTotal = seconds;
      shakeAmp = amp;
    },

    // Whole-canvas light that fades out. Off with reduce motion.
    flash(alpha, color = '#ffffff', seconds = 0.25) {
      if (reducedMotion) return;
      flashAlpha = alpha;
      flashColor = color;
      flashLeft = seconds;
      flashTotal = seconds;
    },

    // Big word in the middle of the board (NICE!, 10 COMBO!, countdown numbers)
    bigText(str, { y = null, color = '#ffffff', size = 1.1, life = 1.0, alpha = 1 } = {}) {
      effects.push({ kind: 'text', impact: true, text: str, x: field.width / 2, y: y ?? field.height * 0.42, color, size, t: 0, life, alpha });
    },

    pop(pieces) {
      for (const p of pieces) {
        effects.push({ kind: 'ghost', x: p.x, y: p.y, r: p.r, color: p.color, special: !!p.special, t: 0, life: R.popGhost * (reducedMotion ? 0.6 : 1) });
        effects.push({ kind: 'pop', x: p.x, y: p.y, r: candyR(p), color: p.special ? STAR_COLOR : effectColor(colors[p.color]), t: 0, life: R.popDuration, seed: Math.random() * TAU });
      }
    },

    text(str, x, y, { color = theme.textFill, size = 0.55, life = R.wordDuration } = {}) {
      effects.push({ kind: 'text', text: str, x, y, color, size, t: 0, life, alpha: 1 });
    },

    draw({ t, dt, trace = [], feverLevel = 0, bonus = false }) {
      if (!field) return;
      const baseX = ox;
      const baseY = oy;
      if (shakeLeft > 0) {
        shakeLeft = Math.max(0, shakeLeft - dt);
        const amp = shakeAmp * scale * (shakeLeft / shakeTotal);
        ox += (Math.random() - 0.5) * 2 * amp;
        oy += (Math.random() - 0.5) * 2 * amp;
      }
      drawBackground(t, feverLevel);
      const selected = new Set(trace);
      ctx.save();
      ctx.beginPath();
      ctx.rect(X(0) - scale * dpr, Y(-0.2), (field.width + 2) * scale * dpr, (field.height + 0.2) * scale * dpr);
      ctx.clip();
      drawSticks(field.pieces, selected);
      drawTraceBand(trace, t);
      drawCandies(field.pieces, selected, t, feverLevel);
      ctx.restore();
      drawEffects(dt);
      emitAmbient(dt, feverLevel, bonus);
      particles.step(dt);
      particles.draw(ctx, X, Y, scale * dpr);
      if (flashLeft > 0) {
        flashLeft = Math.max(0, flashLeft - dt);
        ctx.globalAlpha = flashAlpha * (flashLeft / flashTotal);
        ctx.fillStyle = flashColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      }
      ox = baseX;
      oy = baseY;
    },
  };
}
