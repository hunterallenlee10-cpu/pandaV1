// The project pages (/blog/project/…/), redesigned, and links to every one of them where it
// belongs on the site.
//
// As captured, a project page was a title strip ("Projects - Panda Ext-11425") over a
// blurred photo, then the project's photos at full size one under another, some 2,560 px
// and half a megabyte each; seven of the fifteen had no words at all. Nine of them were
// linked from nowhere but the Site Map: Brookfield Properties, Linear Accelerator Roof
// Replacement, the five "Panda Ext-…" pages and two of the three pages titled just "Roof
// Replacement". Now:
//  - each page has a hero on the site's dark green (the project's type, its name, a line
//    about it, an estimate button and a button down to the photos, beside its best photo),
//    the project's story beside an "At a glance" card (what was done, the materials, the
//    warranty, how long it took, and the service page it belongs to), its video if it has
//    one, the photos as a grid that opens the project gallery's photo viewer, three more
//    projects, and a closing estimate band;
//  - /past-projects/ lists every project under the favorites ("Browse all of our
//    projects", with Homes / Commercial & multi-family / Solar filters);
//  - the service pages a project belongs to (residential roofing, roof replacement, roof
//    types, the three commercial pages, solar, GAF solar roofs, gutter guards) show it in a
//    "Recent projects" row above their testimonials.
// So every project is a click or two from the home page, in context.
//
// The words, facts and photos are in custom/projects/projects.json; a project's words are
// its own page's where it had any. The photos are shown from resized copies
// (custom/projects/photos/, made by scripts/tools/project-photos.mjs) and open full size.
// Applied by site-fixes.mjs (the pages and the rows) and past-projects.mjs (the list);
// rendered again on every run, so editing the JSON and running `npm run update:site`
// updates every page.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { attr, hasClass, esc, find, findAll, headEndOffset } from './html-edit.mjs';

export const PROJECTS_DIR = path.join(ROOT, 'custom', 'projects');
export const PROJECTS_FILES = { 'projects.css': '/_custom/projects/projects.css', 'projects.js': '/_custom/projects/projects.js' };
const PROJECT_PREFIX = '/blog/project/';
// Thumbnails (every photo) and covers (heroes, cards): webp, and a jpg of the cover for
// browsers without webp.
export const THUMB_WIDTH = 720;
export const COVER_WIDTH = 1280;
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };

let data;
export const projectsData = () => (data ??= JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, 'projects.json'), 'utf8')));
const bySlug = () => new Map(projectsData().projects.map((p) => [p.slug, p]));
export const projectHref = (p) => `${PROJECT_PREFIX}${p.slug}/`;

// ----------------------------------------------------------------- photos
const base = (src) => path.posix.basename(src).replace(/\.[a-z]+$/i, '');
const thumbUrl = (src) => `/_custom/projects/photos/${base(src)}-${THUMB_WIDTH}.webp`;
const coverUrl = (src, ext) => `/_custom/projects/photos/${base(src)}-${COVER_WIDTH}.${ext}`;
/** The copies the tool makes: { src, out: [[file name, width, ext, fit]] }. */
export function photoJobs() {
  const jobs = new Map();
  const add = (src, name, w, ext, fit) => {
    if (!jobs.has(src)) jobs.set(src, { src, out: [] });
    const j = jobs.get(src);
    if (!j.out.some((o) => o[0] === name)) j.out.push([name, w, ext, fit]);
  };
  for (const p of projectsData().projects) {
    for (const src of p.photos) add(src, path.posix.basename(thumbUrl(src)), THUMB_WIDTH, 'webp', 'inside');
    for (const ext of ['webp', 'jpg']) add(p.cover, path.posix.basename(coverUrl(p.cover, ext)), COVER_WIDTH, ext, 'width');
  }
  return [...jobs.values()];
}
/** Everything the pages use from custom/projects/: [file on disk, address on the site]. */
export function projectsFiles() {
  const photos = photoJobs().flatMap((j) => j.out.map(([name]) => `photos/${name}`));
  return [...Object.entries(PROJECTS_FILES), ...photos.map((rel) => [rel, `/_custom/projects/${rel}`])]
    .map(([rel, url]) => [path.join(PROJECTS_DIR, rel), url])
    .filter(([file]) => fs.existsSync(file));
}

