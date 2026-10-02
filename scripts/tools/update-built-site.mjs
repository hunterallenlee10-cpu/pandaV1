#!/usr/bin/env node
// Applies the site fixes (scripts/lib/site-fixes.mjs, the blog's design among them), smooth
// scrolling and the "Media" menu link to the pages already built in site/, (re)builds the
// Media page (/media/, scripts/lib/media-page.mjs), and copies the custom/ files they use
// into site/_custom/.
//
// 03-build.mjs rebuilds site/ from the capture cache (.cache/, .work/), which is not in
// the repository; this updates a checkout that only has site/. The fixes are written to
// give the same result on a built page as on the page as captured (a built page already
// carries the earlier fixes, and the stylesheets and scripts it links are not added
// again), so the pages come out as a full rebuild would make them. The map sections are
// left alone: they are rebuilt only by 03-build.mjs.
//
//   node scripts/tools/update-built-site.mjs [--only=/,/roofing/] [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import { PATHS, ROOT, SITE_ORIGIN, SITE_FIXES, SMOOTH_SCROLL, MEDIA_PAGE } from '../lib/config.mjs';
import { applyCustomizations, SMOOTH_SCROLL_DIR, SMOOTH_SCROLL_FILES } from '../lib/customize.mjs';
import { SITE_FIXES_DIR, SITE_FIXES_FILES } from '../lib/site-fixes.mjs';
import { REVIEWS_DIR, REVIEWS_FILES } from '../lib/reviews.mjs';
import { REVIEW_WALL_FILES, REVIEW_WALL_DATA, reviewWallJson } from '../lib/review-wall.mjs';
import { PROJECT_GALLERY_DIR, PROJECT_GALLERY_FILES } from '../lib/project-gallery.mjs';
import { pastProjectsFiles, PAST_PROJECTS_FILES } from '../lib/past-projects.mjs';
import { buildMediaPage, mediaFiles, MEDIA_PATH, MEDIA_FILES } from '../lib/media-page.mjs';
import { BLOG_DIR, BLOG_FILES } from '../lib/blog.mjs';
import { listFiles, args, writeFile } from '../lib/util.mjs';

const opts = args();
const SITE = PATHS.site;
const only = opts.only ? new Set(String(opts.only).split(',').map((p) => p.trim())) : null;
const dryRun = !!opts['dry-run'];

// The URL each page was built from (404.html: the missing page the capture asked for).
const inventory = fs.existsSync(path.join(PATHS.docs, 'url-inventory.csv')) ? fs.readFileSync(path.join(PATHS.docs, 'url-inventory.csv'), 'utf8') : '';
const notFoundUrl = inventory.split('\n').find((l) => l.split(',')[4] === '404-page')?.split(',')[0] || `${SITE_ORIGIN}/404/`;
function pageUrl(file) {
  const rel = path.relative(SITE, file).split(path.sep).join('/');
  if (rel === '404.html') return notFoundUrl;
  return `${SITE_ORIGIN}/${rel.replace(/(^|\/)index\.html$/, '$1')}`;
}

