#!/usr/bin/env node
// Phase 2 — capture every page in a real browser, then download every asset.
//
// For each page and each viewport (desktop 1440 / mobile 390) Chromium loads
// the page. EVERY request it makes is intercepted:
//   * non-GET requests                      -> aborted (nothing is ever sent to the site)
//   * analytics / ads / call tracking       -> aborted (no fake visits recorded)
//   * main site + localizable static CDNs   -> fetched through the shared polite
//                                              fetcher (≤2 concurrent, delay, robots.txt,
//                                              disk cache) and handed to the browser
//   * other third parties (maps, video…)    -> loaded live, recorded as external deps
// Then: slow scroll to the bottom, wait for network quiet, back to top, save the
// rendered HTML (desktop), full-page screenshots (both), and every URL the DOM
// refers to. Finally all discovered assets (srcset variants, data-src, CSS url()
// recursively, fonts, OG images, …) are downloaded.
import fs from 'node:fs';
import path from 'node:path';
import { PATHS, VIEWPORTS, isSiteUrl, isLocalizableHost, trackerFor, isForbidden } from './lib/config.mjs';
import { fetcher, ACCEPT } from './lib/fetcher.mjs';
import { launchBrowser, newContext, visit, prepareForScreenshot, screenshot, collectDomUrls } from './lib/browser.mjs';
import { extractFromHtml, cssRefs, siteUrlsInText, resolveUrl, looksLikeAsset } from './lib/extract.mjs';
import { pageLocalPath, slugForUrl } from './lib/paths.mjs';
import { readJson, writeJson, writeFile, args, pool, fmtBytes } from './lib/util.mjs';

const opts = args();
const PARALLEL = Number(opts.parallel || 2);
const ONLY = opts.only ? String(opts.only).split(',') : null;
const FORCE = Boolean(opts.force);
const SKIP_PAGES = Boolean(opts['assets-only']);

const inv = readJson(path.join(PATHS.work, 'inventory.json'));
const captureDir = path.join(PATHS.work, 'capture');
const renderedDir = path.join(PATHS.work, 'rendered');
const livePngDir = path.join(PATHS.work, 'screens', 'live');
const liveJpgDir = path.join(PATHS.docs, 'screenshots', 'live');

const FULFILL_HEADERS = new Set([
  'content-type', 'location', 'access-control-allow-origin', 'access-control-allow-credentials',
  'access-control-allow-headers', 'access-control-allow-methods', 'access-control-expose-headers',
  'timing-allow-origin', 'cache-control', 'expires', 'last-modified', 'etag', 'vary', 'content-language',
  'x-content-type-options', 'content-security-policy', 'x-frame-options', 'link', 'refresh',
]);

function pagesToCapture() {
  let rows = inv.rows.filter((r) => (r.type === 'page' && Number(r.http_status) === 200) || r.type === '404-page');
  if (ONLY) rows = rows.filter((r) => ONLY.some((o) => r.url.includes(o)));
  return rows.map((r) => ({ url: r.url, slug: r.type === '404-page' ? '404' : slugForUrl(r.url), is404: r.type === '404-page' }));
}

