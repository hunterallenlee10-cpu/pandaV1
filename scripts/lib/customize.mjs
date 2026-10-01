// Deliberate changes to the copy, applied by 03-build.mjs after the normal rewrite.
// Each one is a surgical edit of the page HTML (everything else stays byte-for-byte),
// so re-running the capture and build reproduces them.
//
// The US map (custom/us-map/) replaces the site's old map sections everywhere:
//  - the "Local East Coast Exterior Remodelers" band (orange on most pages, white on
//    /siding/): its picture of a map becomes the animated map; its buttons point at
//    the estimate form and the Service Areas page; the whole-band click and the
//    typos in its paragraph are fixed;
//  - /past-projects/: the Google Maps "Projects | Map" widget (which needs a live
//    WordPress API and cannot work in a static copy) becomes the large interactive
//    map, and the page's hidden project list becomes a visible grid;
//  - /service-areas/: the large map goes where the city list used to be.
//
// Every page also gets smooth scrolling (custom/smooth-scroll/, SMOOTH_SCROLL), and the
// header's "Media" menu item leads to the Media page (media-page.mjs, MEDIA_PAGE), whose
// podcast player also replaces the Podcast page's dead one.
//
// Separately, applyHeroVideo swaps the homepage hero's background video.
import path from 'node:path';
import { parse } from 'parse5';
import { ROOT } from './config.mjs';
import { renderCompactMap, renderExplorerMap, US_MAP_FILES } from './us-map.mjs';
import { collectSiteFixes, SITE_FIXES_FILES } from './site-fixes.mjs';
import { REVIEWS_FILES } from './reviews.mjs';
import { PROJECT_GALLERY_FILES } from './project-gallery.mjs';
import { collectMediaNav, collectPodcastPage, MEDIA_FILES } from './media-page.mjs';
import { attr, classes, hasClass, esc, textOf, clean, findAll, find, startTag, makeEditor, editText, textNodes, isInside, headEndOffset } from './html-edit.mjs';

// Lenis smooth scrolling, on every page: the library, its stylesheet and the site's setup.
export const SMOOTH_SCROLL_DIR = path.join(ROOT, 'custom', 'smooth-scroll');
export const SMOOTH_SCROLL_FILES = {
  'smooth-scroll.css': '/_custom/smooth-scroll/smooth-scroll.css',
  'lenis.min.js': '/_custom/smooth-scroll/lenis.min.js',
  'smooth-scroll.js': '/_custom/smooth-scroll/smooth-scroll.js',
};

// ------------------------------------------------------------- the band
const PARAGRAPH_FIXES = [
  [/throughout Northeast/g, 'throughout the Northeast'],
  [/including, /g, 'including '],
  [/Washington D\.C, and/g, 'Washington, D.C., and'],
];
function isMapBand(n) {
  if (!hasClass(n, 'Client-section')) return false;
  const heading = find(n, (c) => /^h[1-6]$/.test(c.tagName) && /Local East Coast/.test(textOf(c)));
  return Boolean(heading && find(n, (c) => hasClass(c, 'image-container')));
}
function customizeBand(ed, html, band, uid, changes) {
  const orange = hasClass(band, 'map-background') || attr(band, 'id') === 'map-background' || !hasClass(band, 'bg-white');
  // The band itself: no more background picture, fixed height or whole-band click.
  const attrs = band.attrs
    .filter((a) => a.name !== 'onclick' && !(a.name === 'id' && a.value === 'map-background'))
    .map((a) =>
      a.name === 'class'
        ? { name: 'class', value: [...classes(band).filter((c) => c !== 'map-background'), 'pmap-section', `pmap-section--${orange ? 'orange' : 'light'}`].join(' ') }
        : a
    );
  const st = band.sourceCodeLocation.startTag;
  ed.replace(st.startOffset, st.endOffset, startTag(band, attrs));
  // The picture of a map -> the animated map.
  const slot = find(band, (c) => hasClass(c, 'image-container'));
  ed.inner(slot, renderCompactMap({ theme: orange ? 'orange' : 'light', uid }));
  changes.push(`map band (${orange ? 'orange' : 'white'}) -> animated US map`);
  // Typos in the paragraph.
  const para = find(band, (c) => c.tagName === 'p' && /East Coast exterior remodeling/.test(textOf(c)));
  const fixed = para ? textNodes(para).map((t) => editText(ed, html, t, (s) => PARAGRAPH_FIXES.reduce((x, [re, to]) => x.replace(re, to), s))) : [];
  if (fixed.some(Boolean)) changes.push('paragraph typos fixed');
  // Buttons: "Free Estimate" went to Past Projects; "View All Cities" to a page without cities.
  for (const a of findAll(band, (c) => c.tagName === 'a')) {
    const label = clean(textOf(a));
    const href = a.sourceCodeLocation.attrs?.href;
    if (/^Free Estimate$/i.test(label) && href && !/contact-us/.test(attr(a, 'href'))) {
      ed.replace(href.startOffset, href.endOffset, 'href="/contact-us/"');
      changes.push('"Free Estimate" -> /contact-us/');
    }
    if (/^View All Cities$/i.test(label)) {
      const t = textNodes(a).find((x) => /View All Cities/.test(x.value));
      if (t && editText(ed, html, t, (s) => s.replace('View All Cities', 'See Service Areas'))) changes.push('"View All Cities" -> "See Service Areas"');
    }
  }
}

