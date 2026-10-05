// The site restructure: pages merged into another page (MERGED_PAGES in config.mjs) and the
// pages added beside them (NEW_PAGES in new-pages.mjs).
//
//  - Links: every link to a merged page leads to the page it was merged into (relinkMerged,
//    run by customize.mjs on the finished page, so it also covers what the fixes wrote).
//  - Header menu: the entries of merged pages go (Residential Roofing, Commercial's Roof
//    Types and Roof Replacement, Solar Panel Installation, Customer Service, Gallery), so no menu lists the same page twice; a dropdown left with nothing in it
//    (Commercial) becomes a plain entry. The new pages join it: Storm Damage under Roofing,
//    Financing and Warranty under About.
//  - Footer: "Customer Service" (merged into Contact Us, which the footer already lists)
//    becomes "Storm Damage"; "Warranty" and "Financing" lead to their new pages; "Solar" leads
//    to the Solar Options page (both products) rather than the solar panels page.
//
// Applied by site-fixes.mjs on every page; each step checks what is already there, so it
// gives the same result on a page that already has it.
import { MERGED_PAGES, mergedTarget, SITE_ORIGIN } from './config.mjs';
import { attr, hasClass, esc, find, findAll, textOf, clean } from './html-edit.mjs';

// New header menu entries: [after this link, the entries to add], in order.
const NAV_ADD = [
  ['/roofing/replacement/', [{ href: '/storm-damage/', label: 'Storm Damage' }]],
  // The Podcast page stays (it was merged into Media, then brought back on request); a page
  // the earlier merge took it out of gets its entry back, under Media after Blog.
  ['/blog/', [{ href: '/podcast/', label: 'Podcast' }]],
  [
    '/roofing-costs/',
    [
      { href: '/financing/', label: 'Financing' },
      { href: '/warranty/', label: 'Warranty' },
    ],
  ],
];
// Footer links whose label and address change: [label as captured, new label, new address].
const FOOTER_SWAP = [
  ['Customer Service', 'Storm Damage', '/storm-damage/'],
  ['Solar', 'Solar', '/solar-options/'],
];

const host = new URL(SITE_ORIGIN).hostname.replace(/^www\./, '');
const sitePath = (href) => {
  if (!href) return null;
  if (href.startsWith('/')) return href.replace(/[?#].*$/, '');
  try {
    const u = new URL(href);
    return u.hostname.replace(/^www\./, '') === host ? u.pathname : null;
  } catch {
    return null;
  }
};
const ownLink = (li) => (li.childNodes || []).find((c) => c.tagName === 'a');
const isItem = (n) => hasClass(n, 'li');
const isMerged = (href) => {
  const p = sitePath(href);
  return !!(p && mergedTarget(p));
};

/** Every link to a merged page -> the page it was merged into. */
export function relinkMerged(html) {
  if (!Object.keys(MERGED_PAGES).length) return html;
  return html.replace(/(\shref=")([^"]*)(")/g, (m, a, href, b) => {
    const p = sitePath(href);
    const to = p && mergedTarget(p);
    return to ? a + to + b : m;
  });
}

/** The header menu and the footer, tidied for the merged pages and the new ones. */
export function collectMergedNav(doc, html, ed, changes) {
  if (!Object.keys(MERGED_PAGES).length) return false;
  const body = find(doc, (c) => c.tagName === 'body');
  const blocks = (body?.childNodes || []).filter((c) => c.tagName);
  const nav = blocks.find((c) => hasClass(c, 'nav'));
  const footer = blocks.find((c) => hasClass(c, 'footer'));
  let removed = 0;
  let flattened = 0;
  let added = 0;
  if (nav) {
    const items = findAll(nav, isItem);
    const gone = new Set(items.filter((li) => !hasClass(li, 'has_dropdown') && !hasClass(li, 'mobile-show') && isMerged(attr(ownLink(li) || {}, 'href'))));
    // A dropdown whose entries all go: a plain entry like Gutters'.
    const emptied = new Set();
    for (const li of items.filter((x) => hasClass(x, 'has_dropdown'))) {
      const menu = (li.childNodes || []).find((c) => hasClass(c, 'sub_menu'));
      const entries = menu ? (menu.childNodes || []).filter((c) => c.tagName && isItem(c) && !hasClass(c, 'mobile-show')) : [];
      if (entries.length && entries.every((e) => gone.has(e))) emptied.add(li);
    }
    for (const li of emptied) {
      const link = ownLink(li);
      const label = clean(textOf(find(link, (c) => hasClass(c, 'oxy-text')) || link));
      ed.outer(
        li,
        `<div class="oxy-container-840-100 oxy-container li"><a class="oxy-text-link-840-101 oxy-text-link Nav-Link Nav-Link-Hover" href="${esc(attr(link, 'href'))}" target="_self">\n${esc(label)}\n</a></div>`
      );
      flattened++;
    }
    for (const li of gone) {
      if ([...emptied].some((d) => li.sourceCodeLocation.startOffset >= d.sourceCodeLocation.startOffset && li.sourceCodeLocation.endOffset <= d.sourceCodeLocation.endOffset)) continue;
      ed.outer(li, '');
      removed++;
    }
    // The new pages' entries, each after its neighbour (a copy of the neighbour's entry).
    const hrefs = new Set(items.map((li) => sitePath(attr(ownLink(li) || {}, 'href'))));
    for (const [after, entries] of NAV_ADD) {
      const anchor = items.find((li) => !hasClass(li, 'has_dropdown') && !hasClass(li, 'mobile-show') && sitePath(attr(ownLink(li) || {}, 'href')) === after);
      const missing = entries.filter((e) => !hrefs.has(e.href));
      if (!anchor || !missing.length) continue;
      const { startOffset, endOffset } = anchor.sourceCodeLocation;
      const src = html.slice(startOffset, endOffset);
      const label = clean(textOf(ownLink(anchor)));
      const copies = missing.map((e) => src.replace(/href="[^"]*"/, `href="${e.href}"`).replace(new RegExp(`(>\\s*)${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s*<)`), `$1${esc(e.label)}$2`));
      ed.replace(endOffset, endOffset, copies.map((c) => `\n\n${c}`).join(''));
      added += missing.length;
    }
  }
  const swaps = new Set();
  if (footer) {
    for (const a of findAll(footer, (c) => c.tagName === 'a')) {
      const label = clean(textOf(a));
      const swap = FOOTER_SWAP.find(([from]) => from === label);
      if (!swap) continue;
      ed.retag(a, a.attrs.map((x) => (x.name === 'href' ? { name: 'href', value: swap[2] } : x)));
      ed.inner(a, `\n${esc(swap[1])}\n`);
      swaps.add(swap);
    }
  }
  if (removed) changes.push(`site restructure: ${removed} header menu entr${removed === 1 ? 'y' : 'ies'} of merged pages removed`);
  if (flattened) changes.push(`site restructure: ${flattened} emptied dropdown(s) -> plain menu entries`);
  if (added) changes.push(`site restructure: ${added} new page(s) added to the header menu`);
  for (const [from, label, href] of swaps) changes.push(`site restructure: footer "${from}" -> "${label}" (${href})`);
  return removed + flattened + added + swaps.size > 0;
}
