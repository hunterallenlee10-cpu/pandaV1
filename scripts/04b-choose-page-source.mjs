#!/usr/bin/env node
// Phase 3 helper — choose, per page, which HTML the copy serves.
//
// By default every page is the fully rendered DOM captured by Chromium. That
// snapshot already contains the changes the site's own scripts made (carousel
// clones, injected images, widget markup), and those scripts run AGAIN when the
// copy is opened, which can double-initialise them. For every page the visual
// diff flagged, this script builds the page from the HTML exactly as delivered
// (all assets still local), diffs that against the live screenshots too, and
// keeps whichever version matches the live site better. Choices are written to
// .work/page-source-overrides.json, which scripts/03-build.mjs applies.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { PATHS, ROOT } from './lib/config.mjs';
import { readJson, writeJson } from './lib/util.mjs';

const rendered = readJson(path.join(PATHS.work, 'visual-diff-local.json'));
const overridesFile = path.join(PATHS.work, 'page-source-overrides.json');
const overrides = readJson(overridesFile, {});
const worst = (rows) => Math.max(...rows.map((r) => (r.error ? 100 : r.pct)));

const byUrl = new Map();
for (const r of rendered) {
  if (!byUrl.has(r.url)) byUrl.set(r.url, []);
  byUrl.get(r.url).push(r);
}
const flagged = [...byUrl].filter(([url, rows]) => !overrides[url] && rows.some((r) => !r.pass)).map(([url]) => url);
if (!flagged.length) {
  console.log('No flagged rendered pages — every page keeps the rendered DOM.');
  process.exit(0);
}
console.log(`${flagged.length} page(s) flagged with the rendered DOM; trying the as-delivered HTML for them…`);

const rawSite = path.join(PATHS.work, 'site-raw');
const env = { ...process.env, SITE_DIR: rawSite, DOCS_DIR: path.join(PATHS.work, 'docs-raw') };
const urlsFile = path.join(PATHS.work, 'flagged-urls.json');
writeJson(urlsFile, flagged);
const run = (args) => {
  const r = spawnSync(process.execPath, args, { cwd: ROOT, env, stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${args.join(' ')} failed`);
};
run(['scripts/03-build.mjs', '--source=raw']);
run(['scripts/04-visual-diff.mjs', `--site=${rawSite}`, '--label=raw', `--out=${path.join(PATHS.work, 'docs-raw', 'visual-diff')}`, `--urls-file=${urlsFile}`]);

const raw = readJson(path.join(PATHS.work, 'visual-diff-raw.json'));
const decisions = [];
for (const url of flagged) {
  const r = byUrl.get(url);
  const w = raw.filter((x) => x.url === url);
  if (!w.length) continue;
  const renderedWorst = worst(r);
  const rawWorst = worst(w);
  const useRaw = rawWorst < renderedWorst;
  if (useRaw) overrides[url] = 'raw';
  decisions.push({ url, renderedWorstPct: +renderedWorst.toFixed(3), rawWorstPct: +rawWorst.toFixed(3), chosen: useRaw ? 'raw' : 'rendered' });
  console.log(`  ${url}: rendered ${renderedWorst.toFixed(2)}% vs as-delivered ${rawWorst.toFixed(2)}% -> ${useRaw ? 'as-delivered' : 'rendered'}`);
}
writeJson(overridesFile, overrides);
writeJson(path.join(PATHS.work, 'page-source-decisions.json'), decisions);
console.log(`${Object.keys(overrides).length} page(s) now use the as-delivered HTML (see .work/page-source-overrides.json). Re-run 03-build.mjs and 04-visual-diff.mjs.`);
