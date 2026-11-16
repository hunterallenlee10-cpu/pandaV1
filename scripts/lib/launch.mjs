// Launch readiness: what a page needs to go live as the real site, applied last to every page
// (customize.mjs for the captured pages; the generated pages pass through it too).
//
//  - Dead weight from the WordPress install, which a static site cannot use and which showed
//    up as console errors, third-party requests or render-blocking files on every page:
//    Stripe's script and the hidden frames it left in the rendered pages, Contact Form 7 with
//    its redirect add-on and the wp.hooks / wp.i18n files it needed (there is no Contact Form 7
//    form left), Site Kit's helpers, WP Rocket's beacon, Breeze's link prefetcher (WP Rocket's
//    does the same job), Google Maps files left in a rendered page, and a spinner script that
//    threw "Cannot read properties of null" on every page. An unused contact pop-up (its form
//    needed WordPress, and no button opened it) goes too.
//  - Analytics: the tags the live site runs (custom/site-fixes/launch.json) load again, but
//    only when the page is open on the live domain, so previews and copies report nothing.
//    The commented-out originals and their stand-ins are removed.
//  - Settings for the estimate forms (where a request is sent), read by site-fixes.js.
//  - Titles that carried a second title after "| Panda Exteriors" (on the live site too).
//  - Names for links, buttons and pictures that had none (the logo, the footer's social
//    links), for screen readers and search engines.
//
// Every edit gives the same result on a page that already has it.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parse } from 'parse5';
import { Parser as TagScanner } from 'htmlparser2';
import { ROOT } from './config.mjs';
import { attr, hasClass, esc, clean, textOf, rawText, find, findAll, makeEditor, headEndOffset } from './html-edit.mjs';

