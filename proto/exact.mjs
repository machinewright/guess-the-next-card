// Exact posterior P(next card = c | cards seen so far) after an a-shuffle (k GSR riffles = one 2^k-shuffle).
//
// Forward a-shuffle: each POSITION of the final deck gets an iid uniform digit in 0..a-1 (which packet it is drawn
// from); positions sorted by (digit, position) receive cards 0,1,2,... in order.
// Equivalently, a pair (deck tau, f) is uniform over: f = digit of each card VALUE, nondecreasing in value, strictly
// increasing from x to x+1 whenever x+1 lies above x in tau. P(tau) = #f / a^n = C(n+a-r, n) / a^n.
//
// Given the seen prefix, sum over f and completions. For fixed f, the unseen values split into blocks (maximal runs of
// consecutive unseen values with equal digit); inside a block the order is forced increasing, so the number of
// completions is U!/prod(b!), and the next card is c with probability b_c/U if c starts its block, else 0.
// A DP over "units" (a seen value, or a block of unseen values) in value order, with forward and backward tables.

export function nextProbs(prefix, a, n) {
  const pos = new Int32Array(n).fill(-1);
  prefix.forEach((c, i) => { pos[c] = i; });
  const seen = x => pos[x] >= 0;
  // strict(x): must f(x) < f(x+1)? (boundary between unit ending at x and unit starting at x+1)
  const strict = x => !seen(x) ? true : (seen(x + 1) ? pos[x + 1] < pos[x] : false);
  const U = n - prefix.length;
  const fact = [1]; for (let i = 1; i <= n; i++) fact[i] = fact[i - 1] * i;
  // runEnd[x]: for unseen x, the last index of the run of unseen values starting at x
  const runEnd = new Int32Array(n);
  for (let x = n - 1; x >= 0; x--) runEnd[x] = seen(x) ? x - 1 : (x + 1 < n && !seen(x + 1) ? runEnd[x + 1] : x);

  // G[x][d]: weight of assigning values 0..x-1 as complete units, value x-1 has digit d. G[0]: virtual start.
  const G = Array.from({ length: n + 1 }, () => new Float64Array(a));
  // allowed(x, d): sum of G[x][d0] over d0 compatible with value x starting a unit with digit d
  const startFrom = (x, cum) => { // cum = prefix sums of G[x]; returns function d -> weight
    if (x === 0) return () => 1;
    const st = strict(x - 1);
    return d => st ? (d > 0 ? cum[d - 1] : 0) : cum[d];
  };
  const prefixSums = row => { const c = new Float64Array(a); let s = 0; for (let d = 0; d < a; d++) { s += row[d]; c[d] = s; } return c; };
  const inW = []; // inW[x](d): incoming weight for a unit starting at x with digit d
  for (let x = 0; x < n; x++) {
    const w = startFrom(x, x ? prefixSums(G[x]) : null);
    inW[x] = w;
    if (seen(x)) { for (let d = 0; d < a; d++) G[x + 1][d] += w(d); }
    else for (let e = x; e <= runEnd[x]; e++) { const b = e - x + 1; for (let d = 0; d < a; d++) G[e + 1][d] += w(d) / fact[b]; }
  }
  // H[x][d]: weight of completing values x..n-1 given value x-1 ended a unit with digit d.
  const H = Array.from({ length: n + 1 }, () => new Float64Array(a));
  H[n].fill(1);
  const outW = []; // outW[x](d) = H[x][d], i.e., weight after a unit ending at x-1 with digit d
  for (let x = n - 1; x >= 0; x--) {
    // unit starting at x with digit d', given previous digit d: requires d' >= d (or > if strict(x-1))
    // T[d'] = weight of units starting at x with digit d' times the rest
    const T = new Float64Array(a);
    if (seen(x)) for (let d = 0; d < a; d++) T[d] = H[x + 1][d];
    else for (let e = x; e <= runEnd[x]; e++) { const b = e - x + 1; for (let d = 0; d < a; d++) T[d] += H[e + 1][d] / fact[b]; }
    if (x === 0) { H[0].fill(T.reduce((s, v) => s + v, 0)); continue; }
    const st = strict(x - 1); // suffix sums
    let s = 0; const suf = new Float64Array(a + 1);
    for (let d = a - 1; d >= 0; d--) { s += T[d]; suf[d] = s; }
    for (let d = 0; d < a; d++) H[x][d] = st ? suf[d + 1] : suf[d];
  }
  const out = new Map(); let tot = 0;
  for (let c = 0; c < n; c++) {
    if (seen(c)) continue;
    let p = 0;
    for (let e = c; e <= runEnd[c]; e++) {
      const b = e - c + 1;
      for (let d = 0; d < a; d++) p += inW[c](d) * (b / U) / fact[b] * H[e + 1][d];
    }
    out.set(c, p); tot += p;
  }
  for (const [c, v] of out) out.set(c, v / tot);
  return out;
}

// One forward a-shuffle of cards 0..n-1 (top of deck first).
export function ashuffle(a, n, rand = Math.random) {
  const p = [...Array(n).keys()].map(i => [Math.floor(rand() * a), i]);
  p.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const deck = new Array(n);
  p.forEach(([, position], card) => { deck[position] = card; });
  return deck;
}

// One GSR riffle (cut binomially, drop proportional to packet sizes), for cross-checking ashuffle(2^k) = k riffles.
export function riffle(deck, rand = Math.random) {
  let c = 0; for (let i = 0; i < deck.length; i++) if (rand() < .5) c++;
  const A = deck.slice(0, c), B = deck.slice(c), out = []; let i = 0, j = 0;
  while (i < A.length || j < B.length) { const x = A.length - i, y = B.length - j; if (rand() * (x + y) < x) out.push(A[i++]); else out.push(B[j++]); }
  return out;
}
