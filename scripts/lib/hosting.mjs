// The response headers the hosts send with the site (vercel.json, site/_headers, site/serve.json),
// written by 03-build.mjs and kept up to date by scripts/tools/update-built-site.mjs.
//
//  - Search engines are told not to index the site anywhere but on the live domain
//    (custom/site-fixes/launch.json, "liveHosts"): a preview address such as *.vercel.app
//    would otherwise compete with the real site in search results. (Vercel only: Netlify
//    and Cloudflare Pages cannot tell hosts apart in _headers.)
//  - Basic security headers on every response.
//  - Long browser caching for the files that never change under the same address (uploads,
//    fonts, WordPress's versioned styles and scripts) and a week for the custom pictures.
//    Pages and the custom styles and scripts keep the host's default, so an update shows at once.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { launchConfig } from './launch.mjs';

const SECURITY = [
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['X-Frame-Options', 'SAMEORIGIN'],
  ['Permissions-Policy', 'geolocation=(), microphone=(), camera=()'],
];
const FOREVER = 'public, max-age=31536000, immutable';
const WEEK = 'public, max-age=604800, stale-while-revalidate=2592000';
const RAW = [
  ['Content-Type', 'text/plain; charset=utf-8'],
  ['X-Robots-Tag', 'noindex'],
];
const pairs = (list) => list.map(([key, value]) => ({ key, value }));

export function vercelHeaders() {
  const live = launchConfig().liveHosts || [];
  return [
    { source: '/_raw/(.*)', headers: pairs(RAW) },
    { source: '/(.*)', headers: pairs(SECURITY) },
    ...(live.length ? [{ source: '/(.*)', missing: live.map((value) => ({ type: 'host', value })), headers: pairs([['X-Robots-Tag', 'noindex']]) }] : []),
    { source: '/(wp-content|wp-includes|_external)/(.*)', headers: pairs([['Cache-Control', FOREVER]]) },
    { source: '/_custom/(.*)\\.(webp|jpg|jpeg|png|svg|avif|gif|woff2)', headers: pairs([['Cache-Control', WEEK]]) },
  ];
}
export function netlifyHeaders() {
  const block = (source, list) => [source, ...list.map(([k, v]) => `  ${k}: ${v}`)];
  return [
    '# Netlify / Cloudflare Pages headers',
    ...block('/_raw/*', RAW),
    ...block('/*', SECURITY),
    ...block('/wp-content/*', [['Cache-Control', FOREVER]]),
    ...block('/wp-includes/*', [['Cache-Control', FOREVER]]),
    ...block('/_external/*', [['Cache-Control', FOREVER]]),
    '',
  ].join('\n');
}
export function serveHeaders() {
  return [
    { source: '_raw/**', headers: pairs(RAW) },
    { source: '**', headers: pairs(SECURITY) },
  ];
}

/** Brings vercel.json, site/_headers and site/serve.json up to date. Returns the files changed. */
export function syncHostHeaders(siteDir, { dryRun = false } = {}) {
  const changed = [];
  const write = (file, text, name) => {
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text) return;
    changed.push(name);
    if (!dryRun) fs.writeFileSync(file, text);
  };
  const vercelFile = path.join(ROOT, 'vercel.json');
  if (fs.existsSync(vercelFile)) {
    const vercel = JSON.parse(fs.readFileSync(vercelFile, 'utf8'));
    write(vercelFile, JSON.stringify({ ...vercel, headers: vercelHeaders() }, null, 2) + '\n', 'vercel.json');
  }
  write(path.join(siteDir, '_headers'), netlifyHeaders(), 'site/_headers');
  const serveFile = path.join(siteDir, 'serve.json');
  if (fs.existsSync(serveFile)) {
    const serve = JSON.parse(fs.readFileSync(serveFile, 'utf8'));
    write(serveFile, JSON.stringify({ ...serve, headers: serveHeaders() }, null, 2) + '\n', 'site/serve.json');
  }
  return changed;
}
