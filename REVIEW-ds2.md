# Review: "Your own deck" section (round 2)

Scope: `index.html` §"Your own deck", `widgets/yours.js`, `riffleFit` in `src/cards.js`. Read-only; findings only.

---

## Q1. Is `riffleFit`'s likelihood ratio right? Yes.

`src/cards.js:148-159` computes log of P_k(deck) / P_random. For a deck with `r` rising sequences,
Bayer–Diaconis give P_k = C(n+a−r, n)/a^n with a = 2^k, and P_random = 1/n!. So

  ratio = C(n+a−r, n) · n! / a^n
        = (n+a−r)! / ((a−r)! · a^n)          (the n! cancels)
        = Σᵢ₌₁ⁿ log(a−r+i) − n·k·ln 2   in log space.

The code computes exactly this: `l = Σ (log(a−r+i) − log i)`, then `l + logFact − n·k·LN2`, and
`logFact = Σ log i`, so `l + logFact = Σ log(a−r+i)`. Correct. I brute-forced the full a-shuffle
distribution for n=3,4,5 and k=1,2 (a=2,4) against the formula — **0 mismatch**, including the edge
cases r=1, r=a (C(n,n)/a^n = 1/a^n), and r>a (the `-Infinity` branch, `cards.js:154`). No bug here.

---

## Findings (most important first)

### 1. HIGH — a fully reversed deck (r=52) is told it "looks well shuffled"

`widgets/yours.js:47-51`

The summary takes `best = rows.find(x => x.logRatio > -Infinity)`, i.e. the ratio at `k = fewest`
(the first k that can produce r at all), and classifies the deck by that single number:

```js
const best = rows.find(x => x.logRatio > -Infinity);
const top = best ? best.logRatio : -Infinity;
html += top > Math.log(1000) ? `<p>Your deck still clearly remembers its order: …</p>`
      : top > Math.log(10)   ? `<p>Some order is left: …</p>`
      : `<p>By this test your deck looks well shuffled.</p>`;
```

For r ≥ 22 the ratio at k=fewest is already **below 1**, so the third branch fires and the page
prints *"By this test your deck looks well shuffled."* That is wrong in two ways:

- **Trigger deck (r=52):** the fully reversed deck `[51,50,…,1,0]` has 52 rising sequences — the
  *maximum*, the farthest a deck can be from random in this metric. The readout still says it
  "looks well shuffled." (At k=fewest=6 the log-ratio is −31.1; the deck is ~10¹³ times *less*
  likely than a random deck, but the page reads that as "well shuffled".)
- The miscalibration starts far earlier: `r=22` (already *below* the 26.5 random average, i.e. more
  ordered than random) gives top≈+1.5 < ln 10, so it too is called "well shuffled".

Root cause: the ratio P_k/P_random only detects "too few" rising sequences (ratio > 1). A deck with
too *many* rising sequences (reversed / anti-ordered) is also non-random, but its ratio is < 1 and
the code treats "not more likely after riffles" as "random-looking". (Related: the ratio is not
monotone in k — it falls for small r but *rises toward 1 from below* for r ≳ 22, so `find(...)`
does not give the maximum-likelihood k; the same wrong assumption is encoded in
`test/cards.test.js:150`.)

### 2. MEDIUM — "or Y if the deck was also cut" overclaims for the specific deck

`widgets/yours.js:42`

```js
(r > 2 && Math.ceil(Math.log2(r - 1)) < fewest ? `, or ${Math.ceil(Math.log2(r - 1))} if the deck was also cut.` : '.')
```

This fires exactly when r = 2^m + 1 (e.g. r=3 → "…or 1 if the deck was also cut"; r=5 → "or 2";
r=9 → "or 3"; …). The first clause is fine: a deck with r rising sequences needs at least
ceil(log₂ r) riffles, and that many *do* reach it (the a-shuffle hits every deck with r ≤ a). But the
cut clause states that **your** deck could have been made with one fewer riffle plus a cut. A cut
(rotation) raises r by at most 1, and cuts commute with riffles up to a final cut, so "Y riffles +
cuts" is exactly "a rotation of a Y-shuffle". Not every deck with r = 2^m+1 is such a rotation.

**Trigger deck (r=3):** take the fresh order and swap two adjacent pairs far apart — e.g. swap
A♥↔2♥ and J♣↔Q♣ (indices: `[0,1,…,12, 14,13, 15,…,35, 37,36, 38,…,51]`). This deck has r = 3, but
no single rotation of it has r ≤ 2 (I checked all 52 rotations), so it cannot be made by one riffle
*plus any number of cuts*. The page nonetheless prints "…or 1 if the deck was also cut."

### 3. LOW — selected cards are never announced by name; dealt cards vanish from tab order

`widgets/yours.js:9-10, 23, 30-33`

Each card is a `<button aria-label="ace of spades">`. Once clicked it gets `disabled`
(`render()`, line 30) and drops out of the tab order, and the only live feedback is the positional
`say` text *"Next: card N from the top."* (line 33) — the `dealt` line is `aria-live="off"`
(line 10). A screen-reader user gets no confirmation of *which* card they just entered, and the
dealt card's accessible name never changes to indicate it was already picked. The result (readout)
also announces the entire table verbatim. Minor, but a real gap in the names/announcements.

### 4. LOW — dead "impossible" branch in the table

`widgets/yours.js:39,46`

`shown` is filtered to `k >= fewest`, and logRatio is finite at k=fewest, so every rendered row has
a finite ratio; the `x.logRatio === -Infinity ? 'impossible' : …` case can never render. Harmless,
but the "impossible" wording is unreachable.

---

## Q2/Q3 checklist

- Every other printed sentence checks out: "26.5 on average", "one riffle at most doubles them",
  "fewest riffles … is ceil(log₂ r)" (true and reachable for r ≤ 2^k), r=1 → "It is still in order",
  the k-riffle ratio table (verified against the formula), and the `-Infinity` rows for r > 2^k.
- The `cards` grid is 13 columns; at 360 px the columns are ≈22 px (gap 2 px) and the rank+suit
  wrap onto two lines via `.cards br.narrow` (`style.css:87-88`), so no horizontal overflow is
  expected. I could not run a headless browser here to confirm scrollWidth, but static inspection
  shows no fixed widths that would overflow; the main risk is the ≈22 px touch target (smaller than
  the 44 px guideline), not layout breakage.
- No state/undo/clear bug found: `entered` is a single `let` binding shared by both handlers;
  re-selection is prevented by `disabled`, and undo/clear/demo all re-render correctly.
