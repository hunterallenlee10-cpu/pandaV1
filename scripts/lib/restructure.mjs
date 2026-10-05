// Helpers for taking pages off a built site/ and keeping its sitemaps and redirect files in
// step (scripts/tools/update-built-site.mjs; 03-build.mjs does the same from the capture).
//
//  - removeBuiltPages: deletes the HTML (built and raw) of the pages removed on request or
//    merged into another (REMOVED_PAGES) that are still in site/, and returns the files they
//    referenced, so pruneUnusedFiles can then delete the ones no other file uses.
//  - editSitemaps: the removed pages' entries out of the XML sitemaps, the new pages'
//    entries (NEW_PAGES) into page-sitemap.xml.
//  - writeRedirectFiles: _redirects, serve.json and vercel.json with a redirect for every
//    removed page (to REMOVED_PAGE_TARGETS), and no chains: a redirect whose destination
//    redirects again leads straight to the last address.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, REMOVED_PAGES, isRemovedPage, removedPageTarget, isSiteUrl } from './config.mjs';
import { listFiles, writeFile } from './util.mjs';

const TEXT_FILE = /\.(html?|css|js|mjs|json|xml|xsl|txt|svg|webmanifest)$/i;
const NOT_PAGES = /^(_raw|_custom|_external|wp-content|wp-includes)\//;
const rel = (siteDir, f) => path.relative(siteDir, f).split(path.sep).join('/');

