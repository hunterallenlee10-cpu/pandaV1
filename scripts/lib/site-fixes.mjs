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
//    nothing; the reviews beside the video on / and /services/ sat below a large empty
//    band. Every one of them is now the same looping review carousel (reviews.mjs,
//    custom/reviews/); the section is removed from Service Areas.
//  - "Our Project Gallery" (8 pages): three sliders were started on the same photos, so
//    they came out at different widths, the first one cut off, off centre under the
//    tabs. It is now one gallery of same-size photos with category tabs, arrows, dots and
//    a photo viewer (project-gallery.mjs, custom/project-gallery/).
//  - "Experts You Can Trust" (home page): the logo carousel jumped one step every 2.5 s
//    (and its looped copies never loaded their logos); it is now a continuously gliding
//    row of logos.
//  - "About Our Team" / "Request an Appointment" sections: the award badges picture
//    (GAF President's Club + two Inc. 5000 badges) becomes the same badges with the
//    site's other GAF certifications (Diamond Pledge, Metal Certified) in the empty
//    space around them.
//  - Home hero: the award badges picture kept a fixed 562 px width in its 260 px column
//    between two white lines (off the right of the screen on tablets, under the form on
//    small laptops); above phone size the lines and the picture now share one width, as
//    they already did on phones.
//  - From 1120 px the page builder gives some blocks their desktop width (1143 px rows,
//    the 1198 px blog article), but the page's column stays 960 px wide up to 1200 px
//    (1140 px above), so they ran off the right of the screen (the blog text was cut
//    off) at 1120–1199 px, an iPad held sideways among others; they now stop at the
//    column's edge (so does a picture on /roofing/residential/ at 480–529 px, and long
//    words in blog posts on the smallest phones). In the same range the header's phone
//    button wrapped under the logo and the taller header covered the top of the page;
//    the header now uses the whole width there, as it fits in one row.
//  - Header "Services" menu: the "Other" entry (Siding, and Gutters with Gutter Guards one
//    level further in) is replaced by Gutters, Gutter Guards and Siding as their own entries.
//  - "About Our Team" (the lead-form block above the footer on most pages): white text on
//    Panda lime was hard to read; it now sits on a charcoal green with a lime button.
//  - /reviews/: the "Read More Reviews!" button is removed (on request).
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
//  - /service-areas/ hero: it said only "Our Service Areas" and a tagline over a blurry,
//    stretched strip of roof (a 2000x450 picture pinned to the screen). It now says where
//    Panda works, with the numbers from the US map's areas.json (jobs, states, offices),
//    has state chips that glide to the map and zoom to that state, call and map buttons,
//    and a sharp drone photo that loads first.
//  - /service-areas/ "Our Reliable Exterior Remodeling Services": four green boxes of
//    text become a gliding row of photo cards, one per service page, that eases to a
//    stop under the mouse.
//  - Share titles (og:title, twitter:title) copied from the About page: /podcast/ and
//    /referrals/ were shared as "Panda Exteriors | About Us"; they now use the page's
//    own title.
//  - Typos in headings and labels.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { attr, classes, hasClass, esc, textOf, rawText, clean, findAll, find, editText, textNodes, startTag, headEndOffset } from './html-edit.mjs';
import { collectReviewCarousels } from './reviews.mjs';
import { collectProjectGalleries } from './project-gallery.mjs';
import { loadUsMap } from './us-map.mjs';

export const SITE_FIXES_DIR = path.join(ROOT, 'custom', 'site-fixes');
export const SITE_FIXES_FILES = { 'site-fixes.css': '/_custom/site-fixes/site-fixes.css', 'site-fixes.js': '/_custom/site-fixes/site-fixes.js' };
// Fixes that change a whole section or message, by the start of their change note.
export const SECTION_FIXES = /^(testimonials|project gallery|hero awards picture|case-study picture|gallery tile|job details page|logo carousel|award badges|removed on request|service areas hero|services carousel|about section colors)/;

