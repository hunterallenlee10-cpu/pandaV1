// /past-projects/: "Some of our favorite past projects", a short, hand-picked showcase in
// place of the "Featured Projects" grid. That grid listed every project the page had
// (16 cards): five near-identical drone shots of the same houses titled "Panda Ext-14098"
// and the like, three titled just "Roof Replacement", photos of bare decking mid-tear-off,
// and three cards whose (2,560 px) photos often didn't show at all. The page now leads
// with six of the best-looking jobs (residential, solar and commercial) in a photo grid,
// each with a short line from its project page, then a call to action; the map ("Areas We
// Serve") follows.
//
// The projects, their wording and their photos are in custom/past-projects/favorites.json.
// The photos are resized copies (custom/past-projects/photos/, made by
// scripts/tools/past-projects-photos.mjs), about a tenth of the originals' weight.
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
import { hasClass, esc, find } from './html-edit.mjs';

export const PAST_PROJECTS_DIR = path.join(ROOT, 'custom', 'past-projects');
export const PAST_PROJECTS_FILES = { 'past-projects.css': '/_custom/past-projects/past-projects.css' };
export const PAST_PROJECTS_PATH = '/past-projects/';
// Photo widths made by the tool (webp), and the width of the jpg fallback.
export const PHOTO_WIDTHS = [720, 1440];
export const PHOTO_FALLBACK = 1440;

let data;
export const favorites = () => (data ??= JSON.parse(fs.readFileSync(path.join(PAST_PROJECTS_DIR, 'favorites.json'), 'utf8')));
/** The name the photos of a project are saved under (the last part of its address). */
export const photoSlug = (p) => p.href.split('/').filter(Boolean).pop();
const photoUrl = (p, w, ext) => `/_custom/past-projects/photos/${photoSlug(p)}-${w}.${ext}`;

/** Everything the showcase uses: [file on disk, address on the site]. */
export function pastProjectsFiles() {
  const photos = favorites().projects.flatMap((p) => [
    ...PHOTO_WIDTHS.map((w) => `photos/${photoSlug(p)}-${w}.webp`),
    `photos/${photoSlug(p)}-${PHOTO_FALLBACK}.jpg`,
  ]);
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

/** The showcase section. */
export function renderFavorites() {
  const f = favorites();
  const cta = f.cta;
  return (
    `<section class="ppx" aria-labelledby="ppx-title">` +
    `<div class="ppx__head">${f.eyebrow ? `<p class="ppx__eyebrow">${esc(f.eyebrow)}</p>` : ''}` +
    `<h2 class="ppx__title" id="ppx-title">${esc(f.title)}</h2>` +
    `${f.intro ? `<p class="ppx__intro">${esc(f.intro)}</p>` : ''}</div>` +
    // divs with list roles: the site's stylesheet forces bullets and colours on every ul/li.
    `<div class="ppx__grid" role="list">${f.projects.map(card).join('')}</div>` +
    (cta
      ? `<div class="ppx__cta"><div class="ppx__cta-text"><p class="ppx__cta-title">${esc(cta.title)}</p>${cta.text ? `<p>${esc(cta.text)}</p>` : ''}</div>` +
        `<div class="ppx__cta-actions"><a class="ppx__btn" href="${esc(cta.button[1])}">${esc(cta.button[0])}</a>` +
        (cta.more ? `<a class="ppx__more" href="${esc(cta.more[1])}">${esc(cta.more[0])} ${ARROW}</a>` : '') +
        `</div></div>`
      : '') +
    `</section>`
  );
}
export const favoritesNote = () => `favorite projects: ${favorites().projects.length} hand-picked projects above the map (was a grid of every project)`;

/**
 * On a built /past-projects/: the "Featured Projects" grid -> the showcase, above the map
 * (or a showcase already there rendered again). Returns true when the page has one.
 */
export function renderPastProjects(doc, html, ed, { pathname }, changes) {
  if (pathname !== PAST_PROJECTS_PATH) return false;
  const html2 = renderFavorites();
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
