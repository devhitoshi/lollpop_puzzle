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
    duration: 180, // seconds
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
    feverMultiplier: 2,
  },

  combo: {
    window: 2.5, // seconds allowed between clears to keep the combo
  },

  fever: {
    bangsToFever: 7, // "!" count — !!!!!!!
    duration: 8, // seconds
    warnAt: 2, // seconds left when the fever timer starts to blink and tick
    blastCells: 1, // grid: clear this many cells around every traced piece
    blastFactor: 1.6, // physics: clear bodies within (rA + rB) × factor
  },

  // ?feel=grid
  grid: {
    cols: 7,
    rows: 8,
    adjacency: 8, // ?adj=4|8 — 8 allows diagonal links
    gravity: 60, // cells / s²
    maxFall: 22, // cells / s
    spawnGap: 1.15, // vertical spacing of refills above the board
    // Landing squash: the candy flattens on impact and wobbles back (the "ぽよん")
    squashPerSpeed: 0.045, // scale lost per cell/s of impact speed
    squashMax: 0.45,
    squashSpring: { response: 0.38, dampingFraction: 0.2 }, // low damping = long, wide wobble
    bounce: 0.32, // fraction of the impact speed that bounces back up
  },

  // ?feel=physics
  physics: {
    width: 7, // same visual footprint as the grid
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

  // Rescue: blow up the bottom of the board and remix the colors. No score, no "!", combo kept.
  rescue: {
    count: 3, // per match
    gridRows: 2, // grid: bottom rows removed
    physicsDepth: 2.2, // physics: bodies whose center is within this distance of the floor
    shake: 0.35, // seconds of board shake
  },

  input: {
    pickRadius: 0.62, // starting a trace: generous hit circle (field units; one candy ≈ 1)
    linkRadius: 0.42, // extending a trace: tighter, so a diagonal swipe doesn't grab the side neighbors
    sampleStep: 0.15, // pointer segments are sampled at this spacing, so fast swipes don't skip
  },

  // Piece look. ?skin= overrides. See assets/skins/README.md
  skin: {
    default: 'candy', // used when the player hasn't chosen yet
    // Shown on the title screen (T8). ?skin= still accepts any folder name for testing.
    choices: [
      { name: 'candy', label: '飴' },
      { name: 'members', label: 'メンバー' },
    ],
    storageKey: 'lollpop-puzzle:skin',
  },

  render: {
    maxDpr: 2,
    candyRadius: 0.42, // drawn candy size relative to one cell / body diameter
    artRadius: 0.49, // piece art (skins with images) fills more of the cell than a candy
    stickLength: 0.66,
    selectedScale: 1.1,
    traceOutline: 0.1, // white rim of the trace capsule, beyond the candy edge
    traceInset: 0.035, // colored band just outside the candy edge
    traceOutlinePulse: 0.02,
    boomDuration: 0.9,
    popDuration: 0.32,
    wordDuration: 1.1,
  },

  // 「ポップなお祭り度」 on the result screen. Tune fullScore after playtesting.
  result: {
    fullScore: 300000, // 100% at this score (provisional: a bot clearing every 1.5 s scores ~330k–460k)
    tiers: [
      { min: 0, label: 'お祭りの準備中' },
      { min: 25, label: '屋台めぐり' },
      { min: 50, label: 'お祭りの真ん中' },
      { min: 75, label: '楽しさ無限大' },
      { min: 100, label: 'ポップなお祭りの主役' },
    ],
  },

  sound: {
    volume: 0.5,
  },
};
