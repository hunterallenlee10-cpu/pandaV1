// The Gallery page (/gallery/): a hero above the photos. As captured the page opened
// straight on the category tabs, with no heading at all. It now has a hero: "Panda
// Exteriors Company Gallery" with a line about the work, a chip per category with its
// number of photos (each opens its tab, site-fixes.js), the photos, jobs and Google rating
// as numbers, estimate and call buttons, and a collage of five of the gallery's own photos
// (one per category, each opening its tab too) on a charcoal-green band.
//
// The words and the five photos are in custom/site-fixes/gallery-page.json; the numbers
// are counted from the page (tiles whose photo is missing don't count), the US map's
// areas.json and google-reviews.json. Applied by site-fixes.mjs; the hero is rendered
// again on every run, so `npm run update:site` updates it.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { attr, hasClass, esc, find, findAll, clean, textOf } from './html-edit.mjs';
import { loadUsMap } from './us-map.mjs';
import { loadReviewWall } from './review-wall.mjs';

export const GALLERY_PATH = '/gallery/';
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// Where the hero's chips and photos lead: the top of the gallery, right under the hero.
const ANCHOR = 'gallery-photos';

let data;
const galleryPage = () => (data ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'custom', 'site-fixes', 'gallery-page.json'), 'utf8')));

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  camera: line('M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.5-2h5.4l1.5 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM12 16a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6z'),
};
const STAR = '<svg class="pfix-gl-hero__star" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="currentColor"/></svg>';
const fmt = (n) => n.toLocaleString('en-US');

// The categories (tab number -> name) and how many photos each shows.
function categories(doc, siteDir, fixText) {
  const exists = (src) => !siteDir || !src || !src.startsWith('/') || fs.existsSync(path.join(siteDir, decodeURIComponent(src.split(/[?#]/)[0])));
  const tabs = findAll(doc, (c) => c.tagName === 'button' && hasClass(c, 'bde-tabs__tab') && attr(c, 'data-value'));
  return tabs.map((t) => {
    const value = attr(t, 'data-value');
    const tiles = findAll(doc, (c) => hasClass(c, 'ee-gallery-item') && attr(c, 'data-category') === value && exists(attr(c, 'href')));
    return { value, name: fixText(clean(textOf(t))), count: tiles.length };
  });
}

function heroHtml(cats) {
  const g = galleryPage();
  const { states } = loadUsMap();
  const jobs = states.reduce((n, s) => n + (Number(s.jobs) || 0), 0);
  const rating = Number(loadReviewWall().place.rating) || 0;
  const total = cats.reduce((n, c) => n + c.count, 0);
  const stat = (value, label) => `<div class="pfix-gl-hero__stat" role="listitem"><b>${value}</b><span>${esc(label)}</span></div>`;
  const chip = (c) =>
    `<a class="pfix-gl-hero__chip" role="listitem" href="#${ANCHOR}" data-pfix-gallery-tab="${esc(c.value)}">${esc(c.name)}<span>${c.count}</span></a>`;
  const photo = (p, i) => {
    const [[w1, h1], [w2]] = p.sizes;
    const src = `${p.src}-${w1}x${h1}.jpg`;
    const srcset = p.sizes.map(([w, h]) => `${p.src}-${w}x${h}.jpg ${w}w`).join(', ');
    const big = i === 0;
    return (
      `<a class="pfix-gl-mosaic__tile pfix-gl-mosaic__tile--${i + 1}" href="#${ANCHOR}" data-pfix-gallery-tab="${esc(String(p.tab))}" aria-label="${esc(`See the ${p.label.toLowerCase()} photos`)}">` +
      `<img src="${esc(src)}" srcset="${esc(srcset)}" sizes="${big ? '(max-width: 860px) 92vw, 520px' : '(max-width: 860px) 46vw, 260px'}" alt="${esc(p.alt)}" width="${w1}" height="${h1}"${big ? ' fetchpriority="high"' : ''} decoding="async">` +
      `<span class="pfix-gl-mosaic__label">${esc(p.label)}</span></a>`
    );
  };
  return (
    `<section class="pfix-gl-hero" aria-labelledby="pfix-gl-title"><div class="pfix-gl-hero__inner">` +
    `<div class="pfix-gl-hero__text">` +
    `<p class="pfix-gl-hero__eyebrow">${ICONS.camera}${esc(g.eyebrow)}</p>` +
    `<h1 class="pfix-gl-hero__title" id="pfix-gl-title">${esc(g.title)}</h1>` +
    `<p class="pfix-gl-hero__sub">${esc(g.sub)}</p>` +
    `<div class="pfix-gl-hero__chips" role="list" aria-label="Photo categories">${cats.filter((c) => c.count).map(chip).join('')}</div>` +
    `<div class="pfix-gl-hero__stats" role="list">` +
    stat(fmt(total), 'Project photos') +
    (jobs ? stat(fmt(jobs), 'Jobs completed') : '') +
    (rating ? stat(`${esc(rating.toFixed(1))}${STAR}`, 'Google rating') : '') +
    `</div>` +
    `<div class="pfix-gl-hero__ctas">` +
    `<a class="pfix-gl-hero__btn pfix-gl-hero__btn--primary" href="${esc(g.estimate[1])}">${esc(g.estimate[0])}${ICONS.arrow}</a>` +
    `<a class="pfix-gl-hero__btn pfix-gl-hero__btn--ghost" href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a>` +
    `</div>` +
    `</div>` +
    `<div class="pfix-gl-mosaic">${g.photos.map(photo).join('')}</div>` +
    `</div></section>` +
    `<span class="pfix-gl-anchor" id="${ANCHOR}"></span>`
  );
}

/**
 * /gallery/: the hero above the photos (added before the gallery's section on the page as
 * captured, rendered again where an earlier build put it). Returns true if it changed.
 */
export function collectGalleryPage(doc, html, ed, { pathname = '', siteDir = '', fixText = (t) => t } = {}, changes = []) {
  if (pathname !== GALLERY_PATH) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  const cats = categories(doc, siteDir, fixText);
  if (!cats.length) return false;

  const old = find(doc, (c) => hasClass(c, 'pfix-gl-hero'));
  if (old) {
    // The hero and the anchor after it, as one range.
    const anchor = find(doc, (c) => attr(c, 'id') === ANCHOR);
    const end = (anchor || old).sourceCodeLocation.endOffset;
    if (!free(old)) return false;
    ed.replace(old.sourceCodeLocation.startOffset, end, heroHtml(cats));
  } else {
    // The section that holds the gallery (its outermost container under the header).
    // (Other fixes may edit inside it, such as removing tiles whose photo is missing, so
    // only the spot the hero goes in has to be free.)
    const section = findAll(doc, (c) => hasClass(c, 'oxy-container') && !!find(c, (x) => hasClass(x, 'bde-gallery')))[0];
    const at = section?.sourceCodeLocation.startOffset;
    if (at === undefined || ed.overlaps(at, at)) return false;
    ed.replace(at, at, heroHtml(cats));
  }
  changes.push(`gallery page hero: "${galleryPage().title}" with the categories, numbers and a photo collage (the page had no heading)`);
  return true;
}
