// /careers/ is a hand-built page: it loads none of the page builder's stylesheets and
// carries its own copy of the site header (an older menu: "Residential Roofing", a
// Commercial submenu, "Customer Service" instead of Financing and Warranty, no Storm Damage,
// a Gallery entry) with its own styles for it in the page (bold Roboto, a narrower row, a
// shadow, the phone-only menu entries showing in the dropdowns). So the header changed look
// and menu when you went to Careers from any other page.
//
// After the pages are built, /careers/ gets the header of a standard page (/about/):
//  - the header's markup, copied from /about/, so its menu is the same as everywhere else
//    and follows any later change to it;
//  - the stylesheets /about/ styles it with and /careers/ does not load (the page builder's
//    normalize, global settings, selectors, variables and header template), limited to the
//    header (css-scope.mjs) and linked where /about/ has them, so they style nothing else;
//  - the page's own <style> blocks no longer reach the header (the rest of the page is
//    styled as before: the added condition has no specificity).
// The header's text styles are inherited from <body>, where the page sets its own font, so
// they are set on the header as Bootstrap sets them on <body> elsewhere.
// Applied by 03-build.mjs and update-built-site.mjs when the site fixes are on; running it
// again changes nothing.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';
import { find, findAll, hasClass, attr } from './html-edit.mjs';
import { scopeCss } from './css-scope.mjs';

export const CAREERS_PATH = '/careers/';
const SOURCE_PATH = '/about/';
const HEADER = '.oxy-container-974-100';
const CSS_DIR = '_custom/site-fixes';
const BASE_CSS = 'careers-header-base.css';
const MAIN_CSS = 'careers-header.css';
// Marks a <style> block of the page already kept out of the header.
const DONE = '/*pfix:careers-header*/';
// What <body> gives the header on the other pages (Bootstrap's body rule).
const BODY_TEXT = `${HEADER}{font-family:var(--bs-body-font-family);font-size:var(--bs-body-font-size);font-weight:var(--bs-body-font-weight);line-height:var(--bs-body-line-height);color:var(--bs-body-color);text-align:var(--bs-body-text-align)}`;