const CONFIG_FILE = path.join(ROOT, 'custom', 'site-fixes', 'launch.json');
let config;
export const launchConfig = () => (config ??= JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')));

const DEAD_SCRIPT_SRC = [
  /js\.stripe\.com/,
  /\/contact-form-7\/includes\/(swv\/)?js\/index\.js/,
  /\/wpcf7-redirect\//,
  /\/wp-includes\/js\/dist\/(hooks|i18n)\.min\.js/,
  /\/google-site-kit\//,
  /wpr-beacon/,
  /maps\.googleapis\.com/,
  /\/breeze\/assets\/js\/js-front-end\/breeze-prefetch-links/,
];
const DEAD_INLINE = [
  /wpcf7-spinner[\s\S]*custom-submit-button/, // threw on every page: neither element exists
  /^\s*(\/\*\s*<!\[CDATA\[\s*\*\/)?\s*var wpcf7r? = /,
  /wp\.i18n\.setLocaleData/,
  /var rocket_beacon_data/,
  /var breeze_prefetch = /,
  /window\._googlesitekit\b/,
  /_googlesitekitConsentCategoryMap/, // Site Kit's consent defaults: now part of the settings script
];
const DEAD_HINT = /js\.stripe\.com|maps\.googleapis\.com/;
const SOCIAL = [
  [/facebook\.com/, 'Facebook'],
  [/twitter\.com|\/\/x\.com/, 'X (Twitter)'],
  [/instagram\.com/, 'Instagram'],
  [/youtube\.com/, 'YouTube'],
  [/tiktok\.com/, 'TikTok'],
  [/linkedin\.com/, 'LinkedIn'],
];
// EU visitors start with consent denied, as Site Kit set it on the live site.
const CONSENT =
  '{ad_personalization:"denied",ad_storage:"denied",ad_user_data:"denied",analytics_storage:"denied",functionality_storage:"denied",security_storage:"denied",personalization_storage:"denied",' +
  'region:["AT","BE","BG","CH","CY","CZ","DE","DK","EE","ES","FI","FR","GB","GR","HR","HU","IE","IS","IT","LI","LT","LU","LV","MT","NL","NO","PL","PT","RO","SE","SI","SK"],wait_for_update:500}';

/** The settings script every page carries in its head. */
export function launchScript(c = launchConfig()) {
  const settings = {
    live: c.liveHosts || [],
    gtm: c.analytics?.gtm || '',
    gtag: (c.analytics?.gtag || []).filter(Boolean),
    leads: c.leads?.endpoint || '',
    noCors: !!c.leads?.noCors,
  };
  return (
    '<script id="pfix-launch">/* Site settings (custom/site-fixes/launch.json). Analytics loads on the live domain only: previews and copies report nothing. */' +
    `(function(w,d){var c=w.PANDA_SITE=${JSON.stringify(settings)};` +
    'w.dataLayer=w.dataLayer||[];w.gtag=w.gtag||function(){w.dataLayer.push(arguments)};' +
    'c.isLive=c.live.indexOf(location.hostname)>-1;if(!c.isLive)return;' +
    'function load(u){var s=d.createElement("script");s.async=true;s.src=u;d.head.appendChild(s)}' +
    `w.gtag("consent","default",${CONSENT});` +
    'if(c.gtm){w.dataLayer.push({"gtm.start":new Date().getTime(),event:"gtm.js"});load("https://www.googletagmanager.com/gtm.js?id="+c.gtm)}' +
    'if(c.gtag.length){w.gtag("set","linker",{domains:[c.live[0]]});w.gtag("js",new Date());load("https://www.googletagmanager.com/gtag/js?id="+c.gtag[0]);c.gtag.forEach(function(id){w.gtag("config",id)})}' +
    '})(window,document);</script>'
  );
}

// Pictures a page carried as text (a data: address), by the start of their SHA-1: the file
// that replaces them. /careers/ held its awards picture three times, 930 KB of a 1.1 MB page.
const INLINE_PICTURES = { c8f1ea785a1a: '/_custom/site-fixes/careers-awards.webp' };
const INLINE_PICTURE = /data:image\/(?:png|jpe?g|webp);base64,([A-Za-z0-9+/=]{20000,})/g;

const TRACKING_COMMENT = /<!-- TRACKING DISABLED \(.*?\) --><!--\n[\s\S]*?\n-->\n?/g;
const TRACKING_STUB = /<script>\/\* TRACKING DISABLED: no-op stand-ins[\s\S]*?<\/script>\n?/g;
const LAUNCH_SCRIPT = /<script id="pfix-launch">[\s\S]*?<\/script>/g;

/**
 * A link inside a link (a card that is one big link, with a "Read More" link in it). A browser
 * cannot nest links: it ends the outer one where the inner one starts and scatters empty,
 * invisible copies of it around the inner one, which keyboards stop on and screen readers
 * announce as links with no name. The outer link now ends where the browser ended it, before
 * the block that holds the inner link, so the page is the same without the empty copies.
 */
export function unnestLinks(html) {
  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
  const stack = [];
  const cuts = []; // { at, close: [start, end] }
  const parser = new TagScanner(
    {
      onopentag(name) {
        const node = { name, start: parser.startIndex };
        if (name === 'a') {
          const i = stack.findLastIndex((n) => n.name === 'a');
          if (i >= 0 && !stack[i].cut) {
            // the outer link's child that holds this one (or this one itself)
            stack[i].cut = { at: (stack[i + 1] || node).start };
          }
        }
        if (!VOID.has(name)) stack.push(node);
      },
      onclosetag(name, implied) {
        if (VOID.has(name)) return;
        const i = stack.findLastIndex((n) => n.name === name);
        if (i < 0) return;
        const node = stack[i];
        stack.length = i;
        if (name === 'a' && node.cut && !implied) cuts.push({ ...node.cut, close: [parser.startIndex, parser.endIndex + 1] });
      },
    },
    { decodeEntities: false, lowerCaseTags: true, recognizeSelfClosing: false }
  );
  parser.write(html);
  parser.end();
  if (!cuts.length) return { html, count: 0 };
  const edits = cuts.flatMap((c) => [
    { start: c.at, end: c.at, text: '</a>' },
    { start: c.close[0], end: c.close[1], text: '' },
  ]);
  edits.sort((a, b) => b.start - a.start);
  let out = html;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return { html: out, count: cuts.length };
}

const location = (n) => n.sourceCodeLocation;
const setAttr = (n, name, value) => (n.attrs.some((a) => a.name === name) ? n.attrs.map((a) => (a.name === name ? { name, value } : a)) : [...n.attrs, { name, value }]);

/**
 * Makes a page ready to go live. `changes`, when given, collects a line per kind of edit.
 * Returns the page's HTML.
 */
export function launchReady(html, { pathname = '' } = {}, changes = []) {
  // The disabled tracking snippets and their stand-ins go; the settings script (below) takes
  // their place.
  let out = html.replace(TRACKING_COMMENT, '').replace(TRACKING_STUB, '').replace(LAUNCH_SCRIPT, '');
  if (out !== html && !LAUNCH_SCRIPT.test(html)) changes.push('analytics: the disabled snippets -> one settings script that loads the tags on the live domain only');
  LAUNCH_SCRIPT.lastIndex = 0;
  const unnested = unnestLinks(out);
  if (unnested.count) {
    out = unnested.html;
    changes.push(`links: ${unnested.count} link(s) inside a link untangled (the browser left empty, nameless copies of the outer link)`);
  }
  let pictures = 0;
  out = out.replace(INLINE_PICTURE, (all, data) => {
    const file = INLINE_PICTURES[crypto.createHash('sha1').update(data).digest('hex').slice(0, 12)];
    if (file) pictures++;
    return file || all;
  });
  if (pictures) changes.push(`pictures: ${pictures} cop${pictures === 1 ? 'y' : 'ies'} of a picture held in the page as text -> a file the browser can cache`);

  const doc = parse(out, { sourceCodeLocationInfo: true });
  const ed = makeEditor(out);
  const drop = (n) => {
    const l = location(n);
    if (!l || ed.overlaps(l.startOffset, l.endOffset)) return false;
    // (with the line break after it, so no blank lines pile up)
    const end = out[l.endOffset] === '\n' ? l.endOffset + 1 : l.endOffset;
    ed.replace(l.startOffset, end, '');
    return true;
  };

  // An unused contact pop-up: nothing on the page opens it, and its form needed WordPress.
  let dead = 0;
  for (const modal of findAll(doc, (c) => hasClass(c, 'modal') && attr(c, 'id'))) {
    const id = attr(modal, 'id');
    const opener = find(doc, (c) => [attr(c, 'data-bs-target'), attr(c, 'href'), attr(c, 'data-target')].includes(`#${id}`));
    const inline = findAll(doc, (c) => c.tagName === 'script' && !attr(c, 'src')).some((s) => rawText(s).includes(id));
    if (!opener && !inline && find(modal, (c) => hasClass(c, 'wpcf7')) && drop(modal)) {
      dead++;
      changes.push(`unused contact pop-up removed (#${id}: nothing opened it, and its form needed WordPress)`);
    }
  }
  const stillHasCf7 = findAll(doc, (c) => c.tagName === 'form' && hasClass(c, 'wpcf7-form')).some((f) => !ed.overlaps(location(f).startOffset, location(f).endOffset));

  // Dead scripts, frames and connection hints.
  const cf7 = /contact-form-7|wpcf7|wp-includes\/js\/dist\/(hooks|i18n)|wp\.i18n/;
  let scripts = 0;
  for (const s of findAll(doc, (c) => c.tagName === 'script')) {
    const src = attr(s, 'src');
    const type = attr(s, 'type') || '';
    if (/ld\+json|speculationrules|template/.test(type)) continue;
    const re = src ? DEAD_SCRIPT_SRC.find((r) => r.test(src)) : DEAD_INLINE.find((r) => r.test(rawText(s)));
    if (!re) continue;
    if (stillHasCf7 && cf7.test(re.source)) continue;
    if (drop(s)) scripts++;
  }
  for (const f of findAll(doc, (c) => c.tagName === 'iframe' && (/^__privateStripe/.test(attr(c, 'name') || '') || /js\.stripe\.com|stripe\.network/.test(attr(c, 'src') || '')))) if (drop(f)) scripts++;
  for (const l of findAll(doc, (c) => c.tagName === 'link' && /preconnect|dns-prefetch/.test(attr(c, 'rel') || '') && DEAD_HINT.test(attr(c, 'href') || ''))) if (drop(l)) scripts++;
  if (scripts) changes.push(`dead weight: ${scripts} script(s), frame(s) and hint(s) of Stripe, Contact Form 7, Site Kit and other WordPress add-ons removed`);

  // WP Rocket's "lazy render" (content-visibility: auto on [data-wpr-lazyrender]): sections
  // off screen had no height, so the page grew as it was scrolled (the scrollbar jumped and
  // links into the page landed short), and anything reaching outside such a section was cut
  // off, like the "Read More" buttons under the home page's service cards on desktop.
  let lazy = 0;
  for (const el of findAll(doc, (c) => attr(c, 'data-wpr-lazyrender') !== undefined)) {
    const st = location(el)?.startTag;
    if (!st || ed.overlaps(st.startOffset, st.endOffset)) continue;
    ed.retag(el, el.attrs.filter((a) => a.name !== 'data-wpr-lazyrender'));
    lazy++;
  }
  if (lazy) changes.push(`lazy render off for ${lazy} section(s): it cut off content that reaches outside a section and made the page's height jump while scrolling`);

  // Embedded players (YouTube, iHeart) load when the visitor gets near them, not with the page.
  for (const f of findAll(doc, (c) => c.tagName === 'iframe' && /^https?:/.test(attr(c, 'src') || '') && !attr(c, 'loading'))) {
    const st = location(f)?.startTag;
    if (!st || ed.overlaps(st.startOffset, st.endOffset)) continue;
    ed.retag(f, [...f.attrs, { name: 'loading', value: 'lazy' }]);
  }

  // A title with a second title after "| Panda Exteriors" (two SEO fields joined).
  const twice = /^(.*?\S)\s*\|\s*Panda Exteriors\s+\S.*$/;
  for (const t of findAll(doc, (c) => c.tagName === 'title')) {
    const m = clean(textOf(t)).match(twice);
    if (m && location(t).endTag) {
      ed.inner(t, `${esc(m[1])} | Panda Exteriors`);
      changes.push(`title: the second title after "| Panda Exteriors" removed ("${m[1]} | Panda Exteriors")`);
    }
  }
  for (const meta of findAll(doc, (c) => c.tagName === 'meta' && ['og:title', 'twitter:title'].includes(attr(c, 'property') || attr(c, 'name')))) {
    const m = (attr(meta, 'content') || '').match(twice);
    if (m) ed.retag(meta, setAttr(meta, 'content', `${m[1]} | Panda Exteriors`));
  }

  // A page with no main heading (/podcast/: "Panda Vision Podcast" was an h2): its first
  // headline becomes the h1, looking the same (.pfix-h1--plain in site-fixes.css).
  if (!find(doc, (c) => c.tagName === 'h1')) {
    const headline = find(doc, (c) => c.tagName === 'h2' && hasClass(c, 'flext-head'));
    const l = headline && location(headline);
    if (l?.endTag && !ed.overlaps(l.startOffset, l.endOffset)) {
      ed.retag(headline, setAttr(headline, 'class', `${attr(headline, 'class')} pfix-h1 pfix-h1--plain`), 'h1');
      changes.push(`page heading: "${clean(textOf(headline))}" is now the page's h1 (it had none)`);
    }
  }

  // Names for screen readers and search engines.
  let named = 0;
  const retag = (n, attrs) => {
    const st = location(n)?.startTag;
    if (!st || ed.overlaps(st.startOffset, st.endOffset)) return;
    ed.retag(n, attrs);
    named++;
  };
  const inNoscript = (n) => {
    for (let p = n.parentNode; p; p = p.parentNode) if (p.tagName === 'noscript') return true;
    return false;
  };
  const words = (file) => clean(decodeURIComponent(file.split(/[?#]/)[0].split('/').pop() || '').replace(/\.(png|jpe?g|webp|svg|avif)+$/gi, '').replace(/-Home$/i, '').replace(/[-_]+/g, ' '));
  for (const img of findAll(doc, (c) => c.tagName === 'img' && attr(c, 'alt') === undefined)) {
    if (inNoscript(img)) continue;
    let link = null;
    for (let p = img.parentNode; p; p = p.parentNode) if (p.tagName === 'a') link = link || p;
    let alt = '';
    if (hasClass(img, 'Logo-nav') || (link && attr(link, 'href') === '/' && !clean(textOf(link)))) alt = 'Panda Exteriors';
    else if (link && !clean(textOf(link)) && !attr(link, 'aria-label')) alt = words(attr(img, 'data-lazy-src') || attr(img, 'src') || '');
    retag(img, setAttr(img, 'alt', alt));
  }
  for (const a of findAll(doc, (c) => c.tagName === 'a' && attr(c, 'href') && !attr(c, 'aria-label'))) {
    const href = attr(a, 'href');
    const social = SOCIAL.find(([re]) => re.test(href));
    if (!social || clean(textOf(a))) continue;
    let attrs = setAttr(a, 'aria-label', `Panda Exteriors on ${social[1]}`);
    if (/^http:\/\//.test(href)) attrs = attrs.map((x) => (x.name === 'href' ? { name: 'href', value: href.replace(/^http:/, 'https:') } : x));
    if (attr(a, 'target') === '_blank' && !attr(a, 'rel')) attrs = [...attrs, { name: 'rel', value: 'noopener' }];
    retag(a, attrs);
  }
  // The footer: its second set of social icons (the one phones show) still had Twitter's bird
  // where the first has the X; the Terms link was there but hidden; and nothing said whose
  // site it is.
  const X_PATH = 'M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.2L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z';
  for (const a of findAll(doc, (c) => c.tagName === 'a' && /twitter\.com|\/\/x\.com/.test(attr(c, 'href') || ''))) {
    const bird = find(a, (c) => c.tagName === 'path' && /^M22\.46 6c/.test(attr(c, 'd') || ''));
    if (bird && !ed.overlaps(location(bird).startOffset, location(bird).endOffset)) {
      ed.outer(bird, `<path d="${X_PATH}"/>`);
      changes.push('footer: the Twitter bird in the phone footer -> the X, as in the desktop footer');
    }
  }
  const pages = find(doc, (c) => hasClass(c, 'footer-pages'));
  if (pages) {
    for (const el of findAll(pages, (c) => hasClass(c, 'd-none') && (hasClass(c, 'footer-dot') || find(c, (x) => x.tagName === 'a' && /^\/terms-and-conditions\/$/.test(attr(x, 'href') || ''))))) {
      const st = location(el).startTag;
      if (ed.overlaps(st.startOffset, st.endOffset)) continue;
      ed.retag(el, el.attrs.map((x) => (x.name === 'class' ? { name: 'class', value: x.value.split(/\s+/).filter((k) => k !== 'd-none').join(' ') } : x)));
      if (!hasClass(el, 'footer-dot')) changes.push('footer: the Terms and Conditions link shows (it was there, hidden)');
    }
    const next = (pages.parentNode.childNodes || []).filter((c) => c.tagName)[(pages.parentNode.childNodes || []).filter((c) => c.tagName).indexOf(pages) + 1];
    if (!(next && hasClass(next, 'pfix-copyright')) && location(pages).endTag && !ed.overlaps(location(pages).endOffset, location(pages).endOffset + 1)) {
      ed.replace(location(pages).endOffset, location(pages).endOffset, '<div class="pfix-copyright">© Panda Exteriors. All rights reserved.</div>');
      changes.push('footer: a copyright line');
    }
  }

  // Lists of links marked up as <a role="listitem">: the role replaced the link's own, so a
  // screen reader announced "list item", not a link. The links keep their role; the list
  // roles go.
  let lists = 0;
  for (const list of findAll(doc, (c) => attr(c, 'role') === 'list')) {
    const items = (list.childNodes || []).filter((c) => c.tagName);
    const linkItems = items.filter((c) => c.tagName === 'a' && attr(c, 'role') === 'listitem');
    if (!linkItems.length) continue;
    const tags = [list, ...linkItems].map((n) => location(n)?.startTag);
    if (tags.some((st) => !st || ed.overlaps(st.startOffset, st.endOffset))) continue;
    for (const a of linkItems) ed.retag(a, a.attrs.filter((x) => x.name !== 'role'));
    // (a list of links only: its own role goes too; a mixed one keeps its other items)
    if (linkItems.length === items.length) ed.retag(list, list.attrs.filter((x) => x.name !== 'role'));
    lists++;
  }
  if (lists) changes.push(`names: ${lists} list(s) of links announced as links again (the links carried a list item's role)`);

  if (named) changes.push(`names: ${named} link(s) and picture(s) without one given a name (logo, social links) or marked decorative`);

  out = ed.count ? ed.apply() : out;
  // The settings script, just before </head>.
  const headEnd = headEndOffset(out);
  if (headEnd >= 0) out = out.slice(0, headEnd) + launchScript() + out.slice(headEnd);
  return out;
}
