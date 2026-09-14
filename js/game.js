// Match state: time, score, combo, "!" gauge, fever, star candies. Everything the HUD shows is read from `state`.
// No DOM access. The field (js/field-physics.js) is passed in, so tests can use fixed boards.
//
// Two modes share every rule except the clock:
//   timed    a fixed match (CONFIG.game.duration); fever adds a few seconds. In the last seconds "!" fills
//            faster (last spurt), and a fever running when time hits 0 becomes bonus time: the match ends with the fever
//   endless  `timeLeft` is a life gauge that drains faster and faster; clearing candies refills it

export function createGame({ config, field, colorCount = 5, mode = 'timed', duration = config.game.duration, words = [], rng = Math.random }) {
  const { game: g, score: s, combo: cb, fever: fv, endless: en, special: sp, lastSpurt: ls } = config;
  const min = g.minChain;
  const endless = mode === 'endless';

  const state = {
    mode,
    phase: 'play', // 'play' | 'end'
    endReason: null, // 'timeup' | 'gameover'
    timeLeft: endless ? en.start : duration,
    duration,
    elapsed: 0, // seconds since the clock started
    drainRate: endless ? en.drain : 1,
    timerRunning: !g.startTimerOnFirstClear,
    score: 0,
    combo: 0,
    maxCombo: 0,
    sinceClear: Infinity,
    bangs: 0,
    // "!" progress in bang units. Each clear adds pieces / piecesPerBang *at that moment*, so entering the
    // last spurt speeds up what comes next without turning pieces already cleared into extra "!".
    bangProgress: 0,
    lastSpurt: false,
    bonusTime: false,
    fever: { active: false, left: 0, count: 0, timeBonus: 0 },
    cleared: Array(colorCount).fill(0),
    totalCleared: 0,
    clears: 0,
    longest: 0,
    starsMade: 0,
    rescuesLeft: config.rescue.count,
  };

  let boardDirty = true; // re-check for a stuck board once things stop moving
  const listeners = new Set();
  const emit = (event) => listeners.forEach((fn) => fn(event));

  const addTime = (seconds) => {
    state.timeLeft = endless ? Math.min(en.max, state.timeLeft + seconds) : state.timeLeft + seconds;
  };

  function startFever() {
    state.bangs = 0;
    state.bangProgress = 0;
    state.fever.active = true;
    state.fever.left = fv.duration;
    state.fever.count += 1;
    // In the last spurt the fever runs into bonus time instead, so extra seconds would only cut it short
    state.fever.timeBonus = state.lastSpurt ? 0 : fv.timeBonus;
    addTime(state.fever.timeBonus);
  }

  // Score, combo, "!" and time for a set of removed pieces. Shared by traced chains and star candies.
  function award(removed, { bonusPieces = 0 } = {}) {
    const fever = state.fever.active;
    state.combo = state.sinceClear <= cb.window ? state.combo + 1 : 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.sinceClear = 0;
    state.timerRunning = true;
    state.clears += 1;

    const extra = Math.max(0, bonusPieces);
    const base = s.perPiece * removed.length + s.longBonus * extra * extra;
    const multiplier = (1 + s.comboStep * Math.min(state.combo - 1, s.comboCap)) * (fever ? s.feverMultiplier : 1);
    const points = Math.round((base * multiplier) / 10) * 10;
    state.score += points;

    for (const p of removed) if (p.color !== null) state.cleared[p.color] += 1;
    state.totalCleared += removed.length;
    if (endless) addTime(en.perPiece * removed.length);

    let feverStarted = false;
    if (!fever) {
      const per = state.lastSpurt ? ls.piecesPerBang : fv.piecesPerBang;
      state.bangProgress += removed.length / per;
      state.bangs = Math.min(fv.bangsToFever, Math.floor(state.bangProgress + 1e-9));
      if (state.bangs >= fv.bangsToFever) {
        startFever();
        feverStarted = true;
      }
    }
    return { points, combo: state.combo, fever, feverStarted };
  }

  function finish() {
    state.phase = 'end';
    state.endReason = endless ? 'gameover' : 'timeup';
    state.fever.active = false;
    emit({ type: 'end', reason: state.endReason });
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

      if (state.timerRunning) state.elapsed += dt;
      if (state.timerRunning && !state.bonusTime) {
        if (endless) state.drainRate = Math.min(en.drainMax, en.drain * (1 + en.drainGrowth * state.elapsed));
        state.timeLeft = Math.max(0, state.timeLeft - dt * state.drainRate);
        if (!endless && !state.lastSpurt && state.timeLeft <= ls.at) {
          state.lastSpurt = true; // stays on even if fever's time bonus lifts the clock back above `at`
          emit({ type: 'lastSpurt' });
        }
        if (state.timeLeft === 0) {
          if (!endless && state.fever.active) {
            state.bonusTime = true;
            emit({ type: 'bonusStart' });
          } else {
            finish();
            return;
          }
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
          if (state.bonusTime) {
            finish();
            return;
          }
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

    // pieces: the traced path, in order. A single star candy is a tap that detonates it.
    commit(pieces) {
      if (state.phase !== 'play') return { ok: false, reason: 'ended' };

      if (pieces.length === 1 && pieces[0].special) {
        const star = pieces[0];
        const removed = field.remove([star.id], { blast: sp.blast });
        boardDirty = true;
        const result = { ok: true, traced: pieces, removed, star: 'detonated', word: null, ...award(removed) };
        emit({ type: 'clear', ...result });
        if (result.feverStarted) emit({ type: 'feverStart' });
        return result;
      }

      if (pieces.length < min) {
        const result = { ok: false, reason: pieces.length === min - 1 ? 'short' : 'tap' };
        emit({ type: 'miss', ...result });
        return result;
      }

      const last = pieces[pieces.length - 1];
      const starsOnBoard = field.pieces.filter((p) => p.special).length;
      const makeStar = pieces.length >= sp.minChain && starsOnBoard < sp.max;
      const removed = field.remove(pieces.map((p) => p.id), { blast: state.fever.active ? fv.blastFactor : 0, special: makeStar ? { x: last.x, y: last.y } : null });
      boardDirty = true;
      if (makeStar) state.starsMade += 1;
      state.longest = Math.max(state.longest, pieces.length);

      const word = words.length ? words[Math.floor(rng() * words.length)] : null;
      const result = { ok: true, traced: pieces, removed, star: makeStar ? 'made' : null, word, ...award(removed, { bonusPieces: pieces.length - min }) };
      emit({ type: 'clear', ...result });
      if (result.feverStarted) emit({ type: 'feverStart' });
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
      startFever();
      emit({ type: 'feverStart' });
    },

    summary() {
      let favorite = 0;
      state.cleared.forEach((n, i) => {
        if (n > state.cleared[favorite]) favorite = i;
      });
      const clearedColored = state.cleared.reduce((a, n) => a + n, 0);
      return {
        mode,
        endReason: state.endReason,
        bonusTime: state.bonusTime,
        elapsed: state.elapsed,
        score: state.score,
        maxCombo: state.maxCombo,
        feverCount: state.fever.count,
        totalCleared: state.totalCleared,
        favorite: clearedColored ? favorite : null,
        favoriteShare: clearedColored ? state.cleared[favorite] / clearedColored : 0,
        festival: festivalDegree(state.score, config, mode),
      };
    },
  };
}

// 「ポップなお祭り度」: 0–100 against the mode's target score, plus a tier label and a rank letter.
export function festivalDegree(score, config, mode = 'timed') {
  const { tiers, ranks } = config.result;
  const fullScore = mode === 'endless' ? config.endless.fullScore : config.result.fullScore;
  const percent = Math.min(100, Math.round((score / fullScore) * 100));
  const tier = [...tiers].reverse().find((t) => percent >= t.min) ?? tiers[0];
  const rank = ranks.find((r) => percent >= r.min) ?? ranks.at(-1);
  return { percent, label: tier.label, rank: rank.rank };
}