// The size of a photo on the site, read from its JPEG/PNG header (for the viewer and the
// grid's tall tiles), cached.
const sizes = new Map();
function photoSize(src, siteDir) {
  if (sizes.has(src)) return sizes.get(src);
  let size = null;
  try {
    const buf = fs.readFileSync(path.join(siteDir || path.join(ROOT, 'site'), decodeURIComponent(src)));
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      for (let i = 2; i < buf.length - 9; ) {
        if (buf[i] !== 0xff) break;
        const m = buf[i + 1];
        const len = buf.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          size = { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
          break;
        }
        i += 2 + len;
      }
    } else if (buf.toString('ascii', 1, 4) === 'PNG') size = { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } catch {
    /* missing: no size */
  }
  sizes.set(src, size);
  return size;
}
// The resized copies are looked for in custom/projects/ (a full build copies them into the
// site after the pages are written); the originals in the site.
const exists = (siteDir, url) =>
  url.startsWith('/_custom/projects/')
    ? fs.existsSync(path.join(PROJECTS_DIR, url.slice('/_custom/projects/'.length)))
    : !siteDir || fs.existsSync(path.join(siteDir, decodeURIComponent(url)));

// ----------------------------------------------------------------- pieces
const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 2) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  arrow: line('M5 12h14M13 6l6 6-6 6'),
  down: line('M12 5v14M6 13l6 6 6-6'),
  photos: line('M4 7.5A1.5 1.5 0 0 1 5.5 6h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0 1 20 7.5v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 1.8),
  expand: line('M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7'),
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  check: line('M5 12.5l4.2 4.2L19 7', 2.4),
  play: svg('<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>'),
};

function coverPicture(p, siteDir, { cls, sizes: sz, eager = false }) {
  const webp = coverUrl(p.cover, 'webp');
  const jpg = coverUrl(p.cover, 'jpg');
  const thumb = thumbUrl(p.cover);
  const haveCover = exists(siteDir, webp) && exists(siteDir, jpg);
  const srcset = [exists(siteDir, thumb) ? `${thumb} ${THUMB_WIDTH}w` : '', haveCover ? `${webp} ${COVER_WIDTH}w` : ''].filter(Boolean).join(', ');
  return (
    `<picture class="${cls}">${srcset ? `<source type="image/webp" srcset="${esc(srcset)}" sizes="${esc(sz)}">` : ''}` +
    `<img src="${esc(haveCover ? jpg : p.cover)}" alt="${esc(p.alt || '')}"${p.position ? ` style="object-position: ${esc(p.position)}"` : ''}` +
    ` ${eager ? 'fetchpriority="high" data-no-lazy=""' : 'loading="lazy"'} decoding="async"></picture>`
  );
}

/** A project card (the archive on /past-projects/, the rows on service pages, "More projects"). */
function card(p, siteDir, { heading = 'h3', sizes: sz = '(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw', feature = false } = {}) {
  return (
    `<article class="ppj-card${feature ? ' ppj-card--feature' : ''}" data-group="${esc(p.group)}">` +
    `<a class="ppj-card__link" href="${esc(projectHref(p))}">` +
    `<span class="ppj-card__media">${coverPicture(p, siteDir, { cls: 'ppj-card__pic', sizes: feature ? '(min-width: 900px) 640px, 100vw' : sz })}` +
    `<span class="ppj-card__tag">${esc(p.tag)}</span>` +
    `<span class="ppj-card__count">${ICONS.photos}${p.photos.length}</span></span>` +
    `<span class="ppj-card__body">` +
    (p.ref ? `<span class="ppj-card__ref">${esc(p.ref)}</span>` : '') +
    `<${heading} class="ppj-card__title">${esc(p.title)}</${heading}>` +
    `<span class="ppj-card__text">${esc(p.summary)}</span>` +
    `<span class="ppj-card__more">View project ${ICONS.arrow}</span></span>` +
    `</a></article>`
  );
}

