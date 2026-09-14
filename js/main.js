// Startup and wiring only. Rules live in game.js, fields in field-*.js, drawing in render.js.

import { CONFIG, COLORS } from './config.js';
import { createRng } from './rng.js';
import { createPhysicsField } from './field-physics.js';
import { createGame } from './game.js';
import { createRenderer } from './render.js';
import { createTraceInput } from './input.js';
import { createFeedback } from './feedback.js';
import { loadSkin, probeSkin } from './skin.js';
import { resolveTheme, createThemeStore, applyTheme } from './theme.js';
import { attachHaptics, setHapticsEnabled } from './haptics.js';
import { createParticles } from './particles.js';

const params = new URLSearchParams(location.search);
const seedParam = params.has('seed') ? Number(params.get('seed')) >>> 0 : null;
const duration = Number(params.get('time')) || CONFIG.game.duration;
const pos = params.get('pos');
// 'timed' (1 minute) or 'endless'. The title buttons set it; 「もう一回」 replays the same mode.
let mode = params.get('mode') === 'endless' || ['endless', 'gameover'].includes(pos) ? 'endless' : 'timed';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (id) => document.getElementById(id);
const app = $('app');
const canvas = $('board');

const renderer = createRenderer(canvas, { config: CONFIG, colors: COLORS, reducedMotion });
const feedback = createFeedback(CONFIG);

// ---- vibration on/off (T10). Saved on the device; also turns off the iPhone button ticks.
const vibeStore = createThemeStore(CONFIG.vibration.storageKey);
let vibrationOn = vibeStore.get() !== 'off';
const vibeSwitch = $('vibe-switch');
function applyVibration() {
  feedback.setVibration(vibrationOn);
  setHapticsEnabled(vibrationOn);
  for (const b of vibeSwitch.querySelectorAll('button')) b.setAttribute('aria-checked', String((b.dataset.vibe === 'on') === vibrationOn));
}
vibeSwitch.innerHTML = '<button type="button" role="radio" data-vibe="on">オン</button><button type="button" role="radio" data-vibe="off">オフ</button>';
vibeSwitch.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-vibe]');
  if (!btn) return;
  vibrationOn = btn.dataset.vibe === 'on';
  vibeStore.set(vibrationOn ? 'on' : 'off');
  applyVibration();
  if (vibrationOn) navigator.vibrate?.(CONFIG.vibration.clear); // let the player sense the strength
});
applyVibration();

// ---- theme: ?theme= > the player's last choice > CONFIG.theme.default (js/theme.js)
const themeStore = createThemeStore(CONFIG.theme.storageKey);
let themeName = resolveTheme({ param: params.get('theme'), stored: themeStore.get(), choices: CONFIG.theme.choices, fallback: CONFIG.theme.default });
renderer.setTheme(applyTheme(themeName));

const themeSwitch = $('theme-switch');
themeSwitch.innerHTML = CONFIG.theme.choices
  .map((c) => `<button type="button" role="radio" data-theme-name="${c.name}" aria-checked="${c.name === themeName}"${c.ready === false ? ' disabled' : ''}>${c.label}${c.ready === false ? '<small>準備中</small>' : ''}</button>`)
  .join('');
themeSwitch.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-theme-name]');
  if (!btn || btn.disabled || btn.dataset.themeName === themeName) return;
  themeName = btn.dataset.themeName;
  themeStore.set(themeName);
  renderer.setTheme(applyTheme(themeName)); // no reload: CSS follows data-theme, the canvas redraws next frame
  for (const b of themeSwitch.querySelectorAll('button')) b.setAttribute('aria-checked', String(b.dataset.themeName === themeName));
  syncBoardFrame();
});

// The corner brackets (board-frame) sit on the field rectangle inside the canvas
function syncBoardFrame() {
  if (!field) return;
  const a = renderer.fieldToCss(0, 0);
  const b = renderer.fieldToCss(field.width, field.height);
  const frame = $('board-frame').style;
  frame.setProperty('--fx', `${a.x}px`);
  frame.setProperty('--fy', `${a.y}px`);
  frame.setProperty('--fw', `${b.x - a.x}px`);
  frame.setProperty('--fh', `${b.y - a.y}px`);
}

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

