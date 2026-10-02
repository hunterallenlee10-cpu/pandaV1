// The Charity & Community page (/charity-and-community/), redesigned. As captured it was a
// blown-up photo of a Panda truck with the heading laid over the truck's own logo and a lime
// "Donations to Date" box, two short paragraphs beside a list of four gifts (where an
// iHeart player sat in a gap), a lime band of three text-only cards, and a "Contact Our
// Trusted Team" block whose card showed a broken Google map. There were no photos of the
// events at all, though the gallery has 22.
//
// Now (words in custom/site-fixes/charity-page.json, so they can be edited there and applied
// with `npm run update:site`):
//  - hero: the headline and the total donated, "Donate to So Kids Soar" and "Partner with
//    Panda" buttons, beside a collage of four event photos with a So Kids Soar badge;
//  - recent gifts: the four gifts the page listed, largest first, as cards with the
//    organizations' logos (labelled as recent gifts: they are part of the total, not all of it);
//  - the three organizations Panda works with, each with an icon and its line;
//  - a photo wall of the gallery's Community and Charity photos in a grid (tall photos take
//    two rows; 12 at first, "Show all" for the rest), each opening the project gallery's
//    photo viewer (project-gallery.js);
//  - "Tune in": the Community DC episode about Panda and So Kids Soar, in its iHeart player;
//  - a closing band for charities and event organizers, with partner, call and donate buttons.
// The "About Our Team" form block below it is unchanged.
//
// Applied by site-fixes.mjs. The page is rendered again on every run (found by its own
// class on a page an earlier build changed).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { hasClass, esc, find, findAll, classes } from './html-edit.mjs';

export const CHARITY_PATH = '/charity-and-community/';
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// The captured page's sections between the header and the "About Our Team" form, in order.
const OLD_SECTIONS = ['hero-section', 'donation-grid', 'roofers-section', 'Client-section'];

let data;
const charityPage = () => (data ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'custom', 'site-fixes', 'charity-page.json'), 'utf8')));

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  heart: line('M12 20s-7.5-4.4-7.5-10.1A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.5 2.6C19.5 15.6 12 20 12 20z'),
  hand: line('M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 3.6-2.5 6.5-6 6.5-2.6 0-4.2-1.4-5.4-3.4L4 14.2a1.4 1.4 0 0 1 2.3-1.6L8 14.5'),
  trophy: line('M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a2.5 2.5 0 0 0 3 3.4M16 6h3a2.5 2.5 0 0 1-3 3.4M12 13v4M8.5 20.5h7M10 17h4l.5 3.5h-5z'),
  star: line('M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z'),
  external: line('M14 5h5v5M19 5l-8 8M17 14v4.5A1.5 1.5 0 0 1 15.5 20h-10A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7H10', 2),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  expand: line('M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5', 2),
  headphones: line('M4 15v-3a8 8 0 0 1 16 0v3M4 15.5A1.5 1.5 0 0 1 5.5 14H7v6H5.5A1.5 1.5 0 0 1 4 18.5zM20 15.5a1.5 1.5 0 0 0-1.5-1.5H17v6h1.5a1.5 1.5 0 0 0 1.5-1.5z'),
};
const money = (n) => `$${Number(n).toLocaleString('en-US')}`;

// A JPEG's width and height, read from its frame header.
function jpegSize(file) {
  try {
    const b = fs.readFileSync(file);
    for (let i = 2; i < b.length - 9; ) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  } catch {}
  return null;
}

