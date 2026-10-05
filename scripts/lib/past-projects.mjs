// /past-projects/: "Some of our favorite past projects", a short, hand-picked showcase in
// place of the "Featured Projects" grid. That grid listed every project the page had
// (16 cards): five near-identical drone shots of the same houses titled "Panda Ext-14098"
// and the like, three titled just "Roof Replacement", photos of bare decking mid-tear-off,
// and three cards whose (2,560 px) photos often didn't show at all. The page now leads
// with six of the best-looking jobs (residential, solar and commercial) in a photo grid,
// each with a short line from its project page, then a call to action; the map ("Areas We
// Serve") follows.
//
// The hero loses its generic photo of a house (shared with other pages, and pinned to the
// screen with background-attachment: fixed, so it was blown up and soft) for a photo of
// Panda's own crew at work that scrolls with the page, with a dark fade behind the white
// headline, a small label above it and a button down to the favorites.
//
// The projects, their wording and their photos, and the hero's photo, are in
// custom/past-projects/favorites.json. The photos are resized copies (custom/past-projects/photos/, made by
// scripts/tools/past-projects-photos.mjs), about a tenth of the originals' weight.
//
// Under the favorites, "Browse all of our projects" lists every project page with type
// filters (renderArchive in project-pages.mjs, custom/projects/), so none is left linked
// from the Site Map alone.
//
// Applied in two places, so a full build and an update of a built page agree:
//  - customize.mjs, while it turns the page's Google Maps widget into the US map (full
//    build, with SITE_FIXES on): the showcase goes above the map, the hidden project
//    list it used to turn into the grid is dropped;
//  - site-fixes.mjs (renderPastProjects below), on a page built before: the old grid is
//    removed and the showcase put above the map, or an earlier showcase rendered again,
//    so editing the JSON and running `npm run update:site` updates the page.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { hasClass, esc, find, findAll, attr, classes, startTag, headEndOffset } from './html-edit.mjs';
import { renderArchive } from './project-pages.mjs';
import { renderProjectGallery } from './project-gallery.mjs';
import { isMergedPage } from './config.mjs';

