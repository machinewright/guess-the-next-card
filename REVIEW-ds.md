# Review: guess-the-next-card

Scope: `src/cards.js` correctness, `index.html` prose accuracy, `widgets/*.js` real bugs. Read-only; findings only.

---

## 1. src/cards.js — correctness

All functions are correct. I verified each against independent brute force rather than trusting the repo's own tests:

- `riffleDetail`/`riffle`: correct GSR (binomial cut, drop proportional to remaining packet sizes).
- `ashuffle`: correct forward a-shuffle; `ashuffle(2**k)` has exactly the k-riffle distribution (checked exhaustively n=5, k=1..3).
- `risingSequences`: correct; fresh=1, reversed=52.
- `nextProbs`: correct. I enumerated the full digit model (all `a^n` assignments) and compared the exact posterior for every prefix over n=4..8 and a=2,3,4,5,8 — **0 mismatches**. It also reproduces the exact published values in Krityakierne–Thanatipanonda's counterexample (n=10, k=2, first card 5): P(1 next)=31752/105336, P(6 next)=31570/105336, and `bestGuess([4],4,10).card === 0` (their "1"). No NaN/precision failure for n=52, a up to 256. The forward/backward DP, the `strict` boundary (strict iff `!seen(x) || pos[x+1] < pos[x]`), and the block factor `b/fact[b]` (the `1/U` is a constant dropped in cards.js:92 but it cancels in the normalization) are all right.
- `tvDistance`: correct; matches Bayer–Diaconis (k=5..10 → .924 .614 .334 .167 .085 .043) and brute force for n=5.
- `movedOdds`: correct. Verified against a brute-force posterior over all (card, position) moves for n=5,6 and k=1,2 — **0 mismatches**.
- `cardName`/`cardLong`/`isRed`: correct.

**No failing input exists** for any function in cards.js.

---

## 2. index.html — prose problems

### 2.1 (HIGH, wrong) The "optimal strategy" paragraph — index.html:65-66

> "Naming the most likely card each time is a good strategy, but not proven to be the best one. Looking further ahead can matter, and for two or more riffles nobody knows the best strategy."

This is mathematically false. Guessing the *most likely next card* (exactly what this page's guesser does via `nextProbs`/`bestGuess`) **is** the optimal strategy for maximising the expected number of correct guesses. Under complete feedback the guesser's information at step *i* is the fixed history `C_1..C_{i-1}`, independent of its own guesses, so by linearity of expectation each term `P(guess_i = C_i)` is maximised independently (pointwise-greedy): pick `argmax_c P(C_i = c | history)`. "Looking further ahead can matter" is also false for this objective.

What is true — and what the following sentence does get right — is that **McGrath's simple rule** (continue the longer rising sequence), the rule Bayer–Diaconis actually used, was conjectured optimal and was shown *not* optimal for k≥2 by Krityakierne–Thanatipanonda (2021). That counterexample is precisely a case where the MAP card (1) beats McGrath's rule (6). The paragraph conflates the page's own MAP guesser (optimal) with McGrath's rule (suboptimal for k≥2).

Correct wording would be: "Naming the most likely card each time *is* the best strategy. What Bayer and Diaconis left open was whether McGrath's simpler rule — always continue the longer rising sequence — was optimal; in 2021 Krityakierne and Thanatipanonda showed that for two or more riffles it is not."

### 2.2 (LOW, overclaim) Concentration of the guesser's odds — index.html:64

> "Early on, a handful of cards share almost all of the probability"

Overstated. After three riffles the first-card distribution has max probability only 12.5%, and it takes ~34 cards to reach 90% of the mass (20 cards for 50%). Even after 5 cards are dealt the top card is ~16% and 18 cards are needed for 90%. The guesser's advantage is real but modest, not "a handful of cards holding almost all".

---

## 3. Widgets

### 3.1 (MEDIUM) trick.js — a card can never be moved to the top, but the model assumes it can

`widgets/trick.js:41-43`

```js
const from = deck.indexOf(picked); deck.splice(from, 1); deck.splice(deck.indexOf(c) + 1, 0, picked);
```

The move is "insert **just after** the clicked card", so the inserted card can only land at indices 1..n-1; the very top (index 0) is unreachable. This contradicts the prose ("push it back in somewhere else", index.html:98; "any card, put back anywhere", index.html:103), and `movedOdds` (`src/cards.js:132-134`) sums over insertion position `j = 0..n-1`, i.e. it puts prior mass on the top-insertion moves the widget can never generate.

Repro: pick any card, then try to place it at the very top of the deck — there is no target to click. Contrast with the "Try 200 random moves" button (`trick.js:63-64`, `to` uniform in 0..n-1) which *does* include the top, so the interactive path and the "200 moves" path use slightly different move priors, and the finder's reported confidence is a little off for the interactive path.

### 3.2 (LOW, accessibility name) riffle.js — aria-label lies in the "Show cut" view

`widgets/riffle.js:40-42`

```js
if (cut >= 0 && prevDeck) drawBars(cv, prevDeck, { cutAt: cut, colourOf: ... });
else drawBars(cv, deck, { colourOf });
cv.setAttribute('aria-label', `Bar chart of the deck after ${k} riffle${...}: ${count} rising sequence${...}. Top card: ${cardLong(deck[0])}.`);
```

When "Show where it was cut" is on, the canvas draws the **before**-riffle deck (`prevDeck`), but the aria-label still says "after k riffles", reports `count` computed from the already-riffled `deck`, and names `deck[0]` (the shuffled top card) instead of the card actually drawn. A screen-reader user is told the opposite of what is shown.

Repro: click "Riffle", then "Show where it was cut"; the described deck (count, top card) is the post-riffle deck, not the split pre-riffle deck being drawn.

### 3.3 (LOW, accessibility name) chart.js — `<br>` stripped without spaces in point labels

`widgets/chart.js:22`

```js
const hit = add('circle', {... 'aria-label': tipText(k).replace(/<[^>]+>/g, '') });
```

`tipText(7)` is `<b>7 riffles</b><br>guesser: 5.00 right on average (4,000 decks)<br>chance: 4.54`; stripping tags yields `7 rifflesguesser: 5.00 right on average (4,000 decks)chance: 4.54` — words run together ("rifflesguesser", "decks)chance"). The `<br>` should be replaced with a space (e.g. `.replace(/<br>/g,' ').replace(/<[^>]+>/g,'')`).

Repro: focus or hover any chart point and read its accessible name; the guesser/chance fields are concatenated into the preceding word.

---

## Notes

- No horizontal overflow at 360px: `documentElement.scrollWidth` stays 360, and the trick spread, guess grid, and data table all fit (verified headless). No console errors while exercising every widget at 360px and 1100px.
- The prose's numeric claims (4.5 random, 26.5 rising sequences, 13/8.8/5.0 guesser scores, TV 1→0.92→0.61→0.33 halving, "one in two million", moved-card rates ~93%/9-in-10/6-in-10/lost-after-4) all match `src/data.js` and `tvDistance`/`movedOdds`.
