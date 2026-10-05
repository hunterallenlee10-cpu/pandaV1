// The Site Map page (/site-map/). The captured page was a hand-kept list that had fallen
// behind the site (city sub-sites, a removed page, no blog). It is now generated from the
// built site itself, so it lists every page in site/ and says how a visitor gets to each:
//  - where it sits in the top menu or the footer, if it does;
//  - otherwise the shortest chain of clicks from the home page (through links in pages);
//  - otherwise that nothing links to it, so it can only be reached by typing its address;
// with the pages whose content links to it, whether the XML sitemaps list it, and the file
// it is built from. Below the pages: the old addresses that redirect (site/_redirects) and
// the addresses the XML sitemaps list that have no page in the copy. Pages removed on request
// (REMOVED_PAGES) appear nowhere on it, not even as an old address; pages merged into
// another (MERGED_PAGES) are listed as old addresses that redirect.
//
// The page keeps its header, footer and "Site Map" heading; only the list under the heading
// (the .site-rich block) is replaced. The links of the Site Map page itself are not counted.
// A search box and filters (custom/site-map/site-map.js) narrow the list; without
// JavaScript every row shows.
//
// buildSiteMapPage writes it (03-build.mjs after the redirect files, and
// scripts/tools/update-built-site.mjs after the other pages are updated).
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';
import { ROOT, isSiteUrl, REMOVED_PAGES, RENAMED_PATHS, SITEMAP_ONLY_EXCLUDE, isMergedPage } from './config.mjs';
import { attr, hasClass, classes, esc, textOf, clean, findAll, find, textNodes, makeEditor, headEndOffset } from './html-edit.mjs';
import { listFiles } from './util.mjs';

