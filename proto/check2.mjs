// Brute force over all digit assignments (n=6) vs fast.mjs posterior.
import { nextProbs, ashuffle } from './fast.mjs';
const n = 6; let maxErr = 0, cases = 0;
for (const a of [2, 3, 4, 8]) {
  const total = a ** n, pre = new Map();
  for (let x = 0; x < total; x++) {
    let y = x; const d = [];
    for (let i = 0; i < n; i++) { d.push([y % a, i]); y = Math.floor(y / a); }
    d.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const deck = d.map(z => z[1]);
    for (let m = 0; m < n; m++) { const k = deck.slice(0, m).join(','); if (!pre.has(k)) pre.set(k, new Map()); const mm = pre.get(k); mm.set(deck[m], (mm.get(deck[m]) || 0) + 1); }
  }
  for (const [k, mm] of pre) {
    const prefix = k === '' ? [] : k.split(',').map(Number);
    let tot = 0; for (const v of mm.values()) tot += v;
    for (const [c, v] of nextProbs(prefix, a, n)) { maxErr = Math.max(maxErr, Math.abs(v - (mm.get(c) || 0) / tot)); cases++; }
  }
}
console.log('cases', cases, 'max error', maxErr);
