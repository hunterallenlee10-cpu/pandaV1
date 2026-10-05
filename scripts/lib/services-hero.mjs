// Service-page heroes, redesigned to match the site's other heroes (/about/, /offers/): a
// label, the page's heading and line, chips that lead to the page's services, and "Get a free
// estimate" (to the form beside it) and call buttons, over the page's photo darkened behind
// the text. The estimate form beside it is unchanged.
//
//  - /services/: the line offered windows (not a Panda service) over a 678 KB PNG of a Panda
//    roofer installing solar shingles. The line names what Panda does, the chips are the six
//    services, and the photo is a 184 KB WebP copy (services-hero.webp).
//  - /gutters/: the heading and line over a close-up of a gutter guard (hero-gutters.jpg,
//    already small). The chips are gutter installation (the services below the hero) and
//    gutter guards (their page), each with a line from the cards below.
//  - /gutters/gutter-guards/: the heading and line over a photo of a gutter system, now a
//    165 KB WebP copy (gutter-guards-hero.webp) of the 292 KB JPEG. The chips lead to the
//    benefits below (gutter-guards-page.mjs) and to the Gutters page.
//  - /siding/: the heading (a plain block, now the page's h1) and line, with the James Hardie
//    and CertainTeed logos, over a photo of a sided home, now a 147 KB WebP copy
//    (siding-hero.webp) of the 262 KB PNG. The chips are the two siding types, leading to
//    their comparison below (service-pages.mjs); the logos stay under the buttons.
//  - /roofing-costs/: "Roofing Costs" and "Partner with our team for your roofing needs." over
//    an aerial photo of a finished roof (the 187 KB WebP copy beside the 526 KB JPEG). The
//    chips lead to what affects the cost and to insurance roofing below
//    (roofing-costs-page.mjs), and to financing.
//  - /roofing/: "Expert Roofing Services for Your East Coast Home" and its line about GAF
//    Master Elite contractors over a roofed home (hero-roofing.jpg, already a 250 KB JPEG: a
//    WebP copy saved little). The chips are the four roofing pages, each with a line from
//    the page's cards.
//
// Applied by site-fixes.mjs; the text is rendered again on every run (the hero is found by
// its own class on a page an earlier build changed), so `npm run update:site` updates it.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { attr, hasClass, classes, esc, find, findAll, headEndOffset } from './html-edit.mjs';

const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// The hero's estimate form (service-forms.mjs).
const FORM_ID = 'pfix-lead-1';

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  roof: line('M3 11.5L12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5'),
  building: line('M4 21V4h11v17M15 9h5v12M2.5 21h19M7.5 8h2M7.5 12h2M7.5 16h2M11 8h1M11 12h1M11 16h1'),
  sun: line('M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5V4.5M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4'),
  siding: line('M4 5h16v14H4zM4 9h16M4 13h16M4 17h16'),
  gutter: line('M3 7h18l-2 4H5zM17 11v6.5a2.5 2.5 0 0 0 2.5 2.5'),
  guard: line('M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6'),
  layers: line('M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5'),
  swap: line('M4 9h13l-3.5-3.5M20 15H7l3.5 3.5'),
  thermo: line('M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0zM12 9v7.5'),
  card: line('M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3 10h18M7 15h4'),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
};