// The photo gallery under the project list: the work photos of the Gallery page, which was
// merged into this one (MERGED_PAGES); its Community and Charity photos are on the Charity &
// Community page's photo wall already (custom/site-fixes/photo-gallery.json).
const PHOTO_GALLERY = path.join(ROOT, 'custom', 'site-fixes', 'photo-gallery.json');
const COMMUNITY = 'Community and Charity';
let gallery;
function renderPhotoGallery(siteDir) {
  if (!isMergedPage('/gallery/') || !fs.existsSync(PHOTO_GALLERY)) return '';
  gallery ??= JSON.parse(fs.readFileSync(PHOTO_GALLERY, 'utf8'));
  const exists = (src) => !siteDir || fs.existsSync(path.join(siteDir, decodeURIComponent(src.split(/[?#]/)[0])));
  const categories = gallery.categories.filter((c) => c.name !== COMMUNITY);
  const photos = gallery.photos.filter((p) => categories.some((c) => c.id === p.cat) && exists(p.full) && exists(p.src));
  if (!photos.length) return '';
  return (
    `<div class="ppx__gallery" id="photo-gallery">` +
    `<div class="ppx__head"><p class="ppx__eyebrow">Photo gallery</p><h2 class="ppx__title" id="ppx-gallery-title">More photos from our crews</h2>` +
    `<p class="ppx__intro">New roofs, solar, commercial roofing and gutters from Panda jobs across the East Coast. Pick a category, then select a photo to see it full size.</p></div>` +
    renderProjectGallery({ categories, photos }, { uid: 'ppg-photos' }) +
    `</div>`
  );
}

export const PAST_PROJECTS_DIR = path.join(ROOT, 'custom', 'past-projects');
export const PAST_PROJECTS_FILES = { 'past-projects.css': '/_custom/past-projects/past-projects.css' };
export const PAST_PROJECTS_PATH = '/past-projects/';
// Photo widths made by the tool (webp), and the width of the jpg fallback.
export const PHOTO_WIDTHS = [720, 1440];
export const PHOTO_FALLBACK = 1440;
// The hero photo: webp for phones and for larger screens (the larger one also as a jpg).
export const HERO_WIDTHS = [960, 1920];
const HERO_SLUG = 'hero';
const SECTION_ID = 'ppx';

let data;
export const favorites = () => (data ??= JSON.parse(fs.readFileSync(path.join(PAST_PROJECTS_DIR, 'favorites.json'), 'utf8')));
/** The name the photos of a project are saved under (the last part of its address). */
export const photoSlug = (p) => p.href.split('/').filter(Boolean).pop();
const photoUrl = (p, w, ext) => `/_custom/past-projects/photos/${photoSlug(p)}-${w}.${ext}`;
const heroUrl = (w, ext) => `/_custom/past-projects/photos/${HERO_SLUG}-${w}.${ext}`;
/** The photos the tool makes: { slug, photo, sizes: [[width, ext], …] }. */
export function photoJobs() {
  const f = favorites();
  return [
    ...(f.hero?.photo ? [{ slug: HERO_SLUG, photo: f.hero.photo, sizes: [...HERO_WIDTHS.map((w) => [w, 'webp']), [HERO_WIDTHS.at(-1), 'jpg']] }] : []),
    ...f.projects.map((p) => ({ slug: photoSlug(p), photo: p.photo, sizes: [...PHOTO_WIDTHS.map((w) => [w, 'webp']), [PHOTO_FALLBACK, 'jpg']] })),
  ];
}

/** Everything the showcase uses: [file on disk, address on the site]. */
export function pastProjectsFiles() {
  const photos = photoJobs().flatMap((j) => j.sizes.map(([w, ext]) => `photos/${j.slug}-${w}.${ext}`));
  return [...Object.entries(PAST_PROJECTS_FILES), ...photos.map((rel) => [rel, `/_custom/past-projects/${rel}`])]
    .map(([rel, url]) => [path.join(PAST_PROJECTS_DIR, rel), url])
    .filter(([file]) => fs.existsSync(file));
}

const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// How wide each card's photo is shown (the grid in past-projects.css): the first card is
// half the row on computers, the second, fifth and sixth half the row, the third and
// fourth a quarter; every card is the full width on phones and half on tablets.
const SIZES = ['(min-width: 1024px) 600px, (min-width: 640px) 100vw, 100vw', '(min-width: 1024px) 600px, (min-width: 640px) 50vw, 100vw', '(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw'];
const sizesFor = (i) => (i === 0 ? SIZES[0] : i === 2 || i === 3 ? SIZES[2] : SIZES[1]);

function card(p, i) {
  const srcset = PHOTO_WIDTHS.map((w) => `${photoUrl(p, w, 'webp')} ${w}w`).join(', ');
  return (
    `<div class="ppx-card ppx-card--${i + 1}" role="listitem"><a class="ppx-card__link" href="${esc(p.href)}">` +
    `<picture class="ppx-card__media"><source type="image/webp" srcset="${esc(srcset)}" sizes="${sizesFor(i)}">` +
    `<img src="${esc(photoUrl(p, PHOTO_FALLBACK, 'jpg'))}" alt="${esc(p.alt || '')}"${p.position ? ` style="object-position: ${esc(p.position)}"` : ''}` +
    ` loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async"></picture>` +
    `<span class="ppx-card__body"><span class="ppx-card__tag">${esc(p.tag)}</span>` +
    `<span class="ppx-card__title">${esc(p.title)}</span>` +
    `<span class="ppx-card__text">${esc(p.text)}</span>` +
    `<span class="ppx-card__more">View project ${ARROW}</span></span>` +
    `</a></div>`
  );
}

/** The showcase section, with every project listed under the favorites (project-pages.mjs). */
export function renderFavorites(siteDir) {
  const f = favorites();
  const cta = f.cta;
  return (
    `<section class="ppx" id="${SECTION_ID}" aria-labelledby="ppx-title">` +
    `<div class="ppx__head">${f.eyebrow ? `<p class="ppx__eyebrow">${esc(f.eyebrow)}</p>` : ''}` +
    `<h2 class="ppx__title" id="ppx-title">${esc(f.title)}</h2>` +
    `${f.intro ? `<p class="ppx__intro">${esc(f.intro)}</p>` : ''}</div>` +
    // divs with list roles: the site's stylesheet forces bullets and colours on every ul/li.
    `<div class="ppx__grid" role="list">${f.projects.map(card).join('')}</div>` +
    renderArchive(siteDir) +
    renderPhotoGallery(siteDir) +
    (cta
      ? `<div class="ppx__cta"><div class="ppx__cta-text"><p class="ppx__cta-title">${esc(cta.title)}</p>${cta.text ? `<p>${esc(cta.text)}</p>` : ''}</div>` +
        `<div class="ppx__cta-actions"><a class="ppx__btn" href="${esc(cta.button[1])}">${esc(cta.button[0])}</a>` +
        (cta.more ? `<a class="ppx__more" href="${esc(cta.more[1])}">${esc(cta.more[0])} ${ARROW}</a>` : '') +
        `</div></div>`
      : '') +
    `</section>`
  );
}
export const favoritesNote = () => `favorite projects: ${favorites().projects.length} hand-picked projects and every project under them, above the map (was a grid of every project)`;

// ----------------------------------------------------------------- hero
// The photo goes in custom properties on the hero (read by past-projects.css), so it is
// chosen in favorites.json alone.
function heroStyle(h) {
  const jpg = heroUrl(HERO_WIDTHS.at(-1), 'jpg');
  const set = (w) => `image-set(url("${heroUrl(w, 'webp')}") type("image/webp"), url("${jpg}") type("image/jpeg"))`;
  return `--ppx-hero-jpg: url("${jpg}"); --ppx-hero-sm: ${set(HERO_WIDTHS[0])}; --ppx-hero-lg: ${set(HERO_WIDTHS.at(-1))};` + (h.position ? ` --ppx-hero-position: ${h.position};` : '');
}
/** The hero: the photo, a label and a button (rendered again on every run). */
function renderHero(doc, html, ed, changes) {
  const h = favorites().hero;
  const hero = h && find(doc, (c) => hasClass(c, 'past-projects-hero'));
  const text = hero && find(hero, (c) => hasClass(c, 'text-section'));
  const h1 = text && find(text, (c) => c.tagName === 'h1');
  if (!h1) return false;
  const src = (n) => html.slice(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  const para = find(text, (c) => c.tagName === 'p' && hasClass(c, 'para'));
  const inner =
    (h.eyebrow ? `<p class="ppx-hero__eyebrow">${esc(h.eyebrow)}</p>` : '') +
    src(h1) +
    (para ? src(para) : '') +
    (h.button ? `<a class="ppx-hero__btn" href="${esc(h.button[1])}">${esc(h.button[0])} ${ARROW}</a>` : '');
  const cls = hasClass(hero, 'ppx-hero') ? classes(hero) : [...classes(hero), 'ppx-hero'];
  const attrs = [...hero.attrs.filter((a) => a.name !== 'style').map((a) => (a.name === 'class' ? { name: 'class', value: cls.join(' ') } : a)), { name: 'style', value: heroStyle(h) }];
  const st = hero.sourceCodeLocation.startTag;
  const ts = text.sourceCodeLocation;
  const sameTag = html.slice(st.startOffset, st.endOffset) === startTag(hero, attrs);
  const sameText = html.slice(ts.startTag.endOffset, ts.endTag.startOffset) === inner;
  if (!sameTag) ed.retag(hero, attrs);
  if (!sameText) ed.inner(text, inner);
  // Fetch the photo with the page, not when WP Rocket's lazy loader gets to it.
  const preloads =
    `<link rel="preload" as="image" type="image/webp" href="${heroUrl(HERO_WIDTHS[0], 'webp')}" media="(max-width: 960px)" fetchpriority="high">` +
    `<link rel="preload" as="image" type="image/webp" href="${heroUrl(HERO_WIDTHS.at(-1), 'webp')}" media="(min-width: 961px)" fetchpriority="high">`;
  const old = findAll(doc, (c) => c.tagName === 'link' && attr(c, 'rel') === 'preload' && (attr(c, 'href') || '').startsWith(`/_custom/past-projects/photos/${HERO_SLUG}-`));
  const sameLinks = old.map(src).join('') === preloads;
  if (!sameLinks) {
    old.forEach((l, i) => ed.outer(l, i ? '' : preloads));
    const headEnd = headEndOffset(html);
    if (!old.length && headEnd >= 0) ed.replace(headEnd, headEnd, preloads);
  }
  if (!sameTag || !sameText || !sameLinks) {
    changes.push('favorite projects hero: a photo of our crew at work (was a soft stock photo pinned to the screen), a label and a button to the favorites');
  }
  return true;
}

/**
 * /past-projects/: the hero (renderHero), and on a built page the "Featured Projects" grid
 * -> the showcase, above the map (or a showcase already there rendered again). Returns
 * true when the page has either.
 */
export function renderPastProjects(doc, html, ed, { pathname, siteDir }, changes) {
  if (pathname !== PAST_PROJECTS_PATH) return false;
  const hero = renderHero(doc, html, ed, changes);
  return renderShowcase(doc, html, ed, changes, siteDir) || hero;
}
function renderShowcase(doc, html, ed, changes, siteDir) {
  const html2 = renderFavorites(siteDir);
  const current = find(doc, (c) => c.tagName === 'section' && hasClass(c, 'ppx'));
  if (current) {
    if (html.slice(current.sourceCodeLocation.startOffset, current.sourceCodeLocation.endOffset) !== html2) {
      ed.outer(current, html2);
      changes.push(favoritesNote());
    }
    return true;
  }
  const grid = find(doc, (c) => hasClass(c, 'pmap-block--projects'));
  const areas = find(doc, (c) => hasClass(c, 'pmap-block--areas'));
  if (!grid || !areas) return false;
  ed.outer(grid, '');
  ed.replace(areas.sourceCodeLocation.startOffset, areas.sourceCodeLocation.startOffset, html2);
  changes.push(favoritesNote());
  return true;
}
