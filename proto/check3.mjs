import { nextProbs } from './exact.mjs';
// (1) forward digit model == composition of exact GSR riffles (n=5, a=2,4,8)
const n = 5;
function digitDist(a, n) { const m = new Map(), tot = a ** n;
  for (let x = 0; x < tot; x++) { let y = x; const p = []; for (let i = 0; i < n; i++) { p.push([y % a, i]); y = Math.floor(y / a); }
    p.sort((u, v) => u[0] - v[0] || u[1] - v[1]); const deck = new Array(n); p.forEach(([, q], c) => deck[q] = c);
    const k = deck.join(','); m.set(k, (m.get(k) || 0) + 1 / tot); } return m; }
function riffleDist(deck) { const n = deck.length, m = new Map();
  for (let c = 0; c <= n; c++) { let binom = 1; for (let i = 0; i < c; i++) binom = binom * (n - i) / (i + 1);
    const pc = binom / 2 ** n, A = deck.slice(0, c), B = deck.slice(c);
    const inter = []; (function rec(i, j, out) { if (i === A.length && j === B.length) { inter.push(out); return; }
      if (i < A.length) rec(i + 1, j, [...out, A[i]]); if (j < B.length) rec(i, j + 1, [...out, B[j]]); })(0, 0, []);
    for (const o of inter) { const k = o.join(','); m.set(k, (m.get(k) || 0) + pc / inter.length); } } return m; }
function compose(dist) { const m = new Map(); for (const [k, p] of dist) for (const [k2, p2] of riffleDist(k.split(',').map(Number))) m.set(k2, (m.get(k2) || 0) + p * p2); return m; }
let d = new Map([[[...Array(n).keys()].join(','), 1]]); let err1 = 0;
for (let k = 1; k <= 3; k++) { d = compose(d); const g = digitDist(2 ** k, n);
  for (const key of new Set([...d.keys(), ...g.keys()])) err1 = Math.max(err1, Math.abs((d.get(key) || 0) - (g.get(key) || 0))); }
console.log('digit model vs riffles, max diff', err1);
// (2) nextProbs vs brute force posterior
let err2 = 0, cases = 0;
for (const N of [5, 6]) for (const a of [2, 3, 4, 8]) { const dist = digitDist(a, N), pre = new Map();
  for (const [k, p] of dist) { const deck = k.split(',').map(Number);
    for (let m = 0; m < N; m++) { const key = deck.slice(0, m).join(','); if (!pre.has(key)) pre.set(key, new Map()); const mm = pre.get(key); mm.set(deck[m], (mm.get(deck[m]) || 0) + p); } }
  for (const [key, mm] of pre) { const prefix = key === '' ? [] : key.split(',').map(Number); let tot = 0; for (const v of mm.values()) tot += v;
    for (const [c, v] of nextProbs(prefix, a, N)) { err2 = Math.max(err2, Math.abs(v - (mm.get(c) || 0) / tot)); cases++; } } }
console.log('posterior cases', cases, 'max diff', err2);
