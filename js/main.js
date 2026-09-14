// Startup and wiring only. Rules live in game.js, fields in field-*.js, drawing in render.js.

import { CONFIG, COLORS } from './config.js';
import { createRng } from './rng.js';
import { createGridField } from './field-grid.js';
import { createPhysicsField } from './field-physics.js';
import { createGame } from './game.js';
import { createRenderer } from './render.js';
import { createTraceInput } from './input.js';
import { createFeedback } from './feedback.js';
import { loadSkin, probeSkin } from './skin.js';

const params = new URLSearchParams(location.search);
const feel = params.get('feel') === 'physics' ? 'physics' : 'grid';
const adjacency = params.get('adj') === '4' ? 4 : CONFIG.grid.adjacency;
const seedParam = params.has('seed') ? Number(params.get('seed')) >>> 0 : null;
const duration = Number(params.get('time')) || CONFIG.game.duration;
const pos = params.get('pos');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (id) => document.getElementById(id);
const app = $('app');
const canvas = $('board');

const renderer = createRenderer(canvas, { config: CONFIG, colors: COLORS, reducedMotion });
const feedback = createFeedback(CONFIG);

// ---- skin: ?skin= (testing) > the player's last choice > CONFIG.skin.default
const skinStore = {
  get: () => { try { return localStorage.getItem(CONFIG.skin.storageKey); } catch { return null; } },
  set: (v) => { try { localStorage.setItem(CONFIG.skin.storageKey, v); } catch { /* private mode */ } },
};
let skinName = params.get('skin') ?? skinStore.get() ?? CONFIG.skin.default;

async function applySkin(name) {
  const skin = await loadSkin(name, { colors: COLORS });
  renderer.setSkin(skin);
  const credit = $('skin-credit');
  credit.textContent = skin.credit;
  credit.hidden = !skin.credit;
  return skin;
}

// Skin first, so the first frame already shows the right pieces. Failures fall back to candy.
skinName = (await applySkin(skinName)).name;

const skinSwitch = $('skin-switch');
skinSwitch.innerHTML = CONFIG.skin.choices
  .map((c) => `<button type="button" role="radio" data-skin="${c.name}" aria-checked="${c.name === skinName}">${c.label}</button>`)
  .join('');
// Members art may not be ready yet: disable that choice instead of silently showing candy.
for (const btn of skinSwitch.querySelectorAll('button')) {
  if (btn.dataset.skin === 'candy') continue;
  probeSkin(btn.dataset.skin, { colors: COLORS }).then((ok) => {
    if (ok) return;
    btn.disabled = true;
    btn.insertAdjacentHTML('beforeend', '<small>準備中</small>');
  });
}
skinSwitch.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-skin]');
  if (!btn || btn.disabled || btn.dataset.skin === skinName) return;
  const skin = await applySkin(btn.dataset.skin);
  skinName = skin.name;
  skinStore.set(skinName);
  for (const b of skinSwitch.querySelectorAll('button')) b.setAttribute('aria-checked', String(b.dataset.skin === skinName));
  if (skin.missing.length) toast('一部のメンバーの絵を読み込めなかったので、その駒は飴になっています', 2600);
});

let field = null;
let game = null;
let frozen = false;
let words = [];

function makeField(seed) {
  const rng = createRng(seed ?? undefined);
  const f = feel === 'physics'
    ? createPhysicsField({ config: CONFIG, rng })
    : createGridField({ config: CONFIG, rng, adjacency });
  return { f, rng };
}

function newMatch(seed = seedParam) {
  const { f, rng } = makeField(seed);
  field = f;
  renderer.setField(field);
  game = createGame({ config: CONFIG, field, duration, words, rng });
  game.on(onGameEvent);
  app.classList.remove('hurry', 'fever-on');
  app.classList.toggle('waiting', !game.state.timerRunning);
  hud.reset();
}

function setScreen(name) {
  app.dataset.screen = name;
  input.setEnabled(name === 'play');
}

