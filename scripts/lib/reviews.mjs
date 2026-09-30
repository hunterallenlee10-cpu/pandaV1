// The review carousels. Every testimonials carousel on the site becomes the same looping,
// swipeable carousel of the reviews in custom/reviews/reviews.json:
//  - the "Testimonials" sections (a Google-reviews shortcode, .testi-cont, on 17 pages): a
//    Swiper that never started as delivered, so only its first review showed and nothing
//    moved; an earlier version of the site fixes showed its two reviews side by side;
//  - the reviews beside the video in "Panda Exteriors Is Your Top Roofing Choice" (/ and
//    /services/: .tetimonial-swiper-2; /thank-you/: the shortcode again): it did slide,
//    but every review was pushed down to the height of the longest one, leaving a large
//    empty band between the arrows and shorter reviews.
// The markup is rendered here at build time, so every review is in the page (and readable
// without JavaScript, as a sideways-scrolling row); custom/reviews/reviews.js adds the
// motion and custom/reviews/reviews.css styles it. Used by site-fixes.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { attr, hasClass, esc, rawText, findAll } from './html-edit.mjs';

export const REVIEWS_DIR = path.join(ROOT, 'custom', 'reviews');
// Where the stylesheet and script are published in site/ (and linked from pages).
export const REVIEWS_FILES = { 'reviews.css': '/_custom/reviews/reviews.css', 'reviews.js': '/_custom/reviews/reviews.js' };
// Autoplay: time each review stays in place (ms).
const INTERVAL = 6500;

let cached;
export function loadReviews() {
  if (cached) return cached;
  const data = JSON.parse(fs.readFileSync(path.join(REVIEWS_DIR, 'reviews.json'), 'utf8'));
  const reviews = (data.reviews || []).map((r, i) => {
    if (!r.name || !r.text) throw new Error(`custom/reviews/reviews.json: review ${i + 1} needs a "name" and a "text"`);
    const rating = r.rating == null ? 5 : Number(r.rating);
    if (!(rating >= 1 && rating <= 5)) throw new Error(`custom/reviews/reviews.json: ${r.name}: "rating" must be 1 to 5`);
    return { name: String(r.name).trim(), text: String(r.text).replace(/\s+/g, ' ').trim(), rating: Math.round(rating), photo: r.photo || '' };
  });
  if (!reviews.length) throw new Error('custom/reviews/reviews.json: no reviews');
  cached = { label: data.label || 'Customer reviews', reviews };
  return cached;
}

const initials = (name) =>
  name
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '★';

const STAR = 'M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 0 0 .95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 0 0-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 0 0-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 0 0-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 0 0 .95-.69z';
const stars = (rating) =>
  `<span class="prc-card__stars" role="img" aria-label="Rated ${rating} out of 5">` +
  Array.from({ length: 5 }, (_, i) => `<svg viewBox="0 0 20 20" aria-hidden="true"${i < rating ? '' : ' class="is-empty"'}><path d="${STAR}"/></svg>`).join('') +
  `</span>`;
const QUOTE_MARK =
  '<svg class="prc-card__mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M13.3 7.2C8.1 9.4 5 13.5 5 19v5.8h9.4v-9.4H9.9c.4-3.2 2.2-5.6 5.4-7.2l-2-1zm13.1 0c-5.2 2.2-8.3 6.3-8.3 11.8v5.8h9.4v-9.4H23c.4-3.2 2.2-5.6 5.4-7.2l-2-1z"/></svg>';
const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
const CHEVRON_PREV = icon('<path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>');
const CHEVRON_NEXT = icon('<path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>');
const PAUSE = icon('<g class="prc__icon-pause"><rect x="7" y="6" width="3.5" height="12" rx="1"/><rect x="13.5" y="6" width="3.5" height="12" rx="1"/></g><path class="prc__icon-play" d="M8.5 6.4v11.2a1 1 0 0 0 1.53.85l8.9-5.6a1 1 0 0 0 0-1.7l-8.9-5.6a1 1 0 0 0-1.53.85z"/>');

/**
 * One review carousel. variant: 'section' (full-width "Testimonials" sections: up to
 * three reviews in view) or 'column' (beside the video: one review in view).
 */