// The Media page is rebuilt below, from the other pages.
const mediaFile = path.join(SITE, MEDIA_PATH, 'index.html');
const pages = listFiles(SITE, (f) => f.endsWith('.html') && !path.relative(SITE, f).startsWith('_raw') && !(MEDIA_PAGE && f === mediaFile));
const counts = {};
const linked = new Set(); // the /_custom/ files the pages link
let changed = 0;
for (const file of pages.sort()) {
  const url = pageUrl(file);
  const html = fs.readFileSync(file, 'utf8');
  let out = { html };
  if (!only || only.has(new URL(url).pathname)) {
    out = applyCustomizations(html, { pageUrl: url, map: false, fixes: SITE_FIXES, smoothScroll: SMOOTH_SCROLL, media: MEDIA_PAGE, siteDir: SITE, siteOrigin: SITE_ORIGIN });
    if (out.html !== html) {
      changed++;
      for (const f of [...out.changes.fixes, ...out.changes.media]) {
        const k = f.replace(/\s*\(.*$/, '').replace(/:.*$/, '');
        counts[k] = (counts[k] || 0) + 1;
      }
      if (!dryRun) fs.writeFileSync(file, out.html);
    }
  }
  for (const m of out.html.matchAll(/(?:href|src)="(\/_custom\/[^"?#]+)"/g)) linked.add(m[1]);
}

// The Media page, from the pages just updated (its header and footer come from one of them).
let media = null;
if (MEDIA_PAGE && (!only || only.has(MEDIA_PATH))) {
  media = buildMediaPage({ siteDir: SITE, siteOrigin: SITE_ORIGIN });
  if (media && (!fs.existsSync(mediaFile) || fs.readFileSync(mediaFile, 'utf8') !== media.html)) {
    changed++;
    if (!dryRun) writeFile(mediaFile, media.html);
    console.log(`${dryRun ? 'would write' : 'wrote'} ${path.relative(ROOT, mediaFile)} (latest post ${media.post?.href || 'none'}; ${media.episodes} podcast episode(s))`);
  }
}

// The stylesheets and scripts the pages link.
const files = [
  ...Object.entries(SITE_FIXES_FILES).map(([name, url]) => [path.join(SITE_FIXES_DIR, name), url]),
  ...Object.entries(REVIEWS_FILES).map(([name, url]) => [path.join(REVIEWS_DIR, name), url]),
  ...Object.entries(PROJECT_GALLERY_FILES).map(([name, url]) => [path.join(PROJECT_GALLERY_DIR, name), url]),
  ...Object.entries(SMOOTH_SCROLL_FILES).map(([name, url]) => [path.join(SMOOTH_SCROLL_DIR, name), url]),
  ...Object.entries(BLOG_FILES).map(([name, url]) => [path.join(BLOG_DIR, name), url]),
].filter(([, url]) => linked.has(url));
// The review wall and the reviews hero on /reviews/: their stylesheet, script and photos
// (the photos are in the stylesheet, which the list of linked files above doesn't read).
if (linked.has(REVIEW_WALL_FILES['review-wall.js'])) files.push(...Object.entries(REVIEW_WALL_FILES).map(([name, url]) => [path.join(REVIEWS_DIR, name), url]));
// The favorite projects on /past-projects/: their stylesheet and photos (the photos are in
// srcset attributes, which the list of linked files above doesn't read).
if (linked.has(PAST_PROJECTS_FILES['past-projects.css'])) files.push(...pastProjectsFiles());
// Everything the Media page and the Podcast page's player use (their pictures are in
// src/srcset/poster attributes).
const mediaUsed = media || linked.has(MEDIA_FILES['media.js']);
if (mediaUsed) files.push(...mediaFiles());
// The list the review wall on /reviews/ loads (made from custom/reviews/google-reviews.json).
const generated = new Map();
if (linked.has(REVIEW_WALL_FILES['review-wall.js'])) {
  files.push([path.join(REVIEWS_DIR, 'google-reviews.json'), REVIEW_WALL_DATA]);
  generated.set(REVIEW_WALL_DATA, Buffer.from(reviewWallJson()));
}
let copied = 0;
for (const [from, url] of files) {
  const to = path.join(SITE, url);
  const data = generated.get(url) || fs.readFileSync(from);
  if (fs.existsSync(to) && fs.readFileSync(to).equals(data)) continue;
  copied++;
  if (!dryRun) writeFile(to, data);
  console.log(`${dryRun ? 'would copy' : 'copied'} ${path.relative(ROOT, from)} -> ${path.relative(ROOT, to)}`);
}

// Pictures of podcast episodes no longer in custom/media/podcast.json.
if (mediaUsed) {
  const keep = new Set(mediaFiles().map(([, url]) => path.join(SITE, url)));
  for (const f of listFiles(path.join(SITE, '_custom', 'media'))) {
    if (keep.has(f)) continue;
    if (!dryRun) fs.rmSync(f);
    console.log(`${dryRun ? 'would remove' : 'removed'} ${path.relative(ROOT, f)}`);
  }
}

console.log(`${dryRun ? 'Would update' : 'Updated'} ${changed} of ${pages.length + (media ? 1 : 0)} page(s) in ${path.relative(ROOT, SITE) || '.'}/; ${copied} file(s) copied.`);
for (const [k, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)} × ${k}`);