const sheetPath = (href) => decodeURIComponent(href.replace(/[?#].*$/, ''));
const isSheet = (n) => n.tagName === 'link' && /\bstylesheet\b/i.test(attr(n, 'rel') || '') && attr(n, 'href');

// The header element and its source range; the stylesheets and <style> blocks in order.
function read(html) {
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const nav = find(doc, (n) => n.tagName === 'div' && hasClass(n, 'nav') && hasClass(n, HEADER.slice(1)));
  // (A <noscript>'s content is text to the parser, so a <style> in one is not listed.)
  const styles = findAll(doc, (n) => isSheet(n) || n.tagName === 'style');
  return { nav, styles };
}
const styleText = (html, n) => html.slice(n.sourceCodeLocation.startTag.endOffset, n.sourceCodeLocation.endTag.startOffset);

// Returns 'updated', 'unchanged' or a reason it was left alone.
export function syncCareersHeader(siteDir, { dryRun = false } = {}) {
  const file = (p) => path.join(siteDir, p, 'index.html');
  if (!fs.existsSync(file(CAREERS_PATH)) || !fs.existsSync(file(SOURCE_PATH))) return 'no page';
  const source = fs.readFileSync(file(SOURCE_PATH), 'utf8');
  const careers = fs.readFileSync(file(CAREERS_PATH), 'utf8');
  const src = read(source);
  const dst = read(careers);
  if (!src.nav || !dst.nav) return 'no header';

  // The stylesheets /about/ links and /careers/ does not (fonts and the site's own _custom
  // files aside), split at the site's custom CSS block: those before it and those after.
  const have = new Set(dst.styles.filter(isSheet).map((n) => sheetPath(attr(n, 'href'))));
  const customAt = src.styles.findIndex((n) => n.tagName === 'style' && attr(n, 'id') === 'wp-custom-css');
  const missing = (list) =>
    list.filter((n) => isSheet(n) && !have.has(sheetPath(attr(n, 'href'))) && /^\/wp-(content|includes)\//.test(attr(n, 'href')) && !/google-fonts/.test(attr(n, 'href')));
  // Only rules for something the header has: the classes and ids of the subject (outside
  // brackets) must all be in its markup.
  const header = source.slice(src.nav.sourceCodeLocation.startOffset, src.nav.sourceCodeLocation.endOffset);
  const names = new Set([...header.matchAll(/\s(class|id)="([^"]*)"/g)].flatMap((m) => m[2].split(/\s+/).map((v) => (m[1] === 'id' ? '#' : '.') + v)));
  const keep = (subject) => (subject.replace(/\([^)]*\)|\[[^\]]*\]/g, '').match(/[.#]-?[_a-zA-Z][\w-]*/g) || []).every((t) => names.has(t));
  const css = (list) =>
    missing(list)
      .map((n) => path.join(siteDir, sheetPath(attr(n, 'href'))))
      .filter((f) => fs.existsSync(f))
      .map((f) => scopeCss(fs.readFileSync(f, 'utf8'), { inside: HEADER, keep }))
      .join('\n');
  const base = `${BODY_TEXT}\n${css(src.styles.slice(0, Math.max(customAt, 0)))}\n`;
  const main = `${css(src.styles.slice(customAt + 1))}\n`;
  // Where /about/ has the later ones: before the first stylesheet both pages share after them.
  const lastMissing = src.styles.lastIndexOf(missing(src.styles).at(-1));
  const nextShared = src.styles.slice(lastMissing + 1).find((n) => isSheet(n) && have.has(sheetPath(attr(n, 'href'))));
  const before = nextShared && dst.styles.find((n) => isSheet(n) && sheetPath(attr(n, 'href')) === sheetPath(attr(nextShared, 'href')));
  const first = dst.styles[0];
  if (!before || !first) return 'no stylesheets';

  const edits = [];
  const link = (name) => `<link rel="stylesheet" href="/${CSS_DIR}/${name}">`;
  if (!careers.includes(link(BASE_CSS))) edits.push([first.sourceCodeLocation.startOffset, first.sourceCodeLocation.startOffset, link(BASE_CSS)]);
  if (!careers.includes(link(MAIN_CSS))) edits.push([before.sourceCodeLocation.startOffset, before.sourceCodeLocation.startOffset, link(MAIN_CSS)]);
  // The page's own <style> blocks (those /about/ does not have) leave the header alone.
  const shared = new Set(src.styles.filter((n) => n.tagName === 'style').map((n) => styleText(source, n).trim()));
  for (const n of dst.styles) {
    if (n.tagName !== 'style') continue;
    const text = styleText(careers, n);
    if (text.trim().startsWith(DONE) || shared.has(text.trim()) || !/[{]/.test(text)) continue;
    edits.push([n.sourceCodeLocation.startTag.endOffset, n.sourceCodeLocation.endTag.startOffset, `${DONE}${scopeCss(text, { outside: HEADER })}`]);
  }
  // The header itself.
  if (careers.slice(dst.nav.sourceCodeLocation.startOffset, dst.nav.sourceCodeLocation.endOffset) !== header) {
    edits.push([dst.nav.sourceCodeLocation.startOffset, dst.nav.sourceCodeLocation.endOffset, header]);
  }

  const files = [
    [path.join(siteDir, CSS_DIR, BASE_CSS), base],
    [path.join(siteDir, CSS_DIR, MAIN_CSS), main],
  ].filter(([f, text]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== text);
  if (!edits.length && !files.length) return 'unchanged';
  if (!dryRun) {
    let out = careers;
    for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0])) out = out.slice(0, start) + text + out.slice(end);
    if (edits.length) fs.writeFileSync(file(CAREERS_PATH), out);
    for (const [f, text] of files) {
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, text);
    }
  }
  return 'updated';
}
