// The 404 page (404.html, what the host shows for an address that doesn't exist).
//
// As captured it was the header and nothing under it: no heading, no message, no way on but
// the menu. Now, under the header:
//  - a hero: "Oops! That page doesn't exist.", a line, a "Back to the home page" button and
//    the main line as a call button, beside a "4 (house) 4" with a shingle blown off the roof;
//  - "Looking for something else?": six cards to the pages people come for (roofing, siding,
//    gutters, solar, past projects, contact).
//
// Found by the body's error404 class (the page is built from a made-up address, so it has no
// path of its own). Applied by site-fixes.mjs; rendered again on every run (found by its own
// class).
import { attr, hasClass, esc, find } from './html-edit.mjs';

const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  home: line('M3.5 11 12 3.8l8.5 7.2M6 9.2V20h12V9.2M10 20v-5.5h4V20', 2),
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  roof: line('M2.5 12.5 12 5l9.5 7.5M5 10.5V19h14v-8.5M8 14.5h8M8 17h8'),
  siding: line('M4 4.5h16v15H4zM4 8.5h16M4 12.5h16M4 16.5h16'),
  gutter: line('M3 6h18v3.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM17 11.5V19a1.5 1.5 0 0 0 1.5 1.5H20'),
  sun: line('M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4'),
  photo: line('M3.5 6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5zM3.5 16l5-5 4 4 2.5-2.5 5 5M15.5 9.5h.01'),
  pin: line('M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4z'),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
};

// The house in place of the 0: its roof is missing a shingle, which is falling off to the left.
const HOUSE =
  `<svg class="pfix-404__house-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false">` +
  `<g fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M22 60 41 43M48 36.9 60 26l38 34"/>` +
  `<path d="M32 55v39h56V55"/>` +
  `<path d="M52 94V75h16v19"/>` +
  `</g>` +
  `<rect class="pfix-404__shingle" x="4" y="22" width="24" height="11" rx="2.5" fill="#f26924"/>` +
  `</svg>`;

// [icon, title, text, href]
const LINKS = [
  ['roof', 'Roofing', 'Roof replacements, roofing types and attic insulation.', '/roofing/'],
  ['siding', 'Siding', 'Premium siding from CertainTeed and James Hardie.', '/siding/'],
  ['gutter', 'Gutters', 'Seamless gutters and gutter guards.', '/gutters/'],
  ['sun', 'Solar', 'Solar panels and the GAF solar roof.', '/solar/'],
  ['photo', 'Past projects', 'Homes and businesses we’ve worked on.', '/past-projects/'],
  ['pin', 'Contact us', 'Our offices, phone numbers and email.', '/contact-us/'],
];

function pageHtml() {
  const hero =
    `<section class="pfix-404__hero" aria-labelledby="pfix-404-title"><div class="pfix-404__inner pfix-404__hero-grid">` +
    `<div class="pfix-404__copy">` +
    `<p class="pfix-404__eyebrow">Error 404 · Page not found</p>` +
    `<h1 class="pfix-404__title" id="pfix-404-title">Oops! That page doesn’t exist.</h1>` +
    `<p class="pfix-404__sub">It may have moved, or there may be a typo in the address. The rest of the site is right where we left it.</p>` +
    `<div class="pfix-404__actions">` +
    `<a class="pfix-404__btn pfix-404__btn--home" href="/">${ICONS.home}<span>Back to the home page</span></a>` +
    `<a class="pfix-404__btn pfix-404__btn--call" href="${PHONE.href}">${ICONS.phone}<span>Call ${PHONE.text}</span></a>` +
    `</div>` +
    `</div>` +
    `<div class="pfix-404__code" aria-hidden="true"><span>4</span><span class="pfix-404__house">${HOUSE}</span><span>4</span></div>` +
    `</div></section>`;
  const links =
    `<section class="pfix-404__more" aria-labelledby="pfix-404-more"><div class="pfix-404__inner">` +
    `<h2 class="pfix-404__more-title" id="pfix-404-more">Looking for something else?</h2>` +
    `<ul class="pfix-404__links">` +
    LINKS.map(
      ([icon, title, text, href]) =>
        `<li><a class="pfix-404__link" href="${esc(href)}"><span class="pfix-404__link-icon">${ICONS[icon]}</span>` +
        `<span class="pfix-404__link-text"><b>${esc(title)}</b><small>${esc(text)}</small></span>` +
        `<span class="pfix-404__link-arrow">${ICONS.arrow}</span></a></li>`
    ).join('') +
    `</ul></div></section>`;
  return `<main class="pfix-404">${hero}${links}</main>`;
}

/** 404.html: the "page doesn't exist" message, a way home and links to the main pages. */
export function collectNotFoundPage(doc, html, ed, changes = []) {
  const body = find(doc, (c) => c.tagName === 'body');
  if (!body || !(attr(body, 'class') || '').split(/\s+/).includes('error404')) return false;
  const block = pageHtml();

  const old = find(body, (c) => hasClass(c, 'pfix-404'));
  if (old) {
    const { startOffset, endOffset } = old.sourceCodeLocation;
    if (ed.overlaps(startOffset, endOffset)) return false;
    if (html.slice(startOffset, endOffset) !== block) {
      ed.outer(old, block);
      changes.push('not found page: "Oops! That page doesn\'t exist." with a link home and to the main pages (updated)');
    }
    return true;
  }
  // Right under the header.
  const nav = find(body, (c) => c.tagName === 'div' && hasClass(c, 'nav') && hasClass(c, 'oxy-container'));
  const at = nav?.sourceCodeLocation.endOffset;
  if (at === undefined || ed.overlaps(at, at)) return false;
  ed.replace(at, at, block);
  changes.push('not found page: "Oops! That page doesn\'t exist." with a link home and to the main pages (was the header alone)');
  return true;
}
