// Core maths for the essay. Cards are numbers 0..n-1 in their starting order; a deck is an array, top card first.
// Shuffle model: Gilbert-Shannon-Reeds (GSR). k GSR riffles = one "a-shuffle" with a = 2^k (Bayer & Diaconis 1992).

export const SUITS = ['♠', '♥', '♣', '♦'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const cardName = c => RANKS[c % 13] + SUITS[Math.floor(c / 13)];
export const cardLong = c => {
  const r = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'][c % 13];
  return `${r} of ${['spades', 'hearts', 'clubs', 'diamonds'][Math.floor(c / 13)]}`;
};
export const isRed = c => c >= 13 && c < 26 || c >= 39;

// Small seeded generator (mulberry32) so widgets and tests can replay a deck.
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const fresh = n => [...Array(n).keys()];

// One GSR riffle: cut binomially, then drop from either half with probability proportional to its size.
// Returns the new deck plus the cut and, for each position, which half (0 top, 1 bottom) the card came from.
export function riffleDetail(deck, rand = Math.random) {
  let cut = 0; for (let i = 0; i < deck.length; i++) if (rand() < 0.5) cut++;
  const A = deck.slice(0, cut), B = deck.slice(cut), out = [], from = []; let i = 0, j = 0;
  while (i < A.length || j < B.length) {
    const x = A.length - i, y = B.length - j;
    if (rand() * (x + y) < x) { out.push(A[i++]); from.push(0); } else { out.push(B[j++]); from.push(1); }
  }
  return { deck: out, cut, from };
}
export const riffle = (deck, rand) => riffleDetail(deck, rand).deck;

// One a-shuffle of a fresh deck: each POSITION gets a uniform digit 0..a-1; positions sorted by (digit, position)
// receive cards 0, 1, 2, ... in order. Same distribution as log2(a) riffles when a is a power of two.
export function ashuffle(a, n, rand = Math.random) {
  const p = [...Array(n).keys()].map(i => [Math.floor(rand() * a), i]);
  p.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const deck = new Array(n);
  p.forEach(([, position], card) => { deck[position] = card; });
  return deck;
}

// Rising sequences: maximal runs of consecutive card numbers x, x+1, ... that appear top-to-bottom in that order.
// Returns, for each card, the index of its rising sequence, and the count.
export function risingSequences(deck) {
  const n = deck.length, pos = new Array(n); deck.forEach((c, i) => { pos[c] = i; });
  const seq = new Array(n); let r = 0; seq[0] = 0;
  for (let x = 1; x < n; x++) { if (pos[x] < pos[x - 1]) r++; seq[x] = r; }
  return { seq, count: n ? r + 1 : 0 };
}

// Exact posterior P(next card = c | the cards dealt so far) for a deck given an a-shuffle (from a fresh order).
// A pair (deck, f) is uniform over f = digit of each card value, nondecreasing in value and strictly increasing from x
// to x+1 whenever x+1 lies above x. For fixed f the unseen cards form blocks (maximal runs of consecutive unseen
// values with one digit) whose inner order is forced, so there are U!/prod(b!) completions and the next card is c
// with probability b_c/U if c starts its block. Forward/backward DP over units (a seen card, or a block).
export function nextProbs(prefix, a, n) {
  const pos = new Int32Array(n).fill(-1);
  prefix.forEach((c, i) => { pos[c] = i; });
  const seen = x => pos[x] >= 0;
  const strict = x => !seen(x) ? true : (seen(x + 1) ? pos[x + 1] < pos[x] : false);
  const U = n - prefix.length;
  const fact = [1]; for (let i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;
  const runEnd = new Int32Array(n);
  for (let x = n - 1; x >= 0; x--) runEnd[x] = seen(x) ? x - 1 : (x + 1 < n && !seen(x + 1) ? runEnd[x + 1] : x);

  // inW[x][d]: weight of all assignments to values 0..x-1 compatible with a unit starting at x with digit d.
  const G = Array.from({ length: n + 1 }, () => new Float64Array(a));
  const inW = Array.from({ length: n }, () => new Float64Array(a));
  for (let x = 0; x < n; x++) {
    const w = inW[x];
    if (x === 0) w.fill(1);
    else { const st = strict(x - 1); let s = 0; for (let d = 0; d < a; d++) { if (st) { w[d] = s; s += G[x][d]; } else { s += G[x][d]; w[d] = s; } } }
    if (seen(x)) for (let d = 0; d < a; d++) G[x + 1][d] += w[d];
    else for (let e = x; e <= runEnd[x]; e++) { const f = fact[e - x + 1]; for (let d = 0; d < a; d++) G[e + 1][d] += w[d] / f; }
  }
  // H[x][d]: weight of completing values x..n-1 after a unit that ended at x-1 with digit d.
  const H = Array.from({ length: n + 1 }, () => new Float64Array(a));
  H[n].fill(1);
  for (let x = n - 1; x >= 1; x--) {
    const T = new Float64Array(a);
    if (seen(x)) for (let d = 0; d < a; d++) T[d] = H[x + 1][d];
    else for (let e = x; e <= runEnd[x]; e++) { const f = fact[e - x + 1]; for (let d = 0; d < a; d++) T[d] += H[e + 1][d] / f; }
    const st = strict(x - 1); let s = 0;
    for (let d = a - 1; d >= 0; d--) { if (st) { H[x][d] = s; s += T[d]; } else { s += T[d]; H[x][d] = s; } }
  }
  const out = new Map(); let tot = 0;
  for (let c = 0; c < n; c++) {
    if (seen(c)) continue;
    let p = 0;
    for (let e = c; e <= runEnd[c]; e++) { const b = e - c + 1, k = b / fact[b]; for (let d = 0; d < a; d++) p += inW[c][d] * k * H[e + 1][d]; }
    out.set(c, p); tot += p;
  }
  for (const [c, v] of out) out.set(c, v / tot);
  return out;
}

// The guesser used in the essay: always name the most likely next card (ties: lowest card number).
export function bestGuess(prefix, a, n) {
  let best = -1, bp = -1;
  for (const [c, p] of nextProbs(prefix, a, n)) if (p > bp + 1e-15) { bp = p; best = c; }
  return { card: best, p: bp };
}

// Exact total variation distance from a uniformly random deck after k riffles of n cards (Bayer & Diaconis):
// a deck with r rising sequences has probability C(n+a-r, n)/a^n; Eulerian numbers count decks with r sequences.
export function tvDistance(n, k) {
  let row = [1n];
  for (let m = 2; m <= n; m++) { const nr = []; for (let d = 0; d < m; d++) nr[d] = BigInt(d + 1) * (row[d] || 0n) + BigInt(m - d) * (row[d - 1] || 0n); row = nr; }
  const N = BigInt(n), a = 2n ** BigInt(k), an = a ** N;
  let fact = 1n; for (let i = 2n; i <= N; i++) fact *= i;
  const binom = (M, K) => { if (K < 0n || K > M) return 0n; let r = 1n; for (let i = 1n; i <= K; i++) r = r * (M - K + i) / i; return r; };
  let num = 0n;
  for (let d = 0; d < n; d++) { const diff = binom(N + a - BigInt(d + 1), N) * fact - an; num += row[d] * (diff < 0n ? -diff : diff); }
  return Number(num * 10n ** 12n / (2n * an * fact)) / 1e12;
}

// The moved-card trick: one card of a fresh deck is taken out and pushed back in somewhere else, then the deck gets
// k riffles. For every possible move (card x to position j) the starting order is known, so the chance of seeing this
// exact deck is C(n+a-r, n)/a^n with r its rising sequences counted against that starting order. Summing over j
// gives each card's posterior chance of being the moved one (uniform prior over moves).
export function movedOdds(deck, k) {
  const n = deck.length, a = 2 ** k, pos = new Array(n); deck.forEach((c, i) => { pos[c] = i; });
  // log C(n+a-r, n) up to a constant; -Infinity when r > a.
  const lw = r => { if (r > a) return -Infinity; let s = 0; for (let i = 1; i <= n; i++) s += Math.log(a - r + i) - Math.log(i); return s; };
  const W = []; for (let r = 1; r <= n; r++) W[r] = lw(r);
  const like = new Float64Array(n); let max = -Infinity; const logs = [];
  for (let x = 0; x < n; x++) {
    const rest = []; for (let c = 0; c < n; c++) if (c !== x) rest.push(c); // fresh order without x
    const ls = [];
    for (let j = 0; j < n; j++) {
      if (j === x) continue; // putting it back where it was is not a move
      const order = rest.slice(); order.splice(j, 0, x);
      let r = 1; for (let i = 1; i < n; i++) if (pos[order[i]] < pos[order[i - 1]]) r++;
      ls.push(W[r]);
    }
    const m = Math.max(...ls); logs[x] = m === -Infinity ? -Infinity : m + Math.log(ls.reduce((s, v) => s + Math.exp(v - m), 0));
    if (logs[x] > max) max = logs[x];
  }
  let tot = 0; for (let x = 0; x < n; x++) { like[x] = logs[x] === -Infinity ? 0 : Math.exp(logs[x] - max); tot += like[x]; }
  return Array.from(like, v => v / tot);
}

// How well does k riffles explain a given deck (from the fresh order)? A deck with r rising sequences has probability
// C(n+a-r, n)/a^n after k riffles (a = 2^k) and 1/n! in a perfectly random deck. Returns, for k = 1..maxK, the log of
// the ratio P_k(deck) / P_random(deck) (-Infinity if k riffles cannot produce the deck), plus r.
export function riffleFit(deck, maxK = 12) {
  const n = deck.length, { count: r } = risingSequences(deck);
  let logFact = 0; for (let i = 2; i <= n; i++) logFact += Math.log(i);
  const rows = [];
  for (let k = 1; k <= maxK; k++) {
    const a = 2 ** k;
    if (r > a) { rows.push({ k, logRatio: -Infinity }); continue; }
    let l = 0; for (let i = 1; i <= n; i++) l += Math.log(a - r + i) - Math.log(i);
    rows.push({ k, logRatio: l + logFact - n * k * Math.LN2 });
  }
  return { r, rows };
}
