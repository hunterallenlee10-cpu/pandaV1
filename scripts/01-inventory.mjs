#!/usr/bin/env node
// Phase 1 — find every page of the main site.
//   1. robots.txt + every sitemap it lists (recursively)
//   2. polite link crawl from the homepage (and from every sitemap URL)
//   3. special files: 404 page, favicons, web manifest, RSS feed
// Writes docs/url-inventory.csv, docs/url-exclusions.csv and .work/inventory.json.
import zlib from 'node:zlib';
import path from 'node:path';
import { SITE_ORIGIN, SITE_HOST, PATHS, isSiteUrl, isSiteHost, isForbidden, isSitemapOnlyExcluded, SITEMAP_ONLY_EXCLUDE } from './lib/config.mjs';
import { fetcher, ACCEPT } from './lib/fetcher.mjs';
import { extractFromHtml, resolveUrl } from './lib/extract.mjs';
import { ASSET_EXT_RE } from './lib/paths.mjs';
import { writeJson, writeFile, toCsv, args } from './lib/util.mjs';

const opts = args();
const MAX_PAGES = Number(opts['max-pages'] || 5000);
const NOT_FOUND_PROBE = '/pandav1-capture-404-check/';

const rows = new Map(); // url -> row
const excluded = new Map(); // url -> { url, reason, foundOn }
const sitemapUrls = new Set();
const sitemapFiles = [];
const sitemapImages = new Set();
const crawlFound = new Set();
const subsiteHosts = new Map(); // host -> first page it was linked from
const subsitePrefixes = new Map(); // "/es/" -> evidence
const pageInfo = new Map();

function norm(u) {
  const url = new URL(u);
  url.hash = '';
  if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) url.port = '';
  return url.href;
}

function exclude(url, reason, foundOn = '') {
  if (!excluded.has(url)) excluded.set(url, { url, reason, foundOn });
}

function upsert(url, fields) {
  const row = rows.get(url) || { url, source: '', http_status: '', redirect_target: '', type: '', content_type: '', title: '' };
  Object.assign(row, fields);
  rows.set(url, row);
  return row;
}

function addSource(row, src) {
  const set = new Set(row.source ? row.source.split('+') : []);
  set.add(src);
  row.source = ['sitemap', 'crawl', 'special'].filter((s) => set.has(s)).join('+');
}

function subsitePrefixFor(url) {
  const p = new URL(url).pathname;
  for (const prefix of subsitePrefixes.keys()) if (p.startsWith(prefix)) return prefix;
  return null;
}

function isHtml(ct) {
  return /html/.test(ct || '');
}

// ---------------------------------------------------------------- sitemaps
function decodeXml(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim();
}

async function readSitemap(url, depth = 0) {
  if (sitemapFiles.some((s) => s.url === url) || depth > 5) return;
  const { final, chain } = await fetcher.getFollow(url, { accept: 'application/xml,text/xml,*/*' });
  const entry = { url, status: final.status, finalUrl: final.url, children: 0, urls: 0 };
  sitemapFiles.push(entry);
  recordChain(chain, 'special');
  if (final.status !== 200) return;
  upsert(final.url, { type: 'sitemap', content_type: final.contentType });
  let body = final.body;
  if (/\.gz$/i.test(new URL(final.url).pathname) || final.contentType === 'application/x-gzip') {
    try {
      body = zlib.gunzipSync(body);
    } catch {
      /* not actually gzipped */
    }
  }
  const xml = body.toString('utf8');
  const xsl = /<\?xml-stylesheet[^>]*href=["']([^"']+)["']/i.exec(xml);
  if (xsl) entry.xsl = resolveUrl(decodeXml(xsl[1]), final.url);
  if (/<sitemapindex[\s>]/i.test(xml)) {
    for (const m of xml.matchAll(/<sitemap>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/sitemap>/gi)) {
      const child = resolveUrl(decodeXml(m[1]), final.url);
      if (!child) continue;
      entry.children++;
      if (isSiteUrl(child)) await readSitemap(norm(child), depth + 1);
      else exclude(child, 'sitemap on another host', url);
    }
  }
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
    const loc = /<loc>([\s\S]*?)<\/loc>/i.exec(m[1]);
    if (loc) {
      const u = resolveUrl(decodeXml(loc[1]), final.url);
      if (u) {
        entry.urls++;
        sitemapUrls.add(norm(u));
      }
    }
    for (const im of m[1].matchAll(/<image:loc>([\s\S]*?)<\/image:loc>/gi)) {
      const iu = resolveUrl(decodeXml(im[1]), final.url);
      if (iu) sitemapImages.add(iu);
    }
  }
}

