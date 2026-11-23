// Riffle a deck and watch it as bars: x = position in the deck (top card on the left), height = the card's place in
// the fresh deck. A fresh deck is a staircase; each riffle interleaves staircases. Colour = rising sequence.
import { fresh, riffleDetail, risingSequences, cardLong } from '../src/cards.js';

export const SEQ_COLOURS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767']; // validated categorical palette (dark surface)

export function drawBars(cv, deck, { colourOf, cutAt = -1, highlight = -1 } = {}) {
  const dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 600, H = Math.round(W * 0.34);
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#12161f'; g.fillRect(0, 0, W, H);
  const n = deck.length, pad = 10, bw = (W - 2 * pad) / n, base = H - pad, top = pad + 4;
  deck.forEach((c, i) => {
    const h = (base - top) * (c + 1) / n;
    g.fillStyle = colourOf ? colourOf(c, i) : '#d9d2c3';
    g.fillRect(pad + i * bw + 0.6, base - h, Math.max(1, bw - 1.2), h);
    if (i === highlight) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(pad + i * bw, base - h - 1, bw, h + 1); }
  });
  if (cutAt >= 0) { g.strokeStyle = '#fbf9f4'; g.setLineDash([4, 4]); g.lineWidth = 1.5; const x = pad + cutAt * bw;
    g.beginPath(); g.moveTo(x, pad); g.lineTo(x, base); g.stroke(); g.setLineDash([]); }
}

export function mount(el) {
  const n = 52; let deck = fresh(n), k = 0, cut = -1, showSeq = true;
  el.innerHTML = `
    <canvas class="strip" role="img"></canvas>
    <p class="note">Each bar is a card, top of the deck on the left. Its height is where it sat in the fresh deck.</p>
    <div class="controls">
      <button class="primary" data-a="riffle">Riffle</button>
      <button data-a="seq" aria-pressed="true">Colour rising sequences</button>
      <button data-a="reset">New deck</button>
    </div>
    <p class="readout" aria-live="polite"></p>`;
  const cv = el.querySelector('canvas'), out = el.querySelector('.readout');
  const bSeq = el.querySelector('[data-a=seq]');
  let lastCut = -1, prevDeck = null;
  function render() {
    const { seq, count } = risingSequences(deck);
    const colourOf = showSeq ? (c => count <= 8 ? SEQ_COLOURS[seq[c]] : '#d9d2c3') : null;
    if (cut >= 0 && prevDeck) drawBars(cv, prevDeck, { cutAt: cut, colourOf: (c, i) => i < cut ? '#e0a35a' : '#7fa8d8' });
    else drawBars(cv, deck, { colourOf });
    cv.setAttribute('aria-label', `Bar chart of the deck after ${k} riffle${k === 1 ? '' : 's'}: ${count} rising sequence${count === 1 ? '' : 's'}. Top card: ${cardLong(deck[0])}.`);
    const bound = 2 ** k;
    out.innerHTML = k === 0
      ? `A fresh deck: one staircase, one rising sequence. Press <b>Riffle</b>.`
      : cut >= 0
        ? `Before riffle ${k}: the deck was cut after <span class="num">${cut}</span> cards (orange half, blue half). Press the button again to see the result.`
        : `After <span class="num">${k}</span> riffle${k === 1 ? '' : 's'}: <span class="num">${count}</span> rising sequence${count === 1 ? '' : 's'} (at most ${bound > 52 ? 52 : bound} possible).` +
          (showSeq && count > 8 ? ` <span class="note">More than eight: no longer coloured.</span>` : '');
  }
  el.addEventListener('click', e => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    if (a === 'riffle') { prevDeck = deck; const d = riffleDetail(deck); deck = d.deck; lastCut = d.cut; k++; cut = -1; }
    if (a === 'seq') { showSeq = !showSeq; bSeq.setAttribute('aria-pressed', String(showSeq)); }
    if (a === 'reset') { deck = fresh(n); k = 0; cut = -1; prevDeck = null; }
    render();
  });
  new ResizeObserver(() => render()).observe(cv);
  render();
}
