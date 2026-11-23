// Exact total variation distance from uniform after k GSR riffles of n cards (Bayer-Diaconis 1992).
// P(perm with r rising sequences) = C(n+a-r, n)/a^n, a = 2^k; number of perms with r rising sequences = Eulerian A(n, r-1 descents).
const n = +(process.argv[2] || 52);
function eulerian(n) { let row = [1n]; for (let m = 2; m <= n; m++) { const nr = []; for (let d = 0; d < m; d++) nr[d] = BigInt(d + 1) * (row[d] || 0n) + BigInt(m - d) * (row[d - 1] || 0n); row = nr; } return row; } // row[d], d descents
function binom(N, K) { if (K < 0n || K > N) return 0n; let r = 1n; for (let i = 1n; i <= K; i++) r = r * (N - K + i) / i; return r; }
const E = eulerian(n); let fact = 1n; for (let i = 2n; i <= BigInt(n); i++) fact *= i;
const N = BigInt(n);
for (let k = 1; k <= 12; k++) { const a = 2n ** BigInt(k), an = a ** N; let num = 0n; // sum |C(n+a-r,n)*n! - a^n| * A over r; denominator 2 * a^n * n!
  for (let d = 0; d < n; d++) { const r = BigInt(d + 1); const diff = binom(N + a - r, N) * fact - an; num += E[d] * (diff < 0n ? -diff : diff); }
  const den = 2n * an * fact; const scaled = Number(num * 1000000n / den) / 1e6; console.log(k, scaled.toFixed(4)); }
