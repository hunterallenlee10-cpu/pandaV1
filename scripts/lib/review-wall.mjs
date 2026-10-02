// The Reviews page (/reviews/). Its "We've got lots of friends" section showed a picture of
// an old Google rating (4.9), a "Write a Review" button and one review. It becomes the review
// wall: the Google rating and review count, a "Write a review" button that opens Google's
// review form, every five-star Google review (custom/reviews/google-reviews.json, then the
// site's other reviews from reviews.json) as cards that can be filtered by topic and
// searched, and a closing "Had a great experience?" band that asks for a review again.
//
// The first PAGE cards are rendered here, so they are in the page (and readable without
// JavaScript); the whole list is published as review-wall.json, which
// custom/reviews/review-wall.js loads to filter, search and show more. Used by site-fixes.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { classes, hasClass, esc, find, findAll, headEndOffset } from './html-edit.mjs';
import { REVIEWS_DIR, loadReviews } from './reviews.mjs';

export const REVIEW_WALL_FILES = {
  'review-wall.css': '/_custom/reviews/review-wall.css',
  'review-wall.js': '/_custom/reviews/review-wall.js',
  // The hero photo (a finished tile roof, from the "Spanish Tile Roof" project).
  'review-hero-1280.webp': '/_custom/reviews/review-hero-1280.webp',
  'review-hero-1280.jpg': '/_custom/reviews/review-hero-1280.jpg',
  'review-hero-800.webp': '/_custom/reviews/review-hero-800.webp',
};
// The whole list, written by the build (not a file in custom/reviews/).
export const REVIEW_WALL_DATA = '/_custom/reviews/review-wall.json';
export const REVIEW_WALL_PATH = '/reviews/';
// Cards rendered into the page, and added by each "Show more reviews".
const PAGE = 24;

// Topics to filter by: [id, label, what a review must mention].
const TOPICS = [
  ['roofing', 'Roofing', /\broof/i],
  ['siding', 'Siding', /\bsiding\b/i],
  ['gutters', 'Gutters', /\bgutter/i],
  ['solar', 'Solar', /\bsolar\b/i],
  ['insurance', 'Insurance claims', /\binsurance\b|\bclaims?\b|\badjuster/i],
  ['cleanup', 'Clean-up', /\bclean[\s-]?up\b|\bcleaned\b|\bspotless\b|\bimmaculate\b/i],
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dateLabel = (d) => {
  const m = /^(\d{4})(?:-(\d{2}))?/.exec(d || '');
  if (!m) return '';
  return m[2] ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : m[1];
};
// Keeps the reviewer's line breaks (one blank line at most), tidies the rest.
const tidy = (s) =>
  String(s)
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
const key = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 80);