// ----------------------------------------------------------------- the project page
function pageHtml(p, siteDir) {
  const d = projectsData();
  const n = p.photos.length;
  const crumbs =
    // spans, not a list: the site's stylesheet forces bullets and black text on every li.
    `<nav class="ppj-crumbs" aria-label="Breadcrumb">` +
    `<a href="/">Home</a><span class="ppj-crumbs__sep" aria-hidden="true">/</span>` +
    `<a href="/past-projects/">Past Projects</a><span class="ppj-crumbs__sep" aria-hidden="true">/</span>` +
    `<span aria-current="page">${esc(p.title)}</span></nav>`;
  const hero =
    `<section class="ppj-hero" aria-labelledby="ppj-title"><div class="ppj__inner ppj-hero__grid">` +
    `<div class="ppj-hero__text">${crumbs}` +
    `<p class="ppj-hero__meta"><span class="ppj-hero__tag">${esc(p.tag)}</span>${p.ref ? `<span class="ppj-hero__ref">${esc(p.ref)}</span>` : ''}</p>` +
    `<h1 class="ppj-hero__title" id="ppj-title">${esc(p.title)}</h1>` +
    `<p class="ppj-hero__sub">${esc(p.summary)}</p>` +
    `<div class="ppj-hero__ctas">` +
    `<a class="ppj-btn ppj-btn--primary" href="${esc(d.cta.button[1])}">${esc(d.cta.button[0])}</a>` +
    `<a class="ppj-btn ppj-btn--ghost" href="#ppj-photos">${ICONS.down}See the photos (${n})</a>` +
    `</div></div>` +
    `<figure class="ppj-hero__media">${coverPicture(p, siteDir, { cls: 'ppj-hero__pic', sizes: '(min-width: 960px) 620px, 100vw', eager: true })}` +
    `<figcaption class="ppj-hero__badge">${ICONS.photos}<span>${n} photo${n === 1 ? '' : 's'}${p.video ? ' and a video' : ''}</span></figcaption></figure>` +
    `</div></section>`;

  const video = p.video
    ? `<div class="ppj-video"><p class="ppj-video__label">${ICONS.play}Watch the project</p>` +
      `<div class="ppj-video__frame"><iframe src="https://www.youtube-nocookie.com/embed/${esc(p.video.id)}?rel=0" title="${esc(p.video.title)}" loading="lazy"` +
      ` allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div>`
    : '';
  const facts =
    `<aside class="ppj-glance" aria-labelledby="ppj-glance-title"><p class="ppj-glance__title" id="ppj-glance-title">At a glance</p>` +
    `<dl class="ppj-glance__list">${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` +
    `<a class="ppj-glance__service" href="${esc(p.service[1])}"><small>Related service</small><span>${esc(p.service[0])}</span>${ICONS.arrow}</a>` +
    `<div class="ppj-glance__cta"><p>Planning something similar?</p>` +
    `<a class="ppj-btn ppj-btn--primary ppj-btn--block" href="${esc(d.cta.button[1])}">${esc(d.cta.button[0])}</a>` +
    `<a class="ppj-btn ppj-btn--line ppj-btn--block" href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a></div>` +
    `</aside>`;
  const story =
    `<section class="ppj-story" aria-labelledby="ppj-story-title"><div class="ppj__inner ppj-story__grid">` +
    `<div class="ppj-story__text"><p class="ppj-eyebrow">The project</p>` +
    `<h2 class="ppj-h2" id="ppj-story-title">About this project</h2>` +
    p.body.map((t) => `<p>${esc(t)}</p>`).join('') +
    video +
    `</div>${facts}</div></section>`;

  const tile = (src, i) => {
    const size = photoSize(src, siteDir);
    const full = exists(siteDir, `${src}.webp`) ? `${src}.webp` : src;
    const thumb = thumbUrl(src);
    const alt = `${p.title}: photo ${i + 1} of ${n}`;
    const tall = size && size.h > size.w * 1.1;
    return (
      `<a class="ppj-photo${tall ? ' is-tall' : ''}" href="${esc(full)}"${size ? ` data-size="${size.w}x${size.h}"` : ''} data-caption="${esc(p.title)}">` +
      `<picture>${exists(siteDir, thumb) ? `<source type="image/webp" srcset="${esc(thumb)}">` : ''}` +
      `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async"></picture>` +
      `<span class="ppj-photo__zoom">${ICONS.expand}</span></a>`
    );
  };
  const photos =
    `<section class="ppj-photos" id="ppj-photos" aria-labelledby="ppj-photos-title"><div class="ppj__inner">` +
    `<div class="ppj-head"><p class="ppj-eyebrow">Gallery</p><h2 class="ppj-h2" id="ppj-photos-title">Project photos</h2>` +
    `<p class="ppj-head__intro">${n} photo${n === 1 ? '' : 's'} from the job. Select one to see it full size.</p></div>` +
    // project-gallery.js opens these in its photo viewer.
    `<div class="ppj-photos__grid" data-ppg-wall="${esc(p.title)}">${p.photos.map(tile).join('')}</div>` +
    `</div></section>`;

  // Three more projects: the same kind first (named projects before the job-number ones,
  // which share their photos), then the rest, in the JSON's order, starting after this one so
  // neighbouring pages show different picks.
  const all = d.projects;
  const at = all.indexOf(p);
  const ring = [...all.slice(at + 1), ...all.slice(0, at)];
  const rank = (x) => (x.group === p.group ? 0 : 2) + (x.ref && x.ref.startsWith('Project') && x.group === 'homes' ? 1 : 0);
  const picks = ring
    .map((x, i) => [rank(x), i, x])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .slice(0, 3)
    .map(([, , x]) => x);
  const related =
    `<section class="ppj-related" aria-labelledby="ppj-related-title"><div class="ppj__inner">` +
    `<div class="ppj-head ppj-head--row"><div><p class="ppj-eyebrow">${esc(d.related.eyebrow)}</p><h2 class="ppj-h2" id="ppj-related-title">${esc(d.related.title)}</h2></div>` +
    `<a class="ppj-more" href="${esc(d.related.more[1])}">${esc(d.related.more[0])} ${ICONS.arrow}</a></div>` +
    `<div class="ppj-cards">${picks.map((x) => card(x, siteDir)).join('')}</div>` +
    `</div></section>`;

  const cta =
    `<section class="ppj-cta" aria-labelledby="ppj-cta-title"><div class="ppj__inner ppj-cta__box">` +
    `<div><h2 class="ppj-cta__title" id="ppj-cta-title">${esc(d.cta.title)}</h2><p>${esc(d.cta.text)}</p></div>` +
    `<div class="ppj-cta__actions"><a class="ppj-btn ppj-btn--primary" href="${esc(d.cta.button[1])}">${esc(d.cta.button[0])}</a>` +
    `<a class="ppj-btn ppj-btn--ghost" href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a></div>` +
    `</div></section>`;

  return `<main class="ppj">${hero}${story}${photos}${related}${cta}</main>`;
}