// The badges shown where the award badges picture was (files already on the site): the
// three GAF certifications on top, the two Inc. 5000 awards below. The GAF President's
// Club badge and both Inc. 5000 badges are the ones in the old picture.
const AWARDS_PICTURE = /\/wp-content\/uploads\/2025\/04\/awards\.png$/;
const BADGES = [
  { src: '/wp-content/uploads/2025/04/brand-gaf-pledge.png', width: 120, height: 120, kind: 'gaf', alt: 'GAF Diamond Pledge: NDL roof guarantee' },
  { src: '/wp-content/uploads/2025/04/brand-gaf.png', width: 120, height: 120, kind: 'gaf', alt: 'GAF President’s Club: residential award winner' },
  { src: '/wp-content/uploads/2025/05/GAF-Metal-Certified-Panda-Exteriors.png', width: 120, height: 120, kind: 'gaf', alt: 'GAF Metal Certified: Timbersteel roofing contractor' },
  { src: '/wp-content/uploads/2025/04/inc-2004.png', width: 150, height: 130, kind: 'inc', alt: 'Inc. 5000 2024: No. 50 of America’s fastest-growing private companies' },
  { src: '/wp-content/uploads/2025/04/inc-1.png', width: 150, height: 130, kind: 'inc', alt: 'Inc. 5000 2024: No. 1 in construction among America’s fastest-growing private companies' },
];

// The number in the site's header on every page.
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// The header's "Services" menu: the entries that replace "Other", in this order, under Solar.
const SERVICE_MENU_ITEMS = [
  ['Gutters', '/gutters/'],
  ['Gutter Guards', '/gutters/gutter-guards/'],
  ['Siding', '/siding/'],
];
// The Google rating in the lead form's rating picture (admin-ajax-2.png).
const GOOGLE_RATING = '4.9';

// /service-areas/ hero: the drone photo of the Laurel, MD office and the homes around it
// (already on the site, with a .webp copy). site-fixes.css uses the same file.
const SA_HERO_PHOTO = '/wp-content/uploads/2025/07/DJI_20250722134520_0995_D.jpg';
const SA_HERO_CHIPS = 6; // states with the most jobs, as chips; the rest are "+N more"
const SA_MAP_ID = 'service-map';
// /service-areas/ "Our Reliable Exterior Remodeling Services": one card per service page,
// with a photo the site already has for it (a .webp copy is used where there is one).
const SERVICE_CARDS = [
  { group: 'Roofing', title: 'Roof Replacement', href: '/roofing/replacement/', img: ['/wp-content/uploads/2025/04/Roof-Replacement-768x432.jpg', 768, 432],
    text: 'GAF Master Elite certified crews replace worn-out roofs quickly and stand behind the work.' },
  { group: 'Roofing', title: 'Roof Repairs', href: '/roofing/repairs/', img: ['/wp-content/uploads/2025/04/Roofing-Repairs.jpg', 1200, 798],
    text: 'Leaks, storm damage and missing shingles fixed at fair prices, with help on insurance claims.' },
  { group: 'Roofing', title: 'Residential Roofing', href: '/roofing/residential/', img: ['/wp-content/uploads/2025/04/hero-roofing.jpg', 1400, 800],
    text: 'A new roof for your home in the style you want, from an A-rated, GAF Master Elite roofer.' },
  { group: 'Roofing', title: 'Attic Insulation', href: '/roofing/attic-insulation/', img: ['/wp-content/uploads/2025/04/Attic-Insulation.jpg', 1200, 799],
    text: 'Environmentally friendly insulation that keeps your home comfortable all year.' },
  { group: 'Solar', title: 'Solar Panels', href: '/solar/solar-panel-installations/', img: ['/wp-content/uploads/2025/03/8a443005-9df9-4777-839c-45cf7d4b9f2e-1-768x512.jpg', 768, 512],
    text: 'Solar panel systems that lower your utility bills and can qualify for tax incentives.' },
  { group: 'Solar', title: 'GAF Solar Roof', href: '/solar/gaf-solar-roof/', img: ['/wp-content/uploads/2025/05/GAF-Solar-Shingle-Installation-1-768x432.jpg', 768, 432],
    text: 'Solar shingles that work as your roof and your power source, in one install.' },
  { group: 'Commercial', title: 'Commercial Roofing', href: '/commerical-roofing/', img: ['/wp-content/uploads/2025/04/hero-commercial-roofing.jpg', 1400, 800],
    text: 'Flat roof repairs and full replacements for businesses, from inspection to final walkthrough.' },
  { group: 'Exterior', title: 'Siding', href: '/siding/', img: ['/wp-content/uploads/2025/03/Group-9560-1.png', 1450, 768],
    text: 'New siding that refreshes how your home looks and protects it from the weather.' },
  { group: 'Exterior', title: 'Gutters', href: '/gutters/', img: ['/wp-content/uploads/2025/04/Gutter-System.jpg', 1200, 800],
    text: 'Complete gutter systems that carry rainwater away from your roof and foundation.' },
  { group: 'Exterior', title: 'Gutter Guards', href: '/gutters/gutter-guards/', img: ['/wp-content/uploads/2025/04/gutter-installation-768x506.jpg', 768, 506],
    text: 'Guards that stop clogs and pests and cut down on gutter cleaning.' },
];
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

