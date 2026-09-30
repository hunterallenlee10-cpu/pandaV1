// Fixes for problems found in the site audit, applied by customize.mjs during
// 03-build.mjs (SITE_FIXES=0 turns them off). Each one is a surgical edit, so
// everything else on the page stays byte-for-byte as captured.
//
//  - Top bar: it showed "Local Weather: N/A°F | Weather Alerts: N/A" to anyone who
//    didn't grant location access (it asked for it on every page); it now shows the
//    free-estimate phone number. Same bar, same size and colour.
//  - Lead forms: "Unable to load review count" (it needs the WordPress API) becomes a
//    link to the Reviews page.
//  - Testimonials: the 2-review carousel never started (its script runs before the
//    Swiper library loads), so only the first review was visible and the arrows did
//    nothing. Both reviews are now shown side by side; the section is removed from
//    Service Areas.
//  - Missing pictures (missing on the live site too): a reviewer photo becomes the
//    reviewer's initials; an Interiors gallery tile without its photo is removed (the
//    other tiles keep their size).
//  - A link whose href was swallowed by its style attribute is repaired; placeholder
//    phone links ("(XXX) XXX-XXXX") get the site's number.
//  - /commercial-capabilities/: the case-study picture's image map pointed at the
//    wrong places and its pin markers (placed in desktop pixels) made the page twice
//    as wide as a phone screen. Links are now placed over the QR codes in % and listed
//    under the picture.
//  - Blog share buttons did nothing (their script is missing on the live site too);
//    they are now plain share links.
//  - /position-details/ can only show "Failed to load job details." in a static copy;
//    it now points to the open positions on /careers/.
//  - Typos in headings and labels.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { attr, classes, hasClass, esc, textOf, rawText, clean, findAll, find, editText, textNodes } from './html-edit.mjs';

export const SITE_FIXES_DIR = path.join(ROOT, 'custom', 'site-fixes');
export const SITE_FIXES_FILES = { 'site-fixes.css': '/_custom/site-fixes/site-fixes.css', 'site-fixes.js': '/_custom/site-fixes/site-fixes.js' };
// Fixes that change a whole section or message, by the start of their change note.
export const SECTION_FIXES = /^(testimonials|case-study picture|gallery tile|job details page)/;

// The number in the site's header on every page.
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
const TYPOS = [
  [/\bExperts Your Can Trust\b/g, 'Experts You Can Trust'],
  [/\bExterior Modeling\b/g, 'Exterior Remodeling'],
  [/\bCommerical\b/g, 'Commercial'],
  [/\bOur Services Areas\b/g, 'Our Service Areas'],
];

const ancestors = (n) => {
  const out = [];
  for (let a = n.parentNode; a; a = a.parentNode) out.push(a);
  return out;
};
const nextElement = (n) => {
  const sibs = n.parentNode?.childNodes || [];
  for (let i = sibs.indexOf(n) + 1; i < sibs.length; i++) {
    if (sibs[i].tagName) return sibs[i];
    if (sibs[i].nodeName === '#text' && sibs[i].value.trim()) return null;
  }
  return null;
};
const withClass = (n, add, remove = []) => n.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: [...classes(n).filter((c) => !remove.includes(c)), ...add].join(' ') } : a));

let capabilities;
const capabilitiesMap = () => (capabilities ??= JSON.parse(fs.readFileSync(path.join(SITE_FIXES_DIR, 'capabilities-map.json'), 'utf8')));

