#!/usr/bin/env node
// Phase 3a — screenshot every page of the LOCAL copy with exactly the same
// procedure as the live capture, pixel-diff against the live screenshots
// (pixelmatch) and write docs/visual-diff/ (summary + diff images).
//
//   node scripts/04-visual-diff.mjs [--site=site] [--label=local] [--port=4173] [--only=roofing,about]
//
// While the local copy is open, any request it makes to the LIVE site is
// blocked and reported as a leak (the copy must be self-contained).
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import sharp from 'sharp';
import { PATHS, VIEWPORTS, isSiteUrl, isLocalizableHost, trackerFor } from './lib/config.mjs';
import { launchBrowser, newContext, visit, prepareForScreenshot, screenshot } from './lib/browser.mjs';
import { startServer } from './lib/server.mjs';
import { readJson, writeJson, writeFile, toCsv, mdTable, args, pool, listFiles } from './lib/util.mjs';

const opts = args();
const SITE_DIR = opts.site ? path.resolve(opts.site) : PATHS.site;
const LABEL = opts.label || 'local';
const PORT = Number(opts.port || 4173);
const PARALLEL = Number(opts.parallel || 3);
const FLAG_PCT = Number(opts.threshold || 1);
const ONLY = opts.only ? String(opts.only).split(',') : null;
const URLS = opts['urls-file'] ? new Set(readJson(path.resolve(opts['urls-file']))) : null;
const OUT_DIR = opts.out ? path.resolve(opts.out) : path.join(PATHS.docs, 'visual-diff');

const livePng = path.join(PATHS.work, 'screens', 'live');
const localPng = path.join(PATHS.work, 'screens', LABEL);

function pad(png, width, height) {
  if (png.width === width && png.height === height) return png;
  const out = new PNG({ width, height });
  // Magenta fill: area that exists in only one screenshot always counts as different.
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = 255;
    out.data[i + 1] = 0;
    out.data[i + 2] = 255;
    out.data[i + 3] = 255;
  }
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

async function compare(liveFile, localFile, diffJpg) {
  const a = PNG.sync.read(fs.readFileSync(liveFile));
  const b = PNG.sync.read(fs.readFileSync(localFile));
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const A = pad(a, width, height);
  const B = pad(b, width, height);
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(A.data, B.data, diff.data, width, height, { threshold: 0.1, includeAA: false, alpha: 0.15 });
  const pct = (diffPixels / (width * height)) * 100;
  if (diffPixels > 0) {
    fs.mkdirSync(path.dirname(diffJpg), { recursive: true });
    await sharp(PNG.sync.write(diff), { limitInputPixels: false }).jpeg({ quality: 60, mozjpeg: true }).toFile(diffJpg);
  } else if (fs.existsSync(diffJpg)) fs.rmSync(diffJpg);
  return { liveSize: `${a.width}×${a.height}`, localSize: `${b.width}×${b.height}`, heightDelta: b.height - a.height, diffPixels, pct };
}

