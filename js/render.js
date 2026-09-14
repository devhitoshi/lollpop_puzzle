// Canvas drawing. Pieces are pre-drawn once per color into offscreen canvases and stamped with
// drawImage, so a frame is ~60 image draws plus a few lines — cheap even on older phones.
// What a piece looks like comes from the skin (js/skin.js): drawn candy, or piece art scaled once.

const TAU = Math.PI * 2;

export function createRenderer(canvas, { config, colors, reducedMotion = false }) {
  const ctx = canvas.getContext('2d');
  const R = config.render;
  let dpr = 1;
  let cssW = 0;
  let cssH = 0;
  let scale = 1; // CSS px per field unit
  let ox = 0;
  let oy = 0;
  let field = null;
  let sprites = []; // per color: { normal, happy, radius (field units for a 0.5-radius piece), stick }
  let skin = null;
  const effects = [];
  let shakeLeft = 0;
  let shakeTotal = 0;

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

  // Drawn radius of a piece, in field units
  const candyR = (p) => ((sprites[p.color]?.radius ?? R.candyRadius) / 0.5) * p.r;

  function buildSprites() {
    sprites = colors.map((c, i) => {
      const art = skin?.pieces[i];
      if (art?.image) {
        const px = R.artRadius * scale * dpr;
        return { normal: drawArt(art.image, px), happy: art.happy ? drawArt(art.happy, px) : null, radius: R.artRadius, stick: skin.stick };
      }
      return { normal: drawCandy(c, R.candyRadius * scale * dpr), happy: null, radius: R.candyRadius, stick: true };
    });
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
    ctx.fillStyle = '#1a1113';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    ctx.fillStyle = 'rgba(255,245,249,0.04)';
    ctx.fillRect(X(0), Y(0), field.width * scale * dpr, field.height * scale * dpr);
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

  function drawCandies(pieces, selected) {
    for (const p of pieces) {
      const isSel = selected.has(p);
      const { sx, sy, bx, by } = pieceTransform(p, isSel ? R.selectedScale : 1);
      const sprite = sprites[p.color];
      const img = isSel && sprite.happy ? sprite.happy : sprite.normal;
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
    const color = colors[trace[0].color];
    const r = candyR(trace[0]) * R.selectedScale;
    const pulse = reducedMotion ? 0 : Math.sin(t * 7) * R.traceOutlinePulse;
    const layers = [
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
      if (e.kind === 'pop') {
        const r = (e.r + k * 0.45) * scale * dpr;
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 0.12 * (1 - k) * scale * dpr;
        ctx.beginPath();
        ctx.arc(X(e.x), Y(e.y), r, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = e.color;
        for (let j = 0; j < 6; j++) {
          const a = e.seed + (j / 6) * TAU;
          const d = (e.r + k * 0.9) * scale * dpr;
          ctx.beginPath();
          ctx.arc(X(e.x) + Math.cos(a) * d, Y(e.y) + Math.sin(a) * d, 0.07 * (1 - k) * scale * dpr, 0, TAU);
          ctx.fill();
        }
      } else if (e.kind === 'boom') {
        // Rescue: a flash rising from the floor plus sparks in the five member colors
        const flashH = field.height * 0.55 * scale * dpr;
        const grad = ctx.createLinearGradient(0, Y(field.height), 0, Y(field.height) - flashH);
        grad.addColorStop(0, `rgba(255,245,200,${0.85 * (1 - k)})`);
        grad.addColorStop(1, 'rgba(255,245,200,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(X(0), Y(field.height) - flashH, field.width * scale * dpr, flashH);
        for (const s of e.sparks) {
          const x = s.x + s.vx * e.t;
          const y = s.y + s.vy * e.t + 9 * e.t * e.t;
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(X(x), Y(y), s.size * (1 - k * 0.6) * scale * dpr, 0, TAU);
          ctx.fill();
        }
      } else if (e.kind === 'text') {
        const rise = reducedMotion ? 0 : k * 0.9;
        ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
        const size = e.size * scale * dpr * (reducedMotion ? 1 : Math.min(1, 0.6 + k * 4));
        ctx.font = `700 ${size}px "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = size * 0.18;
        ctx.strokeStyle = '#1a1113';
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
    },

    blast(removed) {
      this.pop(removed);
      const sparks = [];
      for (let i = 0; i < 70; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const speed = 4 + Math.random() * 9;
        sparks.push({
          x: Math.random() * field.width,
          y: field.height - Math.random() * 0.8,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          size: 0.05 + Math.random() * 0.1,
          color: colors[i % colors.length].fill,
        });
      }
      effects.push({ kind: 'boom', t: 0, life: R.boomDuration, sparks });
    },

    shake(seconds) {
      if (reducedMotion) return;
      shakeLeft = seconds;
      shakeTotal = seconds;
    },

    pop(pieces) {
      for (const p of pieces) {
        effects.push({ kind: 'pop', x: p.x, y: p.y, r: candyR(p), color: colors[p.color].fill, t: 0, life: R.popDuration, seed: Math.random() * TAU });
      }
    },

    text(str, x, y, { color = '#fff5f9', size = 0.55, life = R.wordDuration } = {}) {
      effects.push({ kind: 'text', text: str, x, y, color, size, t: 0, life });
    },

    draw({ t, dt, trace = [], feverLevel = 0 }) {
      if (!field) return;
      const baseX = ox;
      const baseY = oy;
      if (shakeLeft > 0) {
        shakeLeft = Math.max(0, shakeLeft - dt);
        const amp = 0.18 * scale * (shakeLeft / shakeTotal);
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
      drawCandies(field.pieces, selected);
      ctx.restore();
      drawEffects(dt);
      ox = baseX;
      oy = baseY;
    },
  };
}
