// Keeps the XML sitemaps in step with the pages actually in site/ (a site fix: SITE_FIXES).
//
// The sitemaps were captured from the live site, which lists ~5,500 auto-generated project
// posts the copy leaves out on purpose (SITEMAP_ONLY_EXCLUDE), and doesn't list the blog
// posts published after the capture of the sitemaps or the pages the copy adds (/media/).
// syncSitemaps, run on a built site/ (03-build.mjs and scripts/tools/update-built-site.mjs,
// before the site check reads the sitemaps):
//
//  - drops every entry whose page isn't in site/ (a file in site/, like locations.kml, counts);
//  - adds every indexable page no sitemap lists (noindex pages, the 404 page and the blog's
//    numbered listing pages aside, as on the live site): blog posts to post-sitemap.xml,
//    project pages to the first project sitemap, the rest to page-sitemap.xml, with the
//    page's own modified date (NEW_PAGES_DATE when it has none);
//  - deletes the sitemaps left empty and takes them out of sitemap_index.xml, whose dates
//    become those of the newest entry of each sitemap;
//  - points the sitemaps' stylesheet at /main-sitemap.xsl on the same host: the live site
//    writes //pandaexteriors.com/main-sitemap.xsl, which a browser won't apply on another
//    host, so the copy's sitemaps showed unstyled;
//  - writes locations.kml (listed by local-sitemap.xml): on the live site it is an empty
//    sitemap header, not KML; it becomes a KML file with a placemark for each office.
import fs from 'node:fs';
import path from 'node:path';
import { isSiteUrl } from './config.mjs';
import { officePages, NEW_PAGES_DATE } from './new-pages.mjs';
import { listFiles } from './util.mjs';

const NOT_PAGES = /^(_raw|_custom|_external|wp-content|wp-includes)\//;
const LOC = /<loc>\s*([^<\s]+)\s*<\/loc>/;
const URL_ENTRY = /[ \t]*<url>([\s\S]*?)<\/url>[ \t]*\r?\n?/g;
const SITEMAP_ENTRY = /[ \t]*<sitemap>([\s\S]*?)<\/sitemap>[ \t]*\r?\n?/g;
const KML_FILE = 'locations.kml';

const escapeXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sitemapNumber = (name) => Number(/(\d+)\.xml$/.exec(name)?.[1] || 0);

/** The indexable pages of site/: path -> lastmod. */
function builtPages(siteDir) {
  const pages = new Map();
  for (const f of listFiles(siteDir, (x) => x.endsWith('index.html'))) {
    const rel = path.relative(siteDir, f).split(path.sep).join('/');
    if (NOT_PAGES.test(rel)) continue;
    const p = '/' + rel.replace(/index\.html$/, '');
    const html = fs.readFileSync(f, 'utf8');
    const robots = /<meta[^>]+name=["']robots["'][^>]*>/i.exec(html)?.[0] || '';
    const noindex = /noindex/i.test(robots);
    const modified =
      /<meta[^>]+property=["']article:modified_time["'][^>]+content=["']([^"']+)/i.exec(html)?.[1] ||
      /"dateModified":\s*"([^"]+)"/.exec(html)?.[1] ||
      /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)/i.exec(html)?.[1];
    pages.set(p, { noindex, lastmod: modified || NEW_PAGES_DATE });
  }
  return pages;
}

/** Which sitemap an unlisted page belongs in. */
function sitemapFor(p, names) {
  if (p.startsWith('/blog/project/')) return names.filter((n) => /^project-sitemap\d*\.xml$/.test(n)).sort((a, b) => sitemapNumber(a) - sitemapNumber(b))[0] || 'page-sitemap.xml';
  if (p.startsWith('/blog/') && p !== '/blog/') return 'post-sitemap.xml';
  return 'page-sitemap.xml';
}

/** The office placemarks, as KML (children in the order the KML 2.2 schema sets). */
export function locationsKml(siteOrigin) {
  const placemarks = officePages().map(({ path: p, office: o }) =>
    [
      '\t\t<Placemark>',
      `\t\t\t<name>${escapeXml(`Panda Exteriors ${o.city}, ${o.state}`)}</name>`,
      `\t\t\t<atom:link href="${escapeXml(siteOrigin + p)}"/>`,
      `\t\t\t<address>${escapeXml(`${o.street}, ${o.locality}`)}</address>`,
      `\t\t\t<phoneNumber>${escapeXml(o.phone)}</phoneNumber>`,
      `\t\t\t<description>${escapeXml(`Roofing, solar, siding and gutters in ${o.name}. ${siteOrigin}${p}`)}</description>`,
      `\t\t\t<Point><coordinates>${o.at[1]},${o.at[0]},0</coordinates></Point>`,
      '\t\t</Placemark>',
    ].join('\n'),
  );
  if (!placemarks.length) return null;
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
    '\t<Document>\n' +
    '\t\t<name>Panda Exteriors</name>\n' +
    `\t\t<atom:link href="${escapeXml(siteOrigin + '/')}"/>\n` +
    placemarks.join('\n') +
    '\n\t</Document>\n</kml>\n'
  );
}

