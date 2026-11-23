// Guess the next card. A fresh deck gets k riffles; you name each card before it is turned over. The guesser plays the
// same deck at the same time, always naming the card it finds most likely given the cards turned so far.
import { fresh, riffle, nextProbs, cardName, cardLong, isRed } from '../src/cards.js';
import { GUESS_TABLE } from '../src/data.js';

export function mount(el, opts) {
  const n = 52; let k = +(opts.k || 3), deck, i, you, bot, probs, showOdds = opts.odds === 'on', last = null;
  const opt = v => `<option value="${v}"${v === k ? ' selected' : ''}>${v} riffle${v === 1 ? '' : 's'}</option>`;
  el.innerHTML = `
    <div class="controls">
      <label>Deck shuffled with <select aria-label="Number of riffles">${[1, 2, 3, 4, 5, 6, 7, 8].map(opt).join('')}</select></label>
      <button data-a="new">New deck</button>
      <button data-a="odds" aria-pressed="${showOdds}">Show the guesser's odds</button>
    </div>
    <div class="deal">
      <div class="bigcard back" aria-hidden="true"></div>
      <div class="scores" aria-live="polite"></div>
      <div class="note last" aria-live="polite"></div>
    </div>
    <div class="cards" role="group" aria-label="Your guess for the next card"></div>
    <div class="controls">
      <button data-a="auto">Let the guesser name the rest</button>
    </div>
    <p class="readout" aria-live="polite"></p>`;
  const grid = el.querySelector('.cards'), big = el.querySelector('.bigcard'), sc = el.querySelector('.scores');
  const lastEl = el.querySelector('.last'), out = el.querySelector('.readout'), sel = el.querySelector('select');
  const order = []; for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) order.push(s * 13 + r);
  const btn = new Map();
  for (const c of order) {
    const b = document.createElement('button');
    b.className = 'card' + (isRed(c) ? ' red' : ''); b.dataset.c = c; b.setAttribute('aria-label', cardLong(c));
    b.innerHTML = `<i class="heat" style="opacity:0"></i><span>${cardName(c)}</span>`;
    grid.append(b); btn.set(c, b);
  }
  function deal() {
    deck = fresh(n); for (let r = 0; r < k; r++) deck = riffle(deck);
    i = 0; you = 0; bot = 0; last = null; update();
  }
  function botGuess() { let best = -1, bp = -1; for (const [c, p] of probs) if (p > bp + 1e-15) { bp = p; best = c; } return { card: best, p: bp }; }
  function turn(guess) {
    const g = botGuess(), c = deck[i];
    if (guess === c) you++; if (g.card === c) bot++;
    last = { guess, g: g.card, c }; i++; update();
  }
  function update() {
    const done = i >= n;
    probs = done ? new Map() : nextProbs(deck.slice(0, i), 2 ** k, n);
    let max = 0; for (const p of probs.values()) max = Math.max(max, p);
    const turned = new Set(deck.slice(0, i));
    for (const [c, b] of btn) {
      b.disabled = turned.has(c) || done;
      b.classList.toggle('mark', !!last && c === last.c);
      b.firstChild.style.opacity = showOdds && probs.has(c) ? (0.9 * probs.get(c) / max).toFixed(3) : 0;
      if (probs.has(c)) b.setAttribute('aria-label', `${cardLong(c)}` + (showOdds ? `, guesser's odds ${(100 * probs.get(c)).toFixed(1)}%` : ''));
      else b.setAttribute('aria-label', `${cardLong(c)}, already turned`);
    }
    if (last) { big.className = 'bigcard' + (isRed(last.c) ? ' red' : ''); big.textContent = cardName(last.c); }
    else { big.className = 'bigcard back'; big.textContent = ''; }
    const chance = done ? 0 : 1 / (n - i);
    sc.innerHTML = `<span>Cards turned</span><span class="num">${i} / ${n}</span>
      <span>You</span><span class="num">${you}</span><span>Guesser</span><span class="num">${bot}</span>`;
    const mark = ok => ok ? '<span class="good">right</span>' : 'wrong';
    lastEl.innerHTML = last
      ? `${last.guess >= 0 ? `You said ${cardName(last.guess)}: ${mark(last.guess === last.c)}.` : ''} The guesser said ${cardName(last.g)}: ${mark(last.g === last.c)}.`
      : 'Click the card you think is on top.';
    const avg = GUESS_TABLE[k];
    if (done) out.innerHTML = `Done. You named <span class="num">${you}</span> of 52, the guesser <span class="num">${bot}</span>. ` +
      `Guessing at random gets 4.5 on average; over thousands of decks shuffled ${k} time${k === 1 ? '' : 's'}, the guesser averages <span class="num">${avg.mean.toFixed(1)}</span>.`;
    else if (showOdds) {
      const g = botGuess();
      out.innerHTML = `The guesser's pick: <b>${cardName(g.card)}</b>, with odds <span class="num">${(100 * g.p).toFixed(1)}%</span>. ` +
        `A blind guess has ${(100 * chance).toFixed(1)}%. Darker means more likely.`;
    } else out.innerHTML = i === 0 ? `The deck started in order: A♠ to K♠, then hearts, clubs and diamonds, each ace to king.` : '';
  }
  grid.addEventListener('click', e => { const b = e.target.closest('button.card'); if (b && !b.disabled) turn(+b.dataset.c); });
  sel.addEventListener('change', () => { k = +sel.value; deal(); });
  el.addEventListener('click', e => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    if (a === 'new') deal();
    if (a === 'odds') { showOdds = !showOdds; e.target.closest('button').setAttribute('aria-pressed', String(showOdds)); update(); }
    if (a === 'auto') { while (i < n) turn(-1); }
  });
  deal();
}
