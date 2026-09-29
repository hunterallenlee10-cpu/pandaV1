#!/usr/bin/env node
// Phase 2 (build) — assemble site/ from the capture cache, then write the docs.
// Re-runnable offline: it only reads .cache/ and .work/, never the network.
//
//   node scripts/03-build.mjs [--source=rendered|raw]
//
// --source picks which HTML becomes site/<path>/index.html: the fully rendered
// DOM captured by Chromium (default) or the HTML exactly as delivered. Per-page
// overrides can be listed in .work/page-source-overrides.json ({ "<url>": "raw" }).
import fs from 'node:fs';
import path from 'node:path';
import { PATHS, SITE_ORIGIN, isSiteUrl, isLocalizableHost, isOriginAlias, REMOVE_SUBSITE_LINKS, CUSTOM_US_MAP, HERO_VIDEO_ID } from './lib/config.mjs';
import { fetcher } from './lib/fetcher.mjs';
import { transformHtml, transformCss, transformText } from './lib/transform.mjs';
import { applyCustomizations, applyHeroVideo } from './lib/customize.mjs';
import { US_MAP_DIR, US_MAP_FILES } from './lib/us-map.mjs';
import { extractForms, extractFromHtml } from './lib/extract.mjs';
import { pageLocalPath, assetLocalPath, relToUrlPath } from './lib/paths.mjs';
import { readJson, writeJson, writeFile, toCsv, mdTable, args, fmtBytes, listFiles } from './lib/util.mjs';

const opts = args();
const SOURCE = opts.source || 'rendered';
const OUT = PATHS.site;
const overrides = readJson(path.join(PATHS.work, 'page-source-overrides.json'), {});
const inv = readJson(path.join(PATHS.work, 'inventory.json'));
const assets = readJson(path.join(PATHS.work, 'assets.json'), []);
const captureDir = path.join(PATHS.work, 'capture');
const captures = new Map();
for (const f of listFiles(captureDir, (f) => f.endsWith('.json'))) {
  const c = readJson(f);
  captures.set(c.url, c);
}
const subsitePrefixes = (inv.subsites || []).filter((s) => s.kind === 'subdirectory').map((s) => s.id);

const stripHash = (u) => {
  const x = new URL(u);
  x.hash = '';
  return x.href;
};

// ------------------------------------------------------------ asset index
const assetIndex = new Map();
for (const a of assets) {
  if (a.status !== 200) continue;
  const finalUrl = a.finalUrl || a.url;
  const { rel, renamed } = assetLocalPath(finalUrl, a.contentType);
  const redirected = stripHash(finalUrl) !== stripHash(a.url);
  assetIndex.set(stripHash(a.url), { url: a.url, rel, renamed: renamed || redirected, finalUrl, contentType: a.contentType, bytes: a.bytes, kinds: a.kinds });
  if (redirected && !assetIndex.has(stripHash(finalUrl))) {
    assetIndex.set(stripHash(finalUrl), { url: finalUrl, rel, renamed, finalUrl, contentType: a.contentType, bytes: a.bytes, kinds: a.kinds });
  }
}

function inSubsite(pathname) {
  return subsitePrefixes.some((p) => pathname.startsWith(p) || pathname === p.replace(/\/$/, ''));
}

function mapUrl(abs, { relative = false } = {}) {
  let u;
  try {
    u = new URL(abs);
  } catch {
    return null;
  }
  const asset = assetIndex.get(stripHash(u.href));
  if (relative) return asset && asset.renamed ? relToUrlPath(asset.rel) + u.hash : null;
  if (isSiteUrl(u)) {
    if (inSubsite(u.pathname)) return null; // separate site: keep live link (unless links to it are removed)
    if (asset && asset.renamed) return relToUrlPath(asset.rel) + u.hash;
    return u.pathname + u.search + u.hash || '/';
  }
  if (asset) return relToUrlPath(asset.rel) + u.hash;
  // A file on the site's second hostname that is missing on the live server too:
  // point at where it would be locally, so the copy never contacts the live server
  // (it stays broken, exactly as on the live site).
  if (isOriginAlias(u.hostname)) return relToUrlPath(assetLocalPath(u.href, '').rel) + u.hash;
  return null;
}

