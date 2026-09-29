// Every tunable value lives here. design.html imports this file for the M table,
// so the numbers on the spec sheet are always the numbers in the game.

export const COLORS = [
  // Member colors from lollpop_docs/design.md (mc-*). Graduated members are not used.
  { key: 'kurumi', name: 'くるみ', fill: '#cc0000', swirl: '#ff5a5a', rim: '#6e0000' },
  { key: 'mayu', name: 'まゆ', fill: '#f5c400', swirl: '#fff08a', rim: '#8a6a00' },
  { key: 'mau', name: 'まう', fill: '#7fd4e8', swirl: '#d8f6ff', rim: '#2d7f94' },
  { key: 'ami', name: 'あみ', fill: '#2e9e5b', swirl: '#7fe0a6', rim: '#0f5230' },
  { key: 'mana', name: 'まな', fill: '#ffffff', swirl: '#f6d3e3', rim: '#9c8792', band: '#ff7fbf' },
];

export const CONFIG = {
  // Match length and timing
  game: {
    duration: 60, // seconds (timed mode)
    minChain: 3, // pieces needed to clear
    startTimerOnFirstClear: true, // don't burn time while a first-timer is figuring it out
    hurryAt: 10, // seconds left when the timer starts to pulse
    shortHintMs: 1600, // "3 個からつなごう" toast
  },

  score: {
    perPiece: 60,
    // Bonus grows with the square of pieces past the minimum: 5 pieces → +2² × bonus
    longBonus: 45,
    comboStep: 0.1, // multiplier added per combo
    comboCap: 30, // multiplier stops growing here (×4.0)
    feverMultiplier: 3,
  },

  combo: {
    window: 2.5, // seconds allowed between clears to keep the combo
  },

  fever: {
    bangsToFever: 7, // "!" count — !!!!!!!
    piecesPerBang: 8, // one "!" per this many cleared pieces (7 × 8 = 56). Rare and long, so each fever feels big
    timeBonus: 5, // seconds added when fever starts (endless: up to the life cap)
    duration: 12, // seconds (Tsum Tsum: 11)
    warnAt: 2, // seconds left when the fever timer starts to blink and tick
    blastFactor: 2, // clear candies within (rA + rB) × factor of a traced one
  },

  // The board: round candies piling up in a box
  physics: {
    width: 7, // box size in candy units (one candy ≈ 1 across)
    height: 8,
    count: 46,
    radius: 0.5,
    radiusJitter: 0.06, // ± fraction, so the pile doesn't crystallize into a lattice
    gravity: 38,
    step: 1 / 120, // fixed simulation step; the result doesn't depend on the frame rate
    maxSubsteps: 12,
    iterations: 4, // collision solver passes per step
    restitution: 0.25,
    friction: 0.08, // tangential velocity damping on contact
    airDrag: 0.4, // per second
    linkFactor: 1.15, // "connected" when distance ≤ (rA + rB) × linkFactor
    settleSpeed: 0.35, // everything slower than this counts as resting
    settleTime: 0.25, // seconds of rest before a stuck-board check
    spawnGap: 1.05,
    squashPerSpeed: 0.05,
    squashMax: 0.42,
    squashSpring: { response: 0.36, dampingFraction: 0.2 },
  },

  // Timed mode's last seconds: "!" fills faster, and a fever that is still going when time runs out
  // keeps the match alive until it ends (bonus time).
  lastSpurt: {
    at: 10, // seconds left
    piecesPerBang: 2, // instead of fever.piecesPerBang (balance.mjs: a bot clearing every 2.5 s still reaches a final fever 10 times in 12)
  },

  // Endless mode (?mode=endless): timeLeft is a life gauge. It drains faster over time; clearing refills it.
  endless: {
    start: 10, // seconds of life at the start
    max: 10, // life can't go above this
    perPiece: 0.6, // life refilled per cleared piece
    drain: 1, // life lost per second at the start
    drainGrowth: 0.012, // drain speeds up by this fraction per second played
    drainMax: 2.5, // drain never gets faster than this
    hurryAt: 3, // life left when the gauge starts to pulse
    fullScore: 400000, // 100% of 「ポップなお祭り度」 in endless (provisional; balance.mjs: clearing every 1.2 s averages ~320k)
  },

  // Star candy: made by long chains, tapped to blow up its neighbors
  special: {
    minChain: 7, // traced pieces needed to make one
    max: 3, // stars on the board at once
    blast: 2.2, // clears candies within (rA + rB) × blast of the star
  },

  // Rescue: blow up the bottom of the board and remix the colors. No score, no "!", combo kept.
  rescue: {
    count: 3, // per match
    physicsDepth: 2.2, // candies whose center is within this distance of the floor
    shake: 0.35, // seconds of board shake
  },

  input: {
    pickRadius: 0.62, // starting a trace: generous hit circle (field units; one candy ≈ 1)
    linkRadius: 0.42, // extending a trace: tighter, so a diagonal swipe doesn't grab the side neighbors
    sampleStep: 0.15, // pointer segments are sampled at this spacing, so fast swipes don't skip
  },

  // Piece look. ?skin= overrides. See assets/skins/README.md
  skin: {
    default: 'members', // used when the player hasn't chosen yet
    // Shown on the title screen (T8). ?skin= still accepts any folder name for testing.
    choices: [
      { name: 'candy', label: '飴' },
      { name: 'members', label: 'メンバー' },
    ],
    storageKey: 'lollpop-puzzle:skin',
  },

  // UI theme. ?theme= overrides. Colors and shapes live in css/themes/<name>.css
  theme: {
    default: 'stylish', // used when the player hasn't chosen yet
    // Shown on the title screen (T9). ready: false shows 「準備中」 and can't be picked.
    choices: [
      { name: 'stylish', label: 'スタイリッシュ' },
      { name: 'candy', label: 'キャンディ', ready: false },
    ],
    storageKey: 'lollpop-puzzle:theme',
  },

  render: {
    maxDpr: 2,
    candyRadius: 0.42, // drawn candy size relative to one cell / body diameter
    artRadius: 0.49, // piece art (skins with images) fills more of the cell than a candy
    starRadius: 0.44, // star candy (CONFIG.special)
    stickLength: 0.66,
    selectedScale: 1.1,
    traceOutline: 0.1, // white rim of the trace capsule, beyond the candy edge
    traceInset: 0.035, // colored band just outside the candy edge
    traceEdge: 0.035, // thin dark line outside the white rim, for light themes (--trace-edge)
    traceOutlinePulse: 0.02,
    boomDuration: 0.9,
    popDuration: 0.32,
    popGhost: 0.14, // a cleared candy lingers this long with its pop face, swelling before it bursts
    popGhostScale: 1.35,
    wordDuration: 1.1,
  },

  // Effects. Kicks are velocities in candy units / s; shakes are seconds; flashes are peak opacity.
  // With "reduce motion" there are no kicks, shakes, flashes or spinning rays, and particles are halved.
  fx: {
    maxParticles: 400,
    clearParticles: { base: 12, perExtra: 7, max: 40 }, // 3 pieces → 12, 7 or more → 40
    bigChain: 6, // pieces: small shake, white flash and a word
    words: [
      { min: 10, text: 'AMAZING!' },
      { min: 8, text: 'GREAT!' },
      { min: 6, text: 'NICE!' },
    ],
    comboMilestone: 10, // "10 COMBO!" every this many
    kickClear: 2.2, // outward push from a clear, times (pieces - 2)
    kickStar: 9,
    kickFever: 8, // every candy hops up when fever starts
    shakeBig: 0.16,
    shakeStar: 0.32,
    flashBig: 0.22,
    flashStar: 0.45,
    flashFever: 0.4,
    feverConfetti: 80,
    starParticles: 60,
    sparklesPerSecond: 14, // rising from the board during fever
    bonusConfettiPerSecond: 24, // gold confetti during bonus time
    countdownFrom: 5, // big faint numbers in the last seconds
    reducedParticleScale: 0.5,
  },

  // 「ポップなお祭り度」 on the result screen. Tune fullScore after playtesting.
  result: {
    fullScore: 200000, // 100% at this score (provisional; scripts/balance.mjs: a bot clearing every 1.5 s averages ~160k)
    tiers: [
      { min: 0, label: 'お祭りの準備中' },
      { min: 25, label: '屋台めぐり' },
      { min: 50, label: 'お祭りの真ん中' },
      { min: 75, label: '楽しさ無限大' },
      { min: 100, label: 'ポップなお祭りの主役' },
    ],
    // Rank letter on the result screen (provisional)
    ranks: [
      { min: 90, rank: 'S' },
      { min: 70, rank: 'A' },
      { min: 40, rank: 'B' },
      { min: 0, rank: 'C' },
    ],
    // Result bars are full at these values. Score uses the festival %, 推し色 its share of cleared pieces.
    bars: {
      combo: 30,
      fever: 5,
      elapsed: 120, // endless: seconds survived
    },
    bestKey: 'lollpop-puzzle:best', // + ':timed' / ':endless'
  },

  sound: {
    volume: 0.5,
  },

  // Vibration (ms, or a pattern). Android uses navigator.vibrate. iPhone has no vibration API, so js/haptics.js
  // gives a single light tick on button taps instead (tracing can't vibrate there).
  // W: how to play, shown once before the first match (remembered on the device)
  howto: { storageKey: 'lollpop-puzzle:howto-seen' },
  // R7: X share. Hashtags without "#".
  share: { hashtags: ['ろりぽっぷパズル'] },
  vibration: {
    link: 12, // each candy added to the trace
    clear: 22,
    clearLong: 35, // 6 or more pieces
    star: [30, 30, 60],
    starMade: [15, 40, 15],
    fever: [25, 40, 25, 40, 70],
    boom: [40, 30, 90],
    end: 60,
    storageKey: 'lollpop-puzzle:vibration', // 'on' | 'off'
  },
};
