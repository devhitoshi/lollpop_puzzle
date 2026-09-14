// Synthesized sounds and vibration. No audio files (and no music — see requirements.md).
//   link(n)   a rising blip per candy added to the trace
//   clear(n)  a pop whose pitch climbs with the combo
//   fever     a quick five-note arpeggio
//   boom      the rescue explosion
//   feverTick the last seconds of fever
//   tick      the last-10-seconds clock
//   end       a two-note chime

export function createFeedback(config) {
  const cfg = config.sound;
  let enabled = true;
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

  const vibrate = (ms) => navigator.vibrate?.(ms);
  const semitone = (base, n) => base * 2 ** (n / 12);

  return {
    setEnabled(v) {
      enabled = v;
    },
    get enabled() {
      return enabled;
    },
    link(n) {
      vibrate(8);
      if (!ready()) return;
      tone(semitone(660, Math.min(n, 14) * 1), { type: 'triangle', decay: 0.07, gain: 0.35 });
    },
    clear(count, combo) {
      vibrate(count >= 6 ? 30 : 18);
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
      vibrate([20, 40, 20, 40, 60]);
      if (!ready()) return;
      [0, 4, 7, 12, 16].forEach((n, i) => tone(semitone(660, n), { type: 'square', at: i * 0.06, decay: 0.12, gain: 0.18 }));
    },
    boom() {
      vibrate([40, 30, 90]);
      if (!ready()) return;
      tone(110, { type: 'sine', decay: 0.45, gain: 1, slide: 0.35 });
      tone(70, { type: 'triangle', at: 0.02, decay: 0.5, gain: 0.8, slide: 0.5 });
      tone(900, { type: 'square', decay: 0.08, gain: 0.12, slide: 0.3 });
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
      vibrate(60);
      if (!ready()) return;
      tone(784, { type: 'sine', decay: 0.3, gain: 0.5 });
      tone(1046, { type: 'sine', at: 0.18, decay: 0.5, gain: 0.5 });
    },
  };
}