// ------------------------------------------------------------------ build
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const written = new Map(); // rel -> source url
const collisions = [];
function put(rel, data, sourceUrl) {
  if (written.has(rel) && written.get(rel) !== sourceUrl) collisions.push({ rel, first: written.get(rel), second: sourceUrl });
  written.set(rel, sourceUrl);
  writeFile(path.join(OUT, rel), data);
}

// 1. Assets
let assetCount = 0;
let assetBytes = 0;
const seenRel = new Set();
for (const [key, a] of assetIndex) {
  if (seenRel.has(a.rel)) continue;
  seenRel.add(a.rel);
  const cached = fetcher.readCache(a.finalUrl) || fetcher.readCache(key);
  if (!cached || cached.status !== 200) continue;
  let body = cached.body;
  const ct = a.contentType || '';
  const pathname = new URL(a.finalUrl).pathname;
  if (/css/.test(ct) || /\.css$/i.test(pathname)) {
    body = Buffer.from(transformCss(body.toString('utf8'), a.finalUrl, mapUrl), 'utf8');
  } else if (isSiteUrl(a.finalUrl) && (/javascript|json|manifest|svg|xml/.test(ct) || /\.(m?js|json|webmanifest|svg)$/i.test(pathname))) {
    body = Buffer.from(transformText(body.toString('utf8'), SITE_ORIGIN, mapUrl), 'utf8');
  }
  put(a.rel, body, a.finalUrl);
  assetCount++;
  assetBytes += body.length;
}

// 2. Pages (+ the raw HTML as delivered, for reference)
const pages = inv.rows.filter((r) => (r.type === 'page' && Number(r.http_status) === 200) || r.type === '404-page');

// Links into excluded sub-sites (the city sections) are removed from the copy
// when REMOVE_SUBSITE_LINKS is on; a sub-site URL inside a form value (e.g. the
// lead form's post-submit redirect) becomes the matching main-site page.
const pagePaths = new Set(pages.map((r) => new URL(r.url).pathname));
const isRemovedLink = REMOVE_SUBSITE_LINKS
  ? (abs) => {
      try {
        const u = new URL(abs);
        return isSiteUrl(u) && inSubsite(u.pathname);
      } catch {
        return false;
      }
    }
  : null;
