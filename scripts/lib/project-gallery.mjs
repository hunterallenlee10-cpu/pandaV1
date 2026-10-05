// "Our Project Gallery" (/, /solar/, /roofing/, /roofing/types/, /gutters/, /siding/,
// /commercial-capabilities/, /commercial-roofing/). As delivered it is a Breakdance
// gallery (category tabs over a Swiper slider, filtered with Isotope) that three scripts
// start at once: Breakdance's own Swiper, the theme's `new Swiper('.Project-swipper')` on
// its wrapper and the theme's `new Swiper('.swiper')` (a 2.5 s autoplay meant for the logo
// row) on its inner box. They fight over the same slides, so the photos come out at
// different widths with the first one cut off, the row sits off centre under the
// heading and tabs, and the dots count photos of every category. The rendered snapshots
// also carry Swiper's loop copies.
//
// It becomes one gallery rendered here at build time: the same tabs and photos, in
// category order, as a carousel of same-size photos (custom/project-gallery/: the
// stylesheet, and the script for the tabs, arrows, dots and photo viewer). Used by
// site-fixes.mjs.
import path from 'node:path';
import { ROOT } from './config.mjs';
import { attr, classes, hasClass, esc, rawText, textOf, clean, findAll, find } from './html-edit.mjs';

export const PROJECT_GALLERY_DIR = path.join(ROOT, 'custom', 'project-gallery');
// Where the stylesheet and script are published in site/ (and linked from pages).
export const PROJECT_GALLERY_FILES = {
  'project-gallery.css': '/_custom/project-gallery/project-gallery.css',
  'project-gallery.js': '/_custom/project-gallery/project-gallery.js',
};

const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
const CHEVRON_PREV = icon('<path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>');
const CHEVRON_NEXT = icon('<path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>');
const EXPAND = icon('<path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>');
// Photo widths in the carousel (see project-gallery.css): 3 in a 1296 px row, 3, 2 or 1.
const SIZES = '(min-width: 1320px) 420px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw';

const fileOf = (src) => (src && !src.startsWith('data:') ? src : '');

// The gallery as delivered (or as a rendered snapshot left it): tabs + photos.
export function readBreakdance(gallery) {
  const categories = [];
  for (const tab of findAll(gallery, (c) => hasClass(c, 'js-tab') && attr(c, 'data-value'))) {
    const title = find(tab, (c) => hasClass(c, 'bde-tabs__tab-title'));
    const name = clean(textOf(title || tab));
    if (name && !categories.some((c) => c.id === attr(tab, 'data-value'))) categories.push({ id: attr(tab, 'data-value'), name });
  }
  const photos = [];
  for (const a of findAll(gallery, (c) => hasClass(c, 'ee-gallery-item') && !hasClass(c, 'swiper-slide-duplicate'))) {
    const img = find(a, (c) => c.tagName === 'img' && c.parentNode.tagName !== 'noscript');
    const full = attr(a, 'href');
    if (!img || !full) continue;
    const [fullW, fullH] = (attr(a, 'data-lg-size') || '').split('-');
    photos.push({
      cat: attr(a, 'data-category') || '',
      full,
      fullW,
      fullH,
      src: fileOf(attr(img, 'data-lazy-src')) || fileOf(attr(img, 'src')) || full,
      srcset: attr(img, 'data-lazy-srcset') || attr(img, 'srcset') || '',
      w: attr(img, 'width'),
      h: attr(img, 'height'),
      alt: attr(img, 'alt') || '',
    });
  }
  return { categories, photos };
}

// A gallery an earlier build already made (.ppg): read back from its own markup.
function readOwn(box) {
  const categories = findAll(box, (c) => hasClass(c, 'ppg__tab')).map((t) => ({
    id: attr(t, 'data-cat'),
    name: clean(textOf(find(t, (c) => hasClass(c, 'ppg__tab-name')) || t)),
  }));
  const photos = findAll(box, (c) => hasClass(c, 'ppg__tile')).map((a) => {
    const img = find(a, (c) => c.tagName === 'img');
    const [fullW, fullH] = (attr(a, 'data-size') || '').split('x');
    return {
      cat: attr(a, 'data-cat'),
      full: attr(a, 'href'),
      fullW,
      fullH,
      src: attr(img, 'src'),
      srcset: attr(img, 'srcset') || '',
      w: attr(img, 'width'),
      h: attr(img, 'height'),
      alt: attr(img, 'alt') || '',
    };
  });
  return { categories, photos };
}

