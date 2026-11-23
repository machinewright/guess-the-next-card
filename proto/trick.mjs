// Moved-card trick: deck in order, a card is taken from the top and pushed into the middle, then k riffles.
// Finder: the card whose value x has neither x-1 nor x+1 continuing a rising sequence through it... use: rising-sequence
// decomposition of the final deck; the moved card is the one forming the shortest rising sequence (ties -> fail).
import { riffle } from './exact.mjs';
const n = 52, T = 20000;
function risingSeqs(deck) { const pos = []; deck.forEach((c, i) => pos[c] = i); const seqs = []; let cur = [0];
  for (let x = 1; x < deck.length; x++) { if (pos[x] > pos[x - 1]) cur.push(x); else { seqs.push(cur); cur = [x]; } } seqs.push(cur); return seqs; }
for (const k of [1, 2, 3, 4, 5]) { let ok = 0;
  for (let t = 0; t < T; t++) {
    let d = [...Array(n).keys()]; const moved = d.shift(); const at = 10 + Math.floor(Math.random() * 32); d.splice(at, 0, moved);
    // relabel: the audience's deck is d; finder knows original order d minus... finder knows only the ORIGINAL order (0..n-1)
    for (let r = 0; r < k; r++) d = riffle(d);
    const seqs = risingSeqs(d); const min = Math.min(...seqs.map(s => s.length)); const cand = seqs.filter(s => s.length === min);
    if (cand.length === 1 && cand[0].length === 1 && cand[0][0] === moved) ok++;
  }
  console.log(k, 'riffles: found', (100 * ok / T).toFixed(1) + '%'); }