/** Collects the fixes for one page into the editor. Returns which fix assets the page needs. */
export function collectSiteFixes(doc, html, ed, { pageUrl, siteDir, siteOrigin }, changes) {
  const pathname = pageUrl ? new URL(pageUrl).pathname : '';
  const used = { css: false, js: false };
  const inlineScripts = (re) => findAll(doc, (c) => c.tagName === 'script' && !attr(c, 'src') && re.test(rawText(c)));
  const siteHost = siteOrigin ? new URL(siteOrigin).hostname.replace(/^www\./, '') : '';
  const localHref = (href) => {
    try {
      const u = new URL(href);
      return u.hostname.replace(/^www\./, '') === siteHost ? u.pathname + u.search + u.hash : href;
    } catch {
      return href;
    }
  };

  // Top bar: weather readout -> free-estimate phone number; no more location prompt.
  const ribbon = find(doc, (c) => hasClass(c, 'xai-weather-ribbon'));
  const readout = ribbon && find(ribbon, (c) => hasClass(c, 'weather-data'));
  if (readout) {
    ed.inner(readout, `Free Estimates · Call <a class="pfix-ribbon-link" href="${PHONE.href}">${PHONE.text}</a>`);
    for (const s of inlineScripts(/api\.openweathermap\.org/)) ed.outer(s, '');
    changes.push('top bar: "Local Weather: N/A" -> free-estimate phone number (no location prompt)');
    used.css = true;
  }

  // Lead forms: the review count needs the WordPress API.
  const counts = findAll(doc, (c) => attr(c, 'id') === 'total-reviews');
  if (counts.length) {
    for (const el of counts) ed.inner(el, '<a class="pfix-reviews-link" href="/reviews/">Read our customer reviews</a>');
    for (const s of inlineScripts(/fetchReviewCount/)) ed.outer(s, '');
    changes.push(`lead form: "Unable to load review count" -> link to /reviews/ (${counts.length})`);
    used.css = true;
  }

  // Testimonials: small carousels that never start -> all reviews side by side.
  for (const box of findAll(doc, (c) => hasClass(c, 'swiper-container') && hasClass(c, 'testi-cont'))) {
    const wrapper = find(box, (c) => hasClass(c, 'swiper-wrapper'));
    const slides = wrapper ? (wrapper.childNodes || []).filter((c) => c.tagName && hasClass(c, 'swiper-slide') && !hasClass(c, 'swiper-slide-duplicate')) : [];
    if (!slides.length || slides.length > 3) continue;
    const up = ancestors(box);
    const section = up.find((a) => hasClass(a, 'Client-Logo-section')) || up.find((a) => a.tagName && find(a, (c) => hasClass(c, 'testi-prev-btn')));
    if (pathname === '/service-areas/' && section && hasClass(section, 'Client-Logo-section')) {
      ed.outer(section, '');
      changes.push('testimonials section removed (it does not belong on Service Areas)');
      continue;
    }
    ed.retag(box, withClass(box, ['pfix-testimonials'], ['swiper-container']));
    ed.retag(wrapper, [...withClass(wrapper, ['pfix-testimonials__grid'], ['swiper-wrapper']), { name: 'role', value: 'list' }]);
    for (const s of slides) ed.retag(s, [...s.attrs.filter((a) => a.name !== 'role'), { name: 'role', value: 'listitem' }]);
    const scope = section || box.parentNode;
    const navs = findAll(scope, (c) => hasClass(c, 'testimonial-navigation'));
    const arrows = navs.length ? navs : findAll(scope, (c) => hasClass(c, 'testi-prev-btn') || hasClass(c, 'testi-next-btn'));
    for (const n of arrows) ed.outer(n, '');
    for (const s of findAll(scope, (c) => c.tagName === 'script' && /new Swiper\(\s*["'][^"']*(swiper-container|testi-cont)/.test(rawText(c)))) ed.outer(s, '');
    changes.push(`testimonials: all ${slides.length} reviews shown side by side (the carousel never started; only the first was visible)`);
    used.css = true;
  }

  // Pictures that are missing (on the live site too).
  const exists = (src) => {
    try {
      return fs.existsSync(path.join(siteDir, decodeURIComponent(src.split(/[?#]/)[0])));
    } catch {
      return true;
    }
  };
  const galleries = new Map(); // gallery grid -> tiles removed
  for (const img of findAll(doc, (c) => c.tagName === 'img')) {
    const src = [attr(img, 'data-lazy-src'), attr(img, 'src')].find((s) => s && s.startsWith('/') && !s.startsWith('//'));
    if (!siteDir || !src || exists(src)) continue;
    if (ed.overlaps(img.sourceCodeLocation.startOffset, img.sourceCodeLocation.endOffset)) continue; // inside something already removed
    const alt = attr(img, 'alt') || '';
    if (hasClass(img, 'profile-testi')) {
      // Initials of the name shown on the card (the photo's alt text as a fallback).
      const card = ancestors(img).find((a) => a.tagName && find(a, (c) => hasClass(c, 'profile-name')));
      const shown = card ? clean(textOf(find(card, (c) => hasClass(c, 'profile-name')))) : '';
      const initials = (shown || alt).replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '★';
      const target = img.parentNode?.tagName === 'picture' ? img.parentNode : img;
      const noscript = target === img ? nextElement(img) : null;
      const end = (noscript?.tagName === 'noscript' ? noscript : target).sourceCodeLocation.endOffset;
      ed.replace(target.sourceCodeLocation.startOffset, end, `<span class="${esc([...classes(img), 'pfix-avatar'].join(' '))}" aria-hidden="true">${esc(initials)}</span>`);
      changes.push(`missing reviewer photo -> initials "${initials}" (${shown || alt || src})`);
      used.css = true;
      continue;
    }
    const tile = ancestors(img).find((a) => hasClass(a, 'pi-gallery-item'));
    if (tile) {
      ed.outer(tile, '');
      galleries.set(tile.parentNode, (galleries.get(tile.parentNode) || 0) + 1);
      changes.push(`gallery tile with a missing photo removed (${alt || src})`);
    }
  }
  // The tiles left keep the size they had in a full row of four (.pfix-gallery).
  for (const [grid, removed] of galleries) {
    const left = (grid.childNodes || []).filter((c) => hasClass(c, 'pi-gallery-item')).length - removed;
    if (left < 1 || left > 3 || attr(grid, 'style')) continue;
    ed.retag(grid, [...withClass(grid, ['pfix-gallery']), { name: 'style', value: `--pfix-gallery-n: ${left}` }]);
    used.css = true;
  }

  // A link whose href ended up inside its style attribute (a missing quote on the live
  // site: style="color: #f26924; href="https://…/roofing/">). In a rendered page the
  // browser has already split the URL into empty attributes: https: pandaexteriors.com roofing.
  for (const a of findAll(doc, (c) => c.tagName === 'a' && !attr(c, 'href') && /href\s*=/.test(attr(c, 'style') || ''))) {
    const st = a.sourceCodeLocation.startTag;
    let url = html.slice(st.startOffset, st.endOffset).match(/href\s*=\s*"?\s*(https?:\/\/[^"\s>]+)/i)?.[1];
    if (!url) {
      const names = a.attrs.map((x) => x.name);
      const i = names.findIndex((n) => /^https?:$/i.test(n));
      const parts = i < 0 ? [] : names.slice(i + 1).filter((n) => /^[\w.~%-]+$/.test(n));
      if (parts.length) url = `${names[i]}//${parts.join('/')}/`; // the site's page URLs end in /
    }
    if (!url) continue;
    const href = localHref(url);
    const style = (attr(a, 'style') || '').split(/href\s*=/i)[0].trim();
    ed.replace(st.startOffset, st.endOffset, `<a href="${esc(href)}"${style ? ` style="${esc(style)}"` : ''}>`);
    changes.push(`broken link repaired ("${clean(textOf(a))}" -> ${href})`);
  }

  // Placeholder phone links.
  for (const a of findAll(doc, (c) => c.tagName === 'a' && /^tel:\+?1?234567890$/.test(attr(c, 'href') || ''))) {
    ed.retag(a, a.attrs.map((x) => (x.name === 'href' ? { name: 'href', value: PHONE.href } : x)));
    for (const t of textNodes(a)) editText(ed, html, t, (s) => s.replace(/\(XXX\) XXX-XXXX/g, PHONE.text));
    changes.push(`placeholder phone link -> ${PHONE.text} ("${clean(textOf(a)).replace(/\(XXX\) XXX-XXXX/, PHONE.text)}")`);
  }

  // /commercial-capabilities/: image map with the wrong coordinates + desktop-pixel pins.
  for (const box of findAll(doc, (c) => hasClass(c, 'map-container') && find(c, (x) => x.tagName === 'img' && attr(x, 'usemap')))) {
    const cap = capabilitiesMap();
    const img = find(box, (x) => x.tagName === 'img' && attr(x, 'usemap'));
    if ((attr(img, 'src') || attr(img, 'data-lazy-src') || '').split('/').pop() !== cap.image) {
      console.warn(`site-fixes: ${pathname}: unexpected picture in the capabilities map, left as is`);
      continue;
    }
    const mapEl = find(box, (x) => x.tagName === 'map');
    const spots = (mapEl ? findAll(mapEl, (x) => x.tagName === 'area') : [])
      .map((ar) => ({ city: attr(ar, 'alt'), href: attr(ar, 'href'), box: cap.boxes[attr(ar, 'alt')] }))
      .filter((s) => s.box && s.href);
    if (!spots.length) continue;
    if (mapEl) ed.outer(mapEl, '');
    for (const h of findAll(box, (x) => hasClass(x, 'hotspot'))) ed.outer(h, '');
    ed.retag(img, img.attrs.filter((a) => a.name !== 'usemap'));
    ed.retag(box, withClass(box, ['pfix-imgmap']));
    const pct = (v, total) => `${((v / total) * 100).toFixed(2)}%`;
    const name = (s) => cap.projects[s.href] || s.href.split('/').filter(Boolean).pop();
    // A frame the exact size of the picture (the container can be wider than the
    // picture), so the links, placed in % of the picture, stay on their QR codes.
    const pic = img.parentNode?.tagName === 'picture' ? img.parentNode : img;
    ed.replace(pic.sourceCodeLocation.startOffset, pic.sourceCodeLocation.startOffset, '<div class="pfix-imgmap__frame">');
    ed.replace(
      pic.sourceCodeLocation.endOffset,
      pic.sourceCodeLocation.endOffset,
      spots
        .map(({ city, href, box: [x0, y0, x1, y1] }, i) => {
          const pad = 6;
          const pos = `left:${pct(x0 - pad, cap.width)};top:${pct(y0 - pad, cap.height)};width:${pct(x1 - x0 + 2 * pad, cap.width)};height:${pct(y1 - y0 + 2 * pad, cap.height)}`;
          return `<a class="pfix-imgmap__spot" href="${esc(href)}" style="${pos}" aria-label="${esc(`${city}: ${name(spots[i])}`)}"></a>`;
        })
        .join('') + '</div>'
    );
    const list =
      `<div class="pfix-imgmap-list"><p class="pfix-imgmap-list__title">Commercial project case studies</p>` +
      `<div class="pfix-imgmap-list__items" role="list">` +
      spots.map((s) => `<a role="listitem" href="${esc(s.href)}"><strong>${esc(s.city)}</strong> ${esc(name(s))}</a>`).join('') +
      `</div></div>`;
    ed.replace(box.sourceCodeLocation.endOffset, box.sourceCodeLocation.endOffset, list);
    changes.push(`case-study picture: ${spots.length} links placed over its QR codes and listed below it (the old image map missed them; its pins widened the page on phones)`);
    used.css = true;
  }

  // Blog share buttons -> plain share links.
  const shares = findAll(doc, (c) => c.tagName === 'div' && (hasClass(c, 'js-breakdance-share-button') || hasClass(c, 'js-breakdance-share-mobile')));
  if (shares.length) {
    const canonical = attr(find(doc, (c) => c.tagName === 'link' && attr(c, 'rel') === 'canonical') || {}, 'href') || siteOrigin + pathname;
    const title = attr(find(doc, (c) => c.tagName === 'meta' && attr(c, 'property') === 'og:title') || {}, 'content') || clean(textOf(find(doc, (c) => c.tagName === 'title') || { childNodes: [] }));
    const u = encodeURIComponent(canonical);
    const t = encodeURIComponent(title);
    const urls = {
      Facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      Twitter: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      Email: `mailto:?subject=${t}&body=${u}`,
    };
    let n = 0;
    for (const b of shares) {
      const network = attr(b, 'data-network') || '';
      const native = hasClass(b, 'js-breakdance-share-mobile') || !network;
      const href = native ? urls.Email : urls[network];
      if (!href) continue;
      const attrs = native ? [...withClass(b, ['pfix-share-native']), { name: 'data-share-url', value: canonical }, { name: 'data-share-title', value: title }] : [...b.attrs];
      attrs.push({ name: 'href', value: href });
      if (href.startsWith('http')) attrs.push({ name: 'target', value: '_blank' }, { name: 'rel', value: 'noopener' });
      ed.retag(b, attrs, 'a');
      n++;
    }
    // Their start-up script needs a library that is missing (on the live site too).
    for (const s of inlineScripts(/new BreakdanceSocialShareButtons\(/)) ed.outer(s, '');
    changes.push(`share buttons: ${n} made into working share links`);
    used.css = true;
    used.js = true;
  }

  // /position-details/: the job is loaded from the WordPress API, which a static copy lacks.
  if (pathname === '/position-details/') {
    const box = find(doc, (c) => hasClass(c, 'job-container'));
    const t = box && textNodes(box).find((x) => /Failed to load job details/.test(x.value));
    if (t) {
      editText(ed, html, t, (s) => s.replace('Failed to load job details.', 'This job listing isn’t available right now. You can see all open positions on our Careers page.'));
      const apply = find(doc, (c) => attr(c, 'id') === 'apply-button-2');
      if (apply) {
        ed.retag(apply, apply.attrs.filter((a) => a.name !== 'target').map((a) => (a.name === 'href' ? { name: 'href', value: '/careers/' } : a)));
        for (const x of textNodes(apply)) editText(ed, html, x, (s) => s.replace('Apply Now', 'See open positions'));
      }
      for (const s of inlineScripts(/fetchJobDetails/)) ed.outer(s, '');
      changes.push('job details page: "Failed to load job details." -> pointer to the open positions on /careers/');
    }
  }

  // Typos in visible text (not in URLs or attributes). Skips text already being edited.
  const body = find(doc, (c) => c.tagName === 'body');
  const skip = new Set(['script', 'style', 'noscript', 'textarea', 'template']);
  const fixedTypos = new Set();
  const walkText = (n) => {
    if (n.tagName && skip.has(n.tagName)) return;
    if (n.nodeName === '#text') {
      const l = n.sourceCodeLocation;
      if (!l || ed.overlaps(l.startOffset, l.endOffset)) return;
      editText(ed, html, n, (s) =>
        TYPOS.reduce((x, [re, to]) => x.replace(re, (m) => (fixedTypos.add(`${m} -> ${to}`), to)), s)
      );
      return;
    }
    for (const c of n.childNodes || []) walkText(c);
  };
  if (body) walkText(body);
  if (fixedTypos.size) changes.push(`typos: ${[...fixedTypos].join('; ')}`);

  return used;
}