// Record each hop of a redirect chain as its own inventory row.
function recordChain(chain, source) {
  for (const hop of chain) {
    if (!isSiteUrl(hop.url)) continue;
    const row = upsert(hop.url, { http_status: hop.status, redirect_target: hop.location || '' });
    if (hop.location) row.type = 'redirect';
    addSource(row, source);
  }
}

// ------------------------------------------------------------------- crawl
const queue = [];
const queued = new Set();

function enqueue(url, source, foundOn = '') {
  let u;
  try {
    u = new URL(url);
  } catch {
    return;
  }
  if (!/^https?:$/.test(u.protocol)) return;
  const host = u.hostname.toLowerCase();
  if (!isSiteUrl(u)) {
    if (host.endsWith(`.${SITE_HOST}`) && !isSiteHost(host) && !subsiteHosts.has(host)) subsiteHosts.set(host, foundOn || source);
    return;
  }
  const n = norm(url);
  if (source === 'crawl') crawlFound.add(n);
  if (queued.has(n)) return;
  if (isForbidden(u)) return exclude(n, 'admin/login/API/back-end URL (never requested)', foundOn);
  const prefix = subsitePrefixFor(n);
  if (prefix) return exclude(n, `part of separate sub-site ${prefix}`, foundOn);
  if (u.search && !/^\?p=\d+$/.test(u.search)) return exclude(n, 'query-string variant (not representable as a static file)', foundOn);
  if (/\/feed\/?$|\/feed\/(rss2?|atom|rdf)\/?$/i.test(u.pathname) && !['/feed/', '/comments/feed/'].includes(u.pathname)) {
    return exclude(n, 'per-post/category feed (only the site-wide feeds are kept)', foundOn);
  }
  if (ASSET_EXT_RE.test(u.pathname) && !/\.(html?|xml|txt)$/i.test(u.pathname)) {
    // Linked documents (PDFs etc.) are files, not pages - fetched as type=document.
    queued.add(n);
    queue.push({ url: n, source, foundOn, document: true });
    return;
  }
  if (queued.size >= MAX_PAGES) return exclude(n, `over --max-pages=${MAX_PAGES}`, foundOn);
  queued.add(n);
  queue.push({ url: n, source, foundOn });
}

async function visit(item) {
  const { url, source, foundOn } = item;
  await fetcher.loadRobots();
  const u = new URL(url);
  if (!fetcher.robots.isAllowed(u.pathname + u.search)) {
    exclude(url, `disallowed by robots.txt (${fetcher.robots.matchingRule(u.pathname + u.search)})`, foundOn);
    return;
  }
  const res = await fetcher.get(url, { accept: item.document ? ACCEPT.any : ACCEPT.document });
  if (res.blocked) {
    exclude(url, `blocked: ${res.blocked}`, foundOn);
    return;
  }
  const row = upsert(url, {
    http_status: res.status || `error: ${res.error || 'unknown'}`,
    redirect_target: res.location || '',
    content_type: res.contentType || '',
  });
  addSource(row, source);
  if (sitemapUrls.has(url)) addSource(row, 'sitemap');
  if (crawlFound.has(url)) addSource(row, 'crawl');
  if (res.status >= 300 && res.status < 400) {
    row.type = 'redirect';
    if (res.location) enqueue(res.location, 'crawl', url);
    return;
  }
  if (item.document) {
    row.type = res.status === 200 ? 'document' : 'error';
    return;
  }
  if (res.status !== 200) {
    row.type = 'error';
    return;
  }
  if (!isHtml(res.contentType)) {
    row.type = /rss|atom/.test(res.contentType) || /\/feed\/$/.test(u.pathname) ? 'feed' : /xml/.test(res.contentType) ? 'xml' : 'file';
    return;
  }
  row.type = 'page';
  const html = res.body.toString('utf8');
  const { links, info, assets } = extractFromHtml(html, url);
  row.title = info.title;
  // Documents linked for download (PDFs etc.) are listed as type=document.
  for (const [u, kinds] of assets) if (kinds.has('download')) enqueue(u, 'crawl', url);
  pageInfo.set(url, info);

  // Separate WordPress install (multisite sub-site) living in a subdirectory?
  if (info.apiBase && isSiteUrl(info.apiBase)) {
    const apiPath = new URL(info.apiBase).pathname.replace(/wp-json\/?$/, '');
    if (apiPath !== '/' && apiPath.startsWith('/') && !subsitePrefixes.has(apiPath)) {
      subsitePrefixes.set(apiPath, { evidence: `REST API root ${info.apiBase}`, example: url });
    }
  }
  for (const link of links) enqueue(link, 'crawl', url);
}

