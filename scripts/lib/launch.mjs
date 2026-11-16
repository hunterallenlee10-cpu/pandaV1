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
import { parse } from 'parse5';
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

const TRACKING_COMMENT = /<!-- TRACKING DISABLED \(.*?\) --><!--\n[\s\S]*?\n-->\n?/g;
const TRACKING_STUB = /<script>\/\* TRACKING DISABLED: no-op stand-ins[\s\S]*?<\/script>\n?/g;
const LAUNCH_SCRIPT = /<script id="pfix-launch">[\s\S]*?<\/script>/g;

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
  if (named) changes.push(`names: ${named} link(s) and picture(s) without one given a name (logo, social links) or marked decorative`);

  out = ed.count ? ed.apply() : out;
  // The settings script, just before </head>.
  const headEnd = headEndOffset(out);
  if (headEnd >= 0) out = out.slice(0, headEnd) + launchScript() + out.slice(headEnd);
  return out;
}