export const SITE_MAP_DIR = path.join(ROOT, 'custom', 'site-map');
export const SITE_MAP_PATH = '/site-map/';
// The full list (how to reach every page, redirects, sitemap-only addresses) is a site check,
// not a page for visitors: it lives here, kept out of search engines (noindex) and the XML
// sitemaps, linked from nowhere. /site-map/ itself becomes a plain list of the pages for
// visitors (renderPublicSiteMap). The site restructure.
export const SITE_AUDIT_PATH = '/site-audit/';
// Where the stylesheet and script are published in site/ (and linked from the page).
export const SITE_MAP_FILES = { 'site-map.css': '/_custom/site-map/site-map.css', 'site-map.js': '/_custom/site-map/site-map.js' };
const NOT_FOUND = '/404.html';
// The blog's listing pages (/blog/, /blog/page/2/ …).
const BLOG_LIST = /^\/blog\/(page\/\d+\/)?$/;
const BLOG_PAGE = /^\/blog\/page\/\d+\/$/;
const blogPageNumber = (p) => Number(/\/page\/(\d+)\//.exec(p)?.[1] || 1);
// Folders of site/ that hold no pages of the site.
const NOT_PAGES = /^(_raw|_custom|_external|wp-content|wp-includes)\//;

// ------------------------------------------------------------------ reading the site
const pagePath = (rel) => (rel === '404.html' ? NOT_FOUND : '/' + rel.replace(/(^|\/)index\.html$/, '$1'));
const fileOf = (p) => (p === NOT_FOUND ? 'site/404.html' : `site${p}index.html`);
const shortTitle = (t) => clean(t).replace(/\s*[|–—-]\s*Panda Exteriors\s*$/i, '') || clean(t);
const metaContent = (doc, key) => attr(find(doc, (c) => c.tagName === 'meta' && (attr(c, 'property') === key || attr(c, 'name') === key)) || {}, 'content') || '';

// A link's target as a page key ('/about/'), or null when it leaves the site or is a file.
function linkTarget(href, from, siteOrigin) {
  if (!href || /^(#|mailto:|tel:|sms:|javascript:)/i.test(href.trim())) return null;
  let u;
  try {
    u = new URL(href.trim(), siteOrigin + (from === NOT_FOUND ? '/' : from));
  } catch {
    return null;
  }
  if (!isSiteUrl(u)) return null;
  let p = u.pathname;
  try {
    p = decodeURI(p);
  } catch {}
  if (/\/index\.html?$/i.test(p)) p = p.replace(/index\.html?$/i, '');
  else if (!p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) p += '/';
  return p;
}

// Hidden on every screen: inside an element with d-none, hidden or display:none.
function isHidden(n) {
  for (let p = n; p && p.tagName; p = p.parentNode) {
    if (hasClass(p, 'd-none') || (p.attrs || []).some((a) => a.name === 'hidden') || /display\s*:\s*none/i.test(attr(p, 'style') || '')) return true;
  }
  return false;
}
const isPhoneOnly = (n) => {
  for (let p = n; p && p.tagName; p = p.parentNode) if (hasClass(p, 'mobile-show')) return true;
  return false;
};
const ownLink = (item) => (item.childNodes || []).find((c) => c.tagName === 'a');
// (Without the line some menu entries have under their label: site-fixes.mjs, .pfix-nav-hint.)
const label = (a) => {
  const hint = find(a, (c) => hasClass(c, 'pfix-nav-hint'));
  const text = clean(textOf(a));
  return clean(hint ? text.slice(0, text.lastIndexOf(clean(textOf(hint)))) : text) || clean(attr(a, 'aria-label') || attr(a, 'title') || '');
};

// The top-menu path of a link: the labels of the dropdowns it sits in, then its own.
function menuPath(a, nav) {
  const trail = [label(a)];
  for (let p = a.parentNode; p && p !== nav; p = p.parentNode) {
    if (!hasClass(p, 'has_dropdown')) continue;
    const own = ownLink(p);
    if (own && own !== a) trail.unshift(label(own));
  }
  return trail.filter(Boolean);
}
// The footer column of a link: the column's heading ("Company", "Help" …), if it has one.
function footerPlace(a, footer) {
  for (let p = a.parentNode; p && p !== footer; p = p.parentNode) {
    if (!classes(p).some((c) => /-grid$/i.test(c) && !/^(link|links|footer)-grid$/i.test(c))) continue;
    const heading = clean(textNodes(p).filter((t) => !inLink(t, p)).map((t) => t.value).join(' '));
    if (heading) return heading;
  }
  return '';
}
function inLink(node, stop) {
  for (let p = node.parentNode; p && p !== stop; p = p.parentNode) if (p.tagName === 'a') return true;
  return false;
}
function isWithin(node, ancestor) {
  for (let p = node; p; p = p.parentNode) if (p === ancestor) return true;
  return false;
}

function readPage(file, siteDir, siteOrigin) {
  const rel = path.relative(siteDir, file).split(path.sep).join('/');
  const p = pagePath(rel);
  const html = fs.readFileSync(file, 'utf8');
  const doc = parse(html);
  const body = find(doc, (c) => c.tagName === 'body');
  const blocks = (body?.childNodes || []).filter((c) => c.tagName);
  const nav = blocks.find((c) => hasClass(c, 'nav'));
  const footer = blocks.find((c) => hasClass(c, 'footer'));
  const titleEl = find(doc, (c) => c.tagName === 'title');
  const links = [];
  for (const a of findAll(body || doc, (c) => c.tagName === 'a')) {
    const to = linkTarget(attr(a, 'href'), p, siteOrigin);
    if (!to) continue;
    const zone = nav && isWithin(a, nav) ? 'menu' : footer && isWithin(a, footer) ? 'footer' : 'content';
    links.push({
      to,
      zone,
      hidden: isHidden(a),
      phoneOnly: isPhoneOnly(a),
      text: label(a),
      menu: zone === 'menu' ? menuPath(a, nav) : null,
      column: zone === 'footer' ? footerPlace(a, footer) : null,
    });
  }
  const robots = metaContent(doc, 'robots');
  return {
    path: p,
    file: fileOf(p),
    title: p === NOT_FOUND ? 'Page not found (404)' : BLOG_PAGE.test(p) ? `Blog page ${blogPageNumber(p)}` : shortTitle(titleEl ? textOf(titleEl) : '') || p,
    date: metaContent(doc, 'article:published_time').slice(0, 10),
    noindex: /noindex/i.test(robots),
    links,
  };
}

// The addresses the XML sitemaps list (sitemap index files aside).
function sitemapEntries(siteDir, siteOrigin) {
  const out = new Map(); // path -> sitemap file name
  for (const name of fs.readdirSync(siteDir).filter((f) => f.endsWith('.xml')).sort()) {
    const xml = fs.readFileSync(path.join(siteDir, name), 'utf8');
    if (/<sitemapindex\b/.test(xml)) continue;
    for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
      const p = linkTarget(m[1], '/', siteOrigin);
      if (p && !out.has(p)) out.set(p, name);
    }
  }
  return out;
}

// The redirects of site/_redirects (status 3xx, page addresses only).
function redirects(siteDir) {
  const file = path.join(siteDir, '_redirects');
  if (!fs.existsSync(file)) return [];
  const removed = (p) => !isMergedPage(p) && REMOVED_PAGES.some((x) => p === x || p.startsWith(x));
  const renamed = (p) => Object.keys(RENAMED_PATHS).some((x) => p === x || p.startsWith(x));
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((l) => l.trim().split(/\s+/))
    .filter(([from, to, status]) => from && !from.startsWith('#') && to && /^3\d\d$/.test(status || '') && !/\.[a-z0-9]+$/i.test(from))
    // Pages removed on request are gone from the Site Map altogether, old address included.
    .filter(([from]) => !removed(from))
    .map(([from, to, status]) => ({
      from,
      to,
      status,
      why: isMergedPage(from)
        ? 'Merged into this page in the site restructure.'
        : renamed(from)
          ? 'Old misspelled address; the page now lives at the corrected one.'
          : 'Redirect the live site had; kept so old links still work.',
    }));
}

// ------------------------------------------------------------------ working out the routes
export function collectSiteMap({ siteDir, siteOrigin }) {
  const files = listFiles(siteDir, (f) => f.endsWith('.html') && !NOT_PAGES.test(path.relative(siteDir, f).split(path.sep).join('/')) && path.relative(siteDir, f).split(path.sep).join('/') !== SITE_AUDIT_PATH.slice(1) + 'index.html');
  const pages = new Map();
  for (const f of files.sort()) {
    const page = readPage(f, siteDir, siteOrigin);
    pages.set(page.path, page);
  }
  const sitemap = sitemapEntries(siteDir, siteOrigin);

  // Every link between pages, except the Site Map's own (it links to everything).
  const inbound = new Map([...pages.keys()].map((p) => [p, []]));
  for (const page of pages.values()) {
    if (page.path === SITE_MAP_PATH) continue;
    for (const l of page.links) if (inbound.has(l.to) && l.to !== page.path) inbound.get(l.to).push({ from: page.path, ...l });
  }

  // The top menu and the footer: read from the home page (every page has the same ones).
  const home = pages.get('/') || [...pages.values()][0];
  const menu = new Map();
  const footer = new Map();
  for (const l of home?.links || []) {
    if (l.hidden) continue;
    if (l.zone === 'menu' && l.menu?.length) {
      const prev = menu.get(l.to);
      // A desktop entry beats a phone-only one; then the shorter path.
      if (!prev || (prev.phoneOnly && !l.phoneOnly) || (prev.phoneOnly === l.phoneOnly && l.menu.length < prev.menu.length)) menu.set(l.to, l);
    }
    if (l.zone === 'footer' && !footer.has(l.to) && l.text) footer.set(l.to, l);
  }

  // Shortest click path from the home page, over every visible link.
  const parent = new Map([['/', null]]);
  const queue = pages.has('/') ? ['/'] : [];
  while (queue.length) {
    const p = queue.shift();
    const page = pages.get(p);
    if (!page || p === SITE_MAP_PATH) continue;
    const next = [...page.links].sort((a, b) => (a.zone === 'content') - (b.zone === 'content'));
    for (const l of next) {
      if (l.hidden || parent.has(l.to) || !pages.has(l.to)) continue;
      parent.set(l.to, p);
      queue.push(l.to);
    }
  }
  const route = (p) => {
    if (!parent.has(p)) return null;
    const chain = [];
    for (let x = p; x != null; x = parent.get(x)) chain.unshift(x);
    return chain;
  };

  const rows = [...pages.values()].map((page) => {
    const p = page.path;
    const links = inbound.get(p) || [];
    const content = links.filter((l) => l.zone === 'content');
    const visibleFrom = [...new Set(content.filter((l) => !l.hidden).map((l) => l.from))].sort();
    const hiddenFrom = [...new Set(content.filter((l) => l.hidden).map((l) => l.from))].filter((f) => !visibleFrom.includes(f)).sort();
    const m = menu.get(p);
    const f = footer.get(p);
    const chain = route(p);
    let kind;
    if (p === '/') kind = 'home';
    else if (p === NOT_FOUND) kind = 'error';
    else if (m) kind = 'menu';
    else if (f) kind = 'footer';
    else if (chain) kind = 'linked';
    else kind = 'orphan';
    return {
      ...page,
      kind,
      menu: m ? { trail: m.menu, phoneOnly: m.phoneOnly } : null,
      footer: f ? { column: f.column, text: f.text } : null,
      chain,
      from: visibleFrom,
      hiddenFrom,
      inSitemap: sitemap.has(p),
      // The blog listing pages that list it (an article is on one of them at a time).
      listedOn: visibleFrom.filter((x) => BLOG_LIST.test(x)).sort((a, b) => blogPageNumber(a) - blogPageNumber(b)),
    };
  });

  // Sitemap addresses without a page (a file in site/, like locations.kml, is not missing).
  const missing = [...sitemap.entries()].filter(([p]) => !pages.has(p) && !fs.existsSync(path.join(siteDir, p)));
  return { rows, pages, redirects: redirects(siteDir), missing };
}

// ------------------------------------------------------------------ rendering
const GROUPS = [
  { id: 'main', title: 'Main pages', test: (p) => !p.startsWith('/blog/') && p !== NOT_FOUND },
  { id: 'blog-pages', title: 'Blog listing pages', test: (p) => BLOG_LIST.test(p) },
  { id: 'articles', title: 'Blog articles', test: (p) => /^\/blog\/[^/]+\/$/.test(p) },
  { id: 'offers', title: 'Offer pages', test: (p) => p.startsWith('/blog/offer/') },
  { id: 'projects', title: 'Project pages', test: (p) => p.startsWith('/blog/project/') },
  { id: 'other', title: 'Other pages', test: () => true },
];
const NOTES = {
  'blog-pages': 'The blog lists its articles a few at a time; the numbered buttons at the bottom of each listing page lead to the next ones.',
  articles: 'Newest first. Most articles are reached from the blog listing pages.',
  offers: 'Each offer has its own page; the Offers page and parts of the footer link to them.',
  projects: 'Single-project pages, reached from Past Projects or from a related page.',
};
const KIND = {
  home: ['Home page', 'home'],
  menu: ['Top menu', 'menu'],
  footer: ['Footer', 'footer'],
  linked: ['Linked from pages', 'linked'],
  orphan: ['Not reachable by clicking', 'orphan'],
  error: ['Error page', 'error'],
};
const fmtDate = (d) => (d ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z')) : '');
const plural = (n, one, many = one + 's') => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

function sortRows(id, rows) {
  if (id === 'blog-pages') return rows.sort((a, b) => blogPageNumber(a.path) - blogPageNumber(b.path));
  if (id === 'articles') return rows.sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title));
  if (id === 'main') return rows.sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)));
  return rows.sort((a, b) => a.title.localeCompare(b.title));
}

