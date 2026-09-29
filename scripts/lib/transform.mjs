// Surgical HTML rewriting. The document is parsed with source offsets and only
// the exact spans that need changing are replaced, so everything else - head
// metadata, JSON-LD, whitespace, comments - stays byte-for-byte identical.
//
// What changes:
//  * resource / navigation URLs on the main site -> root-relative (/path)
//  * localized third-party files (Google Fonts, CDN libraries) -> /_external/<host>/…
//  * files stored under a different name (significant query / added extension)
//  * analytics / ads / call-tracking snippets -> commented out behind
//    <!-- TRACKING DISABLED … --> (plus a tiny no-op stub so on-page code that
//    calls gtag()/fbq()/dataLayer.push() does not throw)
// What is deliberately left alone:
//  * canonical / alternate / shortlink / hreflang / prev/next <link>s
//  * every <meta> value (OG / Twitter / description …) and JSON-LD
//  * links to excluded sub-sites and back-end URLs (kept absolute, live)
import { parseHtml, walk, attrMap, attrName, parseSrcset, cssRefs, resolveUrl, textContent, siteUrlRegex } from './extract.mjs';
import { TRACKER_INLINE, trackerFor } from './config.mjs';

const KEEP_LINK_REL =
  /(^|\s)(canonical|alternate|shortlink|pingback|edituri|wlwmanifest|https:\/\/api\.w\.org\/|preconnect|dns-prefetch|next|prev|profile|author|me|publisher|license|search|archives|index|start)(\s|$)/i;
const SINGLE_URL_ATTR =
  /^(href|src|poster|data|action|formaction|background|xlink:href|longdesc|manifest|lowsrc|dynsrc|data-(?:[a-z0-9_]*-)?(?:src|href|url|link|bg|background|background-image|bg-image|image|img|thumb|thumbnail|poster|video|mp4|webm|full|large|large_image|original|orig-file|medium-file|large-file|full-url|lazyload|splash|mobile-src|desktop-src|fallback))$/i;
const SRCSET_ATTR = /(^|-)srcset$/i;

const ABS_RE = /^\s*(https?:)?\/\//i;

// Removing links into excluded sub-sites: a link inside running text is
// unwrapped (the words stay); any other link is removed together with every
// container it leaves without visible content. Carousel navigation (arrows,
// dots, live region) doesn't count as content of its own.
const CAROUSEL_CHROME =
  /(^|\s)(swiper-(button|pagination|notification|scrollbar)[\w-]*|swipper-buttons|slick-(arrow|dots)|owl-(nav|dots)|carousel__(nav|button|arrow|dots)[\w-]*)(\s|$)/i;