/** The gallery's markup: tabs, the carousel (every photo, in category order) and its controls. */
export function renderProjectGallery({ categories, photos }, { uid = 'ppg-1', selected = '' } = {}) {
  const groups = categories.map((c) => ({ ...c, photos: photos.filter((p) => p.cat === c.id) })).filter((g) => g.photos.length);
  // The tab shown first: the category named `selected`, or the first one.
  const first = Math.max(0, groups.findIndex((g) => g.name === selected));
  const tabs = groups.map(
    (g, i) =>
      `<button class="ppg__tab" type="button" role="tab" id="${uid}-tab-${esc(g.id)}" aria-controls="${uid}-panel" aria-selected="${i === first}" tabindex="${i === first ? 0 : -1}" data-cat="${esc(g.id)}">` +
      `<span class="ppg__tab-name">${esc(g.name)}</span>` +
      `<span class="ppg__tab-count">${g.photos.length}<span class="ppg-sr"> photos</span></span>` +
      `</button>`
  );
  const slides = groups.flatMap((g) =>
    g.photos.map((p, i) => {
      const label = `${g.name} project photo ${i + 1} of ${g.photos.length}${p.alt ? `: ${p.alt}` : ''}, view larger`;
      return (
        `<div class="ppg__slide" role="listitem" data-cat="${esc(g.id)}">` +
        `<a class="ppg__tile" href="${esc(p.full)}" data-cat="${esc(g.id)}"${p.fullW && p.fullH ? ` data-size="${esc(p.fullW)}x${esc(p.fullH)}"` : ''} aria-label="${esc(label)}" draggable="false">` +
        `<img src="${esc(p.src)}"${p.srcset ? ` srcset="${esc(p.srcset)}" sizes="${SIZES}"` : ''}${p.w && p.h ? ` width="${esc(p.w)}" height="${esc(p.h)}"` : ''} alt="${esc(p.alt)}" loading="lazy" decoding="async" draggable="false">` +
        `<span class="ppg__zoom">${EXPAND}</span>` +
        `</a></div>`
      );
    })
  );
  return (
    `<div class="ppg" id="${uid}">` +
    // Without JavaScript every photo is in one sideways-scrolling row (no tabs or arrows).
    `<noscript><style>.ppg__tabs,.ppg__controls{display:none!important}</style></noscript>` +
    `<div class="ppg__tabs" role="tablist" aria-label="Project categories">${tabs.join('')}</div>` +
    `<div class="ppg__panel" id="${uid}-panel" role="tabpanel" aria-labelledby="${uid}-tab-${esc(groups[first].id)}">` +
    `<div class="ppg__viewport">` +
    // divs with list roles: the site's stylesheet forces bullets and colours on every ul/li.
    `<div class="ppg__track" role="list">${slides.join('')}</div>` +
    `</div>` +
    `<div class="ppg__controls">` +
    `<button class="ppg__btn ppg__btn--prev" type="button" aria-controls="${uid}-panel" aria-label="Previous photos" aria-disabled="true">${CHEVRON_PREV}</button>` +
    `<div class="ppg__pager" aria-hidden="true"></div>` +
    `<button class="ppg__btn ppg__btn--next" type="button" aria-controls="${uid}-panel" aria-label="Next photos" aria-disabled="false">${CHEVRON_NEXT}</button>` +
    `</div>` +
    `</div>` +
    `</div>`
  );
}

const range = (n) => [n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset];

/**
 * Collects the project galleries of one page into the editor. Works on the page as
 * delivered, on a rendered snapshot and on a page an earlier build already fixed (whose
 * gallery is rendered again from its own markup), so it gives the same result on all
 * three. `selected`: the category whose tab is shown first (by name; the first one if the
 * page has no such category). Returns true if the page now has a gallery.
 */
export function collectProjectGalleries(doc, ed, changes = [], { selected = '' } = {}) {
  let count = 0;
  // The slider version only: /gallery/ shows the same photos as a full grid (.ee-gallery--grid).
  const isSlider = (c) => hasClass(c, 'Project-swipper') && find(c, (x) => hasClass(x, 'bde-gallery')) && find(c, (x) => hasClass(x, 'ee-gallery--slider'));
  // (The photo gallery inside /past-projects/' showcase is rendered with it: past-projects.mjs.)
  const inShowcase = (n) => {
    for (let p = n.parentNode; p; p = p.parentNode) if (hasClass(p, 'ppx')) return true;
    return false;
  };
  for (const box of findAll(doc, (c) => hasClass(c, 'ppg') || isSlider(c))) {
    if (ed.overlaps(...range(box)) || inShowcase(box)) continue;
    const own = hasClass(box, 'ppg');
    const gallery = own ? box : find(box, (x) => hasClass(x, 'bde-gallery'));
    const data = own ? readOwn(gallery) : readBreakdance(gallery);
    const used = data.categories.filter((c) => data.photos.some((p) => p.cat === c.id));
    if (!used.length) continue;
    const uid = `ppg-${++count}`;
    ed.outer(box, renderProjectGallery(data, { uid, selected }));
    const n = data.photos.filter((p) => used.some((c) => c.id === p.cat)).length;
    if (own) {
      changes.push(`project gallery: ${n} photos in ${used.length} categories (rendered again)`);
      continue;
    }
    // The scripts that started the old gallery (its slider, filter and photo viewer), and
    // the viewer's leftover markup in a rendered snapshot.
    const id = classes(gallery).find((c) => /^bde-gallery-[\d-]+$/.test(c));
    if (id) {
      const lightbox = id.replace('bde-gallery-', 'bde-lightbox-');
      for (const s of findAll(doc, (c) => c.tagName === 'script' && !attr(c, 'src') && rawText(c).includes(`.${id}'`) && /Breakdance(Gallery|Lightbox|Swiper)\b/.test(rawText(c)))) {
        if (!ed.overlaps(...range(s))) ed.outer(s, '');
      }
      for (const el of findAll(doc, (c) => hasClass(c, lightbox) && hasClass(c, 'lg-container'))) {
        if (!ed.overlaps(...range(el))) ed.outer(el, '');
      }
    }
    changes.push(`project gallery: ${n} photos in ${used.length} categories, same-size and centred, with tabs, arrows and a photo viewer (three sliders were started on it at once)`);
  }
  return count > 0;
}
