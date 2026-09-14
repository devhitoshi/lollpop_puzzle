// Balance check: plays matches in Node with a simple bot and prints scores / how long endless lasts.
// usage: node scripts/balance.mjs [runs=20]
// The bot clears a random 3–6 chain every `interval` seconds, and taps a star when there is one.
import { CONFIG } from '../js/config.js';
import { createRng } from '../js/rng.js';
import { createPhysicsField } from '../js/field-physics.js';
import { createGame } from '../js/game.js';

const runs = Number(process.argv[2]) || 20;
const dt = 1 / 60;

function play({ mode, interval, seed, limit = 600 }) {
  const rng = createRng(seed);
  const field = createPhysicsField({ config: CONFIG, rng });
  const game = createGame({ config: CONFIG, field, mode, rng });
  for (let i = 0; i < 60 * 5; i++) field.step(dt);
  let wait = 0;
  for (let t = 0; t < limit && game.state.phase === 'play'; t += dt) {
    game.update(dt);
    wait -= dt;
    if (wait > 0) continue; // people trace while candies are still rolling
    const star = field.pieces.find((p) => p.special);
    if (star && rng() < 0.5) {
      game.commit([star]);
    } else {
      const want = 3 + Math.floor(rng() * 4);
      const chain = field.findChain(want) ?? field.findChain(3);
      if (chain) game.commit(chain);
    }
    wait = interval;
  }
  return game.summary();
}

const stats = (xs) => {
  const sorted = [...xs].sort((a, b) => a - b);
  const avg = xs.reduce((a, b) => a + b, 0) / xs.length;
  return `avg ${Math.round(avg).toLocaleString()}  min ${Math.round(sorted[0]).toLocaleString()}  max ${Math.round(sorted.at(-1)).toLocaleString()}`;
};

for (const interval of [1.2, 1.5, 2.5, 3.5]) {
  const res = Array.from({ length: runs }, (_, i) => play({ mode: 'timed', interval, seed: 1000 + i }));
  console.log(`timed   every ${interval}s  score: ${stats(res.map((r) => r.score))}  fever: ${stats(res.map((r) => r.feverCount))}  combo: ${stats(res.map((r) => r.maxCombo))}  %: ${stats(res.map((r) => r.festival.percent))}  bonus: ${res.filter((r) => r.bonusTime).length}/${res.length}  length(s): ${stats(res.map((r) => r.elapsed))}`);
}
for (const interval of [1.2, 2, 3]) {
  const res = Array.from({ length: runs }, (_, i) => play({ mode: 'endless', interval, seed: 2000 + i }));
  console.log(`endless every ${interval}s  lasted(s): ${stats(res.map((r) => r.elapsed))}  score: ${stats(res.map((r) => r.score))}  %: ${stats(res.map((r) => r.festival.percent))}`);
}
