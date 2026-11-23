// Exact posterior next-card guessing (greedy) for an a-shuffle (a = 2^k), digit model.
let n = +(process.env.N || 52);
function lchoose(N, K) { if (K < 0 || K > N) return -Infinity; let s = 0; for (let i = 1; i <= K; i++) s += Math.log(N - K + i) - Math.log(i); return s; }
function ashuffle(a) { const d = [...Array(n).keys()].map(i => [Math.floor(Math.random() * a), i]); d.sort((x, y) => x[0] - y[0] || x[1] - y[1]); return d.map(x => x[1]); }
export function nextProbs(prefix, a) {
  const seen = new Set(prefix), unseen = [...Array(n).keys()].filter(c => !seen.has(c));
  const m = prefix.length, last = m ? prefix[m - 1] : -1;
  let s = 0; for (let i = 1; i < m; i++) if (prefix[i] < prefix[i - 1]) s++;
  const prob = new Map(unseen.map(c => [c, 0]));
  const Ds = m ? [...Array(a).keys()] : [-1];
  for (const D of Ds) {
    const lw = m ? lchoose(D - s + m - 1, m - 1) : 0; if (lw === -Infinity) continue;
    for (const c of unseen) for (let e = Math.max(D, 0); e < a; e++) {
      if (m && e === D && c < last) continue;
      let lp = lw - Math.log(a);
      for (const u of unseen) if (u !== c) { const p = (a - 1 - e + (u > c ? 1 : 0)) / a; if (p <= 0) { lp = -Infinity; break; } lp += Math.log(p); }
      if (lp > -Infinity) prob.set(c, prob.get(c) + Math.exp(lp));
    }
  }
  return prob;
}
if (!process.env.CHECK) {
const T = +process.argv[2] || 200;
for (const k of [3, 4, 5, 6, 7, 8]) {
  const a = 2 ** k; let tot = 0;
  for (let t = 0; t < T; t++) {
    const d = ashuffle(a); let ok = 0;
    for (let i = 0; i < n; i++) { const pr = nextProbs(d.slice(0, i), a); let best = -1, bp = -1; for (const [c, p] of pr) if (p > bp) { bp = p; best = c; } if (best === d[i]) ok++; }
    tot += ok;
  }
  console.log(k, (tot / T).toFixed(2));
}
}
