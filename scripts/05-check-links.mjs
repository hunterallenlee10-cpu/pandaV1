#!/usr/bin/env node
// Phase 3b — link check + inventory coverage.
//  1. File-level check: every internal reference in every HTML page (href, src,
//     srcset variants, data-src, inline styles, OG images …), every CSS url()
//     and every manifest icon must resolve to a file in site/ (or a redirect rule).
//  2. HTTP-level check: linkinator crawls the copy served by `serve`.
//  3. Inventory coverage: every URL in docs/url-inventory.csv has its file.
// Writes docs/missing-assets.md and docs/inventory-coverage.csv.
import fs from 'node:fs';
import path from 'node:path';
import { LinkChecker } from 'linkinator';
import { PATHS, SITE_ORIGIN, isSiteUrl, isForbidden, isRemovedPage, removedPageTarget, renamedPath } from './lib/config.mjs';
import { extractFromHtml, cssRefs, resolveUrl } from './lib/extract.mjs';
import { pageLocalPath, assetLocalPath, relToUrlPath } from './lib/paths.mjs';
import { startServer } from './lib/server.mjs';
import { readJson, writeJson, writeFile, toCsv, mdTable, args, listFiles } from './lib/util.mjs';

const opts = args();
const SITE_DIR = PATHS.site;
const PORT = Number(opts.port || 4174);
const inv = readJson(path.join(PATHS.work, 'inventory.json'));
const assets = readJson(path.join(PATHS.work, 'assets.json'), []);
const subsitePrefixes = (inv.subsites || []).filter((s) => s.kind === 'subdirectory').map((s) => s.id);
const excludedUrls = new Map((inv.excluded || []).map((e) => [e.url, e.reason]));

// Live status of every URL we tried to fetch, keyed by path+query (host-agnostic).
const liveStatus = new Map();
const keyOf = (u) => {
  const x = new URL(u);
  return x.pathname + x.search;
};
for (const r of inv.rows) liveStatus.set(keyOf(r.url), String(r.http_status));
for (const a of assets) {
  const st = String(a.status || a.blocked || a.error);
  if (isSiteUrl(a.url)) liveStatus.set(keyOf(a.url), st);
  else liveStatus.set(`ext:${new URL(a.url).host}${keyOf(a.url)}`, st);
}

