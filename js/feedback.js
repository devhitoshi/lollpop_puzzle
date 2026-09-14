// Synthesized sounds and vibration. No audio files (and no music — see requirements.md).
//   link(n)   a rising blip per candy added to the trace
//   clear(n)  a pop whose pitch climbs with the combo
//   fever     a quick five-note arpeggio
//   boom      the rescue explosion
//   feverTick the last seconds of fever
//   tick      the last-10-seconds clock
//   end       a two-note chime
//   star      a star candy blowing up; starMade  a sparkle when a long chain makes one
//   big(n)    a long chain (NICE! GREAT! AMAZING!); spurt  the last spurt; count(n)  5-4-3-2-1; bonus  bonus time
//   rank(r)   the rank letter landing on the result screen
// Vibration strengths live in CONFIG.vibration. navigator.vibrate is Android only; iPhone taps go through js/haptics.js.

export function createFeedback(config) {
  const cfg = config.sound;
  const vib = config.vibration;
  let enabled = true;
  let vibrationOn = true;
  let ctx = null;

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
  }
  window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  window.addEventListener('keydown', unlock, { capture: true });

  const ready = () => enabled && ctx && ctx.state === 'running';

  function tone(freq, { type = 'sine', at = 0, decay = 0.12, gain = 1, slide = 1 } = {}) {
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide !== 1) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + decay);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, cfg.volume * gain), t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + decay + 0.03);
  }

  const vibrate = (pattern) => {
    if (vibrationOn) navigator.vibrate?.(pattern);
  };
  const semitone = (base, n) => base * 2 ** (n / 12);

  // Short burst of filtered noise: a cymbal-ish splash or a whoosh
  function noise({ at = 0, decay = 0.3, gain = 0.3, freq = 5000 } = {}) {
    const t = ctx.currentTime + at;
    const len = Math.ceil(ctx.sampleRate * decay);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(cfg.volume * gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(t);
  }

  return {
    setEnabled(v) {
      enabled = v;
    },
    get enabled() {
      return enabled;
    },
    setVibration(on) {
      vibrationOn = on;
      if (!on) navigator.vibrate?.(0);
    },
    link(n) {
      vibrate(vib.link);
      if (!ready()) return;
      tone(semitone(660, Math.min(n, 14) * 1), { type: 'triangle', decay: 0.07, gain: 0.35 });
    },
    clear(count, combo) {
      vibrate(count >= 6 ? vib.clearLong : vib.clear);
      if (!ready()) return;
      const base = semitone(520, Math.min(combo - 1, 12) * 2);
      tone(base, { type: 'sine', decay: 0.18, gain: 0.7, slide: 1.8 });
      tone(base * 1.5, { type: 'triangle', at: 0.05, decay: 0.14, gain: 0.35 });
    },
    miss() {
      if (!ready()) return;
      tone(220, { type: 'triangle', decay: 0.1, gain: 0.25, slide: 0.8 });
    },
    fever() {
      vibrate(vib.fever);
      if (!ready()) return;
      tone(90, { type: 'sine', decay: 0.4, gain: 0.9, slide: 0.5 });
      noise({ decay: 0.5, gain: 0.25, freq: 4000 });
      [0, 4, 7, 12, 16, 19].forEach((n, i) => tone(semitone(660, n), { type: 'square', at: 0.05 + i * 0.06, decay: 0.14, gain: 0.18 }));
    },
    big(n) {
      if (!ready()) return;
      const top = Math.min(n - 6, 6);
      [12, 16, 19 + top].forEach((s, i) => tone(semitone(880, s), { type: 'triangle', at: 0.06 + i * 0.05, decay: 0.16, gain: 0.3 }));
    },
    spurt() {
      vibrate(vib.fever);
      if (!ready()) return;
      noise({ decay: 0.35, gain: 0.2, freq: 1500 });
      tone(330, { type: 'sawtooth', decay: 0.35, gain: 0.12, slide: 3 });
      [0, 7, 12].forEach((s, i) => tone(semitone(660, s), { type: 'square', at: 0.25 + i * 0.07, decay: 0.12, gain: 0.16 }));
    },
    count(n) {
      if (!ready()) return;
      tone(n === 1 ? 1320 : 990, { type: 'square', decay: 0.09, gain: 0.16 });
    },
    bonus() {
      vibrate(vib.starMade);
      if (!ready()) return;
      [0, 4, 7, 12].forEach((s, i) => tone(semitone(784, s), { type: 'triangle', at: i * 0.08, decay: 0.22, gain: 0.35 }));
      noise({ at: 0.3, decay: 0.6, gain: 0.18, freq: 6000 });
    },
    rank(r) {
      vibrate(vib.boom);
      if (!ready()) return;
      tone(80, { type: 'sine', decay: 0.45, gain: 1, slide: 0.5 });
      if (r === 'S' || r === 'A') {
        [0, 4, 7, 12].forEach((s, i) => tone(semitone(523, s), { type: 'square', at: 0.12 + i * 0.1, decay: i === 3 ? 0.5 : 0.14, gain: 0.2 }));
      }
    },
    boom() {
      vibrate(vib.boom);
      if (!ready()) return;
      tone(110, { type: 'sine', decay: 0.45, gain: 1, slide: 0.35 });
      tone(70, { type: 'triangle', at: 0.02, decay: 0.5, gain: 0.8, slide: 0.5 });
      tone(900, { type: 'square', decay: 0.08, gain: 0.12, slide: 0.3 });
    },
    star() {
      vibrate(vib.star);
      if (!ready()) return;
      tone(160, { type: 'sine', decay: 0.35, gain: 0.9, slide: 0.4 });
      [0, 7, 12].forEach((n, i) => tone(semitone(880, n), { type: 'triangle', at: 0.04 + i * 0.05, decay: 0.12, gain: 0.25 }));
    },
    starMade() {
      vibrate(vib.starMade);
      if (!ready()) return;
      [12, 19].forEach((n, i) => tone(semitone(660, n), { type: 'sine', at: i * 0.07, decay: 0.16, gain: 0.3 }));
    },
    feverTick() {
      if (!ready()) return;
      tone(1480, { type: 'triangle', decay: 0.06, gain: 0.3 });
    },
    tick() {
      if (!ready()) return;
      tone(1200, { type: 'sine', decay: 0.04, gain: 0.2 });
    },
    end() {
      vibrate(vib.end);
      if (!ready()) return;
      tone(784, { type: 'sine', decay: 0.3, gain: 0.5 });
      tone(1046, { type: 'sine', at: 0.18, decay: 0.5, gain: 0.5 });
    },
  };
}
