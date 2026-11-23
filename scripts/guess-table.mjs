// Measure the greedy guesser's average score (52 cards, complete feedback) after k riffles. Usage: node guess-table.mjs k T seed
import { ashuffle, bestGuess, rng } from '../src/cards.js';
const [k, T, seed] = process.argv.slice(2).map(Number), n = 52, a = 2 ** k, r = rng(seed);
let tot = 0, tot2 = 0; const hist = new Array(n + 1).fill(0);
for (let t = 0; t < T; t++) { const d = ashuffle(a, n, r); let ok = 0;
  for (let i = 0; i < n; i++) if (bestGuess(d.slice(0, i), a, n).card === d[i]) ok++;
  tot += ok; tot2 += ok * ok; hist[ok]++; }
const mean = tot / T, sd = Math.sqrt(tot2 / T - mean * mean);
console.log(JSON.stringify({ k, T, seed, mean, se: sd / Math.sqrt(T), sd, hist }));
