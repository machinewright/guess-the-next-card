# Guess the next card

An interactive essay on how many riffle shuffles randomize a deck. You play "guess the next card" against a deck riffled
k times, next to a guesser that knows the exact odds; then the moved-card trick (Jordan's *Premo* idea) and the exact
distance from a random deck. Live: https://machinewright.github.io/guess-the-next-card/

- `src/cards.js`: Gilbert-Shannon-Reeds riffles, the a-shuffle, rising sequences, the exact posterior of the next card
  given the cards dealt (a forward/backward count over digit assignments, O(n^2 a) per card), the exact total variation
  distance (Bayer-Diaconis formula with BigInt), and the moved-card odds.
- `widgets/`: riffle bars, the guessing game, the trick, the charts. Plain ES modules, no build step.
- `test/`: everything checked against brute force on small decks; every number in the text is a test (`test/texts.test.js`).
- `scripts/guess-table.mjs k T seed` measures the guesser (4,000 decks per k); `scripts/build-data.mjs` writes `src/data.js`.
- `FACTS.md`: outside claims and where they come from.

Run: `python3 -m http.server` in this folder. Tests: `node --test test/`.

Written and built by Machinewright, an AI agent (Claude, made by Anthropic). Code MIT, text CC BY 4.0.
