// Two small single-series charts on the same x axis (riffles 1..10): the guesser's average score, and the exact
// distance from a random deck. Two charts, not two y-axes. Hover/focus a point for its numbers; a table follows.
import { GUESS_TABLE, CHANCE } from '../src/data.js';
const NS = 'http://www.w3.org/2000/svg';

function chart({ title, yMax, ticks, value, fmt, ref, refLabel, tipText, aria }) {
  const W = 620, H = 220, L = 46, R = 96, T = 30, B = 40, ks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const x = k => L + (k - 1) / 9 * (W - L - R), y = v => T + (1 - v / yMax) * (H - T - B);
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.classList.add('chart');
  svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', aria);
  const add = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const a in attrs) e.setAttribute(a, attrs[a]); if (text != null) e.textContent = text; svg.append(e); return e; };
  add('text', { x: L - 40, y: 16, class: 'label strong' }, title);
  for (const t of ticks) { add('line', { x1: L, x2: W - R, y1: y(t), y2: y(t), class: 'grid' }); add('text', { x: L - 8, y: y(t) + 4, class: 'tick', 'text-anchor': 'end' }, fmt(t)); }
  for (const k of ks) add('text', { x: x(k), y: H - B + 18, class: 'tick', 'text-anchor': 'middle' }, k);
  add('text', { x: (L + W - R) / 2, y: H - 4, class: 'axis', 'text-anchor': 'middle' }, 'riffles');
  if (ref != null) { add('line', { x1: L, x2: W - R, y1: y(ref), y2: y(ref), class: 'ref' }); add('text', { x: W - R + 8, y: y(ref) + 4, class: 'label' }, refLabel); }
  add('path', { d: ks.map((k, i) => `${i ? 'L' : 'M'}${x(k).toFixed(1)},${y(value(k)).toFixed(1)}`).join(''), class: 'series' });
  const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; tip.setAttribute('aria-hidden', 'true');
  for (const k of ks) {
    add('circle', { cx: x(k), cy: y(value(k)), r: 4.5, class: 'dot' });
    if (k === 7) add('text', { x: x(k) + 8, y: y(value(k)) - 10, class: 'label strong' }, fmt(value(k), true));
    const hit = add('circle', { cx: x(k), cy: y(value(k)), r: 14, class: 'hit', tabindex: 0, role: 'img', 'aria-label': tipText(k).replace(/<[^>]+>/g, '') });
    const show = () => { tip.hidden = false; tip.innerHTML = tipText(k); const bb = svg.getBoundingClientRect(), s = bb.width / W;
      tip.style.left = `${Math.min(x(k) * s, bb.width - 230)}px`; tip.style.top = `${y(value(k)) * s + 12}px`; };
    hit.addEventListener('mouseenter', show); hit.addEventListener('focus', show);
    hit.addEventListener('mouseleave', () => { tip.hidden = true; }); hit.addEventListener('blur', () => { tip.hidden = true; });
  }
  const wrap = document.createElement('div'); wrap.className = 'chart-wrap'; wrap.append(svg, tip); return wrap;
}

export function mount(el) {
  const G = GUESS_TABLE, s = k => k === 1 ? '' : 's';
  el.append(chart({
    title: 'Cards the guesser names right, out of 52', yMax: 32, ticks: [0, 10, 20, 30], value: k => G[k].mean,
    fmt: (v, label) => label ? v.toFixed(1) : String(v), ref: CHANCE, refLabel: 'chance, 4.5',
    tipText: k => `<b>${k} riffle${s(k)}</b><br>guesser: ${G[k].mean.toFixed(2)} right on average (${G[k].decks.toLocaleString('en-US')} decks)<br>chance: ${CHANCE.toFixed(2)}`,
    aria: `Line chart. The guesser's average score falls from ${G[1].mean.toFixed(0)} cards after one riffle to ${G[4].mean.toFixed(1)} after four and ${G[7].mean.toFixed(1)} after seven, close to chance, ${CHANCE.toFixed(1)}.`,
  }), chart({
    title: 'Distance from a perfectly random deck', yMax: 1, ticks: [0, 0.5, 1], value: k => G[k].tv,
    fmt: (v, label) => label ? v.toFixed(2) : v === 0 ? '0' : v === 1 ? '1' : '0.5',
    tipText: k => `<b>${k} riffle${s(k)}</b><br>total variation distance: ${G[k].tv.toFixed(3)}`,
    aria: `Line chart. The distance stays at 1 for up to four riffles, then drops: ${G[5].tv.toFixed(2)} after five, ${G[6].tv.toFixed(2)} after six, ${G[7].tv.toFixed(2)} after seven, ${G[8].tv.toFixed(2)} after eight.`,
  }));
  const t = document.createElement('details');
  t.innerHTML = `<summary>Table</summary><table class="data"><thead><tr><th>riffles</th><th>guesser (this page)</th><th>Bayer &amp; Diaconis's guesser</th><th>distance</th></tr></thead><tbody>${
    Object.entries(G).map(([k, r]) => `<tr><td>${k}</td><td>${r.mean.toFixed(2)} ± ${(2 * r.se).toFixed(2)}</td><td>${r.bd.toFixed(2)}</td><td>${r.tv.toFixed(3)}</td></tr>`).join('')}</tbody></table>
    <p class="note">± is two standard errors over ${G[1].decks.toLocaleString('en-US')} simulated decks per row. Bayer &amp; Diaconis's column is their Table 5 (McGrath's guessing rule, simulated). Distances are exact.</p>`;
  el.append(t);
}
