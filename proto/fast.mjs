// Fast exact posterior next-card probabilities for an a-shuffle (digit model), O(a * n) per step.
// Model: card i (original position) gets an iid uniform digit in 0..a-1; the deck is sorted by (digit, i).
// k GSR riffle shuffles = one 2^k-shuffle (Bayer-Diaconis).
function lchoose(N, K) { if (K < 0 || K > N) return -Infinity; let s = 0; for (let i = 1; i <= K; i++) s += Math.log(N - K + i) - Math.log(i); return s; }

export function nextProbs(prefix, a, n) {
  const seen = new Set(prefix), unseen = [];
  for (let c = 0; c < n; c++) if (!seen.has(c)) unseen.push(c);
  const m = prefix.length, last = m ? prefix[m - 1] : -1;
  let s = 0; for (let i = 1; i < m; i++) if (prefix[i] < prefix[i - 1]) s++;
  // W[D]: weight of "last prefix card has digit D" = #nondecreasing digit sequences for the prefix ending at D.
  const W = new Float64Array(a), Wle = new Float64Array(a), Wlt = new Float64Array(a);
  if (m) {
    const lw = []; let maxl = -Infinity;
    for (let D = 0; D < a; D++) { lw[D] = lchoose(D - s + m - 1, m - 1); if (lw[D] > maxl) maxl = lw[D]; }
    for (let D = 0; D < a; D++) W[D] = Math.exp(lw[D] - maxl);
  }
  let acc = 0; for (let e = 0; e < a; e++) { Wlt[e] = acc; acc += W[e]; Wle[e] = acc; }
  const U = unseen.length, out = new Map();
  unseen.forEach((c, idx) => {
    const g = U - 1 - idx, l = idx; // unseen cards above / below c
    let p = 0;
    for (let e = 0; e < a; e++) { // c gets digit e and is the smallest remaining key
      const w = m ? (c > last ? Wle[e] : Wlt[e]) : 1;
      if (w === 0) continue;
      const hi = (a - e) / a, lo = (a - 1 - e) / a;
      if (l > 0 && lo === 0) continue;
      p += w * Math.pow(hi, g) * Math.pow(lo, l);
    }
    out.set(c, p);
  });
  let tot = 0; for (const v of out.values()) tot += v;
  for (const [c, v] of out) out.set(c, v / tot);
  return out;
}

export function ashuffle(a, n) {
  const d = [...Array(n).keys()].map(i => [Math.floor(Math.random() * a), i]);
  d.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  return d.map(x => x[1]);
}
