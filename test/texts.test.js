// Every number the essay states, checked against the code or the measured data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tvDistance, movedOdds, riffle, fresh, rng } from '../src/cards.js';
import { GUESS_TABLE, CHANCE } from '../src/data.js';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8').replace(/\s+/g, ' ');
const has = s => assert.ok(html.includes(s), `text should say: ${s}`);

function eulerian(n) { let row = [1n]; for (let m = 2; m <= n; m++) { const nr = []; for (let d = 0; d < m; d++) nr[d] = BigInt(d + 1) * (row[d] || 0n) + BigInt(m - d) * (row[d - 1] || 0n); row = nr; } return row; }
const E = eulerian(52); let F = 1n; for (let i = 2n; i <= 52n; i++) F *= i;

test('random deck: 4.5 right by chance, 26.5 rising sequences on average', () => {
  assert.equal(CHANCE.toFixed(1), '4.5'); has('4.5 right on average');
  let mean = 0n; E.forEach((c, d) => { mean += c * BigInt(d + 1); });
  assert.equal(Number(mean * 10n / F) / 10, 26.5); has('A truly random deck has 26.5 on average');
});

test('16 or fewer rising sequences: about once in two million deals', () => {
  let s = 0n; for (let d = 0; d < 16; d++) s += E[d];
  const p = Number(s * 10n ** 15n / F) / 1e15; // 4.67e-7 = 1 in 2.1 million
  assert.ok(1 / p > 2.0e6 && 1 / p < 2.3e6, String(1 / p)); has('about once in two million deals');
});

test('distance numbers', () => {
  for (let k = 1; k <= 4; k++) assert.ok(tvDistance(52, k) > 0.9999);
  assert.equal(tvDistance(52, 5).toFixed(2), '0.92'); assert.equal(tvDistance(52, 6).toFixed(2), '0.61'); assert.equal(tvDistance(52, 7).toFixed(2), '0.33');
  has('0.92 after five riffles, 0.61 after six, 0.33 after seven');
  for (let k = 7; k < 12; k++) { const r = tvDistance(52, k + 1) / tvDistance(52, k); assert.ok(r > 0.49 && r < 0.52, `halves: ${k}`); }
  for (let k = 1; k <= 10; k++) assert.equal(GUESS_TABLE[k].tv, +tvDistance(52, k).toFixed(4));
});

test('guesser averages quoted in the text match the measured table', () => {
  assert.equal(Math.round(GUESS_TABLE[3].mean), 13); has('averages 13 cards right after three riffles, nearly three times chance');
  assert.ok(GUESS_TABLE[3].mean / CHANCE > 2.7 && GUESS_TABLE[3].mean / CHANCE < 3);
  assert.equal(GUESS_TABLE[4].mean.toFixed(1), '8.8'); has('After four it still gets 8.8, about twice chance');
  assert.equal(GUESS_TABLE[7].mean.toFixed(1), '5.0'); has('After seven it is down to 5.0');
  assert.ok(GUESS_TABLE[7].mean - CHANCE < 0.5); has('within half a card of a random deck');
  // "agree with these": within 0.3 of Bayer & Diaconis's simulated values everywhere
  for (let k = 1; k <= 10; k++) assert.ok(Math.abs(GUESS_TABLE[k].mean - GUESS_TABLE[k].bd) < 0.3, `k=${k}`);
  for (let k = 1; k <= 10; k++) assert.equal(GUESS_TABLE[k].decks, 4000); has('4,000 decks');
});

test('moved card: 94%, 86%, 62%, about 1 in 8 for 1-4 riffles', () => {
  const rate = (k, T, seed) => { const r = rng(seed); let hit = 0;
    for (let t = 0; t < T; t++) { const d = fresh(52), from = Math.floor(r() * 52), [m] = d.splice(from, 1);
      let to; do { to = Math.floor(r() * 52); } while (to === from); d.splice(to, 0, m);
      let x = d; for (let q = 0; q < k; q++) x = riffle(x, r);
      const o = movedOdds(x, k); if (o.indexOf(Math.max(...o)) === m) hit++; }
    return hit / T; };
  const r1 = rate(1, 1500, 11), r2 = rate(2, 1500, 12), r3 = rate(3, 1500, 13), r4 = rate(4, 1500, 14);
  const near = (x, want, tol) => assert.ok(Math.abs(x - want) < tol, `${x} vs ${want}`);
  near(r1, 0.94, 0.02); near(r2, 0.86, 0.03); near(r3, 0.62, 0.04); near(r4, 0.125, 0.03); assert.ok(r4 * 52 > 5.5);
  has('94% of the time after one riffle, 86% after two, and 62% after three'); has('about one time in eight'); has('six times better than a blind guess');
});
