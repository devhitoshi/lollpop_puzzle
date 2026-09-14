// Match state: time, score, combo, "!" gauge, fever. Everything the HUD shows is read from `state`.
// No DOM access. The field (grid or physics) is passed in, so rules are shared by both feels.

export function createGame({ config, field, colorCount = 5, duration = config.game.duration, words = [], rng = Math.random }) {
  const { game: g, score: s, combo: cb, fever: fv } = config;
  const min = g.minChain;

  const state = {
    phase: 'play', // 'play' | 'end'
    timeLeft: duration,
    duration,
    timerRunning: !g.startTimerOnFirstClear,
    score: 0,
    combo: 0,
    maxCombo: 0,
    sinceClear: Infinity,
    bangs: 0,
    fever: { active: false, left: 0, count: 0 },
    cleared: Array(colorCount).fill(0),
    totalCleared: 0,
    clears: 0,
    longest: 0,
    rescuesLeft: config.rescue.count,
  };

  let boardDirty = true; // re-check for a stuck board once things stop moving
  const listeners = new Set();
  const emit = (event) => listeners.forEach((fn) => fn(event));

  function blastFor() {
    if (!state.fever.active) return 0;
    return field.kind === 'grid' ? fv.blastCells : fv.blastFactor;
  }

  return {
    state,
    field,
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    update(dt) {
      field.step(dt);
      if (state.phase !== 'play') return;

      if (state.timerRunning) {
        state.timeLeft = Math.max(0, state.timeLeft - dt);
        if (state.timeLeft === 0) {
          state.phase = 'end';
          state.fever.active = false;
          emit({ type: 'end' });
          return;
        }
      }

      state.sinceClear += dt;
      if (state.combo > 0 && state.sinceClear > cb.window) {
        state.combo = 0;
        emit({ type: 'comboEnd' });
      }

      if (state.fever.active) {
        state.fever.left -= dt;
        if (state.fever.left <= 0) {
          state.fever.active = false;
          state.fever.left = 0;
          emit({ type: 'feverEnd' });
        }
      }

      if (boardDirty && field.isSettled()) {
        boardDirty = false;
        if (!field.hasMove(min)) {
          field.shuffle(min);
          emit({ type: 'shuffle' });
        }
      }
    },

    // pieces: the traced path, in order
    commit(pieces) {
      if (state.phase !== 'play') return { ok: false, reason: 'ended' };
      if (pieces.length < min) {
        const result = { ok: false, reason: pieces.length === min - 1 ? 'short' : 'tap' };
        emit({ type: 'miss', ...result });
        return result;
      }

      const fever = state.fever.active;
      const removed = field.remove(pieces.map((p) => p.id), { blast: blastFor() });
      boardDirty = true;

      state.combo = state.sinceClear <= cb.window ? state.combo + 1 : 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      state.sinceClear = 0;
      state.timerRunning = true;
      state.clears += 1;
      state.longest = Math.max(state.longest, pieces.length);

      const extra = Math.max(0, pieces.length - min);
      const base = s.perPiece * removed.length + s.longBonus * extra * extra;
      const multiplier = (1 + s.comboStep * Math.min(state.combo - 1, s.comboCap)) * (fever ? s.feverMultiplier : 1);
      const points = Math.round((base * multiplier) / 10) * 10;
      state.score += points;

      for (const p of removed) state.cleared[p.color] += 1;
      state.totalCleared += removed.length;

      let feverStarted = false;
      if (!fever) {
        state.bangs += 1;
        if (state.bangs >= fv.bangsToFever) {
          state.bangs = 0;
          state.fever.active = true;
          state.fever.left = fv.duration;
          state.fever.count += 1;
          feverStarted = true;
        }
      }

      const word = words.length ? words[Math.floor(rng() * words.length)] : null;
      const result = { ok: true, traced: pieces, removed, points, combo: state.combo, fever, feverStarted, word };
      emit({ type: 'clear', ...result });
      if (feverStarted) emit({ type: 'feverStart' });
      return result;
    },

    // Rescue: blow up the bottom and remix. Doesn't score, doesn't fill "!", keeps the combo alive.
    rescue() {
      if (state.phase !== 'play' || state.rescuesLeft <= 0) return null;
      state.rescuesLeft -= 1;
      const removed = field.blastBottom();
      boardDirty = true;
      if (state.combo > 0) state.sinceClear = 0;
      const result = { removed, rescuesLeft: state.rescuesLeft };
      emit({ type: 'rescue', ...result });
      return result;
    },

    // Debug / design shortcuts (?pos=)
    startFever() {
      state.bangs = 0;
      state.fever.active = true;
      state.fever.left = fv.duration;
      state.fever.count += 1;
      emit({ type: 'feverStart' });
    },

    summary() {
      let favorite = 0;
      state.cleared.forEach((n, i) => {
        if (n > state.cleared[favorite]) favorite = i;
      });
      return {
        score: state.score,
        maxCombo: state.maxCombo,
        feverCount: state.fever.count,
        totalCleared: state.totalCleared,
        favorite: state.totalCleared ? favorite : null,
        festival: festivalDegree(state.score, config),
      };
    },
  };
}

// 「ポップなお祭り度」: 0–100 against a target score, plus a tier label.
export function festivalDegree(score, config) {
  const { fullScore, tiers } = config.result;
  const percent = Math.min(100, Math.round((score / fullScore) * 100));
  const tier = [...tiers].reverse().find((t) => percent >= t.min) ?? tiers[0];
  return { percent, label: tier.label };
}