// ---- HUD: write to the DOM only when a value actually changes
const hud = (() => {
  const timeEl = $('time');
  const scoreEl = $('score');
  const bangEls = [...$('bangs').children];
  const comboEl = $('combo');
  const comboN = $('combo-n');
  const feverTimer = $('fever-timer');
  const feverBar = $('fever-bar');
  const feverSec = $('fever-sec');
  const rescueBtn = $('rescue');
  const pips = [...$('rescue-pips').children];
  let last = {};
  return {
    reset() {
      last = {};
      comboEl.classList.remove('show');
    },
    update(s) {
      const secs = Math.ceil(s.timeLeft);
      if (secs !== last.secs) {
        timeEl.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
        const hurry = s.timerRunning && s.timeLeft <= CONFIG.game.hurryAt && s.phase === 'play';
        app.classList.toggle('hurry', hurry);
        if (hurry && last.secs !== undefined) feedback.tick();
        last.secs = secs;
      }
      if (s.score !== last.score) {
        scoreEl.textContent = s.score.toLocaleString('ja-JP');
        last.score = s.score;
      }
      // During fever the "!" gauge drains with the time left, one "!" at a time from the right
      const bangs = s.fever.active
        ? Math.ceil((s.fever.left / CONFIG.fever.duration) * CONFIG.fever.bangsToFever)
        : s.bangs;
      if (bangs !== last.bangs) {
        bangEls.forEach((el, i) => el.classList.toggle('on', i < bangs));
        last.bangs = bangs;
      }
      if (s.combo !== last.combo) {
        comboEl.classList.toggle('show', s.combo >= 2);
        comboN.textContent = s.combo;
        comboEl.classList.remove('bump');
        if (s.combo >= 2) {
          void comboEl.offsetWidth; // restart the bump animation
          comboEl.classList.add('bump');
        }
        last.combo = s.combo;
      }
      if (s.fever.active !== last.fever) {
        app.classList.toggle('fever-on', s.fever.active);
        last.fever = s.fever.active;
      }
      if (s.fever.active) {
        feverBar.style.transform = `scaleX(${Math.max(0, s.fever.left / CONFIG.fever.duration)})`;
        const sec = Math.ceil(s.fever.left);
        if (sec !== last.feverSec) {
          feverSec.textContent = sec;
          const warn = s.fever.left <= CONFIG.fever.warnAt;
          feverTimer.classList.toggle('warn', warn);
          if (warn && last.feverSec !== undefined) feedback.feverTick();
          last.feverSec = sec;
        }
      } else if (last.feverSec !== undefined) {
        feverTimer.classList.remove('warn');
        last.feverSec = undefined;
      }
      const rescueKey = `${s.rescuesLeft}:${s.phase}:${app.dataset.screen}`;
      if (rescueKey !== last.rescue) {
        pips.forEach((el, i) => el.classList.toggle('used', i >= s.rescuesLeft));
        rescueBtn.disabled = s.rescuesLeft <= 0 || s.phase !== 'play' || app.dataset.screen !== 'play';
        rescueBtn.setAttribute('aria-label', `下を爆発させて混ぜ直す（のこり ${s.rescuesLeft} 回）`);
        last.rescue = rescueKey;
      }
    },
  };
})();

let toastTimer = 0;
function toast(text, ms = CONFIG.game.shortHintMs) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function onGameEvent(e) {
  if (e.type === 'clear') {
    renderer.pop(e.removed);
    const cx = e.traced.reduce((a, p) => a + p.x, 0) / e.traced.length;
    const cy = e.traced.reduce((a, p) => a + p.y, 0) / e.traced.length;
    renderer.text(`+${e.points.toLocaleString('ja-JP')}`, cx, cy, { color: COLORS[e.traced[0].color].fill === '#ffffff' ? '#ffffff' : COLORS[e.traced[0].color].swirl, size: 0.6 });
    if (e.word) renderer.text(e.word, field.width / 2, Math.max(1.2, cy - 1.1), { size: 0.5, life: 1.3 });
    feedback.clear(e.removed.length, e.combo);
    app.classList.remove('waiting');
  } else if (e.type === 'feverStart') {
    const el = $('fever');
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    feedback.fever();
  } else if (e.type === 'feverEnd') {
    renderer.text('FEVER おわり', field.width / 2, 1.2, { size: 0.55, life: 1.2 });
  } else if (e.type === 'rescue') {
    renderer.blast(e.removed);
    renderer.shake(CONFIG.rescue.shake);
    feedback.boom();
  } else if (e.type === 'miss' && e.reason === 'short') {
    toast('3 個からつなごう');
    feedback.miss();
  } else if (e.type === 'shuffle') {
    toast('つなげる組がないので、まぜました');
  } else if (e.type === 'end') {
    input.setEnabled(false);
    feedback.end();
    setTimeout(showResult, 900);
  }
}

function showResult() {
  const r = game.summary();
  $('r-percent').textContent = r.festival.percent;
  $('r-tier').textContent = r.festival.label;
  $('r-score').textContent = r.score.toLocaleString('ja-JP');
  $('r-combo').textContent = r.maxCombo;
  $('r-fever').textContent = `${r.feverCount} 回`;
  const fav = $('r-favorite');
  if (r.favorite === null) {
    fav.textContent = '—';
  } else {
    const c = COLORS[r.favorite];
    fav.innerHTML = `<span class="swatch" style="background:${c.fill}"></span>${c.name}`;
  }
  setScreen('result');
}

// ---- input
const input = createTraceInput(canvas, {
  config: CONFIG,
  renderer,
  getField: () => field,
  onChange(path, why) {
    if (why === 'extend' && path.length > 0) feedback.link(path.length);
  },
  onCommit(path, cancelled) {
    if (cancelled || !game || path.length === 0) return;
    game.commit(path);
  },
});

// ---- loop
let lastT = performance.now();
let feverLevel = 0;
const debugEl = params.has('debug') ? Object.assign(document.createElement('div'), { className: 'debug' }) : null;
if (debugEl) document.body.append(debugEl);
let fps = 60;