const VISIBLE_ELEMENTS = new Set(['img', 'picture', 'video', 'audio', 'iframe', 'svg', 'canvas', 'input', 'select', 'textarea', 'button', 'object', 'embed']);
const INLINE_PARENTS = new Set(['p', 'span', 'em', 'strong', 'b', 'i', 'u', 'small', 'label', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figcaption', 'blockquote', 'dd', 'dt', 'caption', 'cite', 'q']);
const STOP_AT = new Set(['body', 'html', 'main', 'header', 'footer']);

function hasVisibleContent(node, skip) {
  if (skip.has(node)) return false;
  if (node.nodeName === '#text') return node.value.replace(/[\s\u200b\u00a0\ufeff]+/g, '') !== '';
  if (!node.tagName || ['script', 'style', 'template', 'noscript'].includes(node.tagName)) return false;
  if (CAROUSEL_CHROME.test(attrMap(node).class || '')) return false;
  if (VISIBLE_ELEMENTS.has(node.tagName)) return true;
  return (node.childNodes || []).some((c) => hasVisibleContent(c, skip));
}

const STUB =
  '<script>/* TRACKING DISABLED: no-op stand-ins so site code that calls these does not throw; nothing is sent anywhere. */' +
  'window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){};window.ga=window.ga||function(){};' +
  'window.fbq=window.fbq||function(){};window._fbq=window._fbq||window.fbq;window.clarity=window.clarity||function(){};' +
  'window.uetq=window.uetq||[];window.lintrk=window.lintrk||function(){};window.ttq=window.ttq||{load:function(){},page:function(){},track:function(){},identify:function(){}};' +
  'window.pintrk=window.pintrk||function(){};window.twq=window.twq||function(){};window.snaptr=window.snaptr||function(){};window.rdt=window.rdt||function(){};' +
  '</script>';

const ID_PATTERNS = [
  [/\bGTM-[A-Z0-9]{4,10}\b/g, 0],
  [/\bG-[A-Z0-9]{6,14}\b/g, 0],
  [/\bUA-\d{4,10}-\d{1,4}\b/g, 0],
  [/\bAW-\d{6,12}\b/g, 0],
  [/\bDC-\d{6,12}\b/g, 0],
  [/fbq\(\s*['"]init['"]\s*,\s*['"](\d{8,20})['"]/g, 1],
  [/facebook\.com\/tr\/?\?id=(\d{8,20})/g, 1],
  [/clarity\.ms\/tag\/([a-z0-9]{6,14})/gi, 1],
  [/["']clarity["']\s*,\s*["']script["']\s*,\s*["']([a-z0-9]{6,14})["']/gi, 1],
  [/hjid\s*:\s*(\d{5,10})/g, 1],
  [/_linkedin_partner_id\s*=\s*["']?(\d{4,10})/g, 1],
  [/ttq\.load\(\s*['"]([A-Z0-9]{10,30})['"]/g, 1],
  [/callrail\.com\/companies\/(\d+\/[a-f0-9]+\/\d+)\/swap\.js/g, 1],
  [/\bti\s*:\s*["'](\d{5,12})["']/g, 1],
  [/pintrk\(\s*['"]load['"]\s*,\s*['"](\d{8,16})['"]/g, 1],
  [/snaptr\(\s*['"]init['"]\s*,\s*['"]([a-f0-9-]{20,40})['"]/g, 1],
  [/rdt\(\s*['"]init['"]\s*,\s*['"]([a-z0-9_-]{6,30})['"]/gi, 1],
  [/twq\(\s*['"](?:init|config)['"]\s*,\s*['"]([a-z0-9]{4,10})['"]/gi, 1],
  [/\/\/(\d{3,8})\.tctm\.co/g, 1],
  [/js\.hs-scripts\.com\/(\d+)\.js/g, 1],
  [/_fs_org['"]?\]?\s*=\s*['"]([A-Z0-9-]+)['"]/g, 1],
];

export function trackingIds(text) {
  const ids = new Set();
  for (const [re, g] of ID_PATTERNS) for (const m of String(text).matchAll(re)) ids.add(m[g]);
  return [...ids];
}

function escapeAttr(v) {
  return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function escapeComment(s) {
  return s.replace(/<!--/g, '&lt;!--').replace(/--!>/g, '--!&gt;').replace(/-->/g, '--&gt;');
}

/**
 * @param {string} html
 * @param {object} ctx
 *   pageUrl:  URL the document was served from
 *   mapUrl(absUrl, {relative}) -> replacement string | null
 *   disableTracking: boolean (default true)
 *   isRemovedLink(absUrl) -> boolean      (optional) links to remove entirely
 *   replaceRemovedUrl(absUrl) -> absUrl   (optional) for such URLs inside form values
 */
export function transformHtml(html, ctx) {
  const doc = parseHtml(html);
  const edits = []; // { start, end, text }
  const disabled = []; // { start, end, names, ids, isScript }
  const report = { trackers: [], rewrites: 0, external: [], removedLinks: 0, unwrappedLinks: 0, removedBlocks: [], valueRewrites: 0 };
  const dropLinks = [];
  let base = ctx.pageUrl;
  walk(doc, (n) => {
    if (n.tagName === 'base' && base === ctx.pageUrl) {
      const href = attrMap(n).href;
      const abs = href && resolveUrl(href, ctx.pageUrl);
      if (abs) base = abs;
    }
  });

  const mapRef = (value) => {
    const abs = resolveUrl(value, base);
    if (!abs) return null;
    const relative = !ABS_RE.test(value);
    const out = ctx.mapUrl(abs, { relative });
    return out != null && out !== value ? out : null;
  };

  const rewriteCss = (css, cssBase = base) => {
    let out = '';
    let last = 0;
    let changed = false;
    for (const r of cssRefs(css)) {
      const abs = resolveUrl(r.url, cssBase);
      if (!abs) continue;
      const repl = ctx.mapUrl(abs, { relative: !ABS_RE.test(r.url) });
      if (repl == null || repl === r.url) continue;
      out += css.slice(last, r.start) + repl;
      last = r.end;
      changed = true;
    }
    return changed ? out + css.slice(last) : null;
  };

  // Absolute main-site URLs inside arbitrary text (inline JS, JSON in data-*).
  const rewriteText = (text) => {
    let changed = false;
    const out = text.replace(siteUrlRegex(), (match, p) => {
      const escaped = /\\\//.test(match);
      const pathPart = (p || '').replace(/\\\//g, '/');
      if (!pathPart) return match; // bare origin: leave alone
      const abs = resolveUrl(pathPart, ctx.siteOrigin + '/');
      if (!abs) return match;
      const repl = ctx.mapUrl(abs, { relative: false, text: true });
      if (repl == null) return match;
      changed = true;
      return escaped ? repl.replace(/\//g, '\\/') : repl;
    });
    return changed ? out : null;
  };

  const addEdit = (start, end, text) => {
    edits.push({ start, end, text });
    report.rewrites++;
  };

  const disable = (node, names, text) => {
    const loc = node.sourceCodeLocation;
    if (!loc) return;
    const ids = trackingIds(text);
    disabled.push({ start: loc.startOffset, end: loc.endOffset, names, ids, isScript: node.tagName === 'script' });
    report.trackers.push({ names, ids, tag: node.tagName });
  };

  walk(doc, (node) => {
    if (!node.tagName || !node.sourceCodeLocation) return;
    const tag = node.tagName;
    const a = attrMap(node);
    const loc = node.sourceCodeLocation;

    if (ctx.isRemovedLink && (tag === 'a' || tag === 'area') && a.href) {
      const abs = resolveUrl(a.href, base);
      if (abs && ctx.isRemovedLink(abs)) dropLinks.push(node);
    }

    // ---- tracking detection
    if (ctx.disableTracking !== false) {
      const attrText = Object.values(a).join(' ');
      if (tag === 'script') {
        const type = (a.type || '').toLowerCase();
        if (type !== 'application/ld+json') {
          const text = textContent(node);
          const byUrl = trackerFor(attrText);
          const byInline = TRACKER_INLINE.filter((t) => t.re.test(text)).map((t) => t.name);
          const names = [...new Set([byUrl, ...byInline].filter(Boolean))];
          if (names.length) return disable(node, names, attrText + ' ' + text);
        }
      } else if (tag === 'noscript') {
        const text = textContent(node);
        const name = trackerFor(text);
        if (name) return disable(node, [name], text);
      } else if (tag === 'img' || tag === 'iframe') {
        const name = trackerFor(a.src || a['data-src'] || '');
        if (name) return disable(node, [name], attrText);
      } else if (tag === 'link' && /preload|prefetch|modulepreload/i.test(a.rel || '')) {
        const name = trackerFor(a.href || '');
        if (name) return disable(node, [name], attrText);
      }
    }

    // ---- inline <script> / <style> / <noscript> text
    if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'textarea' || tag === 'title') {
      const child = (node.childNodes || [])[0];
      const cl = child?.sourceCodeLocation;
      if (child && child.nodeName === '#text' && cl) {
        const raw = html.slice(cl.startOffset, cl.endOffset);
        let out = null;
        if (tag === 'style') out = rewriteCss(raw);
        else if (tag === 'script') {
          const type = (a.type || '').toLowerCase();
          if (type !== 'application/ld+json') out = rewriteText(raw);
        } else if (tag === 'noscript') {
          const sub = transformHtml(raw, { ...ctx, pageUrl: base, disableTracking: false });
          if (sub.html !== raw) out = sub.html;
        }
        if (out != null && out !== raw) addEdit(cl.startOffset, cl.endOffset, out);
      }
    }

    // ---- attributes
    if (tag === 'meta') {
      // Only a refresh redirect is functional; every other meta value is kept intact.
      if ((a['http-equiv'] || '').toLowerCase() === 'refresh' && a.content) {
        const m = /^(\s*\d+\s*;\s*url\s*=\s*['"]?)([^'"]+)(.*)$/i.exec(a.content);
        const repl = m && mapRef(m[2]);
        if (repl && loc.attrs?.content) {
          addEdit(loc.attrs.content.startOffset, loc.attrs.content.endOffset, `content="${escapeAttr(m[1] + repl + m[3])}"`);
        }
      }
      return;
    }
    if (tag === 'link' && KEEP_LINK_REL.test(a.rel || '')) return;

    for (const at of node.attrs || []) {
      const name = attrName(at).toLowerCase();
      const value = at.value;
      const aloc = loc.attrs?.[attrName(at)] || loc.attrs?.[name];
      if (!aloc || !value) continue;
      if (tag === 'input' && name === 'value') {
        // Form data goes to the form's handler as-is (e.g. a CRM redirect URL): never
        // rewritten, except to point a removed sub-site URL at the main-site page.
        if (ctx.isRemovedLink && /https?:\/\//i.test(value)) {
          const next = value.replace(/https?:\/\/[^\s"'<>]+/gi, (m) => (ctx.isRemovedLink(m) ? ctx.replaceRemovedUrl(m) : m));
          if (next !== value) {
            addEdit(aloc.startOffset, aloc.endOffset, `${attrName(at)}="${escapeAttr(next)}"`);
            report.valueRewrites++;
          }
        }
        continue;
      }
      let next = null;
      if (name === 'style') {
        next = rewriteCss(value);
      } else if (SRCSET_ATTR.test(name)) {
        let out = '';
        let last = 0;
        let changed = false;
        for (const c of parseSrcset(value)) {
          const repl = mapRef(c.url);
          if (repl == null) continue;
          out += value.slice(last, c.start) + repl;
          last = c.end;
          changed = true;
        }
        if (changed) next = out + value.slice(last);
      } else if (SINGLE_URL_ATTR.test(name) && !/^\s*[{[]/.test(value)) {
        next = mapRef(value.trim());
        if (next != null && value !== value.trim()) next = value.replace(value.trim(), next);
      } else if (/https?:|\\\/\\\/|^\/\//i.test(value)) {
        next = rewriteText(value);
      }
      if (next != null && next !== value) addEdit(aloc.startOffset, aloc.endOffset, `${attrName(at)}="${escapeAttr(next)}"`);
    }
  });

  // ---- links into removed sub-sites
  const dropSet = new Set(dropLinks);
  const removals = new Set();
  const unwraps = [];
  for (const link of dropLinks) {
    const parent = link.parentNode;
    if (parent?.tagName && INLINE_PARENTS.has(parent.tagName) && hasVisibleContent(parent, dropSet)) {
      unwraps.push(link);
      continue;
    }
    let target = link;
    while (target.parentNode?.tagName && !STOP_AT.has(target.parentNode.tagName) && !hasVisibleContent(target.parentNode, dropSet)) {
      target = target.parentNode;
    }
    removals.add(target);
  }
  const insideAny = (n, set) => {
    for (let x = n.parentNode; x; x = x.parentNode) if (set.has(x)) return true;
    return false;
  };
  const removed = [...removals].filter((n) => n.sourceCodeLocation && !insideAny(n, removals));
  const removedRanges = removed.map((n) => [n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset]);
  const inRemoved = (start, end) => removedRanges.some(([a, b]) => start >= a && end <= b);
  const unwrapRanges = [];
  for (const link of unwraps) {
    const l = link.sourceCodeLocation;
    if (!l?.startTag || !l.endTag || inRemoved(l.startOffset, l.endOffset)) continue;
    unwrapRanges.push([l.startTag.startOffset, l.startTag.endOffset], [l.endTag.startOffset, l.endTag.endOffset]);
    report.unwrappedLinks++;
  }
  report.removedLinks = dropLinks.length;
  report.removedBlocks = removed.map((n) => `<${n.tagName}${(attrMap(n).class || '').trim() ? '.' + attrMap(n).class.trim().split(/\s+/).slice(-1)[0] : ''}>`);

  // ---- apply: removed blocks, disabled ranges and unwrapped tags win over edits inside them
  disabled.sort((x, y) => x.start - y.start);
  const top = [];
  for (const d of disabled) if (!inRemoved(d.start, d.end) && !top.some((t) => d.start >= t.start && d.end <= t.end)) top.push(d);
  const inDisabled = (e) =>
    inRemoved(e.start, e.end) ||
    top.some((d) => e.start >= d.start && e.end <= d.end) ||
    unwrapRanges.some(([a, b]) => e.start >= a && e.end <= b);
  const all = edits.filter((e) => !inDisabled(e));
  for (const [start, end] of [...removedRanges, ...unwrapRanges]) all.push({ start, end, text: '' });
  let stubPlaced = false;
  for (const d of top) {
    const original = html.slice(d.start, d.end);
    const label = `${d.names.join(', ')}${d.ids.length ? ': ' + d.ids.join(', ') : ''}`;
    let text = `<!-- TRACKING DISABLED (${label}) --><!--\n${escapeComment(original)}\n-->`;
    if (d.isScript && !stubPlaced) {
      text += STUB;
      stubPlaced = true;
    }
    all.push({ start: d.start, end: d.end, text });
  }
  all.sort((x, y) => y.start - x.start);
  let out = html;
  let guardStart = Infinity;
  for (const e of all) {
    if (e.end > guardStart) continue; // overlapping edit (should not happen) - skip
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    guardStart = e.start;
  }
  report.disabledCount = top.length;
  return { html: out, report, doc };
}

/** Rewrite url()/@import references inside a stylesheet. */
export function transformCss(css, cssUrl, mapUrl) {
  let out = '';
  let last = 0;
  let changed = false;
  for (const r of cssRefs(css)) {
    const abs = resolveUrl(r.url, cssUrl);
    if (!abs) continue;
    const repl = mapUrl(abs, { relative: !ABS_RE.test(r.url) });
    if (repl == null || repl === r.url) continue;
    out += css.slice(last, r.start) + repl;
    last = r.end;
    changed = true;
  }
  return changed ? out + css.slice(last) : css;
}

/** Rewrite absolute main-site URLs in JS / JSON / SVG / manifest text. */
export function transformText(text, siteOrigin, mapUrl) {
  return String(text).replace(siteUrlRegex(), (match, p) => {
    const escaped = /\\\//.test(match);
    const pathPart = (p || '').replace(/\\\//g, '/');
    if (!pathPart) return match;
    const abs = resolveUrl(pathPart, siteOrigin + '/');
    if (!abs) return match;
    const repl = mapUrl(abs, { relative: false, text: true });
    if (repl == null) return match;
    return escaped ? repl.replace(/\//g, '\\/') : repl;
  });
}
