// The moved card. Take any card out of a fresh deck, push it back in somewhere else, riffle, and the page names it.
import { fresh, riffle, movedOdds, cardName, cardLong, isRed, rng } from '../src/cards.js';

export function mount(el, opts) {
  const n = 52; let k = +(opts.k || 3), deck, picked, moved, phase, guess;
  el.innerHTML = `
    <p class="say" aria-live="polite"></p>
    <div class="spread" role="group" aria-label="The deck, top card first"></div>
    <div class="controls">
      <label>Riffles <select aria-label="Number of riffles">${[1, 2, 3, 4].map(v => `<option${v === k ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
      <button class="primary" data-a="go" disabled>Riffle and find it</button>
      <button data-a="reset">Start again</button>
      <button data-a="many">Try 200 random moves</button>
    </div>
    <p class="readout" aria-live="polite"></p>`;
  const spread = el.querySelector('.spread'), say = el.querySelector('.say'), out = el.querySelector('.readout');
  const go = el.querySelector('[data-a=go]'), sel = el.querySelector('select');
  function reset() { deck = fresh(n); picked = -1; moved = -1; phase = 'pick'; guess = null; out.textContent = ''; render(); }
  function render() {
    spread.innerHTML = '';
    deck.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'card' + (isRed(c) ? ' red' : '') + (c === picked && phase === 'place' ? ' picked' : '') + (guess && c === guess.card ? ' found' : '');
      b.textContent = cardName(c); b.dataset.i = i;
      b.disabled = phase === 'ready' || phase === 'done';
      b.setAttribute('aria-label', cardLong(c) + (c === picked && phase === 'place' ? ', picked up' : ''));
      spread.append(b);
    });
    say.innerHTML = {
      pick: 'The deck is in order. <b>Pick any card</b> to take it out.',
      place: `You took the ${cardName(picked)}. Now <b>click a card</b>: the ${cardName(picked)} goes back in just after it.`,
      ready: `The ${cardName(moved)} is in its new place. Choose how many riffles, then press the button. (The finder never sees which card you moved, only the deck after the riffles.)`,
      done: 'The deck after the riffles, top card first.',
    }[phase];
    go.disabled = phase !== 'ready';
  }
  spread.addEventListener('click', e => {
    const b = e.target.closest('button.card'); if (!b) return; const i = +b.dataset.i, c = deck[i];
    if (phase === 'pick') { picked = c; phase = 'place'; }
    else if (phase === 'place') {
      if (c === picked) { picked = -1; phase = 'pick'; render(); return; }
      const from = deck.indexOf(picked); deck.splice(from, 1); deck.splice(deck.indexOf(c) + 1, 0, picked);
      if (deck.every((x, j) => x === j)) { say.textContent = 'That puts it back where it was. Pick a different spot.'; return; }
      moved = picked; picked = -1; phase = 'ready';
    }
    render();
    if (phase === 'place' || phase === 'ready') spread.querySelector(`[data-i="${deck.indexOf(phase === 'place' ? picked : moved)}"]`)?.focus();
  });
  el.addEventListener('click', e => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    if (a === 'reset') reset();
    if (a === 'go') {
      for (let r = 0; r < k; r++) deck = riffle(deck);
      const odds = movedOdds(deck, k); let best = 0; odds.forEach((v, i) => { if (v > odds[best]) best = i; });
      guess = { card: best, p: odds[best] }; phase = 'done'; render();
      const right = best === moved;
      out.innerHTML = `I think you moved the <b>${cardLong(best)}</b> (I'm <span class="num">${Math.round(100 * guess.p)}%</span> sure). ` +
        (right ? `<span class="good">Right.</span>` : `<span class="bad">Wrong:</span> it was the ${cardLong(moved)}.`);
    }
    if (a === 'many') {
      const r = rng(Date.now() & 0xffffffff); let hit = 0, T = 200;
      for (let t = 0; t < T; t++) {
        const d = fresh(n), from = Math.floor(r() * n), [m] = d.splice(from, 1);
        let to; do { to = Math.floor(r() * n); } while (to === from); d.splice(to, 0, m);
        let x = d; for (let q = 0; q < k; q++) x = riffle(x, r);
        const o = movedOdds(x, k); if (o.indexOf(Math.max(...o)) === m) hit++;
      }
      out.innerHTML = `200 random moves, each followed by ${k} riffle${k > 1 ? 's' : ''}: found <span class="num">${hit}</span> (${Math.round(hit / 2)}%).`;
    }
  });
  sel.addEventListener('change', () => { k = +sel.value; });
  reset();
}
