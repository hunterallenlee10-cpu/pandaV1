// URL -> local file mapping. Paths are kept identical to the live site:
//   /roofing/            -> site/roofing/index.html
//   /wp-content/a.jpg    -> site/wp-content/a.jpg
//   https://fonts.gstatic.com/s/x.woff2 -> site/_external/fonts.gstatic.com/s/x.woff2
// A query string that only busts caches (?ver=6.5) is dropped from the file
// name (static servers ignore it, so the original reference still works). Any
// other query becomes part of the file name and references are rewritten.
import path from 'node:path';
import crypto from 'node:crypto';
import { CACHE_BUSTING_KEYS, isSiteUrl } from './config.mjs';

const CT_EXT = {
  'text/html': '.html',
  'application/xhtml+xml': '.html',
  'text/css': '.css',
  'text/javascript': '.js',
  'application/javascript': '.js',
  'application/x-javascript': '.js',
  'application/json': '.json',
  'application/ld+json': '.json',
  'application/manifest+json': '.webmanifest',
  'application/xml': '.xml',
  'text/xml': '.xml',
  'application/rss+xml': '.xml',
  'application/atom+xml': '.xml',
  'application/xslt+xml': '.xsl',
  'text/xsl': '.xsl',
  'text/plain': '.txt',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  'image/bmp': '.bmp',
  'image/tiff': '.tif',
  'font/woff2': '.woff2',
  'font/woff': '.woff',
  'application/font-woff': '.woff',
  'application/font-woff2': '.woff2',
  'application/x-font-woff': '.woff',
  'font/ttf': '.ttf',
  'application/x-font-ttf': '.ttf',
  'font/otf': '.otf',
  'application/x-font-otf': '.otf',
  'application/vnd.ms-fontobject': '.eot',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogv',
  'video/quicktime': '.mov',
  'audio/mpeg': '.mp3',
  'audio/ogg': '.ogg',
  'audio/wav': '.wav',
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'text/vtt': '.vtt',
};

// Extensions a static server maps to a sensible Content-Type.
export const STATIC_EXTS = new Set([
  '.html', '.htm', '.css', '.js', '.mjs', '.json', '.webmanifest', '.xml', '.xsl', '.txt', '.map',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.ico', '.bmp', '.tif', '.tiff', '.cur',
  '.woff2', '.woff', '.ttf', '.otf', '.eot',
  '.mp4', '.webm', '.ogv', '.mov', '.m4v', '.mp3', '.ogg', '.wav', '.m4a', '.vtt',
  '.pdf', '.zip', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.rtf', '.lottie',
]);

export const ASSET_EXT_RE =
  /\.(css|js|mjs|json|webmanifest|jpe?g|png|gif|webp|avif|svg|ico|bmp|tiff?|cur|woff2?|ttf|otf|eot|mp4|webm|ogv|mov|m4v|mp3|ogg|wav|m4a|vtt|pdf|zip|docx?|xlsx?|pptx?|csv|rtf|lottie|xsl|txt|map)$/i;

export const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|avif|svg|ico|bmp|tiff?)$/i;
export const VIDEO_EXT_RE = /\.(mp4|webm|ogv|mov|m4v)$/i;

export function extForContentType(ct) {
  return CT_EXT[String(ct || '').split(';')[0].trim().toLowerCase()] || '';
}

function safeDecode(p) {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
}

export function isCacheBustingQuery(search) {
  const q = String(search || '').replace(/^\?/, '');
  if (!q) return true;
  const params = new URLSearchParams(q);
  for (const key of params.keys()) if (!CACHE_BUSTING_KEYS.has(key.toLowerCase())) return false;
  return true;
}

function queryTag(search) {
  return `__q_${crypto.createHash('sha1').update(search).digest('hex').slice(0, 10)}`;
}

/** Local path (relative to site/, posix) for an HTML page / feed / text file on the main site. */
export function pageLocalPath(urlStr, contentType = 'text/html') {
  const url = new URL(urlStr);
  let p = safeDecode(url.pathname);
  const ct = String(contentType || '').toLowerCase();
  const isXml = /xml/.test(ct) && !/xhtml/.test(ct);
  const indexName = isXml ? 'index.xml' : 'index.html';
  let rel;
  if (p.endsWith('/')) rel = p + indexName;
  else if (/\.(html?)$/i.test(p)) rel = p;
  else if (isXml && /\.xml$/i.test(p)) rel = p;
  else if (!isXml && /html/.test(ct) && /\.[a-z0-9]{1,5}$/i.test(p) && !/\.(html?)$/i.test(p)) rel = `${p}/index.html`;
  else if (/\.[a-z0-9]{1,5}$/i.test(p) && !/html/.test(ct)) rel = p;
  else rel = `${p}/${indexName}`;
  return rel.replace(/^\/+/, '');
}

/**
 * Local path for an asset (site or localized third-party).
 * Returns { rel, renamed } where `renamed` means references must be rewritten
 * to point at the new file name (query in name, or extension appended).
 */
export function assetLocalPath(urlStr, contentType = '') {
  const url = new URL(urlStr);
  const onSite = isSiteUrl(url);
  const prefix = onSite ? '' : `_external/${url.host.toLowerCase()}`;
  let p = safeDecode(url.pathname);
  let renamed = !onSite;
  const ctExt = extForContentType(contentType);
  if (p.endsWith('/')) {
    p += `index${ctExt || '.html'}`;
    renamed = true;
  }
  let ext = path.posix.extname(p).toLowerCase();
  let base = p.slice(0, p.length - ext.length);
  if (url.search && (!onSite || !isCacheBustingQuery(url.search))) {
    base += queryTag(url.search);
    renamed = true;
  }
  // Make sure a static server will send a usable Content-Type.
  const scriptExt = /^\.(php\d?|aspx?|jsp|cgi|pl|cfm)$/i.test(ext);
  if ((!ext || scriptExt || !STATIC_EXTS.has(ext)) && ctExt) {
    if (ext && !scriptExt && !/^\.[a-z0-9]{1,6}$/i.test(ext)) {
      // "extension" that is really part of the name (e.g. file.name-with.dots)
      base += ext;
    } else if (ext) {
      base += ext;
    }
    ext = ctExt;
    renamed = true;
  }
  const rel = `${prefix}${base}${ext}`.replace(/^\/+/, '').replace(/\/{2,}/g, '/');
  return { rel, renamed };
}

/** URL path (root-relative, percent-encoded) for a local file path relative to site/. */
export function relToUrlPath(rel) {
  return '/' + rel.split('/').map((seg) => encodeURIComponent(seg).replace(/%40/g, '@').replace(/%2B/g, '+')).join('/');
}

/** Short, filesystem-safe slug for a page URL (used for screenshot file names). */
export function slugForUrl(urlStr) {
  const url = new URL(urlStr);
  let s = safeDecode(url.pathname).replace(/^\/+|\/+$/g, '');
  if (!s) s = 'home';
  s = s.replace(/[^a-zA-Z0-9._-]+/g, '_');
  if (url.search) s += queryTag(url.search);
  if (s.length > 120) s = s.slice(0, 100) + '_' + crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
  return s;
}