/** Syncs the XML sitemaps of site/ with its pages; returns what changed. */
export function syncSitemaps(siteDir, siteOrigin, { dryRun = false } = {}) {
  const result = { edited: [], deleted: [], dropped: 0, added: [], kml: false };
  const indexFile = path.join(siteDir, 'sitemap_index.xml');
  const names = fs.readdirSync(siteDir).filter((n) => n.endsWith('.xml') && n !== 'sitemap_index.xml');
  const files = new Map(); // name -> { before, xml }
  for (const n of names) {
    const xml = fs.readFileSync(path.join(siteDir, n), 'utf8');
    if (/<urlset\b/.test(xml)) files.set(n, { before: xml, xml });
  }
  if (!files.size) return result;
  const pages = builtPages(siteDir);
  const exists = (p) => pages.has(p) || (p !== '/' && !p.endsWith('/') && fs.existsSync(path.join(siteDir, decodeURIComponent(p))));

  // Entries without a page out.
  const listed = new Set();
  for (const f of files.values()) {
    f.xml = f.xml.replace(URL_ENTRY, (m, inner) => {
      let loc;
      try {
        loc = new URL(LOC.exec(inner)?.[1]);
      } catch {
        return m;
      }
      if (!isSiteUrl(loc)) return m;
      if (!exists(loc.pathname)) {
        result.dropped++;
        return '';
      }
      listed.add(loc.pathname);
      return m;
    });
  }

  // Indexable pages no sitemap lists in.
  const add = new Map();
  for (const [p, page] of pages) {
    if (page.noindex || listed.has(p) || /^\/blog\/page\/\d+\/$/.test(p)) continue;
    const name = sitemapFor(p, [...files.keys()]);
    if (!files.has(name)) continue;
    if (!add.has(name)) add.set(name, []);
    add.get(name).push({ path: p, lastmod: page.lastmod });
  }
  for (const [name, list] of add) {
    list.sort((a, b) => (a.lastmod < b.lastmod ? 1 : a.lastmod > b.lastmod ? -1 : a.path.localeCompare(b.path)));
    const entries = list.map((e) => `\t<url>\n\t\t<loc>${siteOrigin}${e.path}</loc>\n\t\t<lastmod>${e.lastmod}</lastmod>\n\t</url>\n`).join('');
    const f = files.get(name);
    f.xml = f.xml.replace(/<\/urlset>/, `${entries}</urlset>`);
    result.added.push(...list.map((e) => e.path));
  }

  // The stylesheet on the same host.
  const sameHostXsl = (xml) =>
    xml.replace(/(<\?xml-stylesheet\b[^>]*\bhref=")([^"]+)(")/, (m, a, href, b) => {
      try {
        const u = new URL(href, siteOrigin + '/');
        return isSiteUrl(u) ? a + u.pathname + b : m;
      } catch {
        return m;
      }
    });
  for (const f of files.values()) f.xml = sameHostXsl(f.xml);

  // Write them; the empty ones go.
  const lastmods = new Map();
  for (const [name, f] of files) {
    const file = path.join(siteDir, name);
    if (!/<url>/.test(f.xml)) {
      result.deleted.push(name);
      if (!dryRun) fs.rmSync(file);
      continue;
    }
    const dates = [...f.xml.matchAll(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/g)].map((m) => m[1]).sort();
    if (dates.length) lastmods.set(name, dates[dates.length - 1]);
    if (f.xml !== f.before) {
      result.edited.push(name);
      if (!dryRun) fs.writeFileSync(file, f.xml);
    }
  }

  // The index: the deleted sitemaps out, the newest date of each one in.
  if (fs.existsSync(indexFile)) {
    const before = fs.readFileSync(indexFile, 'utf8');
    let xml = sameHostXsl(before).replace(SITEMAP_ENTRY, (m, inner) => {
      let loc;
      try {
        loc = new URL(LOC.exec(inner)?.[1]);
      } catch {
        return m;
      }
      const name = loc.pathname.replace(/^\//, '');
      if (!isSiteUrl(loc) || !files.has(name)) return m;
      if (result.deleted.includes(name)) return '';
      const date = lastmods.get(name);
      return date ? m.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${date}</lastmod>`) : m;
    });
    if (xml !== before) {
      result.edited.push('sitemap_index.xml');
      if (!dryRun) fs.writeFileSync(indexFile, xml);
    }
  }

  // locations.kml, when a sitemap lists it.
  if ([...files.values()].some((f) => f.xml.includes(`${siteOrigin}/${KML_FILE}<`))) {
    const kml = locationsKml(siteOrigin);
    const file = path.join(siteDir, KML_FILE);
    if (kml && (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== kml)) {
      result.kml = true;
      if (!dryRun) fs.writeFileSync(file, kml);
    }
  }
  return result;
}
