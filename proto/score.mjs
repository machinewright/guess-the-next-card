// Average correct guesses (complete feedback) for the greedy exact-posterior guesser, 52 cards, k riffles.
import { nextProbs, ashuffle } from './exact.mjs';
const n = 52, T = +process.argv[2] || 2000;
for (let k = 1; k <= 10; k++) {
  const a = 2 ** k; let tot = 0, tot2 = 0;
  for (let t = 0; t < T; t++) {
    const d = ashuffle(a, n); let ok = 0;
    for (let i = 0; i < n; i++) {
      let best = -1, bp = -1;
      for (const [c, p] of nextProbs(d.slice(0, i), a, n)) if (p > bp) { bp = p; best = c; }
      if (best === d[i]) ok++;
    }
    tot += ok; tot2 += ok * ok;
  }
  const mean = tot / T, sd = Math.sqrt(tot2 / T - mean * mean);
  console.log(k, mean.toFixed(2), '±', (sd / Math.sqrt(T)).toFixed(2), 'sd', sd.toFixed(2));
}