async function captureViewport(browser, pageInfo, vpName) {
  const rec = {
    viewport: vpName,
    status: null,
    finalUrl: null,
    title: '',
    siteRequests: [],
    external: [],
    blocked: [],
    failed: [],
    jsErrors: [],
    domUrls: [],
  };
  const context = await newContext(browser, vpName);
  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    if (!/^https?:/i.test(url)) return route.continue();
    const method = req.method();
    if (method !== 'GET' && method !== 'HEAD') {
      rec.blocked.push({ url, reason: `non-GET (${method})`, type: req.resourceType() });
      return route.abort('blockedbyclient');
    }
    const tracker = trackerFor(url);
    if (tracker) {
      rec.blocked.push({ url, reason: `tracking: ${tracker}`, type: req.resourceType() });
      return route.abort('blockedbyclient');
    }
    const u = new URL(url);
    if (isSiteUrl(u) || isLocalizableHost(u.hostname)) {
      const isDoc = req.resourceType() === 'document';
      const variant = isDoc && vpName === 'mobile' && inv.variesByUa ? 'mobile' : 'desktop';
      const res = await fetcher.get(url, { variant, accept: req.headers().accept || ACCEPT.any, referer: pageInfo.url });
      if (res.blocked) {
        rec.blocked.push({ url, reason: res.blocked + (res.rule ? ` ${res.rule}` : ''), type: req.resourceType() });
        return route.abort('blockedbyclient');
      }
      if (!res.status) {
        rec.failed.push({ url, error: res.error || 'network error', type: req.resourceType() });
        return route.abort('failed');
      }
      rec.siteRequests.push({ url, status: res.status, type: req.resourceType(), contentType: res.contentType, bytes: res.bytes });
      const headers = {};
      for (const [k, v] of Object.entries(res.headers || {})) if (FULFILL_HEADERS.has(k)) headers[k] = v;
      try {
        return await route.fulfill({ status: res.status, headers, body: method === 'HEAD' ? '' : res.body });
      } catch {
        return undefined; // page already closed
      }
    }
    rec.external.push({ url, host: u.host, type: req.resourceType(), frame: req.frame()?.url?.() || '' });
    return route.continue().catch(() => {});
  });

  const page = await context.newPage();
  page.on('pageerror', (e) => rec.jsErrors.push(String(e.message || e).slice(0, 300)));
  page.on('requestfailed', (r) => {
    const err = r.failure()?.errorText || 'failed';
    if (err.includes('ERR_BLOCKED_BY_CLIENT')) return; // our own deliberate blocks, already recorded
    try {
      if (!isSiteUrl(r.url())) rec.failed.push({ url: r.url(), error: err, type: r.resourceType() });
    } catch {}
  });
  try {
    const response = await visit(page, pageInfo.url, vpName);
    rec.status = response ? response.status() : null;
    rec.finalUrl = page.url();
    rec.title = await page.title().catch(() => '');
    if (vpName === 'desktop') {
      const html = await page.content();
      const rel = pageInfo.is404 ? '404.html' : pageLocalPath(pageInfo.url, 'text/html');
      writeFile(path.join(renderedDir, rel), html);
      rec.renderedFile = rel;
    }
    rec.domUrls = await page.evaluate(collectDomUrls).catch(() => []);
    await prepareForScreenshot(page);
    const shot = await screenshot(
      page,
      path.join(livePngDir, `${pageInfo.slug}--${vpName}.png`),
      path.join(liveJpgDir, `${pageInfo.slug}--${vpName}.jpg`),
    );
    rec.screenshot = shot;
  } catch (e) {
    rec.error = String(e.message || e).split('\n')[0];
  } finally {
    await context.close().catch(() => {});
  }
  return rec;
}

async function capturePages() {
  const pages = pagesToCapture();
  console.log(`Capturing ${pages.length} pages × ${Object.keys(VIEWPORTS).length} viewports (parallel ${PARALLEL})`);
  const browser = await launchBrowser();
  let done = 0;
  await pool(pages, PARALLEL, async (p) => {
    const recFile = path.join(captureDir, `${p.slug}.json`);
    if (!FORCE && fs.existsSync(recFile)) {
      const prev = readJson(recFile);
      if (Object.values(prev.viewports || {}).every((v) => v.screenshot && !v.error)) {
        done++;
        return;
      }
    }
    const started = Date.now();
    const record = { url: p.url, slug: p.slug, is404: p.is404, capturedAt: new Date().toISOString(), viewports: {} };
    for (const vp of Object.keys(VIEWPORTS)) record.viewports[vp] = await captureViewport(browser, p, vp);
    writeJson(recFile, record);
    done++;
    const errs = Object.values(record.viewports).filter((v) => v.error).map((v) => `${v.viewport}: ${v.error}`);
    console.log(
      `[${done}/${pages.length}] ${p.url} — ${((Date.now() - started) / 1000).toFixed(1)}s` +
        (errs.length ? `  ERROR ${errs.join('; ')}` : ''),
    );
  });
  await browser.close();
}