async function main() {
  const captures = listFiles(path.join(PATHS.work, 'capture'), (f) => f.endsWith('.json')).map((f) => readJson(f));
  let pages = captures.filter((c) => Object.values(c.viewports).some((v) => v.screenshot));
  if (ONLY) pages = pages.filter((p) => ONLY.some((o) => p.url.includes(o)));
  if (URLS) pages = pages.filter((p) => URLS.has(p.url));
  pages.sort((x, y) => x.url.localeCompare(y.url));
  const server = await startServer(SITE_DIR, PORT);
  console.log(`Serving ${SITE_DIR} at ${server.base}; comparing ${pages.length} pages × ${Object.keys(VIEWPORTS).length} viewports`);
  const browser = await launchBrowser();
  const results = [];
  let done = 0;

  await pool(pages, PARALLEL, async (p) => {
    const live = new URL(p.url);
    const localUrl = `${server.base}${live.pathname}${live.search}`;
    for (const vpName of Object.keys(VIEWPORTS)) {
      const liveFile = path.join(livePng, `${p.slug}--${vpName}.png`);
      if (!fs.existsSync(liveFile)) continue;
      const leaks = [];
      const external = new Set();
      const jsErrors = [];
      const context = await newContext(browser, vpName);
      await context.route('**/*', async (route) => {
        const req = route.request();
        const url = req.url();
        if (url.startsWith(server.base)) return route.continue();
        if (!/^https?:/i.test(url)) return route.continue();
        if (req.method() !== 'GET' && req.method() !== 'HEAD') return route.abort('blockedbyclient');
        if (trackerFor(url)) {
          leaks.push({ url, reason: 'tracking request' });
          return route.abort('blockedbyclient');
        }
        const u = new URL(url);
        if (isSiteUrl(u)) {
          leaks.push({ url, reason: 'request to live site' });
          return route.abort('blockedbyclient');
        }
        if (isLocalizableHost(u.hostname)) leaks.push({ url, reason: 'static CDN file not localized' });
        external.add(u.host);
        return route.continue().catch(() => {});
      });
      const page = await context.newPage();
      page.on('pageerror', (e) => jsErrors.push(String(e.message || e).slice(0, 200)));
      const row = { url: p.url, slug: p.slug, viewport: vpName, localUrl };
      try {
        const res = await visit(page, localUrl, vpName);
        row.localStatus = res ? res.status() : null;
        await prepareForScreenshot(page);
        const localFile = path.join(localPng, `${p.slug}--${vpName}.png`);
        await screenshot(page, localFile);
        Object.assign(row, await compare(liveFile, localFile, path.join(OUT_DIR, `${p.slug}--${vpName}.jpg`)));
      } catch (e) {
        row.error = String(e.message || e).split('\n')[0];
      } finally {
        await context.close().catch(() => {});
      }
      const liveErrors = (p.viewports[vpName]?.jsErrors || []).length;
      row.leaks = leaks.length;
      row.leakExamples = leaks.slice(0, 3).map((l) => `${l.reason}: ${l.url}`);
      row.jsErrorsLocal = jsErrors.length;
      row.jsErrorsLive = liveErrors;
      row.newJsErrors = jsErrors.filter((e) => !(p.viewports[vpName]?.jsErrors || []).includes(e)).slice(0, 3);
      row.pass = !row.error && row.pct <= FLAG_PCT;
      results.push(row);
    }
    done++;
    const mine = results.filter((r) => r.url === p.url);
    console.log(`[${done}/${pages.length}] ${p.url}  ${mine.map((r) => `${r.viewport}: ${r.error ? 'ERROR ' + r.error : r.pct.toFixed(2) + '%'}${r.leaks ? ` (${r.leaks} leaks)` : ''}`).join('  ')}`);
  });
  await browser.close();
  server.stop();

  results.sort((a, b) => a.url.localeCompare(b.url) || a.viewport.localeCompare(b.viewport));
  const build = readJson(path.join(PATHS.work, 'build-report.json'), { pages: [] });
  const sourceOf = new Map(build.pages.map((p) => [p.url, p.source === 'raw' ? 'as-delivered' : 'rendered']));
  for (const r of results) r.source = sourceOf.get(r.url) || '';
  writeJson(path.join(PATHS.work, `visual-diff-${LABEL}.json`), results);
  const passed = results.filter((r) => r.pass).length;
  const rate = results.length ? ((passed / results.length) * 100).toFixed(1) : '0';
  const flagged = results.filter((r) => !r.pass);
  const csvRows = results.map((r) => ({
    url: r.url,
    viewport: r.viewport,
    live_size: r.liveSize,
    local_size: r.localSize,
    height_delta_px: r.heightDelta,
    diff_pixels: r.diffPixels,
    diff_pct: r.pct != null ? r.pct.toFixed(3) : '',
    result: r.error ? 'ERROR' : r.pass ? 'PASS' : 'FLAG',
    page_html: r.source,
    live_site_requests: r.leaks,
    js_errors_live: r.jsErrorsLive,
    js_errors_local: r.jsErrorsLocal,
    error: r.error || '',
  }));
  writeFile(path.join(OUT_DIR, 'summary.csv'), toCsv(Object.keys(csvRows[0] || { url: '' }), csvRows));
  const md = [
    '# Visual diff: local copy vs live site',
    '',
    `Every page was screenshotted (full page) at desktop 1440px and mobile 390px on the live site during capture and`,
    `again from the local copy served with \`serve\`, using the identical procedure (slow scroll to the bottom, wait for`,
    `the network to go quiet, back to top, carousels stopped on their first slide, animations disabled). Screenshots were`,
    `compared with pixelmatch (threshold 0.1, anti-aliasing ignored). Where page heights differ, the extra area counts as`,
    `different. Pages differing by more than ${FLAG_PCT}% are flagged.`,
    '',
    `**Result: ${passed} of ${results.length} screenshots pass (${rate}%).** Flagged: ${flagged.length}.`,
    '',
    `Diff images (\`<page>--<viewport>.jpg\`, changed pixels in red) are saved next to this file for every screenshot`,
    `that is not pixel-identical. Live screenshots are in \`docs/screenshots/live/\`.`,
    '',
    `"Page HTML" says which version the copy serves: \`rendered\` = the DOM captured after the page finished rendering`,
    `in Chromium; \`as-delivered\` = the server's original HTML (used where the rendered snapshot did not match live,`,
    `typically because carousels or other scripts initialise a second time on already-rendered markup).`,
    '',
    flagged.length ? '## Flagged pages\n\n' + mdTable(
      ['Page', 'Viewport', 'Diff %', 'Height Δ (px)', 'Live-site requests', 'New JS errors', 'Note'],
      flagged.map((r) => [new URL(r.url).pathname, r.viewport, r.pct != null ? r.pct.toFixed(2) : '—', r.heightDelta ?? '—', r.leaks, r.newJsErrors.join(' / ').slice(0, 120), r.error || '']),
    ) + '\n' : '',
    '## All pages',
    '',
    mdTable(
      ['Page', 'Viewport', 'Page HTML', 'Live size', 'Local size', 'Diff %', 'Result'],
      results.map((r) => [new URL(r.url).pathname, r.viewport, r.source, r.liveSize || '—', r.localSize || '—', r.pct != null ? r.pct.toFixed(3) : '—', r.error ? 'ERROR' : r.pass ? 'PASS' : '**FLAG**']),
    ),
    '',
  ].join('\n');
  writeFile(path.join(OUT_DIR, 'summary.md'), md);
  const leakTotal = results.reduce((s, r) => s + (r.leaks || 0), 0);
  console.log(`\nVisual diff (${LABEL}): ${passed}/${results.length} pass (${rate}%), ${flagged.length} flagged (> ${FLAG_PCT}%), ${leakTotal} live-site/tracking requests from the copy`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