// The page's title in the browser tab and in share previews.
const docTitle = (p) => `${p.title}${p.ref ? ` (${p.ref})` : ''} | Panda Exteriors`;
function collectHead(doc, html, ed, p) {
  const want = docTitle(p);
  const tags = [
    find(doc, (c) => c.tagName === 'title'),
    ...findAll(doc, (c) => c.tagName === 'meta' && ['og:title', 'twitter:title'].includes(attr(c, 'property') || attr(c, 'name'))),
  ].filter(Boolean);
  let n = 0;
  for (const t of tags) {
    const l = t.sourceCodeLocation;
    if (t.tagName === 'title') {
      if (html.slice(l.startTag.endOffset, l.endTag.startOffset) !== esc(want)) {
        ed.inner(t, esc(want));
        n++;
      }
    } else if (attr(t, 'content') !== want) {
      ed.retag(t, t.attrs.map((a) => (a.name === 'content' ? { name: 'content', value: want } : a)));
      n++;
    }
  }
  // A description for the pages that had none (search results and share previews).
  const desc = find(doc, (c) => c.tagName === 'meta' && attr(c, 'name') === 'description');
  if (!desc) {
    const headEnd = headEndOffset(html);
    if (headEnd >= 0) {
      ed.replace(headEnd, headEnd, `<meta name="description" content="${esc(p.summary)}">`);
      n++;
    }
  }
  return n;
}

/** /blog/project/…/: the redesigned page in place of the title strip and the photos. */
export function collectProjectPage(doc, html, ed, { pathname = '', siteDir } = {}, changes = []) {
  if (!pathname.startsWith(PROJECT_PREFIX)) return false;
  const p = bySlug().get(pathname.slice(PROJECT_PREFIX.length).replace(/\/$/, ''));
  if (!p) return false;
  const out = pageHtml(p, siteDir);
  const current = find(doc, (c) => c.tagName === 'main' && hasClass(c, 'ppj'));
  let range;
  if (current) {
    range = current.sourceCodeLocation;
  } else {
    // As captured: the title strip (.offers-hero, nested in its wrappers) and the photos
    // (.custom-gallery, in its container) are side by side between the header and the footer.
    const hero = find(doc, (c) => hasClass(c, 'offers-hero'));
    const gallery = find(doc, (c) => hasClass(c, 'custom-gallery'));
    if (!hero || !gallery) {
      console.warn(`site-fixes: ${pathname}: no project title strip or photos, left as is`);
      return false;
    }
    let top = hero;
    while (top.parentNode && top.parentNode.tagName !== 'body') top = top.parentNode;
    let box = gallery;
    while (box.parentNode && box.parentNode.tagName !== 'body') box = box.parentNode;
    if (!top.parentNode || top.parentNode !== box.parentNode) {
      console.warn(`site-fixes: ${pathname}: unexpected project page layout, left as is`);
      return false;
    }
    range = { startOffset: top.sourceCodeLocation.startOffset, endOffset: box.sourceCodeLocation.endOffset };
  }
  if (ed.overlaps(range.startOffset, range.endOffset)) return false;
  let n = collectHead(doc, html, ed, p);
  if (html.slice(range.startOffset, range.endOffset) !== out) {
    ed.replace(range.startOffset, range.endOffset, out);
    n++;
  }
  if (n) changes.push(`project page: ${p.title}: a hero, the story beside "At a glance", a photo grid with a viewer and more projects (was a title strip over full-size photos)`);
  return true;
}

