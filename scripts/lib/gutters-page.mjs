// The Gutters, Siding and Roofing pages (/gutters/, /siding/, /roofing/): the parts their other
// modules don't cover.
//
//  - /gutters/ "Why Work with Our East Coast Exterior Specialists?": three lime cards with
//    white text (about 1.7:1, hard to read), the first promising "stellar cleaning services"
//    Panda doesn't offer. They become white cards with an icon each and dark text; the
//    cleaning sentence is dropped, the rest of each card's words are kept.
//  - /siding/ "What Makes Our Siding Team the Best?": the same lime band, with lime headings on
//    white cards (about 1.9:1). The same white icon cards, with the cards' own words.
//  - /roofing/ "What Makes Our Roofers Stand Out?": the same lime band and lime headings. The
//    same white icon cards, with the cards' own words, on Panda orange (the band class): the
//    light offers band is above it and the white testimonials below.
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
const ICON = {
  badge: line('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.9L7 21l5-2.6 5 2.6-1.5-7.1M9.6 9l1.6 1.6L14.6 7.4'),
  pin: line('M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4z'),
  check: line('M5 12.5l4.2 4.2L19 7M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z'),
  star: line('M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z'),
  card: line('M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3 10h18M7 15h4'),
  clock: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.2 2'),
};
// Per page: the cards (icon, title, text), the change note and a class for the band.
const WHY = {
  '/gutters/': {
    note: 'gutters page why cards: white icon cards with dark text (was white on lime), without the cleaning services Panda doesn\'t offer',
    cards: [
      [ICON.badge, 'Trained & Certified Teams', 'Every member of our team is professionally trained and locally certified to handle all types of exterior remodeling projects.'],
      [ICON.pin, 'Local Expertise', 'Our focus is on serving homes and businesses throughout the East Coast, so you can count on us to know how best to protect your home year round.'],
      [ICON.check, 'Easy & Efficient Care', 'We take pride in offering comprehensive services in a straightforward way, so you don’t have to worry about feeling overwhelmed throughout the project.'],
    ],
  },
  '/siding/': {
    note: 'siding page why cards: white icon cards with dark text (was lime headings on a lime band)',
    cards: [
      [ICON.star, 'Quality Products', 'We offer premium siding materials from top manufacturers like CertainTeed and James Hardie, so you can have peace of mind knowing you’re getting the highest-quality products for your home exterior.'],
      [ICON.badge, 'Trained Professionals', 'Every member of our siding replacement team is trained and certified, which means you can count on us to provide great service every time! Plus, we have over 30 years of combined industry experience.'],
      [ICON.card, 'Affordable Services & Flexible Financing', 'We take pride in offering affordable services to our customers, so we can help as many people as possible. To top it off, we provide great financing options, such as no payments and no interest loan options.'],
    ],
  },
  '/roofing/': {
    note: 'roofing page why cards: white icon cards with dark text on Panda orange (was lime headings on a lime band)',
    band: 'pfix-why-band--orange',
    cards: [
      [ICON.star, 'Quality Roofing Products', 'Our team offers a variety of roofing options from GAF, allowing you the opportunity to customize the perfect roof system for your East Coast home.'],
      [ICON.badge, 'GAF Master Elite Roofing Contractors', 'In addition to providing quality GAF products, we are a certified GAF Master Elite contractor. That said, you can count on us to provide stellar services, too.'],
      [ICON.clock, 'One-Day Installations', 'Our roofers can have your new roof installed in as little as one day, so you’re not dealing with construction around your home for a long period of time.'],
    ],
  },
};

const whyCards = (cards) =>
  cards
    .map(
      ([icon, title, text]) =>
        `<div class="pfix-why__card" role="listitem"><span class="pfix-why__icon">${icon}</span>` +
        `<h3 class="pfix-why__title">${esc(title)}</h3><p class="pfix-why__text">${esc(text)}</p></div>`
    )
    .join('');

/** /gutters/, /siding/, /roofing/: the "Why work with us" cards (and /gutters/' services anchor). */
export function collectGuttersPage(doc, html, ed, { pathname = '' } = {}, changes = []) {
  const why = WHY[pathname];
  if (!why) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  let done = false;

  // The cards: the grid's contents, and its class so the section is styled.
  const section = find(doc, (c) => hasClass(c, 'roofers-section'));
  const grid = section && find(section, (c) => hasClass(c, 'Roof-grid') || hasClass(c, 'pfix-why'));
  if (grid && free(grid)) {
    const l = grid.sourceCodeLocation;
    const inner = whyCards(why.cards);
    if (!hasClass(grid, 'pfix-why') || attr(grid, 'role') !== 'list') {
      const attrs = grid.attrs.filter((a) => a.name !== 'role').map((a) => (a.name === 'class' && !hasClass(grid, 'pfix-why') ? { name: 'class', value: `${a.value} pfix-why` } : a));
      ed.retag(grid, [...attrs, { name: 'role', value: 'list' }]);
    }
    if (html.slice(l.startTag.endOffset, l.endTag.startOffset) !== inner) {
      ed.inner(grid, inner);
      changes.push(why.note);
    }
    done = true;
  }
  // The band's class.
  if (why.band && section && !hasClass(section, why.band)) {
    const l = section.sourceCodeLocation.startTag;
    if (!ed.overlaps(l.startOffset, l.endOffset)) {
      ed.retag(section, section.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: `${a.value} ${why.band}` } : a)));
      done = true;
    }
  }

  // A spot just above the gutter services, for the hero's chip.
  if (pathname !== GUTTERS_PATH) return done;
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