// A photo's resized copies on the site (name-WIDTHxHEIGHT.jpg beside it) and its own size.
function photo(src, siteDir) {
  const file = path.join(siteDir, decodeURIComponent(src));
  const dir = path.dirname(file);
  const base = path.basename(src).replace(/\.jpe?g$/i, '');
  const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)x(\\d+)\\.jpe?g$`, 'i');
  let copies = [];
  try {
    copies = fs
      .readdirSync(dir)
      .map((f) => [f, f.match(re)])
      .filter(([, m]) => m && +m[1] >= 250)
      .map(([f, m]) => ({ url: `${path.posix.dirname(src)}/${f}`, w: +m[1], h: +m[2] }))
      .sort((a, b) => a.w - b.w);
  } catch {}
  const [w, h] = jpegSize(file) || [copies.at(-1)?.w || 1200, copies.at(-1)?.h || 900];
  const all = [...copies, { url: src, w, h }];
  return {
    full: src,
    w,
    h,
    // The smallest copy at least `min` wide (else the photo itself).
    pick: (min) => all.find((c) => c.w >= min) || all.at(-1),
    srcset: all.map((c) => `${c.url} ${c.w}w`).join(', '),
  };
}

function img(p, alt, { min, sizes, eager = false, cls = '' }) {
  const c = p.pick(min);
  return (
    `<img${cls ? ` class="${cls}"` : ''} src="${esc(c.url)}" srcset="${esc(p.srcset)}" sizes="${esc(sizes)}" alt="${esc(alt)}" width="${c.w}" height="${c.h}"` +
    `${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`
  );
}

function buttons(where) {
  const { donate, partner } = charityPage();
  return (
    `<div class="pfix-cc-btns pfix-cc-btns--${where}">` +
    `<a class="pfix-cc-btn pfix-cc-btn--primary" href="${esc(donate[1])}" target="_blank" rel="noopener">${ICONS.heart}${esc(donate[0])}<span class="pfix-cc-sr"> (opens in a new tab)</span></a>` +
    `<a class="pfix-cc-btn pfix-cc-btn--ghost" href="${esc(partner[1])}">${ICONS.hand}${esc(partner[0])}</a>` +
    `</div>`
  );
}

function hero(siteDir) {
  const { hero: h, photos, gifts } = charityPage();
  const sks = gifts.items.find((g) => g.name === 'So Kids Soar');
  const tiles = h.photos.map((i, n) => {
    const item = photos.items[i];
    return `<figure class="pfix-cc-collage__tile pfix-cc-collage__tile--${n + 1}">${img(photo(item.src, siteDir), item.alt, { min: n === 0 ? 700 : 500, sizes: '(max-width: 860px) 46vw, 300px', eager: n === 0 })}</figure>`;
  });
  return (
    `<section class="pfix-cc-hero" aria-labelledby="pfix-cc-title"><div class="pfix-cc__inner pfix-cc-hero__inner">` +
    `<div class="pfix-cc-hero__text">` +
    `<p class="pfix-cc__eyebrow pfix-cc__eyebrow--light">${esc(h.eyebrow)}</p>` +
    `<h1 class="pfix-cc-hero__title" id="pfix-cc-title">${esc(h.title)}</h1>` +
    `<p class="pfix-cc-hero__sub">${esc(h.sub)}</p>` +
    `<div class="pfix-cc-hero__total"><b>${money(h.total)}</b><span>${esc(h.totalLabel)}</span></div>` +
    buttons('hero') +
    `</div>` +
    `<div class="pfix-cc-collage">${tiles.join('')}` +
    (sks ? `<p class="pfix-cc-collage__badge"><img src="${esc(sks.logo)}" alt="" width="78" height="78" decoding="async"><span>${esc(h.badge)}</span></p>` : '') +
    `</div>` +
    `</div></section>`
  );
}

function giftsSection() {
  const { gifts, hero: h } = charityPage();
  const items = [...gifts.items].sort((a, b) => b.amount - a.amount);
  const card = (g) =>
    `<div class="pfix-cc-gift" role="listitem"><span class="pfix-cc-gift__logo"><img src="${esc(g.logo)}" alt="" width="78" height="78" loading="lazy" decoding="async"></span>` +
    `<b class="pfix-cc-gift__amount">${money(g.amount)}</b><span class="pfix-cc-gift__name">${esc(g.name)}</span></div>`;
  return (
    `<section class="pfix-cc__sec" id="recent-gifts" aria-labelledby="pfix-cc-gifts-title"><div class="pfix-cc__inner">` +
    `<div class="pfix-cc__head">` +
    `<p class="pfix-cc__eyebrow">${esc(gifts.eyebrow)}</p>` +
    `<h2 class="pfix-cc__title" id="pfix-cc-gifts-title">${esc(gifts.title)}</h2>` +
    `<p class="pfix-cc__sub">${esc(gifts.sub).replace('#total', `<b>${money(h.total)}</b>`)}</p>` +
    `</div>` +
    `<div class="pfix-cc-gifts" role="list">${items.map(card).join('')}</div>` +
    `</div></section>`
  );
}

function orgsSection() {
  const { orgs, donate } = charityPage();
  const card = (o) =>
    `<div class="pfix-cc-org${o.donate ? ' pfix-cc-org--featured' : ''}" role="listitem">` +
    `<span class="pfix-cc-org__icon">${ICONS[o.icon] || ICONS.heart}</span>` +
    `<h3 class="pfix-cc-org__name">${esc(o.name)}</h3>` +
    `<p class="pfix-cc-org__text">${esc(o.text)}</p>` +
    (o.donate ? `<a class="pfix-cc-org__link" href="${esc(donate[1])}" target="_blank" rel="noopener">${esc(donate[0])}${ICONS.external}<span class="pfix-cc-sr"> (opens in a new tab)</span></a>` : '') +
    `</div>`;
  return (
    `<section class="pfix-cc__sec pfix-cc__sec--tint" id="organizations" aria-labelledby="pfix-cc-orgs-title"><div class="pfix-cc__inner">` +
    `<div class="pfix-cc__head">` +
    `<p class="pfix-cc__eyebrow">${esc(orgs.eyebrow)}</p>` +
    `<h2 class="pfix-cc__title" id="pfix-cc-orgs-title">${esc(orgs.title)}</h2>` +
    `<p class="pfix-cc__sub">${esc(orgs.sub)}</p>` +
    `</div>` +
    `<div class="pfix-cc-orgs" role="list">${orgs.items.map(card).join('')}</div>` +
    `</div></section>`
  );
}

function photosSection(siteDir) {
  const { photos } = charityPage();
  const n = photos.items.length;
  const tile = (item, i) => {
    const p = photo(item.src, siteDir);
    return (
      // Tall photos take two rows of the grid; a "wide" one runs across it.
      `<a class="pfix-cc-wall__item${p.h > p.w * 1.1 ? ' is-tall' : ''}${item.wide ? ' is-wide' : ''}${i >= photos.shown ? ' is-extra' : ''}" href="${esc(p.full)}" data-size="${p.w}x${p.h}" data-caption="${esc(item.alt)}">` +
      img(p, item.alt, { min: 500, sizes: '(max-width: 600px) 46vw, (max-width: 1024px) 31vw, 380px' }) +
      `<span class="pfix-cc-wall__zoom">${ICONS.expand}</span></a>`
    );
  };
  return (
    `<section class="pfix-cc__sec" id="photos" aria-labelledby="pfix-cc-photos-title"><div class="pfix-cc__inner">` +
    `<div class="pfix-cc__head">` +
    `<p class="pfix-cc__eyebrow">${esc(photos.eyebrow)}</p>` +
    `<h2 class="pfix-cc__title" id="pfix-cc-photos-title">${esc(photos.title)}</h2>` +
    `<p class="pfix-cc__sub">${esc(photos.sub)}</p>` +
    `</div>` +
    // project-gallery.js opens the photos in its viewer and runs the "Show all" button
    // (hidden without JavaScript, when every photo shows).
    `<div class="pfix-cc-wall" data-ppg-wall="${esc(photos.eyebrow)}">${photos.items.map(tile).join('')}</div>` +
    (n > photos.shown ? `<p class="pfix-cc-wall__more"><button type="button" class="pfix-cc-btn pfix-cc-btn--outline" data-ppg-wall-more hidden>Show all ${n} photos</button></p>` : '') +
    `</div></section>`
  );
}

function listenSection() {
  const { listen } = charityPage();
  return (
    `<section class="pfix-cc__sec pfix-cc__sec--tint" id="tune-in" aria-labelledby="pfix-cc-listen-title"><div class="pfix-cc__inner">` +
    `<div class="pfix-cc-listen">` +
    `<div class="pfix-cc-listen__text">` +
    `<span class="pfix-cc-listen__icon">${ICONS.headphones}</span>` +
    `<p class="pfix-cc__eyebrow pfix-cc__eyebrow--light">${esc(listen.eyebrow)}</p>` +
    `<h2 class="pfix-cc-listen__title" id="pfix-cc-listen-title">${esc(listen.title)}</h2>` +
    `<p class="pfix-cc-listen__body">${esc(listen.text)}</p>` +
    `</div>` +
    `<div class="pfix-cc-listen__player">` +
    `<iframe src="${esc(listen.embed)}" title="${esc(`${listen.title} (${listen.source})`)}" width="100%" height="150" loading="lazy" allow="autoplay"></iframe>` +
    `<p class="pfix-cc-listen__source">${esc(listen.source)}</p>` +
    `</div>` +
    `</div>` +
    `</div></section>`
  );
}

function ctaSection() {
  const { cta } = charityPage();
  return (
    `<section class="pfix-cc-cta" aria-labelledby="pfix-cc-cta-title"><div class="pfix-cc__inner pfix-cc-cta__inner">` +
    `<h2 class="pfix-cc-cta__title" id="pfix-cc-cta-title">${esc(cta.title)}</h2>` +
    `<p class="pfix-cc-cta__text">${esc(cta.text)}</p>` +
    buttons('cta') +
    `<p class="pfix-cc-cta__call"><a href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a></p>` +
    `</div></section>`
  );
}

const pageHtml = (siteDir) =>
  `<div class="pfix-cc">${hero(siteDir)}${giftsSection()}${orgsSection()}${photosSection(siteDir)}${listenSection()}${ctaSection()}</div>`;

/**
 * /charity-and-community/: the page's four sections (as captured) or the page an earlier
 * build made become the redesigned page. Returns true if it changed.
 */
export function collectCharityPage(doc, html, ed, { pathname = '', siteDir = '' } = {}, changes = []) {
  if (pathname !== CHARITY_PATH || !siteDir) return false;
  const free = (start, end) => !ed.overlaps(start, end);
  const built = find(doc, (c) => hasClass(c, 'pfix-cc'));
  let start;
  let end;
  if (built) {
    ({ startOffset: start, endOffset: end } = built.sourceCodeLocation);
  } else {
    // The four sections, which follow one another under the header.
    const sections = OLD_SECTIONS.map((c) => findAll(doc, (x) => x.tagName === 'div' && hasClass(x, 'oxy-container') && classes(x).includes(c))[0]);
    if (sections.some((s) => !s)) return false;
    start = sections[0].sourceCodeLocation.startOffset;
    end = sections.at(-1).sourceCodeLocation.endOffset;
  }
  if (!free(start, end)) return false;
  ed.replace(start, end, pageHtml(siteDir));
  changes.push('charity page: hero with the total and a photo collage, recent gifts, the organizations, a photo wall, the podcast and a partner band (was a truck photo, text cards and a broken map)');
  return true;
}