// Confetti over the DOM screens (result), drawn on #fx-overlay in CSS px. Idle when nothing is flying.
const overlay = (() => {
  const cv = $('fx-overlay');
  const g = cv.getContext('2d');
  const parts = createParticles(240);
  const COLORS_POP = ['#cc0000', '#f5c400', '#7fd4e8', '#2e9e5b', '#ff7fbf', '#ff4f9a'];
  const GOLD = ['#ffd44d', '#ffe98a', '#ffb300', '#ffffff'];
  let dpr = 1;
  return {
    confetti(x, y, n, gold = false) {
      const count = Math.round(n * (reducedMotion ? CONFIG.fx.reducedParticleScale : 1));
      const rect = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(rect.width * dpr);
      cv.height = Math.round(rect.height * dpr);
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
        const speed = 250 + Math.random() * 450;
        const palette = gold && i % 2 === 0 ? GOLD : COLORS_POP;
        parts.spawn({
          x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, gravity: 900, drag: 1.6, life: 1.4 + Math.random() * 0.8,
          size: 5 + Math.random() * 4, shape: i % 7 === 0 ? 'star' : 'confetti', color: palette[i % palette.length],
        });
      }
    },
    frame(dt) {
      if (parts.count === 0) {
        if (cv.width) cv.width = 0; // release the buffer
        return;
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, cv.width, cv.height);
      parts.step(dt);
      parts.draw(g, (x) => x * dpr, (y) => y * dpr, dpr);
    },
  };
})();

let field = null;
let game = null;
let frozen = false;
let words = [];

function makeField(seed) {
  const rng = createRng(seed ?? undefined);
  const f = createPhysicsField({ config: CONFIG, rng });
  return { f, rng };
}

