import { test } from 'node:test';
import assert from 'node:assert/strict';
import { riffle, riffleDetail, ashuffle, nextProbs, bestGuess, tvDistance, risingSequences, movedOdds, fresh, rng, cardName, isRed } from '../src/cards.js';

// Exact distribution of decks after k GSR riffles of a fresh n-card deck, by enumerating cuts and interleavings.
function riffleDist(deck) {
  const n = deck.length, m = new Map();
  for (let c = 0; c <= n; c++) {
    let binom = 1; for (let i = 0; i < c; i++) binom = binom * (n - i) / (i + 1);
    const A = deck.slice(0, c), B = deck.slice(c), inter = [];
    (function rec(i, j, out) {
      if (i === A.length && j === B.length) { inter.push(out); return; }
      if (i < A.length) rec(i + 1, j, [...out, A[i]]);
      if (j < B.length) rec(i, j + 1, [...out, B[j]]);
    })(0, 0, []);
    for (const o of inter) { const k = o.join(','); m.set(k, (m.get(k) || 0) + binom / 2 ** n / inter.length); }
  }
  return m;
}
function riffledDist(n, k) {
  let d = new Map([[fresh(n).join(','), 1]]);
  for (let r = 0; r < k; r++) { const m = new Map(); for (const [key, p] of d) for (const [k2, p2] of riffleDist(key.split(',').map(Number))) m.set(k2, (m.get(k2) || 0) + p * p2); d = m; }
  return d;
}
// Exact distribution of an a-shuffle by enumerating all a^n digit assignments (the model nextProbs is built on).
function digitDist(a, n) {
  const m = new Map(), tot = a ** n;
  for (let x = 0; x < tot; x++) {
    let y = x; const p = [];
    for (let i = 0; i < n; i++) { p.push([y % a, i]); y = Math.floor(y / a); }
    p.sort((u, v) => u[0] - v[0] || u[1] - v[1]);
    const deck = new Array(n); p.forEach(([, q], c) => { deck[q] = c; });
    const key = deck.join(','); m.set(key, (m.get(key) || 0) + 1 / tot);
  }
  return m;
}

test('a 2^k-shuffle has exactly the distribution of k riffles (n=5, k=1..3)', () => {
  for (let k = 1; k <= 3; k++) {
    const d = riffledDist(5, k), g = digitDist(2 ** k, 5);
    for (const key of new Set([...d.keys(), ...g.keys()])) assert.ok(Math.abs((d.get(key) || 0) - (g.get(key) || 0)) < 1e-12, key);
  }
});

test('riffle and ashuffle sample the same distribution as the exact one (n=4, chi-square-ish)', () => {
  const r = rng(1), T = 40000, d = riffledDist(4, 2), cR = new Map(), cA = new Map();
  for (let t = 0; t < T; t++) {
    const x = riffle(riffle(fresh(4), r), r).join(','); cR.set(x, (cR.get(x) || 0) + 1);
    const y = ashuffle(4, 4, r).join(','); cA.set(y, (cA.get(y) || 0) + 1);
  }
  for (const [key, p] of d) for (const c of [cR, cA]) assert.ok(Math.abs((c.get(key) || 0) / T - p) < 5 * Math.sqrt(p * (1 - p) / T) + 1e-9, key);
  const det = riffleDetail(fresh(10), rng(3));
  assert.deepEqual([...det.deck].sort((a, b) => a - b), fresh(10));
  assert.equal(det.from.filter(f => f === 0).length, det.cut);
});

test('nextProbs equals the brute-force posterior (n=5,6; a=2,3,4,8)', () => {
  let cases = 0;
  for (const n of [5, 6]) for (const a of [2, 3, 4, 8]) {
    const dist = digitDist(a, n), pre = new Map();
    for (const [key, p] of dist) {
      const deck = key.split(',').map(Number);
      for (let m = 0; m < n; m++) { const k = deck.slice(0, m).join(','); if (!pre.has(k)) pre.set(k, new Map()); const mm = pre.get(k); mm.set(deck[m], (mm.get(deck[m]) || 0) + p); }
    }
    for (const [k, mm] of pre) {
      const prefix = k === '' ? [] : k.split(',').map(Number); let tot = 0; for (const v of mm.values()) tot += v;
      for (const [c, v] of nextProbs(prefix, a, n)) { assert.ok(Math.abs(v - (mm.get(c) || 0) / tot) < 1e-12); cases++; }
    }
  }
  assert.ok(cases > 6000);
});