function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (!frozen) {
    if (app.dataset.screen === 'play') game.update(dt);
    else field.step(dt);
  }
  const target = game?.state.fever.active ? 1 : 0;
  feverLevel += (target - feverLevel) * Math.min(1, dt * 4);
  const drawDt = frozen ? frozenAdvance : dt;
  frozenAdvance = 0;
  renderer.draw({ t: now / 1000, dt: drawDt, trace: input.path.length ? input.path : frozenTrace, feverLevel });
  if (game) hud.update(game.state);
  if (debugEl && dt > 0) {
    fps += (1 / dt - fps) * 0.05;
    const s = game.state;
    debugEl.textContent = `${feel} adj=${field.adjacency ?? '-'} fps=${fps.toFixed(0)}\n` +
      `pieces=${field.pieces.length} settled=${field.isSettled()}\n` +
      `combo=${s.combo} since=${s.sinceClear.toFixed(2)} bangs=${s.bangs} fever=${s.fever.left.toFixed(1)}`;
  }
  requestAnimationFrame(frame);
}

let frozenTrace = [];
let frozenAdvance = 0; // ?pos= can show an effect a moment after it started

// ---- buttons
$('btn-play').addEventListener('click', () => {
  newMatch();
  setScreen('play');
});
$('btn-again').addEventListener('click', () => {
  newMatch();
  setScreen('play');
});
$('rescue').addEventListener('click', () => {
  if (!game || app.dataset.screen !== 'play') return;
  input.setEnabled(false); // drop a trace in progress
  input.setEnabled(true);
  game.rescue();
});
$('btn-title').addEventListener('click', () => {
  newMatch();
  setScreen('title');
});

new ResizeObserver(() => renderer.resize()).observe(canvas);

// ---- data (optional: the game runs without words)
fetch('data/words.json')
  .then((r) => (r.ok ? r.json() : null))
  .then((data) => {
    if (!data) return;
    words = [...(data.songs ?? []), ...(data.official ?? []), ...(data.x ?? []).map((w) => w.text ?? w)];
  })
  .catch(() => {});

// ---- start
function settleNow() {
  for (let i = 0; i < 60 * 20 && !field.isSettled(); i++) field.step(1 / 60);
}

newMatch(pos ? seedParam ?? 1 : seedParam);
setScreen('title');

if (pos) {
  // ?pos= freezes a representative state for design.html and screenshots
  frozen = true;
  settleNow();
  if (['play', 'combo', 'fever', 'hurry', 'rescue'].includes(pos)) setScreen('play');
  if (pos === 'play') {
    frozenTrace = field.findChain(3) ?? [];
  } else if (pos === 'combo') {
    for (let i = 0; i < 5; i++) {
      const chain = field.findChain(3);
      if (!chain) break;
      game.commit(chain);
      settleNow();
    }
    game.state.sinceClear = 0;
    renderer.clearEffects();
    app.classList.remove('waiting');
    frozenTrace = field.findChain(4) ?? field.findChain(3) ?? [];
    const last = frozenTrace.at(-1);
    if (last) renderer.text('+1,240', last.x, last.y, { size: 0.6 });
  } else if (pos === 'fever') {
    game.startFever();
    game.state.fever.left = 5.4;
    game.state.timerRunning = true;
    game.state.timeLeft = 96;
    game.state.score = 18420;
    app.classList.remove('waiting');
    feverLevel = 1;
    frozenTrace = field.findChain(3) ?? [];
    $('fever').style.opacity = 1;
  } else if (pos === 'rescue') {
    game.state.timerRunning = true;
    game.state.timeLeft = 124;
    game.state.score = 30550;
    game.state.bangs = 3;
    app.classList.remove('waiting');
    game.rescue();
    for (let i = 0; i < 9; i++) field.step(1 / 60);
    frozenAdvance = 0.15;
  } else if (pos === 'hurry') {
    game.state.timerRunning = true;
    game.state.timeLeft = 8;
    game.state.score = 41230;
    game.state.bangs = 5;
    app.classList.remove('waiting');
    toast('3 個からつなごう', 1e9);
  } else if (pos === 'result') {
    Object.assign(game.state, { score: 213400, maxCombo: 23, totalCleared: 310, cleared: [80, 52, 61, 70, 47] });
    game.state.fever.count = 4;
    showResult();
  }
}

requestAnimationFrame(frame);

// ?bot=1 — plays by itself (clears a random chain every ~0.45 s). For smoke tests and fps checks.
if (params.has('bot')) {
  if (!pos) {
    newMatch();
    setScreen('play');
  }
  setInterval(() => {
    if (app.dataset.screen !== 'play' || game.state.phase !== 'play') return;
    if (!field.isSettled()) return; // like a person: wait until the candies land
    const chain = field.findChain(3 + Math.floor(Math.random() * 3)) ?? field.findChain(3);
    if (chain) game.commit(chain);
  }, 450);
}

if (params.has('labels')) {
  import('./labels.js').then(({ showLabels }) => {
    const only = params.get('labels');
    setTimeout(() => showLabels(only === '1' ? null : only.split(',')), 400);
  });
}
