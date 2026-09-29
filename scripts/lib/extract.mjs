// Extraction helpers: find every URL a page (or stylesheet, or script) refers to.
import { parse } from 'parse5';
import { SITE_HOST, SITE_PORT, SITE_ORIGIN, isSiteUrl } from './config.mjs';
import { ASSET_EXT_RE } from './paths.mjs';

export function parseHtml(html) {
  return parse(html, { sourceCodeLocationInfo: true });
}

export function walk(node, fn) {
  fn(node);
  for (const child of node.childNodes || []) walk(child, fn);
  if (node.content) walk(node.content, fn); // <template>
}

export function attrName(a) {
  return a.prefix ? `${a.prefix}:${a.name}` : a.name;
}

export function attrMap(node) {
  const m = {};
  for (const a of node.attrs || []) m[attrName(a)] = a.value;
  return m;
}

export function textContent(node) {
  let s = '';
  walk(node, (n) => {
    if (n.nodeName === '#text') s += n.value;
  });
  return s;
}

const SKIP_SCHEMES = /^(data:|blob:|javascript:|mailto:|tel:|sms:|about:|#|\{\{|\$\{)/i;

export function resolveUrl(ref, base) {
  if (ref == null) return null;
  ref = String(ref).trim();
  if (!ref || SKIP_SCHEMES.test(ref)) return null;
  try {
    const u = new URL(ref, base);
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.href;
  } catch {
    return null;
  }
}

// WHATWG srcset parsing, returning positions so values can be rewritten in place.
export function parseSrcset(input) {
  const out = [];
  const s = String(input || '');
  const isSpace = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f';
  let pos = 0;
  while (pos < s.length) {
    while (pos < s.length && (isSpace(s[pos]) || s[pos] === ',')) pos++;
    if (pos >= s.length) break;
    const start = pos;
    while (pos < s.length && !isSpace(s[pos])) pos++;
    let url = s.slice(start, pos);
    let descriptor = '';
    if (url.endsWith(',')) {
      url = url.replace(/,+$/, '');
    } else {
      const dStart = pos;
      let depth = 0;
      while (pos < s.length) {
        const c = s[pos];
        if (c === '(') depth++;
        else if (c === ')') depth = Math.max(0, depth - 1);
        else if (c === ',' && depth === 0) break;
        pos++;
      }
      descriptor = s.slice(dStart, pos).trim();
      pos++;
    }
    if (url) out.push({ url, descriptor, start, end: start + url.length });
  }
  return out;
}

// url(...), @import "..." and image-set("...") references inside CSS, with
// the offsets of the URL text so it can be replaced.
export function cssRefs(css) {
  const text = String(css || '');
  const comments = [];
  for (const m of text.matchAll(/\/\*[\s\S]*?\*\//g)) comments.push([m.index, m.index + m[0].length]);
  const inComment = (i) => comments.some(([a, b]) => i >= a && i < b);
  const refs = [];
  const push = (m, groups) => {
    for (const g of groups) {
      if (m[g] === undefined || !m.indices[g]) continue;
      const [start, end] = m.indices[g];
      if (inComment(start)) return;
      const raw = m[g];
      const url = raw.replace(/\\([^0-9a-fA-F\n])/g, '$1').trim();
      if (url) refs.push({ url, start, end, raw });
      return;
    }
  };
  const reUrl = /url\(\s*(?:"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|((?:[^)\s"'\\]|\\.)*))\s*\)/dgi;
  for (const m of text.matchAll(reUrl)) push(m, [1, 2, 3]);
  const reImport = /@import\s+(?:"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)')/dgi;
  for (const m of text.matchAll(reImport)) push(m, [1, 2]);
  const reImageSet = /image-set\(([^)]*)\)/gi;
  for (const m of text.matchAll(reImageSet)) {
    const inner = m[1];
    const innerStart = m.index + m[0].indexOf(inner);
    for (const s of inner.matchAll(/(?:^|[\s,])(?:"([^"]*)"|'([^']*)')/dg)) {
      const g = s[1] !== undefined ? 1 : 2;
      const [a, b] = s.indices[g];
      refs.push({ url: s[g], start: innerStart + a, end: innerStart + b, raw: s[g] });
    }
  }
  refs.sort((a, b) => a.start - b.start);
  return refs.filter((r, i) => !(i && r.start === refs[i - 1].start));
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const PATH_CHARS = '[^\\s"\'<>()\\[\\]{}\\\\,|^`]';
// Absolute / protocol-relative main-site URLs in any text (JS, JSON, CSS),
// including the JSON-escaped form https:\/\/example.com\/path
export function siteUrlRegex() {
  const port = SITE_PORT ? `:${SITE_PORT}` : '(?::\\d+)?';
  return new RegExp(
    `(?:https?:)?(?:\\\\?\\/){2}(?:www\\.)?${escapeRe(SITE_HOST)}(?![a-z0-9-]|\\.[a-z0-9])${port}((?:\\\\?\\/${PATH_CHARS}*)*)`,
    'gi',
  );
}

const ROOT_REL_WP = new RegExp(`(?:^|[\\s"'(,=])((?:\\\\?\\/)(?:wp-content|wp-includes)(?:\\\\?\\/${PATH_CHARS}*)+)`, 'g');

function unescapeJsUrl(s) {
  return s
    .replace(/\\\//g, '/')
    .replace(/\\u002[fF]/g, '/')
    .replace(/&amp;/g, '&')
    .replace(/\\u0026/g, '&');
}

/** Main-site URLs mentioned anywhere in a blob of text (absolute + /wp-content/ paths). */
export function siteUrlsInText(text) {
  const out = new Set();
  const t = String(text || '');
  for (const m of t.matchAll(siteUrlRegex())) {
    const p = unescapeJsUrl(m[1] || '/');
    const abs = resolveUrl(p || '/', SITE_ORIGIN + '/');
    if (abs) out.add(abs);
  }
  for (const m of t.matchAll(ROOT_REL_WP)) {
    const abs = resolveUrl(unescapeJsUrl(m[1]), SITE_ORIGIN + '/');
    if (abs) out.add(abs);
  }
  return [...out];
}

export function looksLikeAsset(u) {
  try {
    return ASSET_EXT_RE.test(new URL(u).pathname);
  } catch {
    return false;
  }
}

const LINK_ASSET_RELS = new Set([
  'stylesheet', 'icon', 'shortcut', 'apple-touch-icon', 'apple-touch-icon-precomposed', 'mask-icon',
  'manifest', 'preload', 'prefetch', 'modulepreload', 'image_src', 'fluid-icon', 'alternate stylesheet',
]);
const META_IMAGE_KEYS = new Set([
  'og:image', 'og:image:url', 'og:image:secure_url', 'og:video', 'og:video:url', 'og:video:secure_url', 'og:audio',
  'twitter:image', 'twitter:image:src', 'twitter:player:stream', 'msapplication-tileimage',
  'msapplication-square70x70logo', 'msapplication-square150x150logo', 'msapplication-wide310x150logo',
  'msapplication-square310x310logo', 'thumbnail', 'image', 'thumbnailurl',
]);
const DOWNLOAD_EXT_RE = /\.(pdf|zip|docx?|xlsx?|pptx?|csv|rtf|jpe?g|png|gif|webp|avif|svg|mp4|webm|mov|mp3|txt)$/i;

// Attributes that hold a single URL. data-* attributes are matched by exact
// name or by a URL-ish suffix, never by prefix: data-lazy-sizes,
// data-large_image_width or data-image-title hold text, not URLs.
const DATA_URL_ATTR =
  /^data-(src|lazy-src|original|orig-file|medium-file|large-file|full-url|large_image|bg|background|image|img|thumb|thumbnail|poster|video|mp4|webm|full|url|href|link|lazyload|splash|rocket-src|fallback)$|^data-[a-z0-9_-]*-(src|url|image|img|bg|background|poster|thumb|video)$/;

function isUrlAttr(name) {
  return (
    name === 'src' || name === 'href' || name === 'poster' || name === 'data' || name === 'xlink:href' ||
    name === 'background' || /(^|-)src$/.test(name) || DATA_URL_ATTR.test(name)
  );
}

/** Does an attribute value look like a URL at all (and not a size hint, number, MIME type or caption)? */
export function looksLikeUrlValue(v) {
  v = String(v || '').trim();
  if (!v || /\s/.test(v)) return false;
  if (/^\d+(\.\d+)?(px|%|w|x)?$/i.test(v)) return false;
  if (/^(image|video|audio|font|text|application)\/[\w.+-]+$/i.test(v)) return false;
  return /^(https?:)?\/\//i.test(v) || /^\.{0,2}\//.test(v) || /\.[a-z0-9]{2,5}([?#]|$)/i.test(v);
}

/** Heuristic for an already-resolved URL that came from a text-ish attribute. */
export function isPlausibleAssetUrl(u) {
  let p;
  try {
    p = new URL(u).pathname;
  } catch {
    return false;
  }
  try {
    p = decodeURIComponent(p);
  } catch {}
  if (/[()\s]/.test(p) && !ASSET_EXT_RE.test(p)) return false; // "(max-width: 1000px) 100vw", captions
  if (/\/\d+$/.test(p)) return false; // bare widths/heights resolved against the page
  if (/\/(image|video|audio|font|text|application)\/[a-z0-9.+-]+$/i.test(p)) return false; // MIME types
  return true;
}

/**
 * Parse an HTML document and return everything it references.
 * links:    navigational links (a/area/site iframes) — candidates for the page crawl
 * assets:   Map<absUrl, Set<kind>> — files the page needs
 * external: third-party references (iframes / scripts / styles) with context
 */
export function extractFromHtml(html, pageUrl) {
  const doc = parseHtml(html);
  let base = pageUrl;
  walk(doc, (n) => {
    if (n.tagName === 'base' && base === pageUrl) {
      const href = attrMap(n).href;
      const abs = href && resolveUrl(href, pageUrl);
      if (abs) base = abs;
    }
  });

  const links = new Set();
  const assets = new Map();
  const external = [];
  const feeds = new Set();
  const info = { title: '', canonical: '', generator: [], apiBase: '', robotsMeta: '', lang: '' };

  const addAsset = (ref, kind, b = base) => {
    const abs = resolveUrl(ref, b);
    if (!abs) return;
    if (!assets.has(abs)) assets.set(abs, new Set());
    assets.get(abs).add(kind);
  };
  const addCss = (css, kind, b = base) => {
    for (const r of cssRefs(css)) addAsset(r.url, kind, b);
  };
  const addTextUrls = (text, kind) => {
    for (const u of siteUrlsInText(text)) if (looksLikeAsset(u)) addAsset(u, kind, SITE_ORIGIN + '/');
  };

  walk(doc, (node) => {
    if (!node.tagName) return;
    const tag = node.tagName;
    const a = attrMap(node);

    if (tag === 'html' && a.lang) info.lang = a.lang;
    if (tag === 'title' && !info.title) info.title = textContent(node).trim();

    // Generic attribute handling
    for (const [name, value] of Object.entries(a)) {
      if (!value) continue;
      if (name === 'style') {
        addCss(value, 'inline-style');
        continue;
      }
      if (/srcset$/i.test(name)) {
        for (const c of parseSrcset(value)) addAsset(c.url, `${tag}[${name}]`);
        continue;
      }
      if (tag === 'a' || tag === 'area' || tag === 'link' || tag === 'form' || tag === 'iframe' || tag === 'frame' || tag === 'meta' || tag === 'base') {
        // handled below
      } else if (isUrlAttr(name) && (!name.startsWith('data-') || looksLikeUrlValue(value))) {
        addAsset(value, `${tag}[${name}]`);
      }
      if (/^data-/.test(name) && /https?:|\\\/|\/wp-content\//.test(value)) addTextUrls(value, `${tag}[${name}]`);
    }

    switch (tag) {
      case 'a':
      case 'area': {
        const abs = resolveUrl(a.href, base);
        if (!abs) break;
        const p = new URL(abs).pathname;
        if (isSiteUrl(abs) && DOWNLOAD_EXT_RE.test(p)) addAsset(abs, 'download');
        else links.add(abs);
        break;
      }
      case 'link': {
        const rel = (a.rel || '').toLowerCase().trim();
        const abs = resolveUrl(a.href, base);
        if (a.imagesrcset) for (const c of parseSrcset(a.imagesrcset)) addAsset(c.url, 'link[imagesrcset]');
        if (!abs) break;
        if (rel === 'canonical') info.canonical = abs;
        if (rel === 'https://api.w.org/') info.apiBase = abs;
        if (rel === 'alternate' && /rss|atom/.test(a.type || '')) feeds.add(abs);
        const rels = rel.split(/\s+/);
        if (rels.some((r) => LINK_ASSET_RELS.has(r)) || LINK_ASSET_RELS.has(rel)) {
          addAsset(abs, `link[rel=${rel}]`);
          if (!isSiteUrl(abs)) external.push({ kind: `link:${rel}`, url: abs });
        }
        break;
      }
      case 'meta': {
        const key = (a.property || a.name || a.itemprop || '').toLowerCase();
        if (key === 'generator' && a.content) info.generator.push(a.content);
        if (key === 'robots' && a.content) info.robotsMeta = a.content;
        if (META_IMAGE_KEYS.has(key) && a.content) addAsset(a.content, `meta[${key}]`);
        if ((a['http-equiv'] || '').toLowerCase() === 'refresh' && a.content) {
          const m = /url\s*=\s*['"]?([^'"]+)/i.exec(a.content);
          if (m) {
            const abs = resolveUrl(m[1], base);
            if (abs) links.add(abs);
          }
        }
        break;
      }
      case 'iframe':
      case 'frame': {
        const src = a.src || a['data-src'] || a['data-lazy-src'] || a['data-rocket-src'];
        const abs = resolveUrl(src, base);
        if (!abs) break;
        if (isSiteUrl(abs)) links.add(abs);
        else external.push({ kind: 'iframe', url: abs, title: a.title || '' });
        break;
      }
      case 'script': {
        const type = (a.type || '').toLowerCase();
        const src = a.src || a['data-src'] || a['data-rocket-src'] || a['data-lazy-src'];
        const text = textContent(node);
        if (src) {
          const abs = resolveUrl(src, base);
          if (abs) {
            addAsset(abs, 'script');
            if (!isSiteUrl(abs)) external.push({ kind: 'script', url: abs });
          }
        }
        if (text) addTextUrls(text, type === 'application/ld+json' ? 'json-ld' : 'inline-script');
        break;
      }
      case 'style':
        addCss(textContent(node), 'inline-style');
        break;
      case 'noscript':
        // With scripting enabled parse5 keeps <noscript> content as text; parse it too.
        {
          const inner = textContent(node);
          if (inner && /<(img|iframe|source|link|video)/i.test(inner)) {
            const sub = extractFromHtml(inner, base);
            for (const [u, kinds] of sub.assets) for (const k of kinds) addAsset(u, `noscript:${k}`);
            external.push(...sub.external.map((e) => ({ ...e, kind: `noscript:${e.kind}` })));
          }
        }
        break;
      case 'embed':
      case 'object':
      case 'video':
      case 'audio':
      case 'source': {
        const src = a.src || a.data;
        const abs = resolveUrl(src, base);
        if (abs && !isSiteUrl(abs)) external.push({ kind: tag, url: abs });
        break;
      }
      default:
        break;
    }
  });

  return { doc, base, links, assets, external, feeds, info };
}

const FORM_PLUGINS = [
  [/wpcf7/, 'Contact Form 7'],
  [/gform/, 'Gravity Forms'],
  [/wpforms/, 'WPForms'],
  [/elementor-form/, 'Elementor Forms'],
  [/frm-show-form|frm_forms/, 'Formidable Forms'],
  [/nf-form/, 'Ninja Forms'],
  [/fluentform|ff-el-form/, 'Fluent Forms'],
  [/forminator/, 'Forminator'],
  [/hs-form|hbspt/, 'HubSpot Forms'],
  [/search-form|searchform|role=search/, 'Site search'],
  [/comment-form|commentform/, 'WordPress comments'],
  [/mc4wp|mailchimp|mc-embedded/, 'Mailchimp'],
];

/** Every <form> in a parsed document: action, method, and fields. */
export function extractForms(doc) {
  const labels = {};
  walk(doc, (n) => {
    if (n.tagName === 'label') {
      const f = attrMap(n).for;
      if (f) labels[f] = textContent(n).replace(/\s+/g, ' ').trim();
    }
  });
  const forms = [];
  walk(doc, (n) => {
    if (n.tagName !== 'form') return;
    const a = attrMap(n);
    const sig = `${a.id || ''} ${a.class || ''} ${a.name || ''} ${a.role ? 'role=' + a.role : ''} ${a.action || ''}`.toLowerCase();
    const plugin = (FORM_PLUGINS.find(([re]) => re.test(sig)) || [null, 'Custom / unknown'])[1];
    const fields = [];
    walk(n, (f) => {
      if (!['input', 'select', 'textarea', 'button'].includes(f.tagName)) return;
      const fa = attrMap(f);
      const type = (fa.type || (f.tagName === 'input' ? 'text' : f.tagName)).toLowerCase();
      let label = (fa.id && labels[fa.id]) || fa['aria-label'] || fa.placeholder || '';
      if (!label && (type === 'submit' || f.tagName === 'button')) label = fa.value || textContent(f).replace(/\s+/g, ' ').trim();
      fields.push({
        tag: f.tagName,
        type,
        name: fa.name || '',
        id: fa.id || '',
        required: 'required' in fa || fa['aria-required'] === 'true',
        label: label.slice(0, 80),
      });
    });
    forms.push({
      id: a.id || '',
      name: a.name || '',
      className: a.class || '',
      action: a.action ?? '',
      method: (a.method || 'get').toLowerCase(),
      enctype: a.enctype || '',
      plugin,
      fields,
    });
  });
  return forms;
}