test('one riffle: the first card is the ace of spades or the top of the bottom half', () => {
  const p = nextProbs([], 2, 52);
  // P(first card is 0) = 1/2 (top half) + P(cut=0)... exactly: card 0 is on top unless the drop starts from the bottom half.
  assert.ok(p.get(0) > 0.5 && p.get(0) < 0.53, String(p.get(0)));
  assert.equal(bestGuess([], 2, 52).card, 0);
  assert.ok(Math.abs([...p.values()].reduce((s, v) => s + v, 0) - 1) < 1e-12);
});

test('total variation distance matches Bayer & Diaconis for 52 cards', () => {
  const want = { 5: 0.924, 6: 0.614, 7: 0.334, 8: 0.167, 9: 0.085, 10: 0.043 };
  for (const [k, v] of Object.entries(want)) assert.equal(Math.round(tvDistance(52, +k) * 1000) / 1000, v, `k=${k}`);
  for (let k = 1; k <= 4; k++) assert.ok(tvDistance(52, k) > 0.9999);
  // and brute force for n=5
  for (let k = 1; k <= 3; k++) {
    const d = riffledDist(5, k); let s = 0; for (const p of d.values()) s += Math.abs(p - 1 / 120); s += (120 - d.size) / 120;
    assert.ok(Math.abs(s / 2 - tvDistance(5, k)) < 1e-9, `n=5 k=${k}`);
  }
});

test('rising sequences: k riffles leave at most 2^k', () => {
  const r = rng(9);
  for (let k = 1; k <= 5; k++) for (let t = 0; t < 200; t++) {
    let d = fresh(52); for (let i = 0; i < k; i++) d = riffle(d, r);
    assert.ok(risingSequences(d).count <= 2 ** k);
  }
  assert.equal(risingSequences(fresh(52)).count, 1);
  assert.equal(risingSequences(fresh(52).reverse()).count, 52);
});

test('moved card: odds sum to 1 and one riffle almost always gives it away', () => {
  const r = rng(5); let ok = 0;
  for (let t = 0; t < 100; t++) {
    const d0 = fresh(52), from = Math.floor(r() * 52), [m] = d0.splice(from, 1);
    let to; do { to = Math.floor(r() * 52); } while (Math.abs(to - from) < 2);
    d0.splice(to, 0, m);
    const o = movedOdds(riffle(d0, r), 1);
    assert.ok(Math.abs(o.reduce((s, v) => s + v, 0) - 1) < 1e-9);
    if (o.indexOf(Math.max(...o)) === m) ok++;
  }
  assert.ok(ok >= 90, String(ok));
});

test('card names', () => {
  assert.equal(cardName(0), 'A♠'); assert.equal(cardName(51), 'K♦'); assert.equal(cardName(22), '10♥');
  assert.ok(isRed(13) && isRed(51) && !isRed(0) && !isRed(26));
});

test('one riffle of ANY deck at most doubles its rising sequences (all 6-card decks, all cuts and interleavings)', () => {
  const perms = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));
  for (const d of perms(fresh(6))) {
    const r = risingSequences(d).count;
    for (let c = 0; c <= 6; c++) {
      const A = d.slice(0, c), B = d.slice(c);
      (function rec(i, j, o) {
        if (i === A.length && j === B.length) { assert.ok(risingSequences(o).count <= 2 * r); return; }
        if (i < A.length) rec(i + 1, j, [...o, A[i]]); if (j < B.length) rec(i, j + 1, [...o, B[j]]);
      })(0, 0, []);
    }
  }
});