async function crawl() {
  let active = 0;
  await new Promise((resolve) => {
    const pump = () => {
      while (active < 4 && queue.length) {
        const item = queue.shift();
        const prefix = subsitePrefixFor(item.url);
        if (prefix) {
          exclude(item.url, `part of separate sub-site ${prefix}`, item.foundOn);
          continue;
        }
        active++;
        visit(item)
          .catch((e) => exclude(item.url, `crawl error: ${e.message}`, item.foundOn))
          .finally(() => {
            active--;
            if (rows.size % 25 === 0) process.stdout.write(`  … ${rows.size} URLs checked, ${queue.length} queued\n`);
            pump();
          });
      }
      if (!active && !queue.length) resolve();
    };
    pump();
  });
}

// ------------------------------------------------------------ special files
async function special(url, type) {
  if (!url || !isSiteUrl(url)) return null;
  const n = norm(url);
  const { final, chain } = await fetcher.getFollow(n, { accept: ACCEPT.any });
  recordChain(chain, 'special');
  if (final.blocked) return exclude(n, `blocked: ${final.blocked}`), null;
  const row = upsert(norm(final.url), { http_status: final.status, content_type: final.contentType || '' });
  addSource(row, 'special');
  if (!row.type || row.type === 'redirect') row.type = type;
  return final;
}