// Per page: the hero's class as captured, its photo (site-fixes.css sets it as the
// background, by the page's modifier class), the photo it used to preload, and the words.
export const SERVICES_HERO_PHOTO = '/_custom/site-fixes/services-hero.webp';
const HEROES = {
  '/services/': {
    key: 'services',
    from: 'hero-section-service',
    photo: SERVICES_HERO_PHOTO,
    custom: true,
    oldPreload: '/wp-content/uploads/2025/03/51d2ed67-a432-4105-a85b-e500c856ba9d-2-min.png',
    eyebrow: 'Our services',
    title: 'Expert Roofing and Exterior Services',
    sub: 'From roofing and siding to solar and gutters, we deliver quality craftsmanship that protects your home and boosts its curb appeal.',
    // The services, in the order of the cards below the hero (and the header's menu).
    chips: [
      ['roof', 'Roofing', '/roofing/'],
      ['building', 'Commercial', '/commercial-roofing/'],
      ['sun', 'Solar', '/solar/'],
      ['siding', 'Siding', '/siding/'],
      ['gutter', 'Gutters', '/gutters/'],
      ['guard', 'Gutter Guards', '/gutters/gutter-guards/'],
    ],
    note: 'a line without "windows" (not a Panda service), service chips and estimate and call buttons, over a sharper, lighter copy of the photo',
  },
  '/gutters/': {
    key: 'gutters',
    from: 'Gutter',
    photo: '/wp-content/uploads/2025/04/hero-gutters.jpg',
    eyebrow: 'Gutters & gutter guards',
    title: 'Expert Gutter Replacement Services for Your East Coast Home',
    sub: 'From gutter guard installations to complete gutter system replacements, our trained and certified team has got you covered.',
    // The two services, with a line from their cards below the hero.
    chips: [
      ['gutter', 'Gutter installation', '#gutter-services', 'Gutters that carry water away from your home'],
      ['guard', 'Gutter guards', '/gutters/gutter-guards/', 'Keep leaves, debris and pests out'],
    ],
    note: 'gutter installation and gutter guard chips and estimate and call buttons, with the photo darkened behind the text',
  },
  '/gutters/gutter-guards/': {
    key: 'guards',
    from: 'Gutter-card',
    photo: '/_custom/site-fixes/gutter-guards-hero.webp',
    custom: true,
    oldPreload: '/wp-content/uploads/2025/04/Gutter-System.jpg',
    eyebrow: 'Gutter guards',
    title: 'Expert Gutter Guard Installations for Your East Coast Home',
    sub: 'With best-in-class warranties on all our products, you can feel certain that your gutter protection will last.',
    // What guards do (the benefits below) and new gutters, with a line from the page.
    chips: [
      ['guard', 'Why gutter guards', '#guard-benefits', 'No clogs, no nests, no climbing ladders'],
      ['gutter', 'New gutters too', '/gutters/', 'Replace worn gutters and add guards'],
    ],
    note: 'chips for the benefits and new gutters and estimate and call buttons, over a lighter copy of the photo',
  },
  '/siding/': {
    key: 'siding',
    from: 'siding',
    photo: '/_custom/site-fixes/siding-hero.webp',
    custom: true,
    eyebrow: 'Siding',
    title: 'Top-Quality Siding Services for Your East Coast Home',
    sub: 'Breathe new life into your home exterior with custom siding options that look great and can withstand the East Coast weather.',
    // The two siding types (the comparison below), with a line from it.
    chips: [
      ['siding', 'Fiber cement', '#siding-types', 'James Hardie: the look of painted wood'],
      ['layers', 'Vinyl', '#siding-types', 'CertainTeed: never needs painting'],
    ],
    // The brands the hero showed, kept under the buttons.
    brands: [
      ['/wp-content/uploads/2025/04/brand-jameshardie.png', 'James Hardie', 418, 84],
      ['/wp-content/uploads/2025/04/brand-certainteed.png', 'CertainTeed', 296, 70],
    ],
    note: 'fiber cement and vinyl chips, estimate and call buttons and the James Hardie and CertainTeed logos, over a lighter copy of the photo (the heading is now the page\'s h1)',
  },
  '/roofing-costs/': {
    key: 'costs',
    from: 'customer',
    photo: '/wp-content/uploads/2025/05/GAF-Solar-Shingle-Installation-1.jpg.webp',
    eyebrow: 'Roofing costs',
    title: 'What Goes Into the Cost of a New Roof',
    sub: 'A new roof is a big investment. See what shapes the price, how insurance can help after storm damage, and how financing makes it more affordable.',
    // The sections below the hero (roofing-costs-page.mjs) and financing.
    chips: [
      ['roof', 'What affects cost', '#roof-cost', 'Size, material, decking and code'],
      ['guard', 'Insurance claims', '#insurance-claims', 'Storm damage may be covered'],
      ['card', 'Financing', '/financing/', 'Delayed payments, no-interest loans'],
    ],
    note: 'chips for what affects the cost, insurance claims and financing and estimate and call buttons, over a WebP copy of the photo',
  },
  '/roofing/': {
    key: 'roofing',
    from: 'roofing-hero',
    photo: '/wp-content/uploads/2025/04/hero-roofing.jpg',
    eyebrow: 'Roofing',
    title: 'Expert Roofing Services for Your East Coast Home',
    sub: 'Leave your roofing project in the hands of our GAF Master Elite Contractors: quality GAF products, certified crews and the best warranties to protect your investment.',
    // The four roofing pages (the cards below), with a line from each card.
    chips: [
      ['swap', 'Roof replacement', '/roofing/replacement/', 'Installed in as little as one day'],
      ['layers', 'Roof types', '/roofing/types/', 'Asphalt shingles, metal and flat roofs'],
      ['roof', 'Storm damage', '/storm-damage/', 'Free inspection and insurance claim help'],
      ['thermo', 'Attic insulation', '/roofing/attic-insulation/', 'Keeps your home comfortable all year'],
    ],
    note: 'chips for the four roofing pages and estimate and call buttons, with the photo darkened behind the text (was a heading and a line on the bare photo)',
  },
};
export const HERO_PATHS = Object.keys(HEROES);