function replaceRemovedUrl(abs) {
  const u = new URL(abs);
  const prefix = subsitePrefixes.find((p) => u.pathname.startsWith(p) || u.pathname === p.replace(/\/$/, '')) || '';
  const rest = '/' + u.pathname.slice(prefix.length).replace(/^\/+/, '');
  return SITE_ORIGIN + (pagePaths.has(rest) ? rest : '/');
}
const intentionalChanges = [];
const pageReports = [];
const formsSeen = new Map();
const trackersSeen = new Map();
const externalSeen = new Map();
let pagesFromRendered = 0;
for (const row of pages) {
  const is404 = row.type === '404-page';
  const rel = is404 ? '404.html' : pageLocalPath(row.url, 'text/html');
  const raw = fetcher.readCache(row.url);
  if (!raw) {
    pageReports.push({ url: row.url, rel, error: 'raw HTML missing from cache' });
    continue;
  }
  put(path.posix.join('_raw', rel), raw.body, row.url);
  const renderedPath = path.join(PATHS.work, 'rendered', rel);
  const wanted = overrides[row.url] || SOURCE;
  const useRendered = wanted === 'rendered' && fs.existsSync(renderedPath);
  const srcHtml = useRendered ? fs.readFileSync(renderedPath, 'utf8') : raw.body.toString('utf8');
  if (useRendered) pagesFromRendered++;
  const charset = /<meta[^>]+charset=["']?([\w-]+)/i.exec(srcHtml)?.[1];
  const transformed = transformHtml(srcHtml, { pageUrl: row.url, mapUrl, siteOrigin: SITE_ORIGIN, isRemovedLink, replaceRemovedUrl });
  const { report } = transformed;
  // Deliberate changes on top of the copy: the old map sections -> the animated US map,
  // and the homepage hero's background video -> HERO_VIDEO_ID.
  const custom = CUSTOM_US_MAP ? applyCustomizations(transformed.html, { pageUrl: row.url }) : { html: transformed.html, changes: [] };
  const hero = applyHeroVideo(custom.html, { videoId: HERO_VIDEO_ID });
  put(rel, hero.html, row.url);
  pageReports.push({ url: row.url, rel, source: useRendered ? 'rendered' : 'raw', rewrites: report.rewrites, trackersDisabled: report.disabledCount, charset });
  if (report.removedLinks || report.valueRewrites || custom.changes.length || hero.changes.length) {
    intentionalChanges.push({
      url: row.url,
      removedLinks: report.removedLinks,
      unwrappedLinks: report.unwrappedLinks,
      removedBlocks: report.removedBlocks,
      valueRewrites: report.valueRewrites,
      customSections: custom.changes,
      heroVideo: hero.changes,
    });
  }

  for (const t of report.trackers) {
    for (const name of t.names) {
      if (!trackersSeen.has(name)) trackersSeen.set(name, { ids: new Set(), pages: new Set(), tags: new Set() });
      const e = trackersSeen.get(name);
      t.ids.forEach((id) => e.ids.add(id));
      e.pages.add(row.url);
      e.tags.add(t.tag);
    }
  }
  // Forms: from the rendered DOM when we have it (JS-built forms included).
  const formDocHtml = fs.existsSync(renderedPath) ? fs.readFileSync(renderedPath, 'utf8') : srcHtml;
  const parsed = extractFromHtml(formDocHtml, row.url);
  for (const f of extractForms(parsed.doc)) {
    const key = `${f.plugin}|${f.action}|${f.method}|${f.fields.map((x) => x.name || x.type).join(',')}`;
    if (!formsSeen.has(key)) formsSeen.set(key, { ...f, pages: new Set() });
    formsSeen.get(key).pages.add(row.url);
  }
  for (const e of parsed.external) {
    const host = new URL(e.url).host;
    if (isLocalizableHost(host) && assetIndex.has(stripHash(e.url))) continue;
    const key = `${host}|${e.kind}`;
    if (!externalSeen.has(key)) externalSeen.set(key, { host, kind: e.kind, example: e.url, pages: new Set(), title: e.title || '' });
    externalSeen.get(key).pages.add(row.url);
  }
}

// The animated US map's stylesheet and script (custom/us-map/), linked from the pages above.
const mapPages = intentionalChanges.filter((c) => c.customSections?.length);
if (mapPages.length) {
  for (const [name, url] of Object.entries(US_MAP_FILES)) put(url.replace(/^\//, ''), fs.readFileSync(path.join(US_MAP_DIR, name)), `custom/us-map/${name}`);
}

// 3. Special files kept verbatim: robots.txt, sitemaps (+ XSL), feeds
const rewrites = [];
for (const row of inv.rows) {
  if (!['robots', 'sitemap', 'sitemap-stylesheet', 'feed', 'xml', 'file'].includes(row.type)) continue;
  if (Number(row.http_status) !== 200) continue;
  const res = fetcher.readCache(row.url);
  if (!res) continue;
  const u = new URL(row.url);
  const rel = row.type === 'robots' ? 'robots.txt' : pageLocalPath(row.url, res.contentType);
  if (!written.has(rel)) put(rel, res.body, row.url);
  const servedAt = '/' + rel;
  if (u.pathname !== servedAt && u.pathname.endsWith('/')) rewrites.push({ from: u.pathname, to: relToUrlPath(rel) });
}

// 4. Redirects
const redirectRows = new Map();
for (const r of inv.rows) {
  if (r.type === 'redirect' && r.redirect_target) redirectRows.set(r.url, { from: r.url, status: r.http_status, to: r.redirect_target, kind: 'page' });
}
for (const a of assets) {
  for (const hop of a.redirects || []) {
    if (hop.location && !redirectRows.has(hop.url)) redirectRows.set(hop.url, { from: hop.url, status: hop.status, to: hop.location, kind: 'asset' });
  }
}
for (const c of captures.values()) {
  for (const vp of Object.values(c.viewports || {})) {
    for (const r of vp.siteRequests || []) {
      if (r.status >= 300 && r.status < 400 && !redirectRows.has(r.url)) {
        const cached = fetcher.readCache(r.url);
        if (cached?.location) redirectRows.set(r.url, { from: r.url, status: r.status, to: cached.location, kind: `browser:${r.type}` });
      }
    }
  }
}
const redirectList = [...redirectRows.values()].sort((a, b) => a.from.localeCompare(b.from));
const serveSource = (p) => (p.replace(/\/+$/, '') || '/').replace(/[()[\]{}*+?:!]/g, '\\$&');
const netlify = [];
const serveRedirects = [];
for (const r of redirectList) {
  const f = new URL(r.from);
  const t = new URL(r.to, r.from);
  r.note = '';
  if (!isSiteUrl(f)) {
    r.note = 'source not on main site';
    continue;
  }
  const dest = isSiteUrl(t) ? t.pathname + t.search + t.hash : t.href;
  if (isSiteUrl(t) && t.pathname === f.pathname && t.search === f.search) {
    r.note = 'protocol/host-only redirect (not needed on a static host)';
    continue;
  }
  if (isSiteUrl(t) && t.search === f.search && t.pathname.replace(/\/$/, '') === f.pathname.replace(/\/$/, '')) {
    r.note = 'trailing-slash redirect (static hosts handle this themselves)';
    continue;
  }
  if (f.search) {
    r.note = 'query-string source: not expressible in _redirects';
    continue;
  }
  const status = [301, 302, 303, 307, 308].includes(Number(r.status)) ? Number(r.status) : 301;
  netlify.push(`${f.pathname}  ${dest}  ${status}`);
  // serve matches against the request path with any trailing slash removed.
  serveRedirects.push({ source: serveSource(f.pathname), destination: dest, type: status });
  r.note = 'in site/_redirects';
}
writeFile(path.join(PATHS.docs, 'redirects.csv'), toCsv(['from', 'status', 'to', 'kind', 'note'], redirectList));
const redirectsFile = [
  '# Netlify / Cloudflare Pages redirect rules — generated by scripts/03-build.mjs from the redirects',
  '# observed while capturing the live site (see docs/redirects.csv for every hop, including ones that',
  '# a static host does not need, like http->https or trailing-slash redirects).',
  ...netlify,
  ...rewrites.map((r) => `${r.from}  ${r.to}  200`),
  '',
].join('\n');
writeFile(path.join(OUT, '_redirects'), redirectsFile);
writeFile(
  path.join(OUT, '_headers'),
  ['# Netlify / Cloudflare Pages headers', '/_raw/*', '  Content-Type: text/plain; charset=utf-8', '  X-Robots-Tag: noindex', ''].join('\n'),
);
writeJson(path.join(OUT, 'serve.json'), {
  redirects: serveRedirects,
  rewrites: rewrites.map((r) => ({ source: serveSource(r.from), destination: r.to })),
  headers: [
    {
      source: '_raw/**',
      headers: [
        { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        { key: 'X-Robots-Tag', value: 'noindex' },
      ],
    },
  ],
});
writeFile(path.join(OUT, '.nojekyll'), '');

// Vercel reads neither _redirects/_headers nor serve.json, so write vercel.json
// next to site/ (the repo root): a Git-connected Vercel project then serves the
// folder as plain static files — no install, no build — with the same rules.
const vercelSource = (p) => p.replace(/[()[\]{}*+?:!]/g, '\\$&');
const vercelRedirects = redirectList
  .filter((r) => r.note === 'in site/_redirects')
  .map((r) => {
    const f = new URL(r.from);
    const t = new URL(r.to, r.from);
    const status = [301, 302, 303, 307, 308].includes(Number(r.status)) ? Number(r.status) : 301;
    return { from: f.pathname, destination: isSiteUrl(t) ? t.pathname + t.search + t.hash : t.href, statusCode: status };
  });
const rawHeaders = [
  { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
  { key: 'X-Robots-Tag', value: 'noindex' },
];
const vercel = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  framework: null,
  installCommand: '',
  buildCommand: "echo 'Static copy of the site: nothing to build'",
  outputDirectory: path.basename(OUT),
  trailingSlash: true,
  rewrites: rewrites.map((r) => ({ source: vercelSource(r.from), destination: r.to })),
  headers: [{ source: '/_raw/(.*)', headers: rawHeaders }],
};
// Every redirect/rewrite/header rule counts toward Vercel's 2,048 routes per
// deployment; past that, redirects go to a bulk-redirects file instead.
if (vercelRedirects.length <= 2000 - vercel.rewrites.length - vercel.headers.length) {
  vercel.redirects = vercelRedirects.map((r) => ({ source: vercelSource(r.from), destination: r.destination, statusCode: r.statusCode }));
} else {
  const bulk = vercelRedirects.map((r) => ({ source: r.from, destination: r.destination, permanent: r.statusCode === 301 || r.statusCode === 308 }));
  writeJson(path.join(path.dirname(OUT), 'vercel-redirects.json'), bulk);
  vercel.bulkRedirectsPath = 'vercel-redirects.json';
}
writeJson(path.join(path.dirname(OUT), 'vercel.json'), vercel);

// ------------------------------------------------------------------ docs
const docs = PATHS.docs;
const pagesList = (set, max = 8) => {
  const arr = [...set].map((u) => new URL(u).pathname);
  return arr.slice(0, max).join(', ') + (arr.length > max ? ` … (+${arr.length - max})` : '');
};

// asset manifest
const manifestRows = assets.map((a) => {
  const idx = assetIndex.get(stripHash(a.url));
  return {
    url: a.url,
    local_path: idx ? `site/${idx.rel}` : '',
    http_status: a.status || a.blocked || a.error,
    content_type: a.contentType,
    bytes: a.bytes,
    discovered_via: (a.kinds || []).slice(0, 3).join(' '),
  };
});
writeFile(path.join(docs, 'asset-manifest.csv'), toCsv(['url', 'local_path', 'http_status', 'content_type', 'bytes', 'discovered_via'], manifestRows));

// external dependencies
const liveRequests = new Map(); // host -> { types, pages, example, failed }
const blockedByReason = new Map();
const jsErrors = [];
for (const c of captures.values()) {
  for (const vp of Object.values(c.viewports || {})) {
    for (const e of vp.external || []) {
      if (!liveRequests.has(e.host)) liveRequests.set(e.host, { types: new Set(), pages: new Set(), example: e.url, failed: 0 });
      const x = liveRequests.get(e.host);
      x.types.add(e.type);
      x.pages.add(c.url);
    }
    for (const f of vp.failed || []) {
      try {
        const h = new URL(f.url).host;
        if (liveRequests.has(h)) liveRequests.get(h).failed++;
      } catch {}
    }
    for (const b of vp.blocked || []) {
      const reason = b.reason.replace(/\s.*$/, '') === 'tracking:' ? b.reason : b.reason.split(' ')[0];
      if (!blockedByReason.has(reason)) blockedByReason.set(reason, { count: 0, examples: new Set() });
      const x = blockedByReason.get(reason);
      x.count++;
      if (x.examples.size < 3) x.examples.add(b.url);
    }
    for (const err of vp.jsErrors || []) jsErrors.push({ url: c.url, viewport: vp.viewport, error: err });
  }
}
const localizedHosts = new Map();
for (const a of assets) {
  if (a.status !== 200 || isSiteUrl(a.url)) continue;
  const h = new URL(a.url).host;
  if (!localizedHosts.has(h)) localizedHosts.set(h, { files: 0, bytes: 0 });
  localizedHosts.get(h).files++;
  localizedHosts.get(h).bytes += a.bytes;
}
const extMd = [
  '# External dependencies',
  '',
  'Everything the live pages load from hosts other than the main site, and what the offline copy does with it.',
  'Generated by `scripts/03-build.mjs` from the capture records.',
  '',
  '## Downloaded into the copy (`site/_external/<host>/…`)',
  '',
  'Static files (fonts, font CSS, CDN libraries) that are safe to self-host. References were rewritten to the local files.',
  '',
  localizedHosts.size
    ? mdTable(['Host', 'Files', 'Size'], [...localizedHosts].map(([h, v]) => [h, v.files, fmtBytes(v.bytes)]))
    : '_None._',
  '',
  '## Left pointing at their live sources',
  '',
  'Third-party embeds and widgets referenced in the HTML (iframes, widget scripts, stylesheets). These still load from the internet when you view the copy; offline they simply do not appear.',
  '',
  externalSeen.size
    ? mdTable(
        ['Host', 'Kind', 'Pages', 'Example'],
        [...externalSeen.values()].sort((a, b) => b.pages.size - a.pages.size).map((e) => [e.host, e.kind, e.pages.size, e.example.slice(0, 120)]),
      )
    : '_None found in the HTML._',
  '',
  '### Every third-party host the browser contacted while rendering the live pages',
  '',
  '(Includes hosts loaded indirectly by the embeds above. Analytics/tracking hosts are not listed here because they were blocked; see `tracking.md`.)',
  '',
  liveRequests.size
    ? mdTable(
        ['Host', 'Resource types', 'Pages', 'Failed during capture', 'Example'],
        [...liveRequests].sort((a, b) => b[1].pages.size - a[1].pages.size).map(([h, v]) => [h, [...v.types].join(', '), v.pages.size, v.failed, v.example.slice(0, 100)]),
      )
    : '_None._',
  '',
].join('\n');
writeFile(path.join(docs, 'external-dependencies.md'), extMd);

// tracking
const trackingMd = [
  '# Tracking & analytics',
  '',
  'All analytics, advertising-pixel and call-tracking code found on the live pages. In the copy each snippet is',
  'commented out in place, behind a `<!-- TRACKING DISABLED (name: IDs) -->` marker, so viewing or testing the copy',
  'never reports visits. Where a `<script>` was disabled, a one-line no-op stub (`window.gtag = function(){}` etc.)',
  'is added once per page so other site code that calls these functions does not throw errors. It sends nothing.',
  '',
  'During the capture itself every request to these services was also blocked at the network level, so the crawl',
  'did not register visits either (and tools normally injected by Tag Manager were never loaded).',
  '',
  trackersSeen.size
    ? mdTable(
        ['Service', 'IDs found', 'Pages', 'Disabled elements'],
        [...trackersSeen].map(([name, v]) => [name, [...v.ids].join(', ') || '(none visible)', v.pages.size, [...v.tags].map((t) => `<${t}>`).join(' ')]),
      )
    : '_No tracking snippets found in the page HTML._',
  '',
  '## Requests blocked during capture',
  '',
  blockedByReason.size
    ? mdTable(['Reason', 'Requests', 'Examples'], [...blockedByReason].sort((a, b) => b[1].count - a[1].count).map(([r, v]) => [r, v.count, [...v.examples].map((u) => u.slice(0, 90)).join(' · ')]))
    : '_None._',
  '',
  'To re-enable tracking in a deployed copy, restore the commented-out blocks (search for `TRACKING DISABLED`).',
  '',
].join('\n');
writeFile(path.join(docs, 'tracking.md'), trackingMd);

// forms
const FORM_EMBED_HOSTS = /jotform|typeform|hsforms|hubspot|leadconnectorhq|msgsndr|gohighlevel|docs\.google\.com\/forms|cognitoforms|formstack|wufoo|paperform|tally\.so|123formbuilder|formsite/i;
const embeddedForms = [...externalSeen.values()].filter((e) => FORM_EMBED_HOSTS.test(e.host + ' ' + e.example));
const formsList = [...formsSeen.values()].sort((a, b) => b.pages.size - a.pages.size);
const formsMd = [
  '# Forms',
  '',
  'Forms cannot submit on a static copy: there is no server behind it to receive the data. Their markup is kept as',
  'captured; the only change is that URLs pointing at the main site (form `action`s and the AJAX endpoints in page',
  'scripts, e.g. `/wp-admin/admin-ajax.php`) are root-relative like every other link, so a test submission on the',
  'copy goes to the static host (and fails harmlessly) instead of reaching the live site. The original action URL is',
  'listed below. Actions that point at a third-party service were left untouched — **submitting those from the copy',
  'would reach that service for real.**',
  '',
  `Unique forms found: **${formsList.length}** (identical forms on several pages are listed once).`,
  '',
];
formsList.forEach((f, i) => {
  const actionAbs = f.action ? new URL(f.action, [...f.pages][0]).href : '(none — submits to the current page / via JavaScript)';
  const thirdParty = f.action && !isSiteUrl(actionAbs);
  formsMd.push(
    `## ${i + 1}. ${f.plugin}${f.id ? ` — \`#${f.id}\`` : ''}`,
    '',
    `- **Action:** \`${actionAbs}\`${thirdParty ? ' ⚠️ third-party endpoint, left live' : ''}`,
    `- **Method:** ${f.method.toUpperCase()}${f.enctype ? ` (${f.enctype})` : ''}`,
    `- **Appears on ${f.pages.size} page(s):** ${pagesList(f.pages)}`,
    '',
    f.fields.length
      ? mdTable(['Field name', 'Type', 'Label / placeholder', 'Required'], f.fields.map((x) => [x.name || '(none)', x.type, x.label, x.required ? 'yes' : '']))
      : '_No fields._',
    '',
  );
});
if (embeddedForms.length) {
  formsMd.push('## Embedded third-party forms (iframes / scripts)', '', mdTable(['Host', 'Kind', 'Pages', 'Example'], embeddedForms.map((e) => [e.host, e.kind, e.pages.size, e.example.slice(0, 120)])), '');
}
formsMd.push(
  '## Making forms work on a static host',
  '',
  '- **Netlify Forms:** add `data-netlify="true"` (and a `name`) to a `<form>`; Netlify captures submissions.',
  '- **Formspree / Basin / Getform:** point the form `action` at the service endpoint.',
  '- **Cloudflare Pages:** handle the POST with a Pages Function.',
  '',
);
writeFile(path.join(docs, 'forms.md'), formsMd.join('\n'));

// build report (used by verification + final report)
const totalSiteBytes = listFiles(OUT).reduce((s, f) => s + fs.statSync(f).size, 0);
writeJson(path.join(PATHS.work, 'build-report.json'), {
  builtAt: new Date().toISOString(),
  source: SOURCE,
  pages: pageReports,
  pagesFromRendered,
  assetFiles: assetCount,
  assetBytes,
  siteBytes: totalSiteBytes,
  collisions,
  redirects: { total: redirectList.length, inNetlifyFile: netlify.length },
  trackers: [...trackersSeen].map(([n, v]) => ({ name: n, ids: [...v.ids], pages: v.pages.size })),
  forms: formsList.length,
  jsErrorsLive: jsErrors.length,
  intentionalChanges,
});
writeJson(path.join(PATHS.work, 'live-js-errors.json'), jsErrors);

console.log(`Built ${OUT}`);
console.log(`  pages: ${pageReports.length} (${pagesFromRendered} from rendered DOM, ${pageReports.length - pagesFromRendered} from raw HTML)`);
console.log(`  asset files: ${assetCount} (${fmtBytes(assetBytes)}); site total ${fmtBytes(totalSiteBytes)}`);
console.log(`  redirects: ${redirectList.length} observed, ${netlify.length} written to site/_redirects`);
console.log(`  tracking services disabled: ${[...trackersSeen.keys()].join(', ') || 'none'}`);
console.log(`  forms: ${formsList.length} unique; external hosts referenced: ${new Set([...externalSeen.values()].map((e) => e.host)).size}`);
if (REMOVE_SUBSITE_LINKS) {
  const edited = intentionalChanges.filter((c) => c.removedLinks);
  console.log(
    `  sub-site links removed: ${edited.reduce((n, c) => n + c.removedLinks, 0)} on ${edited.length} page(s) ` +
      `(${edited.reduce((n, c) => n + c.unwrappedLinks, 0)} unwrapped in text); ` +
      `form values redirected to main-site pages: ${intentionalChanges.reduce((n, c) => n + c.valueRewrites, 0)}`,
  );
}
if (CUSTOM_US_MAP) {
  console.log(`  animated US map: ${mapPages.length} page(s) — ${mapPages.map((c) => new URL(c.url).pathname).join(', ') || 'no map sections found'}`);
}
if (HERO_VIDEO_ID) {
  const heroPages = intentionalChanges.filter((c) => c.heroVideo?.length);
  console.log(`  hero background video ${HERO_VIDEO_ID}: ${heroPages.map((c) => new URL(c.url).pathname).join(', ') || 'no hero video found'}`);
}
if (collisions.length) console.log(`  WARNING: ${collisions.length} local path collisions (see .work/build-report.json)`);