const fmt = (n) => n.toLocaleString('en-US');
const andList = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs.join(''));
const ICON_PHONE =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';
const ICON_DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M11 4h2v12.2l4.6-4.6 1.4 1.4-7 7-7-7 1.4-1.4 4.6 4.6z"/></svg>';

// /service-areas/ hero: the text column says where Panda works (from the US map's data,
// so the two always agree), the map section gets an id for the chips and the map button
// to point at, and the photo is preloaded. The photo itself is set in site-fixes.css.
function serviceAreasHero(doc, html, ed, { pathname, siteDir }, changes) {
  const hero = find(doc, (c) => hasClass(c, 'service-area-hero'));
  const text = hero && find(hero, (c) => hasClass(c, 'text-section'));
  const h1 = text && find(text, (c) => c.tagName === 'h1');
  if (!h1 || hasClass(hero, 'pfix-sa-hero')) return false;
  if (siteDir && ![SA_HERO_PHOTO, `${SA_HERO_PHOTO}.webp`].every((f) => fs.existsSync(path.join(siteDir, f)))) {
    console.warn(`site-fixes: ${pathname}: the hero photo is missing from the site, hero left as is`);
    return false;
  }
  const { states, stateByCode, areas } = loadUsMap();
  const jobs = states.reduce((n, s) => n + (Number(s.jobs) || 0), 0);
  const offices = areas.length;
  const officeStates = [...new Set(areas.map((a) => a.state))].map((code) => stateByCode.get(code).name);
  const top = [...states].sort((a, b) => (Number(b.jobs) || 0) - (Number(a.jobs) || 0)).slice(0, SA_HERO_CHIPS);
  const more = states.length - top.length;

  const stat = (value, label) => `<div class="pfix-sa-hero__stat" role="listitem"><b>${value}</b><span>${esc(label)}</span></div>`;
  const chip = (s) =>
    `<a class="pfix-sa-hero__chip" href="#${SA_MAP_ID}" data-pfix-state="${esc(s.code)}">${esc(s.name)}${s.jobs ? ` <span>${fmt(Number(s.jobs))}</span>` : ''}</a>`;
  const column =
    `<p class="pfix-sa-hero__eyebrow">Our Service Areas</p>` +
    startTag(h1, withClass(h1, ['pfix-sa-hero__title'])) +
    esc(`Local exterior remodelers with ${offices} offices on the East Coast`) +
    `</h1>` +
    `<p class="pfix-sa-hero__sub">${esc(
      `${jobs ? `We’ve completed ${fmt(jobs)} jobs in ${states.length} states.` : `We work in ${states.length} states.`} ` +
        `Our local offices are in ${andList(officeStates)}.`
    )}</p>` +
    `<div class="pfix-sa-hero__stats" role="list">` +
    (jobs ? stat(fmt(jobs), 'Jobs completed') : '') +
    stat(states.length, 'States') +
    stat(offices, 'Local offices') +
    stat(`${GOOGLE_RATING}<span class="pfix-sa-hero__star" aria-hidden="true">★</span>`, 'Google rating') +
    `</div>` +
    `<div class="pfix-sa-hero__areas">` +
    `<p class="pfix-sa-hero__label" id="pfix-sa-hero-areas">${jobs ? 'Jobs completed by state' : 'Some of the states we work in'}</p>` +
    `<div class="pfix-sa-hero__chips" role="group" aria-labelledby="pfix-sa-hero-areas">` +
    top.map(chip).join('') +
    (more > 0 ? `<a class="pfix-sa-hero__chip pfix-sa-hero__chip--more" href="#${SA_MAP_ID}" data-pfix-state="" aria-label="See all ${states.length} states on the map">+${more} more</a>` : '') +
    `</div></div>` +
    `<div class="pfix-sa-hero__ctas">` +
    `<a class="pfix-sa-hero__btn pfix-sa-hero__btn--call" href="${PHONE.href}">${ICON_PHONE}` +
    `<span class="pfix-sa-hero__long">Call ${PHONE.text}</span><span class="pfix-sa-hero__short" aria-hidden="true">Call us</span></a>` +
    `<a class="pfix-sa-hero__btn pfix-sa-hero__btn--map" href="#${SA_MAP_ID}">${ICON_DOWN}See the map</a>` +
    `</div>`;
  ed.retag(hero, withClass(hero, ['pfix-sa-hero']));
  ed.inner(text, column);

  // The section the large map sits in (its heading is "Proud to Serve…").
  const section = find(doc, (c) => hasClass(c, 'Area_Section'));
  if (section && !attr(section, 'id')) ed.retag(section, [...section.attrs, { name: 'id', value: SA_MAP_ID }]);
  else if (!section) console.warn(`site-fixes: ${pathname}: no map section, the hero's map links go nowhere`);

  // Fetch the photo with the page instead of when WP Rocket's lazy loader gets to it.
  const headEnd = headEndOffset(html);
  if (headEnd >= 0) ed.replace(headEnd, headEnd, `<link rel="preload" as="image" type="image/webp" href="${SA_HERO_PHOTO}.webp" fetchpriority="high">`);

  changes.push(
    `service areas hero: says where Panda works (${fmt(jobs)} jobs, ${states.length} states, ${offices} offices), ` +
      `with state chips that zoom the map, call and map buttons and a sharp drone photo (was a stretched roof strip)`
  );
  return true;
}

