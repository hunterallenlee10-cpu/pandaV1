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
import { parse } from 'parse5';
import { renderCompactMap, renderExplorerMap, US_MAP_FILES } from './us-map.mjs';
import { collectSiteFixes, SITE_FIXES_FILES } from './site-fixes.mjs';
import { attr, classes, hasClass, esc, textOf, clean, findAll, find, startTag, makeEditor, editText, textNodes, isInside, headEndOffset } from './html-edit.mjs';

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
  `<p class="pmap-block__intro">Select a state to zoom in and see our local offices.</p>` +
  `<div class="pmap-card">${renderExplorerMap({ uid })}</div>` +
  `</div>`;

// ----------------------------------------------------------------- main
// map: replace the old map sections (CUSTOM_US_MAP). fixes: the audit fixes in
// site-fixes.mjs (SITE_FIXES). Returns the new HTML and what changed, per group.
export function applyCustomizations(html, { pageUrl, map = true, fixes = false, siteDir, siteOrigin } = {}) {
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const ed = makeEditor(html);
  const changes = { map: [], fixes: [] };
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
  if (!changes.map.length && !changes.fixes.length) return { html, changes };

  // Stylesheets and scripts go just before the page's own </head>. If a page has none,
  // they go right before the first edit instead (still valid HTML), never above the
  // doctype: anything before <!doctype html> switches the browser to quirks mode.
  let assets = '';
  if (changes.map.length) assets += `<link rel="stylesheet" href="${US_MAP_FILES['us-map.css']}"><script src="${US_MAP_FILES['us-map.js']}" defer></script>`;
  if (fixAssets.css) assets += `<link rel="stylesheet" href="${SITE_FIXES_FILES['site-fixes.css']}">`;
  if (fixAssets.js) assets += `<script src="${SITE_FIXES_FILES['site-fixes.js']}" defer></script>`;
  if (assets) {
    const headEnd = headEndOffset(html);
    const at = headEnd >= 0 ? headEnd : ed.firstStart;
    ed.replace(at, at, assets);
  }
  const out = ed.apply();
  if (/^\s*<!doctype/i.test(html) && !/^\s*<!doctype/i.test(out)) {
    throw new Error(`customize: ${pageUrl} would no longer start with its doctype`);
  }
  return { html: out, changes };
}