function renderRoute(row, { titles, blogMenu, blogPages }) {
  const step = (p, i, all) =>
    i === all.length - 1 ? `<span class="psm-route__here">${esc(titles.get(p) || p)}</span>` : `<a href="${esc(p === NOT_FOUND ? '/404.html' : p)}">${esc(titles.get(p) || p)}</a>`;
  const parts = [];
  if (row.kind === 'home') parts.push('<p class="psm-how__main">The home page. The logo at the top left of every page leads here.</p>');
  else if (row.kind === 'error') parts.push('<p class="psm-how__main">Shown for any address that has no page. Nothing links to it.</p>');
  if (row.menu)
    parts.push(
      `<p class="psm-how__main"><span class="psm-how__where">Top menu</span> ${row.menu.trail.map((t) => `<span class="psm-crumb">${esc(t)}</span>`).join('<span class="psm-sep" aria-hidden="true">›</span>')}` +
        `${row.menu.phoneOnly ? ' <span class="psm-note">(phone menu only)</span>' : ''}</p>`
    );
  if (row.footer)
    parts.push(
      `<p class="psm-how__${row.menu ? 'also' : 'main'}"><span class="psm-how__where">Footer</span> ` +
        `<span class="psm-crumb">${esc(row.footer.column || 'Bottom row')}</span><span class="psm-sep" aria-hidden="true">›</span><span class="psm-crumb">${esc(row.footer.text)}</span></p>`
    );
  if (row.kind === 'linked' && BLOG_PAGE.test(row.path))
    parts.push(
      `<p class="psm-how__main"><span class="psm-how__where">On the blog</span> Open the <a href="/blog/">Blog</a>${blogMenu ? ` (${blogMenu})` : ''} and use the page numbers at the bottom.</p>`
    );
  else if (row.kind === 'linked' && row.listedOn.length > 3 && row.listedOn.length === blogPages)
    // The featured article sits at the top of every listing page.
    parts.push(
      `<p class="psm-how__main"><span class="psm-how__where">On the blog</span> Featured at the top of the <a href="/blog/">Blog</a> and every page of it` +
        `${blogMenu ? ` <span class="psm-note">(${blogMenu})</span>` : ''}</p>`
    );
  else if (row.kind === 'linked' && row.listedOn.length)
    parts.push(
      `<p class="psm-how__main"><span class="psm-how__where">On the blog</span> Listed on ${row.listedOn.map((p) => `<a href="${esc(p)}">${esc(titles.get(p) || p)}</a>`).join(', ')}` +
        `${blogMenu ? ` <span class="psm-note">(${blogMenu}, then the page numbers at the bottom)</span>` : ''}</p>`
    );
  else if (row.kind === 'linked' && row.chain)
    parts.push(
      `<p class="psm-how__main"><span class="psm-how__where">Clicks from home</span> <span class="psm-route">${row.chain
        .map((p, i, all) => step(p, i, all))
        .join('<span class="psm-sep" aria-hidden="true">›</span>')}</span></p>`
    );
  if (row.kind === 'orphan')
    parts.push(
      `<p class="psm-how__main psm-how__main--warn">${
        row.from.length
          ? `Only linked from ${row.from.length === 1 ? 'a page' : 'pages'} that can't be reached by clicking either, so it`
          : 'No page links to it, so it'
      } can only be opened by typing its address${row.inSitemap ? ' (search engines can still find it in the XML sitemap)' : ''}.</p>` +
        (row.hiddenFrom.length ? `<p class="psm-how__also">A hidden link to it sits on ${row.hiddenFrom.map((p) => `<a href="${esc(p)}">${esc(titles.get(p) || p)}</a>`).join(', ')}.</p>` : '')
    );
  return parts.join('');
}

function renderFrom(row, { titles }) {
  if (!row.from.length) return '';
  const list = row.from.map((p) => `<div role="listitem"><a href="${esc(p)}">${esc(titles.get(p) || p)}</a> <code>${esc(p)}</code></div>`).join('');
  return (
    `<details class="psm-from"><summary>Linked from ${plural(row.from.length, 'page')}${row.menu || row.footer || row.kind === 'home' ? ' (not counting the menu and footer)' : ''}</summary>` +
    `<div role="list">${list}</div></details>`
  );
}

function renderRow(row, ctx) {
  const [kindLabel, kindClass] = KIND[row.kind];
  const flags = [row.kind, row.inSitemap ? 'sitemap' : 'nositemap', row.menu ? 'menu' : '', row.footer ? 'footer' : ''].filter(Boolean);
  const search = [row.title, row.path, row.file, row.menu?.trail.join(' '), row.footer?.column, row.footer?.text].filter(Boolean).join(' ').toLowerCase();
  const href = row.path === NOT_FOUND ? '/404.html' : row.path;
  return (
    `<div role="listitem" class="psm-row" data-flags="${esc([...new Set(flags)].join(' '))}" data-search="${esc(search)}">` +
    `<div class="psm-page">` +
    `<a class="psm-page__title" href="${esc(href)}">${esc(row.title)}</a>` +
    `<code class="psm-page__path">${esc(row.path)}</code>` +
    `<span class="psm-page__file" title="The file this page is built from">${esc(row.file)}</span>` +
    `</div>` +
    `<div class="psm-how">${renderRoute(row, ctx)}${renderFrom(row, ctx)}</div>` +
    `<div class="psm-tags">` +
    `<span class="psm-tag psm-tag--${kindClass}">${kindLabel}</span>` +
    (row.date ? `<span class="psm-tag psm-tag--plain">${esc(fmtDate(row.date))}</span>` : '') +
    (row.inSitemap ? '' : `<span class="psm-tag psm-tag--muted" title="Search engines read the XML sitemaps to find pages">Not in XML sitemap</span>`) +
    (row.noindex ? `<span class="psm-tag psm-tag--muted">Hidden from search</span>` : '') +
    `</div>` +
    `</div>`
  );
}

// An old address, written with &#47; for its slashes: the copy rewrites every "/commerical-
// roofing/" it finds in a page to the corrected address (renamePaths), which would turn the
// old address into the new one when the site fixes run on this page again.
const oldAddress = (p) => esc(p).replace(/\//g, '&#47;');

export function renderSiteMap({ rows, redirects: moves, missing }) {
  const titles = new Map(rows.map((r) => [r.path, r.path === '/' ? 'Home' : r.title]));
  const blogRow = rows.find((r) => r.path === '/blog/');
  // "Top menu › Media › Blog", for the blog's listing pages.
  const ctx = { titles, blogMenu: blogRow?.menu ? `Top menu › ${blogRow.menu.trail.join(' › ')}` : '', blogPages: rows.filter((r) => BLOG_LIST.test(r.path)).length };
  const left = [...rows];
  const groups = GROUPS.map((g) => {
    const mine = left.filter((r) => g.test(r.path));
    for (const r of mine) left.splice(left.indexOf(r), 1);
    return { ...g, rows: sortRows(g.id, mine) };
  }).filter((g) => g.rows.length);
  const count = (k) => rows.filter((r) => r.kind === k).length;
  const stats = [
    ['Pages in the site', rows.length, ''],
    ['In the top menu', rows.filter((r) => r.menu).length, 'menu'],
    ['In the footer', rows.filter((r) => r.footer).length, 'footer'],
    ['Reached through links in pages', count('linked'), 'linked'],
    ['Not reachable by clicking from the home page', count('orphan'), 'orphan'],
    ['Not in the XML sitemaps', rows.filter((r) => !r.inSitemap).length, 'nositemap'],
  ];
  const filters = [
    ['all', 'All pages', rows.length],
    ['menu', 'Top menu', stats[1][1]],
    ['footer', 'Footer', stats[2][1]],
    ['linked', 'Linked from pages', stats[3][1]],
    ['orphan', 'Not reachable by clicking', stats[4][1]],
    ['nositemap', 'Not in XML sitemap', stats[5][1]],
  ];
  const missingGroups = new Map();
  for (const [p, file] of missing) {
    const key = SITEMAP_ONLY_EXCLUDE.find((x) => p.startsWith(x)) || p;
    if (!missingGroups.has(key)) missingGroups.set(key, { key, files: new Set(), count: 0, example: p });
    const g = missingGroups.get(key);
    g.count++;
    g.files.add(file);
  }

  return (
    `<div class="psm" id="every-page">` +
    `<p class="psm-lead">Every page on this site and how to get to it: where it sits in the top menu or footer, or the clicks that lead to it from the home page. ` +
    `Pages that can't be reached by clicking are marked, so none get missed. This list is rebuilt from the site's own files every time the site is built.</p>` +
    `<div role="list" class="psm-stats">${stats
      .map(([l, n, f]) => `<div role="listitem" class="psm-stat${f === 'orphan' && n ? ' psm-stat--warn' : ''}"><span class="psm-stat__n">${n.toLocaleString('en-US')}</span><span class="psm-stat__l">${esc(l)}</span></div>`)
      .join('')}</div>` +
    `<div class="psm-tools" data-psm-tools hidden>` +
    `<label class="psm-search"><span class="psm-sr">Search pages</span><input type="search" placeholder="Search by title, address or menu…" autocomplete="off" data-psm-search></label>` +
    `<div class="psm-filters" role="group" aria-label="Show">${filters
      .map(([f, l, n], i) => `<button type="button" class="psm-filter" data-psm-filter="${f}" aria-pressed="${i === 0}">${esc(l)} <span>${n}</span></button>`)
      .join('')}</div>` +
    `<p class="psm-count" aria-live="polite" data-psm-count></p>` +
    `</div>` +
    `<nav class="psm-jump" aria-label="Sections">${groups.map((g) => `<a href="#psm-${g.id}">${esc(g.title)} <span>${g.rows.length}</span></a>`).join('')}` +
    `<a href="#psm-redirects">Old addresses <span>${moves.length}</span></a>` +
    (missing.length ? `<a href="#psm-missing">Sitemap-only addresses <span>${missing.length.toLocaleString('en-US')}</span></a>` : '') +
    `</nav>` +
    groups
      .map(
        (g) =>
          `<section class="psm-group" id="psm-${g.id}" data-psm-group><h2 class="psm-group__title">${esc(g.title)} <span>${g.rows.length}</span></h2>` +
          (NOTES[g.id] ? `<p class="psm-group__note">${esc(NOTES[g.id])}</p>` : '') +
          `<div class="psm-head" aria-hidden="true"><span>Page</span><span>How to get there</span><span>Status</span></div>` +
          `<div role="list" class="psm-list">${g.rows.map((r) => renderRow(r, ctx)).join('')}</div></section>`
      )
      .join('') +
    `<p class="psm-empty" data-psm-empty hidden>No page matches. Try another search or filter.</p>` +
    `<section class="psm-group psm-extra" id="psm-redirects"><h2 class="psm-group__title">Old addresses that redirect <span>${moves.length}</span></h2>` +
    `<p class="psm-group__note">These addresses have no page of their own. Anyone who opens one is sent on to the page shown.</p>` +
    (moves.length
      ? `<div role="list" class="psm-list psm-list--moves">${moves
          .map(
            (r) =>
              `<div role="listitem" class="psm-move"><code class="psm-move__from">${oldAddress(r.from)}</code><span class="psm-sep" aria-hidden="true">→</span>` +
              `<a class="psm-move__to" href="${esc(r.to)}">${esc(titles.get(r.to) || r.to)} <code>${esc(r.to)}</code></a><span class="psm-move__why">${esc(r.why)}</span></div>`
          )
          .join('')}</div>`
      : `<p class="psm-group__note">None.</p>`) +
    `</section>` +
    (missing.length
      ? `<section class="psm-group psm-extra" id="psm-missing"><h2 class="psm-group__title">Addresses in the XML sitemaps with no page <span>${missing.length.toLocaleString('en-US')}</span></h2>` +
        `<p class="psm-group__note">The XML sitemaps (read by search engines) list these addresses, but this copy of the site has no page for them, so they show the "page not found" page.</p>` +
        `<div role="list" class="psm-list psm-list--missing">${[...missingGroups.values()]
          .map(
            (g) =>
              `<div role="listitem" class="psm-missing"><code>${esc(g.count > 1 ? `${g.key}…` : g.key)}</code><span>${plural(g.count, 'address', 'addresses')}` +
              `${g.count > 1 ? ` (for example <code>${esc(g.example)}</code>)` : ''}, listed in ${[...g.files]
                .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
                .map((f) => `<a href="/${esc(f)}">${esc(f)}</a>`)
                .join(', ')}` +
              `${SITEMAP_ONLY_EXCLUDE.includes(g.key) ? '. Left out of the copy on purpose: they are only in the sitemaps and no page links to them.' : '.'}</span></div>`
          )
          .join('')}</div></section>`
      : '') +
    `</div>`
  );
}

// ------------------------------------------------------------------ the public list
// Groups of the visitors' site map, in order: [title, test]. Pages no group takes go under
// "More pages"; the error page, the blog's numbered listing pages and the site check don't show.
const PUBLIC_GROUPS = [
  ['Roofing', (p) => /^\/(roofing\/|storm-damage\/|roofing-costs\/)/.test(p)],
  ['Commercial, solar and exteriors', (p) => /^\/(services|commercial-roofing|solar|solar-options|siding|gutters)\//.test(p)],
  ['Savings and support', (p) => /^\/(offers|financing|warranty|faqs|contact-us|referrals)\/$/.test(p)],
  ['Our company', (p) => /^\/(about|careers|charity-and-community|reviews|past-projects|service-areas)\/$/.test(p)],
  ['Local offices', (p) => p.startsWith('/locations/')],
  ['Media', (p) => /^\/(media|blog)\/$/.test(p)],
  ['Projects', (p) => p.startsWith('/blog/project/')],
  ['Legal', (p) => /^\/(privacy-policy|terms-and-conditions)\/$/.test(p)],
  ['Blog articles', (p) => /^\/blog\/[^/]+\/$/.test(p) && !BLOG_LIST.test(p)],
];
export function renderPublicSiteMap({ rows }) {
  const left = rows.filter((r) => r.path !== NOT_FOUND && r.path !== SITE_MAP_PATH && !BLOG_PAGE.test(r.path));
  const home = left.find((r) => r.path === '/');
  const groups = PUBLIC_GROUPS.map(([title, test]) => {
    const mine = left.filter((r) => r.path !== '/' && test(r.path));
    for (const r of mine) left.splice(left.indexOf(r), 1);
    return [title, mine];
  });
  const more = left.filter((r) => r.path !== '/');
  if (more.length) groups.splice(groups.length - 1, 0, ['More pages', more]);
  const byTitle = (a, b) => a.title.localeCompare(b.title);
  const item = (r) => `<div role="listitem"><a href="${esc(r.path)}">${esc(r.path === '/' ? 'Home' : r.title)}</a></div>`;
  return (
    `<div class="psm psm--public" id="every-page">` +
    `<p class="psm-lead">Every page on our site, in one place.${home ? ` Start at the <a href="/">home page</a>, or jump to a section:` : ''}</p>` +
    `<nav class="psm-jump" aria-label="Sections">${groups
      .filter(([, g]) => g.length)
      .map(([t, g], i) => `<a href="#psm-public-${i + 1}">${esc(t)} <span>${g.length}</span></a>`)
      .join('')}</nav>` +
    groups
      .filter(([, g]) => g.length)
      .map(([t, g], i) => {
        const sorted = t === 'Blog articles' ? [...g].sort((a, b) => (b.date || '').localeCompare(a.date || '') || byTitle(a, b)) : [...g].sort((a, b) => (a.path.split('/').length - b.path.split('/').length) || byTitle(a, b));
        return `<section class="psm-pgroup${t === 'Blog articles' ? ' psm-pgroup--wide' : ''}" id="psm-public-${i + 1}"><h2 class="psm-group__title">${esc(t)}</h2><div role="list" class="psm-plist">${sorted.map(item).join('')}</div></section>`;
      })
      .join('') +
    `</div>`
  );
}

/**
 * The site check (SITE_AUDIT_PATH): the full list, on a copy of the built /site-map/ page
 * with its own title and address, kept out of search engines.
 */
function auditPage(html, doc, data, siteOrigin) {
  const ed = makeEditor(html);
  const slot = find(doc, (c) => hasClass(c, 'site-rich'));
  ed.inner(slot, renderSiteMap(data));
  const head = find(doc, (c) => c.tagName === 'head');
  const url = siteOrigin + SITE_AUDIT_PATH;
  const title = 'Site Check | Panda Exteriors';
  const titleEl = findAll(head, (c) => c.tagName === 'title')[0];
  if (titleEl) ed.inner(titleEl, esc(title));
  let robots = false;
  for (const m of findAll(head, (c) => c.tagName === 'meta')) {
    const key = attr(m, 'property') || attr(m, 'name');
    if (key === 'robots') {
      ed.retag(m, m.attrs.map((a) => (a.name === 'content' ? { name: 'content', value: 'noindex, nofollow' } : a)));
      robots = true;
    } else if (key === 'og:url') ed.retag(m, m.attrs.map((a) => (a.name === 'content' ? { name: 'content', value: url } : a)));
    else if (key === 'og:title' || key === 'twitter:title') ed.retag(m, m.attrs.map((a) => (a.name === 'content' ? { name: 'content', value: title } : a)));
  }
  for (const l of findAll(head, (c) => c.tagName === 'link' && attr(c, 'rel') === 'canonical')) ed.retag(l, l.attrs.map((a) => (a.name === 'href' ? { name: 'href', value: url } : a)));
  // Structured data describing /site-map/ doesn't belong on the check.
  for (const sc of findAll(head, (c) => c.tagName === 'script' && attr(c, 'type') === 'application/ld+json')) ed.outer(sc, '');
  const has = (u) => findAll(head, (c) => attr(c, 'href') === u || attr(c, 'src') === u).length > 0;
  const headEnd = headEndOffset(html);
  ed.replace(
    headEnd,
    headEnd,
    (robots ? '' : '<meta name="robots" content="noindex, nofollow">') +
      (has(SITE_MAP_FILES['site-map.css']) ? '' : `<link rel="stylesheet" href="${SITE_MAP_FILES['site-map.css']}">`) +
      (has(SITE_MAP_FILES['site-map.js']) ? '' : `<script src="${SITE_MAP_FILES['site-map.js']}" defer></script>`)
  );
  return ed.apply();
}

/**
 * The Site Map page: the built /site-map/ page in siteDir with its list replaced by every
 * page of the site. Returns { html, pages, orphans } or null (with a warning) when the page
 * or its list is missing.
 */
export function buildSiteMapPage({ siteDir, siteOrigin }) {
  const file = path.join(siteDir, SITE_MAP_PATH, 'index.html');
  if (!fs.existsSync(file)) {
    console.warn(`site map: ${SITE_MAP_PATH} is not in the site, not rebuilt`);
    return null;
  }
  const html = fs.readFileSync(file, 'utf8');
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const slot = find(doc, (c) => hasClass(c, 'site-rich'));
  if (!slot?.sourceCodeLocation?.endTag) {
    console.warn(`site map: no list (.site-rich) found in ${SITE_MAP_PATH}, not rebuilt`);
    return null;
  }
  const data = collectSiteMap({ siteDir, siteOrigin });
  const ed = makeEditor(html);
  ed.inner(slot, renderPublicSiteMap(data));
  const head = find(doc, (c) => c.tagName === 'head');
  const has = (url) => findAll(head, (c) => attr(c, 'href') === url || attr(c, 'src') === url).length > 0;
  const headEnd = headEndOffset(html);
  if (headEnd < 0) throw new Error(`site map: ${SITE_MAP_PATH} has no </head>`);
  // The visitors' list needs the stylesheet only (the search and filters are the check's).
  for (const sc of findAll(head, (c) => c.tagName === 'script' && attr(c, 'src') === SITE_MAP_FILES['site-map.js'])) ed.outer(sc, '');
  ed.replace(headEnd, headEnd, has(SITE_MAP_FILES['site-map.css']) ? '' : `<link rel="stylesheet" href="${SITE_MAP_FILES['site-map.css']}">`);
  return {
    html: ed.apply(),
    audit: auditPage(html, doc, data, siteOrigin),
    pages: data.rows.length,
    orphans: data.rows.filter((r) => r.kind === 'orphan').map((r) => r.path),
  };
}

/** [source file, published URL] of the stylesheet and script. */
export const siteMapFiles = () => Object.entries(SITE_MAP_FILES).map(([name, url]) => [path.join(SITE_MAP_DIR, name), url]);