export function renderReviewCarousel({ variant = 'section', uid = 'prc-1' } = {}) {
  const { label, reviews } = loadReviews();
  const n = reviews.length;
  const slides = reviews.map((r, i) => {
    const textId = `${uid}-text-${i + 1}`;
    const avatar = r.photo
      ? `<img class="prc-card__avatar" src="${esc(r.photo)}" alt="" width="40" height="40" loading="lazy" decoding="async" draggable="false">`
      : `<span class="prc-card__avatar" aria-hidden="true">${esc(initials(r.name))}</span>`;
    return (
      `<div class="prc__slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}">` +
      `<figure class="prc-card">` +
      `<div class="prc-card__top">${stars(r.rating)}${QUOTE_MARK}</div>` +
      `<blockquote class="prc-card__quote"><p class="prc-card__text" id="${textId}">${esc(r.text)}</p></blockquote>` +
      `<button class="prc-card__more is-hidden" type="button" aria-expanded="false" aria-controls="${textId}">Read more</button>` +
      `<figcaption class="prc-card__author">${avatar}<span class="prc-card__name">${esc(r.name)}</span></figcaption>` +
      `</figure></div>`
    );
  });
  const dots = reviews.map((_, i) => `<button class="prc__dot" type="button" tabindex="-1" data-to="${i}"></button>`).join('');
  return (
    `<div class="prc prc--${variant}" id="${uid}" role="region" aria-roledescription="carousel" aria-label="${esc(label)}" data-interval="${INTERVAL}">` +
    `<div class="prc__viewport"><div class="prc__track" id="${uid}-track" aria-live="polite">${slides.join('')}</div></div>` +
    `<div class="prc__controls">` +
    `<div class="prc__status">` +
    `<button class="prc__btn prc__btn--play" type="button" aria-controls="${uid}-track" aria-label="Stop automatic slide show">${PAUSE}</button>` +
    `<div class="prc__dots" aria-hidden="true">${dots}</div>` +
    `</div>` +
    `<div class="prc__arrows">` +
    `<button class="prc__btn prc__btn--prev" type="button" aria-controls="${uid}-track" aria-label="Previous review">${CHEVRON_PREV}</button>` +
    `<button class="prc__btn prc__btn--next" type="button" aria-controls="${uid}-track" aria-label="Next review">${CHEVRON_NEXT}</button>` +
    `</div>` +
    `</div>` +
    `</div>`
  );
}

const ancestors = (n) => {
  const out = [];
  for (let a = n.parentNode; a; a = a.parentNode) out.push(a);
  return out;
};
const range = (n) => [n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset];

/**
 * Collects the review carousels of one page into the editor, in page order. Works on the
 * page as delivered and on a page an earlier build already fixed (side-by-side cards, or
 * a review carousel, which is rendered again from reviews.json), so it gives the same
 * result on both. Returns true if the page now has a carousel.
 */
export function collectReviewCarousels(doc, ed, { pathname = '' } = {}, changes = []) {
  let count = 0;
  const uid = () => `prc-${++count}`;
  const { reviews } = loadReviews();
  const removeAll = (nodes) => {
    for (const x of nodes) if (!ed.overlaps(...range(x))) ed.outer(x, '');
  };
  // The old arrows and the Swiper start-up scripts next to a carousel.
  const oldControls = (scope) => {
    const navs = findAll(scope, (c) => hasClass(c, 'testimonial-navigation'));
    removeAll(navs.length ? navs : findAll(scope, (c) => hasClass(c, 'testi-prev-btn') || hasClass(c, 'testi-next-btn')));
    removeAll(findAll(scope, (c) => c.tagName === 'script' && !attr(c, 'src') && /new Swiper\(\s*["'][^"']*(swiper-container|testi-cont)/.test(rawText(c))));
  };

  for (const box of findAll(doc, (c) => hasClass(c, 'testi-cont') || hasClass(c, 'tetimonial-swiper-2') || hasClass(c, 'prc'))) {
    if (ed.overlaps(...range(box))) continue;
    // Already a review carousel (a page built before): the reviews may have changed.
    if (hasClass(box, 'prc')) {
      ed.outer(box, renderReviewCarousel({ variant: hasClass(box, 'prc--column') ? 'column' : 'section', uid: uid() }));
      changes.push(`testimonials: looping review carousel of ${reviews.length} reviews (rendered again from reviews.json)`);
      continue;
    }
    // The reviews beside the video on / and /services/.
    if (hasClass(box, 'tetimonial-swiper-2')) {
      ed.outer(box, renderReviewCarousel({ variant: 'column', uid: uid() }));
      oldControls(box.parentNode);
      changes.push(`testimonials: looping review carousel of ${reviews.length} reviews beside the video (shorter reviews sat below a large empty band)`);
      continue;
    }
    // The "Testimonials" shortcode: as delivered (.swiper-container.testi-cont) or as an
    // earlier build left it (.testi-cont.pfix-testimonials).
    const up = ancestors(box);
    const section = up.find((a) => hasClass(a, 'Client-Logo-section'));
    if (pathname === '/service-areas/' && section) {
      ed.outer(section, '');
      changes.push('testimonials section removed (it does not belong on Service Areas)');
      continue;
    }
    const column = up.find((a) => hasClass(a, 'testi-auto'));
    ed.outer(box, renderReviewCarousel({ variant: column ? 'column' : 'section', uid: uid() }));
    oldControls(section || column || box.parentNode);
    changes.push(`testimonials: looping review carousel of ${reviews.length} reviews (the old carousel never started)`);
  }
  return count > 0;
}
