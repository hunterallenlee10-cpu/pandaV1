// The Gutters page (/gutters/): the parts its other modules don't cover.
//
//  - "Why Work with Our East Coast Exterior Specialists?": three lime cards with white text
//    (about 1.7:1, hard to read), the first promising "stellar cleaning services" Panda
//    doesn't offer. They become white cards with an icon each and dark text; the cleaning
//    sentence is dropped, the rest of each card's words are kept.
//  - A spot to jump to above the gutter services (the "Gutter installation" chip in the
//    hero, services-hero.mjs, leads there).
//
// The hero is services-hero.mjs's, the sections under the services service-pages.mjs's.
// Applied by site-fixes.mjs; rendered again on every run.
import { attr, hasClass, esc, find } from './html-edit.mjs';

export const GUTTERS_PATH = '/gutters/';
// Where the hero's "Gutter installation" chip leads: the services under the hero.
const SERVICES_ANCHOR = 'gutter-services';

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`);
const WHY = [
  [
    line('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.9L7 21l5-2.6 5 2.6-1.5-7.1M9.6 9l1.6 1.6L14.6 7.4'),
    'Trained & Certified Teams',
    'Every member of our team is professionally trained and locally certified to handle all types of exterior remodeling projects.',
  ],
  [
    line('M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4z'),
    'Local Expertise',
    'Our focus is on serving homes and businesses throughout the East Coast, so you can count on us to know how best to protect your home year round.',
  ],
  [
    line('M5 12.5l4.2 4.2L19 7M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z'),
    'Easy & Efficient Care',
    'We take pride in offering comprehensive services in a straightforward way, so you don’t have to worry about feeling overwhelmed throughout the project.',
  ],
];

const whyCards = () =>
  WHY.map(
    ([icon, title, text]) =>
      `<div class="pfix-why__card" role="listitem"><span class="pfix-why__icon">${icon}</span>` +
      `<h3 class="pfix-why__title">${esc(title)}</h3><p class="pfix-why__text">${esc(text)}</p></div>`
  ).join('');

/** /gutters/: the "Why work with us" cards and the services anchor. Returns true if it changed. */
export function collectGuttersPage(doc, html, ed, { pathname = '' } = {}, changes = []) {
  if (pathname !== GUTTERS_PATH) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  let done = false;

  // The cards: the grid's contents, and its class so the section is styled.
  const section = find(doc, (c) => hasClass(c, 'roofers-section'));
  const grid = section && find(section, (c) => hasClass(c, 'Roof-grid') || hasClass(c, 'pfix-why'));
  if (grid && free(grid)) {
    const l = grid.sourceCodeLocation;
    const inner = whyCards();
    if (!hasClass(grid, 'pfix-why') || attr(grid, 'role') !== 'list') {
      const attrs = grid.attrs.filter((a) => a.name !== 'role').map((a) => (a.name === 'class' && !hasClass(grid, 'pfix-why') ? { name: 'class', value: `${a.value} pfix-why` } : a));
      ed.retag(grid, [...attrs, { name: 'role', value: 'list' }]);
    }
    if (html.slice(l.startTag.endOffset, l.endTag.startOffset) !== inner) {
      ed.inner(grid, inner);
      changes.push('gutters page why cards: white icon cards with dark text (was white on lime), without the cleaning services Panda doesn\'t offer');
    }
    done = true;
  }

  // A spot just above the gutter services, for the hero's chip.
  if (!find(doc, (c) => attr(c, 'id') === SERVICES_ANCHOR)) {
    const services = find(doc, (c) => c.tagName === 'div' && hasClass(c, 'Team-section') && hasClass(c, 'oxy-container'));
    const at = services?.sourceCodeLocation.startOffset;
    if (at !== undefined && !ed.overlaps(at, at)) {
      ed.replace(at, at, `<span class="pfix-anchor" id="${SERVICES_ANCHOR}"></span>`);
      done = true;
    }
  } else done = true;
  return done;
}