const heroText = (h) =>
  `<p class="pfix-sv-hero__eyebrow">${esc(h.eyebrow)}</p>` +
  `<h1 class="pfix-sv-hero__title">${esc(h.title)}</h1>` +
  `<p class="pfix-sv-hero__sub">${esc(h.sub)}</p>` +
  `<nav class="pfix-sv-hero__services${h.chips.some((c) => c[3]) ? ' pfix-sv-hero__services--wide' : ''}" aria-label="${{ services: 'Our services', guards: 'Gutter guards', siding: 'Siding types', costs: 'Roofing costs', roofing: 'Roofing services' }[h.key] || 'Gutter services'}">` +
  h.chips
    .map(([icon, name, href, line2]) => `<a class="pfix-sv-hero__service" href="${esc(href)}">${ICONS[icon]}<span>${line2 ? `<b>${esc(name)}</b><small>${esc(line2)}</small>` : esc(name)}</span></a>`)
    .join('') +
  `</nav>` +
  `<div class="pfix-sv-hero__ctas">` +
  `<a class="pfix-sv-hero__btn pfix-sv-hero__btn--primary" href="#${FORM_ID}">Get a free estimate${ICONS.arrow}</a>` +
  `<a class="pfix-sv-hero__btn pfix-sv-hero__btn--ghost" href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a>` +
  `</div>` +
  (h.brands
    ? `<div class="pfix-sv-hero__brands" role="list" aria-label="Brands we install">` +
      h.brands
        .map(
          ([src, alt, w, ht]) =>
            `<picture role="listitem"><source type="image/webp" srcset="${esc(src)}.webp"><img src="${esc(src)}" alt="${esc(alt)}" width="${w}" height="${ht}" decoding="async"></picture>`
        )
        .join('') +
      `</div>`
    : '');

const withClass = (n, add) => {
  const has = n.attrs.some((a) => a.name === 'class');
  const cls = [...new Set([...classes(n), ...add])].join(' ');
  return has ? n.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: cls } : a)) : [...n.attrs, { name: 'class', value: cls }];
};

/** A service page's hero: its text column, background and preload. Returns true if it changed. */
export function collectServiceHero(doc, html, ed, { pathname = '', siteDir = '' } = {}, changes = []) {
  const h = HEROES[pathname];
  if (!h) return false;
  const file = h.custom ? path.join(ROOT, 'custom', 'site-fixes', path.basename(h.photo)) : siteDir && path.join(siteDir, h.photo);
  if (file && !fs.existsSync(file)) {
    console.warn(`${pathname} hero: the photo ${h.photo} is missing, hero left as is`);
    return false;
  }
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  const hero = find(doc, (c) => hasClass(c, 'hero-section') && (hasClass(c, h.from) || hasClass(c, 'pfix-sv-hero')));
  const text = hero && find(hero, (c) => hasClass(c, 'text-section'));
  if (!text || !free(text)) return false;

  const mark = ['pfix-sv-hero', `pfix-sv-hero--${h.key}`];
  if (!mark.every((c) => hasClass(hero, c))) ed.retag(hero, withClass(hero, mark));
  ed.inner(text, heroText(h));
  // Preload the photo (instead of the one the page used to preload).
  const type = h.photo.endsWith('.webp') ? ' type="image/webp"' : '';
  const preload = `<link rel="preload" as="image"${type} href="${h.photo}" fetchpriority="high">`;
  if (h.oldPreload) for (const l of findAll(doc, (c) => c.tagName === 'link' && attr(c, 'rel') === 'preload' && attr(c, 'href') === h.oldPreload)) if (free(l)) ed.outer(l, '');
  const headEnd = headEndOffset(html);
  // (Not when the page already preloads it: /roofing/ did, as captured.)
  const preloaded = findAll(doc, (c) => c.tagName === 'link' && attr(c, 'rel') === 'preload' && attr(c, 'href') === h.photo).length > 0;
  if (headEnd >= 0 && !preloaded && !html.includes(preload)) ed.replace(headEnd, headEnd, preload);
  changes.push(`${h.key} page hero: a label, the heading, ${h.note}`);
  return true;
}