// ------------------------------------------------------------------ assets
async function downloadAssets() {
  const pages = pagesToCapture();
  const discovered = new Map(); // url -> Set(kinds)
  const add = (u, kind) => {
    if (!u) return;
    let url;
    try {
      url = new URL(u);
    } catch {
      return;
    }
    url.hash = '';
    if (!/^https?:$/.test(url.protocol)) return;
    if (!(isSiteUrl(url) || isLocalizableHost(url.hostname))) return;
    if (isSiteUrl(url) && isForbidden(url)) return;
    const href = url.href;
    if (!discovered.has(href)) discovered.set(href, new Set());
    discovered.get(href).add(kind);
  };
  const pageUrls = new Set(inv.rows.filter((r) => r.type === 'page' || r.type === 'redirect').map((r) => r.url));

  for (const p of pages) {
    const recFile = path.join(captureDir, `${p.slug}.json`);
    const rec = fs.existsSync(recFile) ? readJson(recFile) : null;
    // (a) what the browser actually requested, (b) what the rendered DOM refers to
    for (const vp of Object.values(rec?.viewports || {})) {
      for (const r of vp.siteRequests || []) if (r.type !== 'document') add(r.url, `browser:${r.type}`);
      for (const u of vp.domUrls || []) if (!pageUrls.has(u)) add(u, `dom:${vp.viewport}`);
    }
    // (c) static parse of the raw HTML and of the rendered HTML (srcset variants, data-src, noscript…)
    const raw = fetcher.readCache(p.url);
    const htmls = [];
    if (raw?.body?.length) htmls.push(raw.body.toString('utf8'));
    const rendered = rec?.viewports?.desktop?.renderedFile && path.join(renderedDir, rec.viewports.desktop.renderedFile);
    if (rendered && fs.existsSync(rendered)) htmls.push(fs.readFileSync(rendered, 'utf8'));
    for (const html of htmls) {
      const { assets } = extractFromHtml(html, p.url);
      for (const [u, kinds] of assets) if (!pageUrls.has(u)) for (const k of kinds) add(u, `html:${k}`);
    }
  }
  for (const u of inv.sitemapImages || []) add(u, 'sitemap-image');
  // Linked documents / icons / manifests found in Phase 1 are assets too.
  for (const r of inv.rows) if (['document', 'icon', 'manifest', 'sitemap-stylesheet'].includes(r.type)) add(r.url, `inventory:${r.type}`);

  console.log(`Downloading assets: ${discovered.size} URLs discovered so far (CSS is scanned recursively)…`);
  const results = new Map();
  const queue = [...discovered.keys()];
  const seen = new Set(queue);
  let processed = 0;
  const enqueue = (u, kind) => {
    const before = discovered.size;
    add(u, kind);
    let href;
    try {
      const x = new URL(u);
      x.hash = '';
      href = x.href;
    } catch {
      return;
    }
    if (discovered.has(href) && !seen.has(href)) {
      seen.add(href);
      queue.push(href);
    }
    return discovered.size > before;
  };

  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      const { final, chain } = await fetcher.getFollow(url, { accept: ACCEPT.any });
      results.set(url, {
        url,
        status: final.status,
        finalUrl: final.url,
        contentType: final.contentType || '',
        bytes: final.bytes || 0,
        blocked: final.blocked || null,
        error: final.error || null,
        redirects: chain.length > 1 ? chain : undefined,
        kinds: [...(discovered.get(url) || [])],
      });
      processed++;
      if (processed % 100 === 0) console.log(`  … ${processed} assets processed, ${queue.length} queued`);
      if (final.status !== 200) continue;
      const ct = final.contentType || '';
      const pathname = new URL(final.url).pathname;
      if (/css/.test(ct) || /\.css$/i.test(pathname)) {
        for (const r of cssRefs(final.body.toString('utf8'))) {
          const abs = resolveUrl(r.url, final.url);
          if (abs) enqueue(abs, `css:${url}`);
        }
      } else if (/javascript|json|manifest|svg|xml/.test(ct) || /\.(m?js|json|webmanifest|svg)$/i.test(pathname)) {
        const text = final.body.toString('utf8');
        for (const u of siteUrlsInText(text)) if (looksLikeAsset(u)) enqueue(u, `text:${url}`);
        if (/manifest/.test(ct) || /\.webmanifest$/i.test(pathname)) {
          try {
            for (const icon of JSON.parse(text).icons || []) enqueue(resolveUrl(icon.src, final.url), `manifest:${url}`);
          } catch {}
        }
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));

  const list = [...results.values()].sort((a, b) => a.url.localeCompare(b.url));
  writeJson(path.join(PATHS.work, 'assets.json'), list);
  const ok = list.filter((a) => a.status === 200);
  const bytes = ok.reduce((s, a) => s + a.bytes, 0);
  console.log(`Assets: ${list.length} URLs, ${ok.length} downloaded OK (${fmtBytes(bytes)}), ${list.length - ok.length} not OK`);
  const bad = list.filter((a) => a.status !== 200);
  for (const a of bad.slice(0, 25)) console.log(`  ${a.status || a.blocked || a.error}  ${a.url}`);
  if (bad.length > 25) console.log(`  … and ${bad.length - 25} more (see .work/assets.json)`);
}

async function main() {
  if (!SKIP_PAGES) await capturePages();
  await downloadAssets();
  console.log(
    `Fetcher: ${fetcher.stats.network} network requests, ${fetcher.stats.cacheHits} cache hits, ` +
      `${fetcher.stats.blockedRobots} robots-blocked, ${fetcher.stats.blockedForbidden} forbidden-blocked, ` +
      `${fmtBytes(fetcher.stats.bytes)} downloaded, peak site concurrency ${fetcher.peakSiteConcurrency}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