// -------------------------------------------------------- Past Projects
function projectCards(list) {
  return findAll(list, (c) => c.tagName === 'article')
    .map((art) => {
      const link = find(art, (c) => c.tagName === 'a' && attr(c, 'href'));
      const img = find(art, (c) => c.tagName === 'img' && hasClass(c, 'img-responsive')) || find(art, (c) => c.tagName === 'img');
      const nameEl = find(art, (c) => hasClass(c, 'project-name'));
      const title = clean(nameEl ? textOf(nameEl) : attr(img || {}, 'alt') || '');
      const src = [attr(img || {}, 'data-lazy-src'), attr(img || {}, 'src')].find((s) => s && !s.startsWith('data:'));
      return link && title ? { href: attr(link, 'href'), title, src, srcset: attr(img || {}, 'data-lazy-srcset') || attr(img || {}, 'srcset') || '', w: attr(img || {}, 'width'), h: attr(img || {}, 'height') } : null;
    })
    .filter(Boolean);
}
function renderProjects(cards) {
  const li = (c) =>
    `<div class="pmap-projects__item" role="listitem"><a href="${esc(c.href)}">` +
    (c.src
      ? `<img src="${esc(c.src)}"${c.srcset ? ` srcset="${esc(c.srcset)}" sizes="(max-width: 767px) 100vw, 320px"` : ''}` +
        `${c.w && c.h ? ` width="${esc(c.w)}" height="${esc(c.h)}"` : ''} alt="" loading="lazy" decoding="async">`
      : '') +
    `<span>${esc(c.title)}</span></a></div>`;
  return (
    `<div class="pmap-block pmap-block--projects">` +
    `<h2 class="heading-2 text-center">Featured Projects</h2>` +
    // divs with list roles: the site's stylesheet forces bullets and colours on every ul/li.
    `<div class="pmap-projects" role="list">${cards.map(li).join('')}</div>` +
    `</div>`
  );
}
const explorerBlock = (uid) =>
  `<div class="pmap-block pmap-block--areas">` +
  `<h2 class="heading-2 text-center">Areas We Serve</h2>` +
  `<p class="pmap-block__intro">Select a state to zoom in and see how many jobs we've completed there.</p>` +
  `<div class="pmap-card">${renderExplorerMap({ uid })}</div>` +
  `</div>`;