/** The removed pages still in site/: their HTML is deleted; returns the local files they used. */
export function removeBuiltPages(siteDir, { dryRun = false } = {}) {
  const pages = listFiles(siteDir, (f) => f.endsWith('index.html') && !NOT_PAGES.test(rel(siteDir, f))).filter((f) => isRemovedPage('/' + rel(siteDir, f).replace(/index\.html$/, '')));
  const used = new Set();
  const removed = [];
  for (const f of pages) {
    const html = fs.readFileSync(f, 'utf8');
    for (const m of html.matchAll(/(?:src|href|srcset|data-src|data-srcset|content|poster)="([^"]+)"|url\((['"]?)([^'")]+)\2\)/g)) {
      for (const part of (m[1] || m[3] || '').split(',')) {
        const p = part.trim().split(/\s+/)[0].replace(/[?#].*$/, '');
        if (!p.startsWith('/') || p.startsWith('//') || p.endsWith('/')) continue;
        let decoded = p;
        try {
          decoded = decodeURIComponent(p);
        } catch {}
        if (fs.existsSync(path.join(siteDir, decoded))) used.add(decoded.slice(1));
      }
    }
    const page = '/' + rel(siteDir, f).replace(/index\.html$/, '');
    removed.push(page);
    if (!dryRun) {
      for (const file of [f, path.join(siteDir, '_raw', rel(siteDir, f))]) {
        if (!fs.existsSync(file)) continue;
        fs.rmSync(file);
        removeEmptyDirs(siteDir, path.dirname(file));
      }
    }
  }
  return { removed, used };
}

function removeEmptyDirs(siteDir, dir) {
  for (let d = dir; d !== siteDir && d.startsWith(siteDir) && fs.existsSync(d) && fs.readdirSync(d).length === 0; d = path.dirname(d)) fs.rmdirSync(d);
}

/**
 * Deletes the files in `candidates` (site-relative paths) whose name appears in no other
 * file of the site (raw HTML aside), like 03-build.mjs does for the pages it leaves out. A
 * style sheet or script that goes may leave the files it referenced unused too.
 */
export function pruneUnusedFiles(siteDir, candidates, { dryRun = false } = {}) {
  const texts = new Map();
  for (const f of listFiles(siteDir, (x) => TEXT_FILE.test(x) && !rel(siteDir, x).startsWith('_raw/'))) texts.set(rel(siteDir, f), fs.readFileSync(f, 'utf8'));
  const names = (r) => {
    const b = path.posix.basename(r);
    return [...new Set([b, encodeURI(b), encodeURIComponent(b)])];
  };
  const gone = new Set();
  const usedElsewhere = (r) => {
    const n = names(r);
    for (const [other, t] of texts) if (other !== r && !gone.has(other) && n.some((x) => t.includes(x))) return true;
    return false;
  };
  let queue = [...candidates].filter((r) => !/\.html?$/i.test(r));
  while (queue.length) {
    const next = [];
    for (const r of queue) {
      if (gone.has(r) || !fs.existsSync(path.join(siteDir, r)) || usedElsewhere(r)) continue;
      gone.add(r);
      const t = texts.get(r);
      if (t) for (const m of t.matchAll(/(?:url\((['"]?)|["'])(\/[^"')\s]+\.[a-z0-9]{2,5})/gi)) next.push(m[2].slice(1));
    }
    queue = next;
  }
  let bytes = 0;
  for (const r of gone) {
    const file = path.join(siteDir, r);
    bytes += fs.statSync(file).size;
    if (!dryRun) {
      fs.rmSync(file);
      removeEmptyDirs(siteDir, path.dirname(file));
    }
  }
  return { files: [...gone].sort(), bytes };
}

/** A sitemap without the entries of removed pages. */
export function pruneSitemapXml(xml) {
  return xml.replace(/[ \t]*<url>([\s\S]*?)<\/url>[ \t]*\r?\n?/g, (m, inner) => {
    try {
      const loc = new URL(/<loc>\s*([^<\s]+)\s*<\/loc>/.exec(inner)?.[1]);
      return isSiteUrl(loc) && isRemovedPage(loc.pathname) ? '' : m;
    } catch {
      return m;
    }
  });
}

/** page-sitemap.xml with an entry for each of `pages` ({ path, lastmod }) it doesn't list yet. */
export function addSitemapPages(xml, pages, siteOrigin) {
  const missing = pages.filter((p) => !xml.includes(`<loc>${siteOrigin}${p.path}</loc>`));
  if (!missing.length) return xml;
  const entries = missing.map((p) => `\t<url>\n\t\t<loc>${siteOrigin}${p.path}</loc>\n\t\t<lastmod>${p.lastmod}</lastmod>\n\t</url>\n`).join('');
  return xml.replace(/<\/urlset>/, `${entries}</urlset>`);
}

/** Every XML sitemap of site/: removed pages out, `newPages` into page-sitemap.xml. */
export function editSitemaps(siteDir, siteOrigin, newPages = [], { dryRun = false } = {}) {
  const edited = [];
  for (const name of fs.readdirSync(siteDir).filter((f) => f.endsWith('.xml'))) {
    const file = path.join(siteDir, name);
    const xml = fs.readFileSync(file, 'utf8');
    if (/<sitemapindex\b/.test(xml) || !/<urlset\b/.test(xml)) continue;
    let out = pruneSitemapXml(xml);
    if (name === 'page-sitemap.xml') out = addSitemapPages(out, newPages, siteOrigin);
    if (out !== xml) {
      edited.push(name);
      if (!dryRun) fs.writeFileSync(file, out);
    }
  }
  return edited;
}

/** The site's RSS feed without the items of removed pages (merged blog posts). */
export function pruneFeedXml(xml) {
  return xml.replace(/[ \t]*<item>([\s\S]*?)<\/item>[ \t]*\r?\n?/g, (m, inner) => {
    try {
      const link = new URL(/<link>\s*([^<\s]+)\s*<\/link>/.exec(inner)?.[1]);
      return isSiteUrl(link) && isRemovedPage(link.pathname) ? '' : m;
    } catch {
      return m;
    }
  });
}
export function editFeed(siteDir, { dryRun = false } = {}) {
  const file = path.join(siteDir, 'feed', 'index.xml');
  if (!fs.existsSync(file)) return false;
  const xml = fs.readFileSync(file, 'utf8');
  const out = pruneFeedXml(xml);
  if (out === xml) return false;
  if (!dryRun) fs.writeFileSync(file, out);
  return true;
}

/** Redirect rows ({ from, to, status }) with chains followed to their last address. */
export function flattenRedirects(rows) {
  const by = new Map(rows.map((r) => [r.from.replace(/\/+$/, '') || '/', r]));
  return rows.map((r) => {
    let to = r.to;
    const seen = new Set([r.from]);
    for (let next = by.get(to.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/'); next && !seen.has(next.from) && /^\//.test(to); next = by.get(to.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/')) {
      seen.add(next.from);
      to = next.to;
    }
    return { ...r, to };
  });
}

const serveSource = (p) => (p.replace(/\/+$/, '') || '/').replace(/[()[\]{}*+?:!]/g, '\\$&');
const vercelSource = (p) => p.replace(/[()[\]{}*+?:!]/g, '\\$&');

/**
 * Brings site/_redirects, site/serve.json and vercel.json up to date: a 301 for every removed
 * page that has none yet, chains flattened. The files' other rules and order are kept.
 */
export function writeRedirectFiles(siteDir, { dryRun = false } = {}) {
  const file = path.join(siteDir, '_redirects');
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const isRule = (l) => /^\/\S*\s+\S+\s+3\d\d\s*$/.test(l.trim());
  const rows = lines.filter(isRule).map((l) => {
    const [from, to, status] = l.trim().split(/\s+/);
    return { from, to, status: Number(status) };
  });
  const have = new Set(rows.map((r) => r.from));
  const add = REMOVED_PAGES.filter((p) => p.endsWith('/') && !have.has(p))
    .sort()
    .map((p) => ({ from: p, to: removedPageTarget(p), status: 301 }));
  const all = flattenRedirects([...rows, ...add]);
  const ruleText = (r) => `${r.from}  ${r.to}  ${r.status}`;
  const firstRule = lines.findIndex(isRule);
  const rest = lines.filter((l) => !isRule(l));
  const header = rest.slice(0, firstRule < 0 ? rest.length : firstRule);
  const tail = rest.slice(header.length);
  const out = [...header, ...all.map(ruleText), ...tail].join('\n');
  const changed = [];
  if (out !== lines.join('\n')) {
    changed.push('site/_redirects');
    if (!dryRun) fs.writeFileSync(file, out);
  }
  const serveFile = path.join(siteDir, 'serve.json');
  if (fs.existsSync(serveFile)) {
    const serve = JSON.parse(fs.readFileSync(serveFile, 'utf8'));
    const next = { ...serve, redirects: all.map((r) => ({ source: serveSource(r.from), destination: r.to, type: r.status })) };
    if (JSON.stringify(next) !== JSON.stringify(serve)) {
      changed.push('site/serve.json');
      if (!dryRun) writeFile(serveFile, JSON.stringify(next, null, 2) + '\n');
    }
  }
  const vercelFile = path.join(ROOT, 'vercel.json');
  if (fs.existsSync(vercelFile)) {
    const vercel = JSON.parse(fs.readFileSync(vercelFile, 'utf8'));
    const next = { ...vercel, redirects: all.map((r) => ({ source: vercelSource(r.from), destination: r.to, statusCode: r.status })) };
    if (JSON.stringify(next) !== JSON.stringify(vercel)) {
      changed.push('vercel.json');
      if (!dryRun) writeFile(vercelFile, JSON.stringify(next, null, 2) + '\n');
    }
  }
  return { changed, added: add.length };
}