// /service-areas/ "Our Reliable Exterior Remodeling Services": four flat green boxes of
// text (Roofing, Solar, Commercial, Gutters) -> a gliding row of photo cards for every
// service page (SERVICE_CARDS), each linking to its page. It moves with the logo row's
// script (.pfix-marquee in site-fixes.js), easing to a stop under the mouse; without
// JavaScript or with reduced motion the cards sit still, wrapped in rows.
function servicesCarousel(doc, html, ed, { pathname, siteDir }, changes) {
  const section = find(doc, (c) => hasClass(c, 'roofers-section') && find(c, (x) => /^h[1-6]$/.test(x.tagName) && /Our Reliable Exterior Remodeling Services/.test(textOf(x))));
  const grid = section && find(section, (c) => hasClass(c, 'Roof-grid'));
  if (!grid) return false;
  const exists = (src) => !siteDir || fs.existsSync(path.join(siteDir, src));
  const cards = SERVICE_CARDS.filter((s) => exists(s.img[0]));
  if (cards.length < SERVICE_CARDS.length) console.warn(`site-fixes: ${pathname}: ${SERVICE_CARDS.length - cards.length} service photo(s) missing, those cards left out`);
  if (cards.length < 4) return false;
  const card = (s) => {
    const [src, w, h] = s.img;
    const webp = exists(`${src}.webp`) ? `<source type="image/webp" srcset="${esc(src)}.webp">` : '';
    return (
      `<div class="pfix-marquee__item" role="listitem"><a class="pfix-svc" href="${esc(s.href)}">` +
      `<span class="pfix-svc__media"><picture>${webp}<img src="${esc(src)}" alt="" width="${w}" height="${h}" loading="lazy" decoding="async"></picture></span>` +
      `<span class="pfix-svc__body"><span class="pfix-svc__group">${esc(s.group)}</span>` +
      `<h3 class="pfix-svc__title">${esc(s.title)}</h3><span class="pfix-svc__text">${esc(s.text)}</span>` +
      `<span class="pfix-svc__more">Learn more<span aria-hidden="true"> →</span></span></span></a></div>`
    );
  };
  ed.retag(section, withClass(section, ['pfix-services']));
  ed.outer(
    grid,
    `<div class="pfix-marquee pfix-marquee--cards" data-speed="34" role="region" aria-label="Our services">` +
      `<div class="pfix-marquee__track" role="list">${cards.map(card).join('')}</div></div>` +
      `<p class="pfix-services__all"><a href="/services/">See all our services<span aria-hidden="true"> →</span></a></p>`
  );
  // The intro ran its two sentences together ("renovations.Some of…") on wide screens.
  const intro = find(section, (c) => c.tagName === 'p' && /manufacturers’ warranties/.test(textOf(c)));
  if (intro)
    ed.inner(
      intro,
      'We work with products backed by manufacturers’ warranties, so you get reliable results from every renovation. Here are the services we offer:'
    );
  changes.push(`services carousel: ${cards.length} photo cards linking to each service page, gliding until hovered (was 4 green boxes of text)`);
  return true;
}

