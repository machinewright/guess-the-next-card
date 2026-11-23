// Brute force: n=5, a=3 and a=4, all digit assignments; compare P(next | prefix) with nextProbs.
process.env.N = '5'; process.env.CHECK = '1';
const { nextProbs } = await import('./bayes.mjs');
const n = 5; let maxErr = 0, cases = 0;
for (const a of [2, 3, 4]) {
  const dist = new Map(); // deck string -> prob
  const total = a ** n;
  for (let x = 0; x < total; x++) { let y = x; const d = []; for (let i = 0; i < n; i++) { d.push([y % a, i]); y = Math.floor(y / a); }
    d.sort((p, q) => p[0] - q[0] || p[1] - q[1]); const key = d.map(z => z[1]).join(''); dist.set(key, (dist.get(key) || 0) + 1 / total); }
  const prefixes = new Map();
  for (const [deck, p] of dist) for (let m = 0; m < n; m++) { const pre = deck.slice(0, m), nx = deck[m];
    if (!prefixes.has(pre)) prefixes.set(pre, new Map()); const mm = prefixes.get(pre); mm.set(nx, (mm.get(nx) || 0) + p); }
  for (const [pre, mm] of prefixes) { const tot = [...mm.values()].reduce((s, v) => s + v, 0);
    const got = nextProbs([...pre].map(Number), a); const gtot = [...got.values()].reduce((s, v) => s + v, 0);
    for (const [c, v] of got) { const want = (mm.get(String(c)) || 0) / tot; maxErr = Math.max(maxErr, Math.abs(v / gtot - want)); cases++; } }
}
console.log('cases', cases, 'max error', maxErr);