let cached;
export function loadReviewWall() {
  if (cached) return cached;
  const data = JSON.parse(fs.readFileSync(path.join(REVIEWS_DIR, 'google-reviews.json'), 'utf8'));
  const place = data.place || {};
  for (const k of ['writeReviewUrl', 'mapsUrl']) if (!place[k]) throw new Error(`custom/reviews/google-reviews.json: "place" needs "${k}"`);
  const hide = (data.hideIfMentions || []).filter(Boolean).map((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
  const hidden = [];
  const seen = new Set();
  const take = (r, google) => {
    const text = tidy(r.text || '');
    const rating = r.rating == null ? 5 : Number(r.rating);
    if (!r.name || !text || rating !== 5) return null;
    if (seen.has(key(text))) return null;
    seen.add(key(text));
    if (hide.some((re) => re.test(text))) {
      hidden.push(r.name);
      return null;
    }
    return {
      name: String(r.name).trim(),
      date: dateLabel(r.date),
      sort: r.date || '',
      text,
      avatar: r.avatar || r.photo || '',
      guide: !!r.localGuide,
      google,
      topics: TOPICS.filter(([, , re]) => re.test(text)).map(([id]) => id),
    };
  };
  const google = (data.reviews || [])
    .map((r) => take(r, true))
    .filter(Boolean)
    .sort((a, b) => (a.sort < b.sort ? 1 : a.sort > b.sort ? -1 : 0));
  const site = loadReviews().reviews.map((r) => take(r, false)).filter(Boolean);
  const reviews = [...google, ...site].map(({ sort, ...r }) => r);
  if (!reviews.length) throw new Error('custom/reviews/google-reviews.json: no five-star reviews to show');
  const topics = TOPICS.map(([id, label]) => ({ id, label, count: reviews.filter((r) => r.topics.includes(id)).length })).filter((t) => t.count);
  const quote = data.heroQuote?.text && data.heroQuote?.name ? { text: tidy(data.heroQuote.text), name: String(data.heroQuote.name).trim() } : null;
  cached = { place, reviews, topics, hidden, google: google.length, quote };
  return cached;
}

/** The list the page's script loads (review-wall.json). */
export function reviewWallJson() {
  const { reviews } = loadReviewWall();
  return JSON.stringify({ reviews });
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
const starRow = (cls) => `<span class="${cls}">` + `<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="${STAR}"/></svg>`.repeat(5) + `</span>`;
export const GOOGLE_G =
  '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
const PEN = icon('<path d="M4 20h4L18.5 9.5a2.8 2.8 0 0 0-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m13.5 6.5 4 4" fill="none" stroke="currentColor" stroke-width="2"/>');
const OUT = icon('<path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>');
const SEARCH = icon('<circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>');

/** One review card. review-wall.js builds the same markup for the cards it adds. */
function card(r, i) {
  const id = `prw-text-${i + 1}`;
  const meta = [r.guide ? 'Local Guide' : '', r.date].filter(Boolean).join(' · ');
  return (
    `<article class="prw-card" data-topics="${esc(r.topics.join(' '))}">` +
    `<div class="prw-card__head">` +
    `<span class="prw-card__avatar" aria-hidden="true"><span>${esc(initials(r.name))}</span>` +
    (r.avatar ? `<img src="${esc(r.avatar)}" alt="" width="44" height="44" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : '') +
    `</span>` +
    `<span class="prw-card__who"><span class="prw-card__name">${esc(r.name)}</span>` +
    (meta ? `<span class="prw-card__meta">${esc(meta)}</span>` : '') +
    `</span>` +
    (r.google ? `<span class="prw-card__src" title="Posted on Google">${GOOGLE_G}<span class="prw-sr">Posted on Google</span></span>` : '') +
    `</div>` +
    `<span class="prw-card__stars" role="img" aria-label="Rated 5 out of 5">${starRow('prw-stars')}</span>` +
    `<p class="prw-card__text" id="${id}">${esc(r.text)}</p>` +
    `<button class="prw-card__more" type="button" aria-expanded="false" aria-controls="${id}" hidden>Read more</button>` +
    `</article>`
  );
}

/** The whole section. */
export function renderReviewWall() {
  const { place, reviews, topics } = loadReviewWall();
  const rating = Number(place.rating) || 5;
  const count = Number(place.count) || 0;
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100)).toFixed(1);
  const n = reviews.length;
  const ext = (href) => `href="${esc(href)}" target="_blank" rel="noopener"`;
  const newTab = '<span class="prw-sr"> (opens Google in a new tab)</span>';
  const chips =
    `<button class="prw__chip" type="button" data-topic="" aria-pressed="true">All <span>${n}</span></button>` +
    topics.map((t) => `<button class="prw__chip" type="button" data-topic="${t.id}" aria-pressed="false">${esc(t.label)} <span>${t.count}</span></button>`).join('');
  return (
    `<section class="prw" id="google-reviews" aria-labelledby="prw-title" data-src="${REVIEW_WALL_DATA}" data-page="${PAGE}" data-total="${n}">` +
    // Intro and the Google rating.
    `<div class="prw__top"><div class="prw__wrap prw__intro-row">` +
    `<div class="prw__intro">` +
    `<p class="prw__eyebrow"><span class="prw__g">${GOOGLE_G}</span>Google reviews</p>` +
    `<h2 class="prw__title" id="prw-title">We’ve got lots of friends, and we’re always looking for more!</h2>` +
    `<p class="prw__lede">Homeowners across the East Coast rate Panda Exteriors ${esc(String(rating))} out of 5 on Google. Here’s what they say, in their own words.</p>` +
    `</div>` +
    `<div class="prw__score">` +
    `<div class="prw__score-main"><span class="prw__score-num">${esc(rating.toFixed(1))}</span>` +
    `<span class="prw__score-side"><span class="prw__score-stars" role="img" aria-label="Rated ${esc(String(rating))} out of 5" style="--prw-fill:${pct}%">${starRow('prw-stars prw-stars--base')}${starRow('prw-stars prw-stars--fill')}</span>` +
    (count ? `<span class="prw__score-count">${count.toLocaleString('en-US')} reviews on Google</span>` : '') +
    `</span></div>` +
    `<a class="prw__btn prw__btn--primary" ${ext(place.writeReviewUrl)}>${PEN}Write a review${newTab}</a>` +
    `<a class="prw__btn prw__btn--ghost" ${ext(place.mapsUrl)}>See them all on Google${OUT}${newTab}</a>` +
    `</div>` +
    `</div></div>` +
    // The reviews.
    `<div class="prw__wrap prw__body">` +
    `<div class="prw__toolbar" hidden>` +
    `<div class="prw__chips" role="group" aria-label="Show reviews about">${chips}</div>` +
    `<label class="prw__search">${SEARCH}<span class="prw-sr">Search the reviews</span><input type="search" placeholder="Search reviews" autocomplete="off" enterkeyhint="search"></label>` +
    `</div>` +
    `<p class="prw__status" role="status">${n.toLocaleString('en-US')} five-star review${n === 1 ? '' : 's'}</p>` +
    `<div class="prw__grid">${reviews.slice(0, PAGE).map(card).join('')}</div>` +
    `<div class="prw__empty" hidden><p>No reviews match that search.</p><button class="prw__btn prw__btn--outline prw__clear" type="button">Show all reviews</button></div>` +
    `<div class="prw__more-row">` +
    `<button class="prw__btn prw__btn--outline prw__more" type="button" hidden>Show more reviews</button>` +
    (n > PAGE ? `<noscript><a class="prw__btn prw__btn--outline" ${ext(place.mapsUrl)}>Read more reviews on Google</a></noscript>` : '') +
    `</div>` +
    `</div>` +
    // Ask for a review.
    `<div class="prw__wrap"><div class="prw-cta">` +
    `<div class="prw-cta__text">` +
    `${starRow('prw-stars prw-cta__stars')}` +
    `<h3 class="prw-cta__title">Had a great experience with Panda?</h3>` +
    `<p class="prw-cta__lede">Your review helps a neighbor find a roofer they can trust, and our crews read every one. It takes about a minute.</p>` +
    `<div class="prw-cta__steps" role="list"><span class="prw-cta__step" role="listitem"><span>Tap <strong>Write a review</strong></span></span><span class="prw-cta__step" role="listitem"><span>Pick your stars</span></span><span class="prw-cta__step" role="listitem"><span>Tell us how it went</span></span></div>` +
    `</div>` +
    `<a class="prw__btn prw__btn--primary prw__btn--big" ${ext(place.writeReviewUrl)}><span class="prw__g prw__g--chip">${GOOGLE_G}</span>Write a Google review${newTab}</a>` +
    `</div></div>` +
    `</section>`
  );
}

/**
 * /reviews/: the "We've got lots of friends" section (as captured: .Reviews-section; as an
 * earlier build left it: .prw) becomes the review wall. Returns true if it did.
 */
export function collectReviewWall(doc, ed, { pathname = '' } = {}, changes = []) {
  if (pathname !== REVIEW_WALL_PATH) return false;
  const box = findAll(doc, (c) => hasClass(c, 'prw') || hasClass(c, 'Reviews-section'))[0];
  if (!box) return false;
  const l = box.sourceCodeLocation;
  if (ed.overlaps(l.startOffset, l.endOffset)) return false;
  const { reviews, google, hidden, place } = loadReviewWall();
  ed.outer(box, renderReviewWall());
  changes.push(
    `reviews page: review wall of ${reviews.length} five-star reviews (${google} from Google), rated ${place.rating} from ${place.count} Google reviews, with "Write a review" links` +
      (hidden.length ? `; ${hidden.length} left off (hideIfMentions)` : '') +
      (hasClass(box, 'prw') ? ' (rendered again)' : '')
  );
  return true;
}

// ---- The hero ---------------------------------------------------------------------------------
// /reviews/ hero: "Customer Reviews" and one line over a truck photo pinned to the screen
// (blown up from 1200 px). It now leads with the Google rating, a few reviewers' faces, a
// short quote, "Read the reviews" and "Write a review" buttons and the BBB and GAF badges,
// over a sharp photo of a finished tile roof. The free-estimate form beside it showed a
// picture of an old Google rating (4.9); on this page it shows the current one.
const ARROW_DOWN = icon('<path d="M12 4v15m0 0-6-6m6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>');
const CHECK = icon('<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>');

const fmtCount = (n) => (n >= 1000 ? `${(Math.floor(n / 100) * 100).toLocaleString('en-US')}+` : n.toLocaleString('en-US'));

function ratingStars(rating, cls) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100)).toFixed(1);
  return `<span class="${cls}" role="img" aria-label="Rated ${esc(String(rating))} out of 5" style="--prw-fill:${pct}%">${starRow('prw-stars prw-stars--base')}${starRow('prw-stars prw-stars--fill')}</span>`;
}

/** The Google rating in the free-estimate form (in place of the old rating picture). */
function formBadge() {
  const { place } = loadReviewWall();
  const rating = Number(place.rating) || 5;
  return (
    `<div class="prh-badge"><span class="prh-badge__g">${GOOGLE_G}</span>` +
    `<span class="prh-badge__text"><span class="prh-badge__label">Google Rating</span>` +
    `<span class="prh-badge__row"><b>${esc(rating.toFixed(1))}</b>${ratingStars(rating, 'prh-badge__stars prw-score-stars')}</span></span></div>`
  );
}

function heroText() {
  const { place, reviews, quote } = loadReviewWall();
  const rating = Number(place.rating) || 5;
  const count = Number(place.count) || 0;
  // Faces: reviewers with a photo on the site first (always there), then Google photos.
  const faces = [...reviews.filter((r) => r.avatar.startsWith('/')), ...reviews.filter((r) => r.avatar && !r.avatar.startsWith('/'))].slice(0, 4);
  const ext = `href="${esc(place.writeReviewUrl)}" target="_blank" rel="noopener"`;
  return (
    `<p class="prh__eyebrow">Customer reviews</p>` +
    `<h1 class="prh__title">Rated ${esc(rating.toFixed(1))} stars by ${count ? `${esc(fmtCount(count))} homeowners` : 'homeowners'} on Google</h1>` +
    `<p class="prh__sub">See why East Coast homeowners trust Panda Exteriors for quality and service, in their own words.</p>` +
    `<div class="prh__proof">` +
    `<div class="prh__rating">` +
    `<span class="prh__g">${GOOGLE_G}</span>` +
    `<span class="prh__num">${esc(rating.toFixed(1))}</span>` +
    `<span class="prh__rating-side">${ratingStars(rating, 'prh__stars prw-score-stars')}` +
    (count ? `<span class="prh__count">${count.toLocaleString('en-US')} Google reviews</span>` : '') +
    `</span>` +
    (faces.length
      ? `<span class="prh__faces" aria-hidden="true">` +
        faces
          .map((r) => `<span class="prh__face"><span>${esc(initials(r.name))}</span><img src="${esc(r.avatar)}" alt="" width="40" height="40" decoding="async" referrerpolicy="no-referrer"></span>`)
          .join('') +
        `</span>`
      : '') +
    `</div>` +
    (quote
      ? `<figure class="prh__quote"><blockquote><p>“${esc(quote.text)}”</p></blockquote><figcaption>${esc(quote.name)} <span>· Google review</span></figcaption></figure>`
      : '') +
    `</div>` +
    `<div class="prh__ctas">` +
    `<a class="prh__btn prh__btn--read" href="#google-reviews">${ARROW_DOWN}Read the reviews</a>` +
    `<a class="prh__btn prh__btn--write" ${ext}>${PEN}Write a review<span class="prw-sr"> (opens Google in a new tab)</span></a>` +
    `</div>` +
    `<div class="prh__trust" role="list">` +
    `<span role="listitem">${CHECK}BBB A-rated business</span>` +
    `<span role="listitem">${CHECK}GAF Master Elite contractor</span>` +
    `</div>`
  );
}

/**
 * /reviews/: the hero (.hero-section.reviews) gets the new text column and photo, and the
 * free-estimate forms on the page show the current Google rating. Gives the same result on
 * the page as captured and on a page an earlier build already changed.
 */
export function collectReviewsHero(doc, html, ed, { pathname = '' } = {}, changes = []) {
  if (pathname !== REVIEW_WALL_PATH) return false;
  const hero = find(doc, (c) => hasClass(c, 'hero-section') && hasClass(c, 'reviews'));
  const text = hero && find(hero, (c) => hasClass(c, 'text-section'));
  if (!text) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  if (!free(text)) return false;
  if (!hasClass(hero, 'prh')) ed.retag(hero, hero.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: [...classes(hero), 'prh'].join(' ') } : a)));
  ed.inner(text, heroText());
  // The rating picture in the free-estimate forms (or the badge an earlier build put there).
  let badges = 0;
  const inForm = (n) => {
    for (let a = n.parentNode; a; a = a.parentNode) if (hasClass(a, 'form-card')) return true;
    return false;
  };
  for (const pic of findAll(doc, (c) => ((c.tagName === 'picture' && hasClass(c, 'rating')) || hasClass(c, 'prh-badge')) && inForm(c))) {
    if (!free(pic)) continue;
    ed.outer(pic, formBadge());
    badges++;
  }
  // Fetch the photo with the page, not when the stylesheet gets to it.
  const headEnd = headEndOffset(html);
  const preload = `<link rel="preload" as="image" type="image/webp" href="${REVIEW_WALL_FILES['review-hero-800.webp']}" imagesrcset="${REVIEW_WALL_FILES['review-hero-800.webp']} 800w, ${REVIEW_WALL_FILES['review-hero-1280.webp']} 1280w" imagesizes="100vw" fetchpriority="high">`;
  if (headEnd >= 0 && !html.includes(preload)) ed.replace(headEnd, headEnd, preload);
  const { place } = loadReviewWall();
  changes.push(
    `reviews page hero: Google rating (${place.rating} from ${place.count} reviews), reviewers' faces, a quote, "Read the reviews" and "Write a review" buttons and the BBB and GAF badges, over a sharp tile-roof photo (was a blown-up truck photo)` +
      (badges ? `; current Google rating in ${badges} free-estimate form(s) (was a 4.9 picture)` : '')
  );
  return true;
}