// ------------------------------------------------------------ hero video
// The homepage hero plays a muted, looping YouTube video behind its text: an iframe in
// .hero .video-background (lazy-loaded by WP Rocket from data-lazy-src) plus a
// <noscript> copy. This points both at another video and keeps every player setting
// (mute, autoplay, loop, no controls); the old video's share-tracking "si" is dropped.
//
// It also sizes the player to cover the hero like a background image. The live site
// sizes it to the hero's width only (a 16:9 box pulled up 15%), which leaves most of the
// tall tablet hero black and shows only the top half of the video on wide screens.
// Instead the player is centred and scaled to fill the hero at any size, running
// HERO_VIDEO_BLEED px past its top and bottom so YouTube's title bar (shown for a few
// seconds when the video starts) is cropped off. Browsers without container query
// units (before 2023) get the player at the hero's own size, letterboxed.
const YT_EMBED = /(https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/)([\w-]{11})([^"'\s<>]*)/g;
const HERO_VIDEO_BLEED = 90;
const HERO_VIDEO_BOX = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; container-type: size;';
const HERO_VIDEO_PLAYER =
  'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; ' +
  `width: max(100cqw, (100cqh + ${2 * HERO_VIDEO_BLEED}px) * 16 / 9); height: max(100cqw * 9 / 16, 100cqh + ${2 * HERO_VIDEO_BLEED}px);`;
export function applyHeroVideo(html, { videoId } = {}) {
  if (!videoId) return { html, changes: [] };
  if (!/^[\w-]{11}$/.test(videoId)) throw new Error(`customize: "${videoId}" is not a YouTube video ID`);
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const hero = find(doc, (c) => hasClass(c, 'hero') && find(c, (x) => hasClass(x, 'video-background')));
  const bg = hero && find(hero, (c) => hasClass(c, 'video-background'));
  if (!bg) return { html, changes: [] };
  const { startOffset, endOffset } = bg.sourceCodeLocation;
  const before = html.slice(startOffset, endOffset);
  const changes = [];
  const was = new Set();
  const swapped = before.replace(YT_EMBED, (url, base, id, query) => {
    if (id === videoId) return url;
    was.add(id);
    const q = query
      .replace(/^\?si=[^&"'\s<>]*(?:&#0?38;|&amp;|&)?/, '?')
      .replace(new RegExp(`(playlist=)${id}(?![\\w-])`, 'g'), `$1${videoId}`);
    return base + videoId + q;
  });
  if (was.size) changes.push(`hero background video ${[...was].join(', ')} -> ${videoId}`);
  // The 16:9 box around the player (and the player itself, in the iframe and its
  // <noscript> copy, whose markup parse5 keeps as text) get the cover sizing.
  const fitted = swapped
    .replace(/(<div\b[^>]*?\sstyle=")[^"]*padding-bottom:\s*56\.25%[^"]*(")/, `$1${HERO_VIDEO_BOX}$2`)
    .replace(/(<iframe\b[^>]*?\sstyle=")[^"]*(")/g, `$1${HERO_VIDEO_PLAYER}$2`);
  if (fitted !== swapped) changes.push('hero video sized to cover the hero');
  if (!changes.length) return { html, changes };
  return { html: html.slice(0, startOffset) + fitted + html.slice(endOffset), changes };
}

// ----------------------------------------------------------------- main
// map: replace the old map sections (CUSTOM_US_MAP). fixes: the audit fixes in
// site-fixes.mjs (SITE_FIXES). smoothScroll: Lenis on the page (SMOOTH_SCROLL). media:
// the "Media" menu item -> /media/, and the Podcast page's player (MEDIA_PAGE).
// Returns the new HTML and what changed, per group. Stylesheets and scripts the page
// already links are not added again, so the fixes (not the map) can also be run over an
// already built page (scripts/tools/update-built-site.mjs).
export function applyCustomizations(html, { pageUrl, map = true, fixes = false, smoothScroll = false, media = false, siteDir, siteOrigin } = {}) {
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const ed = makeEditor(html);
  const changes = { map: [], fixes: [], media: [] };
  let n = 0;
  const uid = () => `pmap-${++n}`;
  const pathname = pageUrl ? new URL(pageUrl).pathname : '';

  if (map) {
    for (const band of findAll(doc, isMapBand)) customizeBand(ed, html, band, uid(), changes.map);

    // The Google Maps widget (Past Projects): it lives in one HTML-code block.
    const widget = find(doc, (c) => hasClass(c, 'custom-project') && find(c, (x) => attr(x, 'id') === 'map-container' || attr(x, 'id') === 'mapclusterer'));
    if (widget) {
      ed.outer(widget, explorerBlock(uid()));
      changes.map.push('Google Maps projects widget -> interactive US map');
      const list = find(doc, (c) => attr(c, 'id') === 'projectsListData');
      const cards = list ? projectCards(list) : [];
      if (list && cards.length) {
        ed.outer(list, renderProjects(cards));
        changes.map.push(`hidden project list -> featured projects grid (${cards.length})`);
      }
      // Map scripts left outside the widget, if any.
      for (const s of findAll(doc, (c) => c.tagName === 'script' && /maps\/api\/js\?[^"]*callback=initMap|markerclusterer/.test(attr(c, 'src') || ''))) {
        if (!isInside(s, widget)) ed.outer(s, '');
      }
    }

    // Service Areas: the large map goes where the list of cities used to be.
    if (/^\/service-areas\/$/.test(pathname)) {
      const section = find(doc, (c) => hasClass(c, 'Area_Section'));
      const box = section && find(section, (c) => hasClass(c, 'container'));
      if (box) {
        ed.append(box, `<div class="pmap-card">${renderExplorerMap({ uid: uid() })}</div>`);
        changes.map.push('interactive US map added under "…work on properties throughout:"');
      }
    }
  }

  const fixAssets = fixes ? collectSiteFixes(doc, html, ed, { pageUrl, siteDir, siteOrigin }, changes.fixes) : {};
  let mediaAssets = false;
  if (media) {
    collectMediaNav(doc, html, ed, changes.media);
    mediaAssets = collectPodcastPage(doc, html, ed, changes.media);
  }

  // Stylesheets and scripts go just before the page's own </head>. If a page has none,
  // they go right before the first edit instead (still valid HTML), never above the
  // doctype: anything before <!doctype html> switches the browser to quirks mode.
  const linked = new Set(findAll(doc, (c) => (c.tagName === 'link' && attr(c, 'rel') === 'stylesheet') || c.tagName === 'script').map((c) => attr(c, 'href') || attr(c, 'src')));
  const css = (href) => (linked.has(href) ? '' : `<link rel="stylesheet" href="${href}">`);
  const js = (src) => (linked.has(src) ? '' : `<script src="${src}" defer></script>`);
  let assets = '';
  if (changes.map.length) assets += css(US_MAP_FILES['us-map.css']) + js(US_MAP_FILES['us-map.js']);
  if (fixAssets.css) assets += css(SITE_FIXES_FILES['site-fixes.css']);
  if (fixAssets.js) assets += js(SITE_FIXES_FILES['site-fixes.js']);
  if (fixAssets.reviews) assets += css(REVIEWS_FILES['reviews.css']) + js(REVIEWS_FILES['reviews.js']);
  if (fixAssets.gallery) assets += css(PROJECT_GALLERY_FILES['project-gallery.css']) + js(PROJECT_GALLERY_FILES['project-gallery.js']);
  if (mediaAssets) assets += css(MEDIA_FILES['media.css']) + js(MEDIA_FILES['media.js']);
  if (smoothScroll) assets += css(SMOOTH_SCROLL_FILES['smooth-scroll.css']) + js(SMOOTH_SCROLL_FILES['lenis.min.js']) + js(SMOOTH_SCROLL_FILES['smooth-scroll.js']);
  if (assets) {
    const headEnd = headEndOffset(html);
    const at = headEnd >= 0 ? headEnd : ed.count ? ed.firstStart : -1;
    if (at >= 0) ed.replace(at, at, assets);
    else console.warn(`customize: ${pageUrl} has no </head>, stylesheets and scripts not added`);
  }
  if (!ed.count) return { html, changes };
  const out = ed.apply();
  if (/^\s*<!doctype/i.test(html) && !/^\s*<!doctype/i.test(out)) {
    throw new Error(`customize: ${pageUrl} would no longer start with its doctype`);
  }
  return { html: out, changes };
}
