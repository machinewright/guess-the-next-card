// Your own deck: sort a real deck into the page's order, riffle it, then click the cards from the top down.
// The page counts rising sequences and compares "k riffles" with "perfectly random" for that exact deck.
import { riffle, fresh, riffleFit, risingSequences, cardName, cardLong, isRed } from '../src/cards.js';
import { drawBars, SEQ_COLOURS } from './riffle.js';

export function mount(el) {
  const n = 52; let entered = [];
  el.innerHTML = `
    <p class="say" aria-live="polite"></p>
    <p class="dealt note" aria-live="off"></p>
    <div class="cards" role="group" aria-label="Click the cards in the order they come off the top of your deck"></div>
    <div class="controls">
      <button data-a="undo">Undo</button>
      <button data-a="clear">Clear</button>
      <button data-a="demo">No deck? Try one riffled 3 times</button>
    </div>
    <canvas class="strip" role="img" hidden></canvas>
    <div class="readout" aria-live="polite"></div>`;
  const grid = el.querySelector('.cards'), say = el.querySelector('.say'), dealt = el.querySelector('.dealt');
  const cv = el.querySelector('canvas'), out = el.querySelector('.readout'), btn = new Map();
  for (let c = 0; c < n; c++) {
    const b = document.createElement('button');
    b.className = 'card' + (isRed(c) ? ' red' : ''); b.dataset.c = c; b.setAttribute('aria-label', cardLong(c));
    b.innerHTML = `<span>${cardName(c).slice(0, -1)}<br class="narrow">${cardName(c).slice(-1)}</span>`;
    grid.append(b); btn.set(c, b);
  }
  const fmtPow = x => { const e = x / Math.LN10; return e >= 3 ? `about 10<sup>${Math.floor(e)}</sup>` : `about ${Math.exp(x) >= 10 ? Math.round(Math.exp(x)) : Math.exp(x).toFixed(1)}`; };
  function render() {
    const done = entered.length === n, set = new Set(entered);
    for (const [c, b] of btn) b.disabled = set.has(c);
    el.querySelector('[data-a=undo]').disabled = !entered.length;
    dealt.innerHTML = entered.length ? `Your deck from the top (${entered.length} of 52): ` + entered.map(c => `<span class="${isRed(c) ? 'red' : ''}">${cardName(c)}</span>`).join(' ') : '';
    const lastName = entered.length ? `${cardLong(entered.at(-1))} is card ${entered.length}. ` : '';
    say.innerHTML = done ? `${lastName}All 52 cards in.` : entered.length ? `${lastName}Next: card ${entered.length + 1} from the top.` : 'Click the top card of your deck first, then the next one down, and so on.';
    cv.hidden = !done;
    if (!done) { out.innerHTML = ''; return; }
    const { r, rows, pAtMost, pAtLeast } = riffleFit(entered), { seq } = risingSequences(entered);
    drawBars(cv, entered, { colourOf: c => r <= 8 ? SEQ_COLOURS[seq[c]] : '#d9d2c3' });
    cv.setAttribute('aria-label', `Bar chart of your deck: ${r} rising sequences.`);
    const fewest = Math.ceil(Math.log2(r)), shown = rows.filter(x => x.k >= Math.max(1, fewest) && x.k <= Math.max(fewest + 3, 7));
    let html = `<p>Your deck has <span class="num">${r}</span> rising sequence${r === 1 ? '' : 's'}. A perfectly shuffled deck has 26.5 on average. ` +
      (r === 1 ? 'It is still in order.' : `The fewest riffles that can make ${r} is <span class="num">${fewest}</span> (one riffle at most doubles them)` +
        (r > 2 && Math.ceil(Math.log2(r - 1)) < fewest ? `, or possibly ${Math.ceil(Math.log2(r - 1))} if you also cut the deck.` : '.')) +
      ` Cutting the deck between riffles barely matters: in simulations it never added more than one in total.</p>`;
    if (r > 1) {
      html += `<p>How much more likely a deck exactly like yours is after <i>k</i> riffles than from a perfect shuffle:</p><table class="data"><tbody>` +
        shown.map(x => `<tr><td>${x.k} riffle${x.k === 1 ? '' : 's'}</td><td>${x.logRatio >= 0 ? fmtPow(x.logRatio) + ' times' : `${fmtPow(-x.logRatio)} times <i>less</i> likely`}</td></tr>`).join('') + `</tbody></table>`;
      const best = rows.find(x => x.logRatio > -Infinity);
      const top = best ? best.logRatio : -Infinity;
      const pct = p => p < 0.001 ? 'under 0.1%' : `${(100 * p).toFixed(p < 0.1 ? 1 : 0)}%`;
      html += top > Math.log(1000) ? `<p>Your deck still clearly remembers its order: a perfect shuffle would almost never leave it like this.</p>`
        : top > Math.log(10) || pAtMost < 0.01 ? `<p>Some order is left: a perfect shuffle leaves ${r} or fewer rising sequences in ${pct(pAtMost)} of deals.</p>`
        : pAtLeast < 0.01 ? `<p>That is too many: a perfect shuffle leaves ${r} or more in ${pct(pAtLeast)} of deals. Something put runs of cards in reverse order; dealing cards into a pile reverses them, for example.</p>`
        : `<p>By this test your deck looks well shuffled: a perfect shuffle gives ${r} or fewer rising sequences in ${pct(pAtMost)} of deals.</p>`;
    }
    out.innerHTML = html;
  }
  grid.addEventListener('click', e => { const b = e.target.closest('button.card'); if (b && !b.disabled && entered.length < n) { entered.push(+b.dataset.c); render(); } });
  el.addEventListener('click', e => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    if (a === 'undo') entered.pop();
    if (a === 'clear') entered = [];
    if (a === 'demo') { let d = fresh(n); for (let i = 0; i < 3; i++) d = riffle(d); entered = d; }
    render();
  });
  new ResizeObserver(() => { if (entered.length === n) render(); }).observe(cv);
  render();
}
