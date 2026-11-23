// Simulate GSR riffle shuffles and next-card guessing with complete feedback.
const n = 52;
function riffle(deck) { // one GSR shuffle
  let c = 0; for (let i = 0; i < deck.length; i++) if (Math.random() < .5) c++;
  let A = deck.slice(0, c), B = deck.slice(c), out = [], i = 0, j = 0;
  while (i < A.length || j < B.length) {
    const a = A.length - i, b = B.length - j;
    if (Math.random() * (a + b) < a) out.push(A[i++]); else out.push(B[j++]);
  }
  return out;
}
const strategies = {
  succ: (seen, last) => { // successor of last revealed card, else smallest unseen
    if (last >= 0 && last + 1 < n && !seen[last + 1]) return last + 1;
    for (let c = 0; c < n; c++) if (!seen[c]) return c; },
  smallest: (seen) => { for (let c = 0; c < n; c++) if (!seen[c]) return c; },
  random: (seen) => { const u = []; for (let c = 0; c < n; c++) if (!seen[c]) u.push(c); return u[Math.floor(Math.random()*u.length)]; },
};
const T = 20000;
for (let k = 1; k <= 12; k++) {
  const res = {};
  for (const s in strategies) res[s] = 0;
  for (let t = 0; t < T; t++) {
    let d = [...Array(n).keys()]; for (let r = 0; r < k; r++) d = riffle(d);
    for (const s in strategies) {
      const seen = new Array(n).fill(false); let last = -1, ok = 0;
      for (const card of d) { if (strategies[s](seen, last) === card) ok++; seen[card] = true; last = card; }
      res[s] += ok;
    }
  }
  console.log(k, Object.entries(res).map(([s, v]) => `${s} ${(v / T).toFixed(2)}`).join('  '));
}