function stripVolatile(html) {
  return html
    .replace(/nonce["']?\s*[:=]\s*["'][^"']*["']/gi, '')
    .replace(/\b\d{6,}\b/g, '')
    .replace(/\s+/g, '');
}

// -------------------------------------------------------------------- main
async function main() {
  console.log(`Phase 1 inventory for ${SITE_ORIGIN}`);
  await fetcher.loadRobots();
  upsert(`${SITE_ORIGIN}/robots.txt`, { http_status: fetcher.robotsStatus, type: 'robots', content_type: 'text/plain' });
  addSource(rows.get(`${SITE_ORIGIN}/robots.txt`), 'special');
  console.log(`robots.txt: HTTP ${fetcher.robotsStatus}; ${fetcher.robots.sitemaps.length} Sitemap line(s); crawl-delay ${fetcher.robots.crawlDelay ?? 'none'}`);

  // Homepage (follow any apex/www or http/https redirect).
  const home = await fetcher.getFollow(`${SITE_ORIGIN}/`, { accept: ACCEPT.document });
  recordChain(home.chain, 'crawl');
  const homeUrl = norm(home.final.url);
  console.log(`homepage: ${homeUrl} (HTTP ${home.final.status})`);
  if (home.final.status !== 200) {
    console.error(`Homepage did not return 200 (got ${home.final.status}${home.final.error ? ' ' + home.final.error : ''}). Aborting.`);
    process.exitCode = 1;
  }

  // 1. Sitemaps
  const listed = fetcher.robots.sitemaps.map((s) => resolveUrl(s, SITE_ORIGIN + '/')).filter(Boolean);
  const candidates = listed.length ? listed : [`${SITE_ORIGIN}/sitemap_index.xml`, `${SITE_ORIGIN}/sitemap.xml`, `${SITE_ORIGIN}/wp-sitemap.xml`];
  for (const sm of candidates) {
    if (isSiteUrl(sm)) await readSitemap(norm(sm));
    else exclude(sm, 'sitemap on another host', 'robots.txt');
  }
  if (!listed.length || !sitemapFiles.some((s) => s.status === 200)) {
    for (const sm of [`${SITE_ORIGIN}/sitemap_index.xml`, `${SITE_ORIGIN}/sitemap.xml`]) await readSitemap(norm(sm));
  }
  for (const s of sitemapFiles) if (s.xsl) await special(s.xsl, 'sitemap-stylesheet');
  console.log(`sitemaps: ${sitemapFiles.filter((s) => s.status === 200).length} read, ${sitemapUrls.size} URLs, ${sitemapImages.size} image entries`);

  // 2. Crawl: homepage first, then everything the sitemaps listed.
  enqueue(homeUrl, 'crawl', '(start)');
  // Sections in SITEMAP_ONLY_EXCLUDE are not taken from the sitemap: they are
  // captured only if a crawled page links to them.
  for (const u of sitemapUrls) if (!isSitemapOnlyExcluded(u)) enqueue(u, 'sitemap', '(sitemap)');
  await crawl();
  let sitemapOnly = 0;
  for (const u of sitemapUrls) {
    if (isSitemapOnlyExcluded(u) && !rows.has(u)) {
      exclude(u, `listed only in the sitemap, not linked from any page (${SITEMAP_ONLY_EXCLUDE.join(', ')})`, '(sitemap)');
      sitemapOnly++;
    }
  }
  if (sitemapOnly) console.log(`sitemap-only URLs left out (not linked from any page): ${sitemapOnly}`);

  // 3. Special files
  const homeInfo = pageInfo.get(homeUrl);
  const homeHtml = home.final.status === 200 ? home.final.body.toString('utf8') : '';
  const homeParsed = homeHtml ? extractFromHtml(homeHtml, homeUrl) : null;
  const iconUrls = new Set([`${SITE_ORIGIN}/favicon.ico`]);
  let manifestUrl = null;
  if (homeParsed) {
    for (const [u, kinds] of homeParsed.assets) {
      const k = [...kinds].join(' ');
      if (/rel=(shortcut )?icon|apple-touch-icon|mask-icon|msapplication/.test(k)) iconUrls.add(u);
      if (/rel=manifest/.test(k)) manifestUrl = u;
    }
  }
  for (const u of iconUrls) await special(u, 'icon');
  const manifests = new Set([manifestUrl, `${SITE_ORIGIN}/site.webmanifest`].filter(Boolean));
  for (const m of manifests) {
    const res = await special(m, 'manifest');
    if (res?.status === 200) {
      try {
        const json = JSON.parse(res.body.toString('utf8'));
        for (const icon of json.icons || []) await special(resolveUrl(icon.src, res.url), 'icon');
      } catch {
        /* not JSON */
      }
    }
  }
  const feeds = new Set([`${SITE_ORIGIN}/feed/`, ...(homeParsed ? [...homeParsed.feeds].filter((f) => /^\/(comments\/)?feed\/?$/.test(new URL(f).pathname)) : [])]);
  for (const f of feeds) await special(f, 'feed');
  const nf = await special(`${SITE_ORIGIN}${NOT_FOUND_PROBE}`, '404-page');
  if (nf) {
    const row = rows.get(norm(nf.url));
    if (row) row.type = '404-page';
  }

  // Does the server send different HTML to phones? (1 extra request)
  let variesByUa = null;
  if (home.final.status === 200) {
    const mobile = await fetcher.getFollow(homeUrl, { variant: 'mobile', accept: ACCEPT.document });
    if (mobile.final.status === 200) {
      const a = stripVolatile(homeHtml);
      const b = stripVolatile(mobile.final.body.toString('utf8'));
      variesByUa = a !== b;
      if (variesByUa) console.log(`NOTE: homepage HTML differs for a mobile user agent (${a.length} vs ${b.length} chars normalised).`);
    }
  }

  // Sub-sites in subdirectories detected mid-crawl: drop any rows under them.
  for (const [url, row] of rows) {
    const prefix = subsitePrefixFor(url);
    if (prefix && row.type !== 'redirect') {
      exclude(url, `part of separate sub-site ${prefix}`, '');
      rows.delete(url);
    }
  }

  // --------------------------------------------------------------- outputs
  const order = ['page', '404-page', 'redirect', 'error', 'feed', 'document', 'sitemap', 'sitemap-stylesheet', 'robots', 'manifest', 'icon', 'xml', 'file'];
  const list = [...rows.values()].sort((a, b) => (order.indexOf(a.type) - order.indexOf(b.type)) || a.url.localeCompare(b.url));
  writeFile(
    path.join(PATHS.docs, 'url-inventory.csv'),
    toCsv(['url', 'source', 'http_status', 'redirect_target', 'type', 'content_type', 'title'], list),
  );
  const ex = [...excluded.values()].sort((a, b) => a.reason.localeCompare(b.reason) || a.url.localeCompare(b.url));
  writeFile(path.join(PATHS.docs, 'url-exclusions.csv'), toCsv(['url', 'reason', 'foundOn'], ex));

  const subsites = [
    ...[...subsiteHosts].map(([host, foundOn]) => ({ kind: 'subdomain', id: host, evidence: `linked from ${foundOn}` })),
    ...[...subsitePrefixes].map(([prefix, v]) => ({ kind: 'subdirectory', id: prefix, evidence: v.evidence, example: v.example })),
  ];
  writeJson(path.join(PATHS.work, 'inventory.json'), {
    generatedAt: new Date().toISOString(),
    origin: SITE_ORIGIN,
    homeUrl,
    robots: { status: fetcher.robotsStatus, sitemaps: fetcher.robots.sitemaps, crawlDelay: fetcher.robots.crawlDelay },
    sitemaps: sitemapFiles,
    sitemapImages: [...sitemapImages],
    variesByUa,
    homeInfo: homeInfo || null,
    subsites,
    rows: list,
    excluded: ex,
    fetchStats: { ...fetcher.stats, peakSiteConcurrency: fetcher.peakSiteConcurrency },
  });

  // ----------------------------------------------------------------- report
  const count = (pred) => list.filter(pred).length;
  const byType = {};
  for (const r of list) byType[r.type || 'unknown'] = (byType[r.type || 'unknown'] || 0) + 1;
  console.log('\n=== Phase 1 totals ===');
  console.log(`URLs in inventory: ${list.length}`);
  console.log(`  by type: ${Object.entries(byType).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`  pages (HTTP 200 HTML): ${count((r) => r.type === 'page')}`);
  console.log(`    from sitemap only: ${count((r) => r.type === 'page' && r.source === 'sitemap')}, crawl only: ${count((r) => r.type === 'page' && r.source === 'crawl')}, both: ${count((r) => r.type === 'page' && r.source === 'sitemap+crawl')}`);
  const notInSitemap = list.filter((r) => r.type === 'page' && !r.source.includes('sitemap'));
  console.log(`  pages the sitemaps missed: ${notInSitemap.length}`);
  console.log(`  redirects: ${count((r) => r.type === 'redirect')}, errors: ${count((r) => r.type === 'error')}`);
  console.log(`Excluded URLs: ${ex.length} (see docs/url-exclusions.csv)`);
  const reasons = {};
  for (const e of ex) reasons[e.reason.replace(/\(.*\)$/, '').trim()] = (reasons[e.reason.replace(/\(.*\)$/, '').trim()] || 0) + 1;
  for (const [k, v] of Object.entries(reasons)) console.log(`  ${v} × ${k}`);
  console.log(`Sub-sites excluded: ${subsites.length ? subsites.map((s) => `${s.id} (${s.kind})`).join(', ') : 'none found'}`);
  console.log(`Server varies HTML by user agent: ${variesByUa}`);
  console.log(`Network requests: ${fetcher.stats.network} (cache hits ${fetcher.stats.cacheHits}), peak concurrency ${fetcher.peakSiteConcurrency}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