// ----------------------------------------------------------------- /past-projects/
/** "Browse all of our projects": every project, with type filters (projects.js). */
export function renderArchive(siteDir) {
  const d = projectsData();
  const a = d.archive;
  const count = (key) => (key === 'all' ? d.projects.length : d.projects.filter((p) => p.group === key).length);
  const chips = a.filters
    .filter(([key]) => count(key))
    .map(
      ([key, label], i) =>
        `<button type="button" class="ppj-filter" data-filter="${esc(key)}" aria-pressed="${i === 0 ? 'true' : 'false'}">${esc(label)} <span>${count(key)}</span></button>`
    )
    .join('');
  return (
    `<div class="ppj-archive" id="${esc(a.id)}" aria-labelledby="ppj-archive-title">` +
    `<div class="ppj-head"><p class="ppj-eyebrow">${esc(a.eyebrow)}</p><h2 class="ppj-h2" id="ppj-archive-title">${esc(a.title)}</h2>` +
    `<p class="ppj-head__intro">${esc(a.intro)}</p></div>` +
    // The buttons work with projects.js; without it they stay hidden and every project shows.
    `<div class="ppj-filters" role="group" aria-label="Show projects" hidden>${chips}</div>` +
    `<div class="ppj-cards ppj-cards--archive" data-ppj-archive>${d.projects.map((p) => card(p, siteDir)).join('')}</div>` +
    `<p class="ppj-archive__status" role="status" aria-live="polite"></p>` +
    `</div>`
  );
}

// ----------------------------------------------------------------- service pages
/** A "Recent projects" row above a service page's testimonials. */
export function collectProjectStrip(doc, html, ed, { pathname = '', siteDir } = {}, changes = []) {
  const strip = projectsData().strips?.[pathname];
  if (!strip) return false;
  const projects = strip.projects.map((s) => bySlug().get(s)).filter(Boolean);
  if (!projects.length) return false;
  const one = projects.length === 1;
  const out =
    `<section class="ppj ppj-strip" aria-labelledby="ppj-strip-title"><div class="ppj__inner">` +
    `<div class="ppj-head ppj-head--row"><div><p class="ppj-eyebrow">${esc(strip.eyebrow || 'Our work')}</p>` +
    `<h2 class="ppj-h2" id="ppj-strip-title">${esc(strip.title)}</h2>${strip.intro ? `<p class="ppj-head__intro">${esc(strip.intro)}</p>` : ''}</div>` +
    `<a class="ppj-more" href="/past-projects/#${esc(projectsData().archive.id)}">See all past projects ${ICONS.arrow}</a></div>` +
    `<div class="ppj-cards${one ? ' ppj-cards--one' : ` ppj-cards--${projects.length}`}">${projects.map((p) => card(p, siteDir, { feature: one })).join('')}</div>` +
    `</div></section>`;
  const current = find(doc, (c) => c.tagName === 'section' && hasClass(c, 'ppj-strip'));
  if (current) {
    const l = current.sourceCodeLocation;
    if (ed.overlaps(l.startOffset, l.endOffset)) return false;
    if (html.slice(l.startOffset, l.endOffset) !== out) {
      ed.outer(current, out);
      changes.push(`project row: ${strip.title} (${projects.length})`);
    }
    return true;
  }
  // Above the testimonials, else above "About Our Team".
  const anchor =
    find(doc, (c) => hasClass(c, 'Client-Logo-section') && !!find(c, (x) => hasClass(x, 'Testimonial-container'))) ||
    find(doc, (c) => hasClass(c, 'Request-Container'));
  if (!anchor) {
    console.warn(`site-fixes: ${pathname}: nowhere to put the project row, left out`);
    return false;
  }
  const at = anchor.sourceCodeLocation.startOffset;
  if (ed.overlaps(at, at)) return false;
  ed.replace(at, at, out);
  changes.push(`project row: ${strip.title} (${projects.length})`);
  return true;
}