/** Collects the fixes for one page into the editor. Returns which fix assets the page needs. */
export function collectSiteFixes(doc, html, ed, { pageUrl, siteDir, siteOrigin }, changes) {
  const pathname = pageUrl ? new URL(pageUrl).pathname : '';
  const used = { css: false, js: false, reviews: false, gallery: false };
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

  // Lead forms: the review count needs the WordPress API. The second form on a page (the
  // one in "About Our Team") uses total-reviews-1 or -2; the snapshot caught it showing
  // "Unable to load review count" or "Based on 0 reviews!".
  const counts = findAll(doc, (c) => /^total-reviews(-\d+)?$/.test(attr(c, 'id') || ''));
  if (counts.length) {
    for (const el of counts) ed.inner(el, '<a class="pfix-reviews-link" href="/reviews/">Read our customer reviews</a>');
    for (const s of inlineScripts(/fetchReviewCount/)) ed.outer(s, '');
    changes.push(`lead form: "Unable to load review count" -> link to /reviews/ (${counts.length})`);
    used.css = true;
  }

  // Testimonials: every review carousel -> the looping review carousel (reviews.mjs).
  // Before the missing-photo fix below, which then leaves the replaced reviews alone.
  if (collectReviewCarousels(doc, ed, { pathname }, changes)) used.reviews = true;

  // "Our Project Gallery": the slider started three times over -> one tidy gallery
  // (project-gallery.mjs, custom/project-gallery/).
  if (collectProjectGalleries(doc, ed, changes)) used.gallery = true;

  // "Experts You Can Trust": the logo carousel (started by the site's own script for
  // every .swiper, stepping every 2.5 s) -> a gliding row. Its class names change so that
  // script leaves it alone; Swiper's leftovers in a rendered page (copies, sizes) go.
  const swiperState = (c) => /^swiper-/.test(c) && c !== 'swiper-wrapper' && c !== 'swiper-slide';
  const noSwiperAttrs = (n) =>
    n.attrs.filter((a) => !['style', 'role', 'aria-label', 'aria-live', 'data-swiper-slide-index'].includes(a.name) && !(a.name === 'id' && /^swiper-wrapper-/.test(a.value)));
  for (const box of findAll(doc, (c) => hasClass(c, 'swiper') && hasClass(c, 'swipper-Logo'))) {
    const wrapper = find(box, (c) => hasClass(c, 'swiper-wrapper'));
    const slides = wrapper ? (wrapper.childNodes || []).filter((c) => c.tagName && hasClass(c, 'swiper-slide')) : [];
    const logos = slides.filter((s) => hasClass(s, 'client-logo') && !hasClass(s, 'swiper-slide-duplicate'));
    if (!logos.length || logos.length !== slides.filter((s) => !hasClass(s, 'swiper-slide-duplicate')).length) continue;
    ed.retag(box, withClass({ attrs: noSwiperAttrs(box) }, ['pfix-marquee'], ['swiper', ...classes(box).filter(swiperState)]));
    ed.retag(wrapper, withClass({ attrs: noSwiperAttrs(wrapper) }, ['pfix-marquee__track'], ['swiper-wrapper']));
    for (const s of slides) {
      if (hasClass(s, 'swiper-slide-duplicate')) ed.outer(s, '');
      else ed.retag(s, withClass({ attrs: noSwiperAttrs(s) }, ['pfix-marquee__item'], ['swiper-slide', ...classes(s).filter(swiperState)]));
    }
    changes.push(`logo carousel: ${logos.length} logos glide past continuously (it jumped a step every 2.5 s)`);
    used.css = true;
    used.js = true;
  }

  // "About Our Team" / "Request an Appointment": the award badges picture -> the badges
  // one by one, with the other GAF certifications added (see BADGES).
  const haveBadges = !siteDir || BADGES.every((b) => fs.existsSync(path.join(siteDir, b.src)) && fs.existsSync(path.join(siteDir, `${b.src}.webp`)));
  for (const img of findAll(doc, (c) => c.tagName === 'img' && AWARDS_PICTURE.test(attr(c, 'data-lazy-src') || attr(c, 'src') || ''))) {
    if (!ancestors(img).some((a) => hasClass(a, 'Request-Container'))) continue;
    if (!haveBadges) {
      console.warn(`site-fixes: ${pathname}: a badge picture is missing from the site, award badges left as is`);
      break;
    }
    const pic = img.parentNode?.tagName === 'picture' ? img.parentNode : img;
    if (ed.overlaps(pic.sourceCodeLocation.startOffset, pic.sourceCodeLocation.endOffset)) continue;
    const badge = (b) =>
      `<div class="pfix-badges__item pfix-badges__item--${b.kind}" role="listitem"><picture>` +
      `<source type="image/webp" srcset="${esc(b.src)}.webp">` +
      `<img src="${esc(b.src)}" alt="${esc(b.alt)}" width="${b.width}" height="${b.height}" loading="lazy" decoding="async">` +
      `</picture></div>`;
    ed.outer(pic, `<div class="pfix-badges" role="list" aria-label="Certifications and awards">${BADGES.map(badge).join('')}</div>`);
    changes.push('award badges: the other GAF certifications (Diamond Pledge, Metal Certified) added beside President’s Club and the Inc. 5000 badges');
    used.css = true;
  }

  // Home hero: the award badges picture between two white lines (.logo-container, 260 px
  // wide) kept its fixed 562 px width above phone size -> lines and picture share one
  // width, no wider than the column (.pfix-hero-awards).
  const retagOnce = (n, cls) => {
    const st = n.sourceCodeLocation.startTag;
    if (hasClass(n, cls) || ed.overlaps(st.startOffset, st.endOffset)) return false;
    ed.retag(n, withClass(n, [cls]));
    return true;
  };
  for (const box of findAll(doc, (c) => hasClass(c, 'logo-container') && (c.childNodes || []).some((k) => k.tagName && hasClass(k, 'Flex-image')))) {
    if (!retagOnce(box, 'pfix-hero-awards')) continue;
    changes.push('hero awards picture: kept between its two lines, no wider than its column (it ran off the screen on tablets and under the form on small laptops)');
    used.css = true;
  }

  // Blocks with a fixed desktop width wider than their column at 1120–1199 px (1143 px
  // rows, the 1198 px blog article and its picture) -> no wider than the column (.pfix-fit);
  // long words (an email address) wrap inside the article. The award badges picture on
  // /roofing/residential/ is set 100 px in from the left, which ran it off the screen at
  // 480–529 px -> in line with the text above it below 768 px, as below 480 px already.
  const fixedWidth = findAll(doc, (c) => ['container-custom', 'Blog-detail', 'Blog-detail-img', 'img-flex-logos'].some((k) => hasClass(c, k))).filter((c) => retagOnce(c, 'pfix-fit'));
  // Blog post heroes: the topic and date tags have a 10 px right margin, which ran a few px
  // off the smallest phones' screens when a tag filled its line (.pfix-fit too).
  for (const box of findAll(doc, (c) => hasClass(c, 'text-section') && (c.childNodes || []).some((k) => k.tagName && hasClass(k, 'tag-text')))) {
    if (retagOnce(box, 'pfix-fit')) fixedWidth.push(box);
  }
  if (fixedWidth.length) {
    changes.push(`column fit: ${fixedWidth.length} fixed-width block(s) kept inside their column (they ran off the screen at some widths)`);
    used.css = true;
  }

  // The header's row (logo, menu, phone button) in its 960 px column at 1120–1199 px: the
  // button wrapped under the logo -> the row uses the whole width there (.pfix-header-row).
  for (const box of findAll(doc, (c) => hasClass(c, 'container') && c.parentNode && hasClass(c.parentNode, 'nav') && (c.childNodes || []).some((k) => k.tagName && hasClass(k, 'row-flex')))) {
    if (!retagOnce(box, 'pfix-header-row')) continue;
    changes.push('header: logo, menu and phone button kept in one row at 1120–1199 px (the button wrapped under the logo)');
    used.css = true;
  }

  // Header "Services" menu: its last entry, "Other", held Siding and Gutters (with Gutter
  // Guards one level further in) -> Gutters, Gutter Guards and Siding as their own entries
  // under Solar, built like the menu's other plain entries (no arrow, no further level).
  for (const menu of findAll(doc, (c) => hasClass(c, 'Service-Menu'))) {
    const list = (menu.childNodes || []).find((k) => k.tagName && hasClass(k, 'sub_menu'));
    const other = list && (list.childNodes || []).find((k) => k.tagName && hasClass(k, 'has_dropdown') && (k.childNodes || []).some((a) => a.tagName === 'a' && clean(textOf(a)) === 'Other'));
    if (!other || ed.overlaps(other.sourceCodeLocation.startOffset, other.sourceCodeLocation.endOffset)) continue;
    const sample = find(list, (c) => c.tagName === 'a' && hasClass(c, 'Nav-Link-Hover') && hasClass(c.parentNode, 'li') && !hasClass(c.parentNode, 'mobile-show'));
    const liClass = sample ? attr(sample.parentNode, 'class') : 'oxy-container li';
    const aClass = sample ? attr(sample, 'class') : 'oxy-text-link Nav-Link Nav-Link-Hover';
    ed.outer(
      other,
      SERVICE_MENU_ITEMS.map(([label, href]) => `<div class="${esc(liClass)}"><a class="${esc(aClass)}" href="${esc(href)}" target="_self"> ${esc(label)} </a></div>`).join(' ')
    );
    changes.push('services menu: "Other" -> Gutters, Gutter Guards and Siding as their own entries');
  }

  // "About Our Team" (and the same block on the offer pages): white text on Panda lime was
  // hard to read (about 1.7:1 with the paragraphs at 80% opacity) -> a charcoal green, with
  // the lime kept for its button (.pfix-about). The white version of the block is left as is.
  const about = findAll(doc, (c) => hasClass(c, 'Request-Container') && hasClass(c, 'primary-bg')).filter((c) => retagOnce(c, 'pfix-about'));
  if (about.length) {
    changes.push(`about section colors: charcoal green background, lime button (white on lime was hard to read) (${about.length})`);
    used.css = true;
  }

  // Removed on request.
  if (pathname === '/reviews/') {
    for (const b of findAll(doc, (c) => hasClass(c, 'bde-button') && /^Read More Reviews!?$/i.test(clean(textOf(c))))) {
      ed.outer(b, '');
      changes.push('removed on request: the "Read More Reviews!" button');
    }
  }
  if (pathname === '/service-areas/') {
    // "Expert Roofers on the East Coast" (text and truck photo, under the hero) and the
    // green "Learn More About Our Exterior Remodeling Services" band (text and photo).
    const SECTIONS = [
      ['Service-container', 'Expert Roofers on the East Coast'],
      ['Client-section', 'Learn More About Our Exterior Remodeling Services'],
    ];
    for (const [cls, title] of SECTIONS) {
      const heading = (c) => /^h[1-6]$/.test(c.tagName) && clean(textOf(c)) === title;
      for (const box of findAll(doc, (c) => hasClass(c, cls) && find(c, heading))) {
        ed.outer(box, '');
        changes.push(`removed on request: the "${title}" section`);
      }
    }
    // The truck photo went with its section: no more fetching it first.
    for (const l of findAll(doc, (c) => c.tagName === 'link' && attr(c, 'rel') === 'preload' && /Panda-Exteriors-Truck/.test(attr(c, 'imagesrcset') || attr(c, 'href') || ''))) {
      ed.outer(l, '');
    }
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

  // /service-areas/: the hero says where Panda works and links to the map.
  if (pathname === '/service-areas/' && serviceAreasHero(doc, html, ed, { pathname, siteDir }, changes)) {
    used.css = true;
    used.js = true;
  }
  if (pathname === '/service-areas/' && servicesCarousel(doc, html, ed, { pathname, siteDir }, changes)) {
    used.css = true;
    used.js = true;
  }

  // A share title copied from the About page ("Panda Exteriors | About Us") on another
  // page: the page's own title (what the browser tab and search results show).
  if (pathname && pathname !== '/about/') {
    const title = clean(textOf(find(doc, (c) => c.tagName === 'title') || { childNodes: [] }));
    const shared = findAll(doc, (c) => c.tagName === 'meta' && ['og:title', 'twitter:title'].includes(attr(c, 'property') || attr(c, 'name')) && /\|\s*About Us$/.test(attr(c, 'content') || ''));
    if (title && shared.length) {
      const was = attr(shared[0], 'content');
      for (const m of shared) ed.retag(m, m.attrs.map((a) => (a.name === 'content' ? { name: 'content', value: title } : a)));
      changes.push(`share title: "${was}" -> "${title}"`);
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