// ------------------------------------------------------------ resolution
const rules = new Map();
if (fs.existsSync(path.join(SITE_DIR, '_redirects'))) {
  for (const line of fs.readFileSync(path.join(SITE_DIR, '_redirects'), 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const [from, to, status] = line.trim().split(/\s+/);
    rules.set(from, { to, status });
  }
}

function fileFor(pathname) {
  let p;
  try {
    p = decodeURIComponent(pathname);
  } catch {
    p = pathname;
  }
  const cands = p.endsWith('/') ? [`${p}index.html`] : [p, `${p}/index.html`];
  for (const c of cands) {
    const f = path.join(SITE_DIR, c);
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  return null;
}

function resolveLocal(pathname, depth = 0) {
  if (fileFor(pathname)) return { ok: true, via: 'file' };
  const alt = pathname.endsWith('/') ? pathname.slice(0, -1) : `${pathname}/`;
  const rule = rules.get(pathname) || rules.get(alt);
  if (rule && depth < 5) {
    if (/^https?:/i.test(rule.to)) return { ok: true, via: `redirect → ${rule.to}` };
    const t = new URL(rule.to, SITE_ORIGIN + '/');
    const r = resolveLocal(t.pathname, depth + 1);
    return { ok: r.ok, via: `${rule.status === '200' ? 'rewrite' : 'redirect'} → ${rule.to}` };
  }
  return { ok: false };
}

const inSubsite = (pathname) => subsitePrefixes.some((p) => pathname.startsWith(p) || pathname === p.replace(/\/$/, ''));

function classify(abs) {
  let u = new URL(abs);
  // /_external/<host>/<path> is where a third-party (or second-hostname) file lives
  // locally: look up the original URL's live status.
  const ext = /^\/_external\/([^/]+)(\/.*)$/.exec(u.pathname);
  if (ext) u = new URL(`https://${ext[1]}${ext[2]}${u.search}`);
  if (inSubsite(u.pathname)) return 'excluded sub-site (links to live)';
  if (isForbidden(u)) return 'back-end/admin URL (intentionally not copied)';
  const ex = excludedUrls.get(abs);
  if (ex) return `excluded in Phase 1: ${ex}`;
  const live = ext
    ? liveStatus.get(`ext:${u.host}${u.pathname}${u.search}`) || liveStatus.get(`ext:${u.host}${u.pathname}`)
    : liveStatus.get(u.pathname + u.search) || liveStatus.get(u.pathname);
  if (live && /^(4|5)\d\d$/.test(live)) return `missing on the live site too (HTTP ${live})`;
  if (live === 'robots') return 'disallowed by robots.txt (not downloaded)';
  if (live === '0' || /error/i.test(live || '')) return 'download failed (network error)';
  return live ? `NOT COPIED (live status ${live})` : 'NOT COPIED (never requested)';
}

// ---------------------------------------------------------- 1. file-level
const refs = new Map(); // pathname -> { abs, kinds:Set, from:Set }
function addRef(abs, kind, from) {
  let u;
  try {
    u = new URL(abs);
  } catch {
    return;
  }
  if (!isSiteUrl(u)) return;
  const key = u.pathname;
  if (!refs.has(key)) refs.set(key, { abs: u.href, kinds: new Set(), from: new Set() });
  refs.get(key).kinds.add(kind);
  refs.get(key).from.add(from);
}
const isRawDir = (f) => f.split(path.sep).includes('_raw');
const htmlFiles = listFiles(SITE_DIR, (f) => /\.html?$/i.test(f) && !isRawDir(f));
for (const file of htmlFiles) {
  const rel = path.relative(SITE_DIR, file).split(path.sep).join('/');
  const pageUrl = SITE_ORIGIN + relToUrlPath(rel).replace(/(^|\/)index\.html$/, '$1');
  const { links, assets: found } = extractFromHtml(fs.readFileSync(file, 'utf8'), pageUrl);
  for (const l of links) addRef(l, 'link', rel);
  for (const [u, kinds] of found) addRef(u, [...kinds][0], rel);
}
const cssFiles = listFiles(SITE_DIR, (f) => /\.css$/i.test(f) && !isRawDir(f));
for (const file of cssFiles) {
  const rel = path.relative(SITE_DIR, file).split(path.sep).join('/');
  const cssUrl = SITE_ORIGIN + relToUrlPath(rel);
  for (const r of cssRefs(fs.readFileSync(file, 'utf8'))) {
    const abs = resolveUrl(r.url, cssUrl);
    if (abs) addRef(abs, 'css url()', rel);
  }
}
for (const file of listFiles(SITE_DIR, (f) => /\.webmanifest$|manifest\.json$/i.test(f) && !isRawDir(f))) {
  const rel = path.relative(SITE_DIR, file).split(path.sep).join('/');
  try {
    for (const icon of JSON.parse(fs.readFileSync(file, 'utf8')).icons || []) addRef(resolveUrl(icon.src, SITE_ORIGIN + relToUrlPath(rel)), 'manifest icon', rel);
  } catch {}
}
const missing = [];
let okCount = 0;
for (const [pathname, r] of refs) {
  const res = resolveLocal(pathname);
  if (res.ok) {
    okCount++;
    continue;
  }
  missing.push({ path: pathname, url: r.abs, reason: classify(r.abs), kinds: [...r.kinds].join(', '), referrers: r.from.size, example: [...r.from][0] });
}
const fixable = missing.filter((m) => m.reason.startsWith('NOT COPIED') || m.reason.startsWith('download failed'));

// ---------------------------------------------------------- 2. HTTP-level
const server = await startServer(SITE_DIR, PORT);
const seeds = inv.rows
  .filter((r) => (r.type === 'page' && Number(r.http_status) === 200))
  .map((r) => `${server.base}${new URL(r.url).pathname}`);
const checker = new LinkChecker();
const base = server.base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lc = await checker.check({
  path: [...new Set([`${server.base}/`, ...seeds])],
  recurse: true,
  checkCss: true,
  concurrency: 20,
  timeout: 20_000,
  redirects: 'allow',
  linksToSkip: [`^(?!${base})`, `${base}/_raw/`],
});
server.stop();
const broken = lc.links.filter((l) => l.state === 'BROKEN');
const brokenByUrl = new Map();
for (const l of broken) {
  const key = l.url.replace(server.base, '');
  if (!brokenByUrl.has(key)) {
    const u = new URL(l.url);
    brokenByUrl.set(key, { url: l.url, status: l.status, parents: new Set(), reason: classify(SITE_ORIGIN + u.pathname + u.search) });
  }
  if (l.parent) brokenByUrl.get(key).parents.add(new URL(l.parent).pathname);
}
const brokenRows = [...brokenByUrl.values()].map((b) => ({ ...b, parent: [...b.parents][0] || '', pages: b.parents.size }));
const brokenFixable = brokenRows.filter((b) => b.reason.startsWith('NOT COPIED') || b.reason.startsWith('download failed'));

// ------------------------------------------------------ 3. inventory coverage
const coverage = [];
for (const row of inv.rows) {
  const status = Number(row.http_status);
  let expected = '';
  let present = 'n/a';
  let note = '';
  const u = new URL(row.url);
  if (row.type === 'page' && isSiteUrl(u) && isRemovedPage(u.pathname)) note = `page removed from the copy on request (redirects to ${removedPageTarget(u.pathname)})`;
  else if (row.type === 'page' && status === 200) {
    const moved = new URL(row.url);
    moved.pathname = renamedPath(moved.pathname); // a page at a corrected address (RENAMED_PATHS)
    expected = pageLocalPath(moved.href, 'text/html');
  }
  else if (row.type === '404-page') expected = '404.html';
  else if (row.type === 'robots' && status === 200) expected = 'robots.txt';
  else if (['sitemap', 'sitemap-stylesheet', 'feed', 'xml', 'file'].includes(row.type) && status === 200) expected = pageLocalPath(row.url, row.content_type);
  else if (['icon', 'manifest', 'document'].includes(row.type) && status === 200) expected = assetLocalPath(row.url, row.content_type).rel;
  else if (row.type === 'redirect') {
    const r = resolveLocal(u.pathname);
    const t = row.redirect_target ? new URL(row.redirect_target, row.url) : null;
    if (u.search) {
      present = 'n/a';
      note = 'query-string redirect: listed in docs/redirects.csv only';
    } else if (t && isSiteUrl(t) && inSubsite(t.pathname)) {
      present = 'n/a';
      note = 'redirect into an excluded sub-site (links point to the live site)';
    } else if (r.ok) {
      present = 'yes';
      note = r.via;
    } else if (t && isSiteUrl(t) && resolveLocal(t.pathname).ok) {
      present = 'yes';
      note = `target ${t.pathname} present (redirect not needed on a static host)`;
    } else {
      present = 'no';
      note = 'redirect target not in copy';
    }
  } else {
    note = status ? `live returned HTTP ${status} — nothing to copy` : 'not fetched';
  }
  if (expected) {
    present = fs.existsSync(path.join(SITE_DIR, expected)) ? 'yes' : 'no';
    if (row.type === 'feed' || row.type === 'sitemap') note = 'kept verbatim';
  }
  coverage.push({ url: row.url, type: row.type, http_status: row.http_status, expected_file: expected ? `site/${expected}` : '', present, note });
}
writeFile(path.join(PATHS.docs, 'inventory-coverage.csv'), toCsv(['url', 'type', 'http_status', 'expected_file', 'present', 'note'], coverage));
const covMissing = coverage.filter((c) => c.present === 'no');
const covApplicable = coverage.filter((c) => c.present !== 'n/a');

// ---------------------------------------------------------------- report
const failedDownloads = assets.filter((a) => a.status !== 200);
const md = [
  '# Missing assets & link check',
  '',
  'Generated by `scripts/05-check-links.mjs`.',
  '',
  '## Summary',
  '',
  mdTable(['Check', 'Result'], [
    ['Internal references checked (HTML href/src/srcset/data-*/styles/OG + CSS url() + manifest icons)', `${refs.size} unique paths in ${htmlFiles.length} HTML + ${cssFiles.length} CSS files`],
    ['… resolving to a file or redirect in site/', okCount],
    ['… not resolvable', `${missing.length} (${fixable.length} fixable, ${missing.length - fixable.length} expected — see reasons)`],
    ['HTTP link check (linkinator, served copy)', `${lc.links.length} links checked, ${brokenRows.length} unique broken URLs (${brokenFixable.length} fixable, the rest expected — see reasons)`],
    ['Inventory URLs with a matching file', `${covApplicable.length - covMissing.length} of ${covApplicable.length} applicable (${coverage.length} total rows)`],
    ['Assets that could not be downloaded from the live site', failedDownloads.length],
  ]),
  '',
];
md.push('## Unresolved internal references', '');
md.push(
  missing.length
    ? mdTable(['Path', 'Reason', 'Referenced as', 'Referring files', 'Example referrer'], missing.sort((a, b) => a.reason.localeCompare(b.reason)).map((m) => [m.path, m.reason, m.kinds, m.referrers, m.example]))
    : '_None — every internal reference resolves._',
  '',
);
md.push('## Broken links found by the HTTP crawl (linkinator)', '');
md.push(
  brokenRows.length
    ? mdTable(['URL', 'Status', 'Linked from (pages)', 'Example page', 'Reason'], brokenRows.map((b) => [b.url.replace(server.base, ''), b.status, b.pages, b.parent, b.reason]))
    : '_None._',
  '',
);
md.push('## Inventory URLs without a file', '');
md.push(covMissing.length ? mdTable(['URL', 'Type', 'Expected file', 'Note'], covMissing.map((c) => [c.url, c.type, c.expected_file, c.note])) : '_None — every applicable inventory URL has its file (details: `inventory-coverage.csv`)._', '');
md.push('## Downloads that failed on the live site', '');
md.push(
  failedDownloads.length
    ? mdTable(['URL', 'Live result', 'Referenced via'], failedDownloads.map((a) => [a.url, a.status || a.blocked || a.error, (a.kinds || []).slice(0, 2).join(' ')]))
    : '_None._',
  '',
);
writeFile(path.join(PATHS.docs, 'missing-assets.md'), md.join('\n'));
writeJson(path.join(PATHS.work, 'link-check.json'), {
  refs: refs.size,
  ok: okCount,
  missing,
  fixable: fixable.length,
  linkinator: { links: lc.links.length, broken: broken.length, uniqueBroken: brokenRows.length, brokenFixable: brokenFixable.length },
  coverage: { rows: coverage.length, applicable: covApplicable.length, missing: covMissing.length },
  failedDownloads: failedDownloads.length,
});
console.log(`Internal refs: ${refs.size} checked, ${missing.length} unresolved (${fixable.length} fixable)`);
console.log(`linkinator: ${lc.links.length} links, ${brokenRows.length} unique broken URLs (${brokenFixable.length} fixable)`);
console.log(`Inventory coverage: ${covApplicable.length - covMissing.length}/${covApplicable.length} applicable URLs have files`);
console.log(`Failed live downloads: ${failedDownloads.length}`);