function newMatch(seed = seedParam) {
  const { f, rng } = makeField(seed);
  field = f;
  renderer.setField(field);
  syncBoardFrame();
  game = createGame({ config: CONFIG, field, mode, duration, words, rng });
  app.dataset.mode = mode;
  game.on(onGameEvent);
  app.classList.remove('hurry', 'fever-on', 'last-spurt', 'bonus-time');
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
  const feverSecFine = $('fever-sec-fine');
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
      // Timed shows 0:42; endless shows the life gauge with tenths (07.3), since it moves both ways
      let text = s.mode === 'endless'
        ? Math.max(0, s.timeLeft).toFixed(1).padStart(4, '0')
        : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
      if (s.bonusTime) text = 'BONUS';
      if (text !== last.timeText) {
        timeEl.textContent = text;
        last.timeText = text;
      }
      if (secs !== last.secs) {
        const hurryAt = s.mode === 'endless' ? CONFIG.endless.hurryAt : CONFIG.game.hurryAt;
        const hurry = s.timerRunning && s.timeLeft <= hurryAt && s.phase === 'play' && !s.bonusTime;
        app.classList.toggle('hurry', hurry);
        const countdown = s.mode === 'timed' && s.lastSpurt && !s.bonusTime && secs > 0 && secs <= FX.countdownFrom && s.phase === 'play';
        if (countdown && last.secs !== undefined) {
          renderer.bigText(String(secs), { size: 3.2, alpha: 0.28, life: 0.9, color: '#ff4f9a' });
          feedback.count(secs);
        } else if (hurry && last.secs !== undefined) {
          feedback.tick();
        }
        last.secs = secs;
      }
      if (s.score !== last.score) {
        scoreEl.textContent = s.score.toLocaleString('ja-JP');
        if (last.score !== undefined && s.score > last.score) {
          scoreEl.classList.remove('bump');
          void scoreEl.offsetWidth;
          scoreEl.classList.add('bump');
        }
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
      const phaseKey = `${s.lastSpurt}:${s.bonusTime}`;
      if (phaseKey !== last.phaseKey) {
        app.classList.toggle('last-spurt', s.lastSpurt);
        app.classList.toggle('bonus-time', s.bonusTime);
        if (s.bonusTime) app.classList.remove('hurry');
        last.phaseKey = phaseKey;
      }
      if (s.fever.active !== last.fever) {
        app.classList.toggle('fever-on', s.fever.active);
        last.fever = s.fever.active;
      }
      if (s.fever.active) {
        feverBar.style.transform = `scaleX(${Math.max(0, s.fever.left / CONFIG.fever.duration)})`;
        const fine = Math.max(0, s.fever.left).toFixed(1).padStart(4, '0');
        if (fine !== last.feverFine) {
          feverSecFine.textContent = fine;
          last.feverFine = fine;
        }
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
    const c = COLORS[e.traced[0].color];
    // Bigger scores get bigger numbers
    const pointSize = 0.6 + Math.min(0.5, e.points / 20000);
    renderer.text(`+${e.points.toLocaleString('ja-JP')}`, cx, cy, { color: !c || c.fill === '#ffffff' ? '#ffffff' : c.swirl, size: pointSize });
    if (e.word) renderer.text(e.word, field.width / 2, Math.max(1.2, cy - 1.1), { size: 0.5, life: 1.3 });
    renderer.celebrate(e.removed, e.traced.length);
    if (e.star === 'detonated') {
      renderer.burst(cx, cy, 2 * CONFIG.physics.radius * CONFIG.special.blast);
      renderer.shake(0.3, 0.3);
      renderer.flash(FX.flashStar);
      kick(cx, cy, { radius: 4, strength: FX.kickStar });
      feedback.star();
    } else {
      feedback.clear(e.removed.length, e.combo);
      kick(cx, cy, { radius: 2.4, strength: FX.kickClear * Math.max(1, e.traced.length - 2) });
      if (e.traced.length >= FX.bigChain) {
        const word = FX.words.find((w) => e.traced.length >= w.min);
        renderer.bigText(word.text, { size: 1.15 });
        renderer.shake(FX.shakeBig, 0.12);
        renderer.flash(FX.flashBig);
        feedback.big(e.traced.length);
      }
      if (e.star === 'made') {
        const last = e.traced.at(-1);
        renderer.text('スター飴！', last.x, Math.max(1, last.y - 0.9), { size: 0.5, life: 1.2 });
        setTimeout(() => feedback.starMade(), 120);
      }
    }
    if (e.combo > 0 && e.combo % FX.comboMilestone === 0) {
      renderer.bigText(`${e.combo} COMBO!`, { y: field.height * 0.62, size: 0.9, color: '#ffd44d' });
    }
    app.classList.remove('waiting');
  } else if (e.type === 'feverStart') {
    const el = $('fever');
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    feedback.fever();
    renderer.flash(FX.flashFever, '#ff4f9a', 0.3);
    renderer.feverConfetti();
    renderer.shake(0.25, 0.14);
    kick(field.width / 2, field.height, { radius: 99, strength: 0, up: FX.kickFever }); // every candy hops
    pulseClass('fx-fever-start', 700);
    if (game.state.fever.timeBonus > 0) renderer.text(`+${game.state.fever.timeBonus}秒`, field.width / 2, 2.4, { size: 0.6, life: 1.4 });
  } else if (e.type === 'lastSpurt') {
    showBanner('LAST SPURT!', 'spurt');
    feedback.spurt();
  } else if (e.type === 'bonusStart') {
    showBanner('BONUS TIME!', 'gold');
    renderer.flash(0.35, '#fff6c8', 0.35);
    feedback.bonus();
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

const FX = CONFIG.fx;

// Candies hop in response to big moments. Off with reduce motion (it moves the whole board).
function kick(x, y, opts) {
  if (!reducedMotion) field.kick(x, y, opts);
}

// A class on .app for a moment, so CSS can flash the frame or HUD
function pulseClass(name, ms) {
  app.classList.remove(name);
  void app.offsetWidth;
  app.classList.add(name);
  setTimeout(() => app.classList.remove(name), ms);
}

// F3: a big word over the board, same motion as the FEVER banner
function showBanner(text, variant = '') {
  const el = $('banner');
  el.textContent = text;
  el.dataset.variant = variant;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

function showResult() {
  const r = game.summary();
  $('result-heading').textContent = r.endReason === 'gameover' ? 'GAME OVER' : 'RESULT';
  $('r-tier').textContent = r.festival.label;
  const rankEl = $('r-rank');
  rankEl.textContent = r.festival.rank;
  rankEl.dataset.rank = r.festival.rank;
  // Bars start empty and grow one after another once the screen is shown (CSS transition-delay per row)
  const targets = [];
  const bar = (id, ratio, color) => {
    const el = $(id).style;
    el.setProperty('--w', '0%');
    targets.push([el, `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`]);
    if (color) el.setProperty('--c', color);
  };
  bar('r-score-bar', r.festival.percent / 100);
  bar('r-combo-bar', r.maxCombo / CONFIG.result.bars.combo);
  bar('r-fever-bar', r.feverCount / CONFIG.result.bars.fever);
  $('r-elapsed').textContent = `${r.elapsed.toFixed(1)} 秒`;
  bar('r-elapsed-bar', r.elapsed / CONFIG.result.bars.elapsed);
  // Personal best per mode, kept on the device
  const bestStore = createThemeStore(`${CONFIG.result.bestKey}:${r.mode}`);
  const prevBest = Number(bestStore.get()) || 0;
  const isNewBest = r.score > prevBest;
  if (isNewBest) bestStore.set(String(r.score));
  const bestEl = $('r-best');
  const newBest = isNewBest && prevBest > 0;
  bestEl.textContent = newBest
    ? `NEW BEST!　${r.score.toLocaleString('ja-JP')}`
    : `BEST　${Math.max(prevBest, r.score).toLocaleString('ja-JP')}`;
  bestEl.classList.toggle('new', newBest);
  $('r-combo').textContent = r.maxCombo;
  $('r-fever').textContent = `${r.feverCount} 回`;
  const fav = $('r-favorite');
  if (r.favorite === null) {
    fav.textContent = '—';
    bar('r-favorite-bar', 0);
  } else {
    const c = COLORS[r.favorite];
    fav.innerHTML = `<span class="swatch" style="background:${c.fill}"></span>${c.name}`;
    bar('r-favorite-bar', r.favoriteShare, c.fill === '#ffffff' ? c.band : c.fill);
  }
  setScreen('result');

  countUp($('r-score'), r.score, (v) => v.toLocaleString('ja-JP'));
  countUp($('r-percent'), r.festival.percent, String);
  const screen = $('screen-result');
  screen.classList.remove('fx-in');
  void screen.offsetWidth;
  requestAnimationFrame(() => {
    for (const [el, w] of targets) el.setProperty('--w', w);
    screen.classList.add('fx-in'); // starts the rank stamp and card shake (CSS)
  });
  // When the rank lands: sound and confetti (more for S / A, gold for S)
  setTimeout(() => {
    if (app.dataset.screen !== 'result') return;
    feedback.rank(r.festival.rank);
    const rect = rankEl.getBoundingClientRect();
    const appRect = app.getBoundingClientRect();
    const big = r.festival.rank === 'S' || r.festival.rank === 'A';
    overlay.confetti(rect.left - appRect.left + rect.width / 2, rect.top - appRect.top + rect.height / 2, big ? 90 : 40, r.festival.rank === 'S');
    if (newBest) {
      const b = bestEl.getBoundingClientRect();
      overlay.confetti(b.left - appRect.left + b.width / 2, b.top - appRect.top, 50, true);
    }
  }, reducedMotion ? 0 : 1000);
}

// Numbers on the result screen count up from 0 (shown final at once with reduce motion)
function countUp(el, to, format, ms = 800) {
  if (reducedMotion || to <= 0) {
    el.textContent = format(to);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const k = Math.min(1, (now - start) / ms);
    el.textContent = format(Math.round(to * (1 - (1 - k) ** 3)));
    if (k < 1) requestAnimationFrame(tick);
  };
  el.textContent = format(0);
  requestAnimationFrame(tick);
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
  renderer.draw({ t: now / 1000, dt: drawDt, trace: input.path.length ? input.path : frozenTrace, feverLevel, bonus: !!game?.state.bonusTime });
  overlay.frame(dt);
  if (game) hud.update(game.state);
  if (debugEl && dt > 0) {
    fps += (1 / dt - fps) * 0.05;
    const s = game.state;
    debugEl.textContent = `fps=${fps.toFixed(0)}\n` +
      `pieces=${field.pieces.length} settled=${field.isSettled()}\n` +
      `combo=${s.combo} since=${s.sinceClear.toFixed(2)} bangs=${s.bangs} fever=${s.fever.left.toFixed(1)}`;
  }
  requestAnimationFrame(frame);
}

let frozenTrace = [];
let frozenAdvance = 0; // ?pos= can show an effect a moment after it started

// ---- buttons
$('btn-play').addEventListener('click', () => {
  mode = 'timed';
  newMatch();
  setScreen('play');
});
$('btn-endless').addEventListener('click', () => {
  mode = 'endless';
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

// iPhone: a light tick on these taps (js/haptics.js). No-op on Android and desktops.
attachHaptics([$('btn-play'), $('btn-endless'), $('btn-again'), $('btn-title'), $('rescue'), ...vibeSwitch.querySelectorAll('button')]);

new ResizeObserver(() => {
  renderer.resize();
  syncBoardFrame();
}).observe(canvas);

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
  if (['play', 'combo', 'fever', 'hurry', 'rescue', 'special', 'endless', 'spurt', 'bonus'].includes(pos)) setScreen('play');
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
    frozenAdvance = 0.45; // confetti fountains mid-air, rays and sparkles showing
    game.startFever();
    game.state.fever.left = CONFIG.fever.duration - 2.6;
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
  } else if (pos === 'spurt') {
    Object.assign(game.state, { timerRunning: true, timeLeft: 8, elapsed: 52, score: 98760, bangs: 5, bangProgress: 5.5, lastSpurt: true });
    app.classList.remove('waiting');
    frozenTrace = field.findChain(4) ?? field.findChain(3) ?? [];
    $('banner').textContent = 'LAST SPURT!';
    $('banner').dataset.variant = 'spurt';
    $('banner').style.opacity = 1;
  } else if (pos === 'bonus') {
    frozenAdvance = 0.6; // past the start flash, gold confetti already falling
    game.state.lastSpurt = true;
    game.startFever();
    Object.assign(game.state, { timerRunning: true, timeLeft: 0, elapsed: 61.5, score: 142300, bonusTime: true });
    game.state.fever.left = 7.2;
    app.classList.remove('waiting');
    feverLevel = 1;
    frozenTrace = field.findChain(3) ?? [];
    $('fever').classList.remove('show'); // in play the FEVER word has faded long before time runs out
    $('banner').textContent = 'BONUS TIME!';
    $('banner').dataset.variant = 'gold';
    $('banner').style.opacity = 1;
  } else if (pos === 'special') {
    // Two star candies on the board, as if two long chains had just been made
    const [a, b] = [...field.pieces].sort((p, q) => q.y - p.y).filter((_, i) => i === 5 || i === 17);
    for (const p of [a, b]) Object.assign(p, { special: 'star', color: null });
    Object.assign(game.state, { timerRunning: true, timeLeft: 38, score: 52480, bangs: 4, bangProgress: 4.6 });
    app.classList.remove('waiting');
  } else if (pos === 'endless') {
    Object.assign(game.state, { timerRunning: true, timeLeft: 2.4, elapsed: 48.2, score: 61280, bangs: 2, bangProgress: 2.3 });
    app.classList.remove('waiting');
  } else if (pos === 'gameover') {
    Object.assign(game.state, { score: 88420, maxCombo: 31, totalCleared: 190, cleared: [44, 30, 41, 38, 37], elapsed: 72.4, endReason: 'gameover', phase: 'end' });
    game.state.fever.count = 5;
    showResult();
  } else if (pos === 'result') {
    Object.assign(game.state, { score: 113400, maxCombo: 23, totalCleared: 190, cleared: [50, 32, 41, 40, 27], elapsed: 80, endReason: 'timeup' });
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
    const star = field.pieces.find((p) => p.special);
    if (star && Math.random() < 0.5) {
      game.commit([star]);
      return;
    }
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
