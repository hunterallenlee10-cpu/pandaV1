#!/usr/bin/env node
// Applies the site fixes (scripts/lib/site-fixes.mjs) and smooth scrolling to the pages
// already built in site/, and copies the custom/ files they use into site/_custom/.
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
import { PATHS, ROOT, SITE_ORIGIN, SITE_FIXES, SMOOTH_SCROLL } from '../lib/config.mjs';
import { applyCustomizations, SMOOTH_SCROLL_DIR, SMOOTH_SCROLL_FILES } from '../lib/customize.mjs';
import { SITE_FIXES_DIR, SITE_FIXES_FILES } from '../lib/site-fixes.mjs';
import { REVIEWS_DIR, REVIEWS_FILES } from '../lib/reviews.mjs';
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

const pages = listFiles(SITE, (f) => f.endsWith('.html') && !path.relative(SITE, f).startsWith('_raw'));
const counts = {};
const linked = new Set(); // the /_custom/ files the pages link
let changed = 0;
for (const file of pages.sort()) {
  const url = pageUrl(file);
  const html = fs.readFileSync(file, 'utf8');
  let out = { html };
  if (!only || only.has(new URL(url).pathname)) {
    out = applyCustomizations(html, { pageUrl: url, map: false, fixes: SITE_FIXES, smoothScroll: SMOOTH_SCROLL, siteDir: SITE, siteOrigin: SITE_ORIGIN });
    if (out.html !== html) {
      changed++;
      for (const f of out.changes.fixes) {
        const k = f.replace(/\s*\(.*$/, '').replace(/:.*$/, '');
        counts[k] = (counts[k] || 0) + 1;
      }
      if (!dryRun) fs.writeFileSync(file, out.html);
    }
  }
  for (const m of out.html.matchAll(/(?:href|src)="(\/_custom\/[^"?#]+)"/g)) linked.add(m[1]);
}

// The stylesheets and scripts the pages link.
const files = [
  ...Object.entries(SITE_FIXES_FILES).map(([name, url]) => [path.join(SITE_FIXES_DIR, name), url]),
  ...Object.entries(REVIEWS_FILES).map(([name, url]) => [path.join(REVIEWS_DIR, name), url]),
  ...Object.entries(SMOOTH_SCROLL_FILES).map(([name, url]) => [path.join(SMOOTH_SCROLL_DIR, name), url]),
].filter(([, url]) => linked.has(url));
let copied = 0;
for (const [from, url] of files) {
  const to = path.join(SITE, url);
  const data = fs.readFileSync(from);
  if (fs.existsSync(to) && fs.readFileSync(to).equals(data)) continue;
  copied++;
  if (!dryRun) writeFile(to, data);
  console.log(`${dryRun ? 'would copy' : 'copied'} ${path.relative(ROOT, from)} -> ${path.relative(ROOT, to)}`);
}

console.log(`${dryRun ? 'Would update' : 'Updated'} ${changed} of ${pages.length} page(s) in ${path.relative(ROOT, SITE) || '.'}/; ${copied} file(s) copied.`);
for (const [k, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)} × ${k}`);
