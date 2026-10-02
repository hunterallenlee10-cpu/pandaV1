// The Services page (/services/): its hero, redesigned to match the site's other heroes.
//
// As captured it was "Expert Roofing and Exterior Services" and one line ("From roofing and
// siding to windows and gutters…": Panda has no windows service) over a 678 KB PNG of a
// Panda roofer installing solar shingles, with a plain dark tint. It now has a label, the
// same heading, the line without windows, a chip per service linking to its page, and "Get
// a free estimate" (to the form beside it) and call buttons, over the same photo as a
// 184 KB WebP copy (services-hero.webp) with a dark fade behind the text. The estimate form
// beside it is unchanged.
//
// Applied by site-fixes.mjs; the text is rendered again on every run (the hero is found by
// its own class on a page an earlier build changed), so `npm run update:site` updates it.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { attr, hasClass, classes, find, findAll, headEndOffset } from './html-edit.mjs';

export const SERVICES_PATH = '/services/';
// site-fixes.css sets it as the hero's background; it is preloaded in place of the old PNG.
export const SERVICES_HERO_PHOTO = '/_custom/site-fixes/services-hero.webp';
const OLD_PHOTO = '/wp-content/uploads/2025/03/51d2ed67-a432-4105-a85b-e500c856ba9d-2-min.png';
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
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
};
// The services, in the order of the cards below the hero (and the header's menu).
const SERVICES = [
  ['roof', 'Roofing', '/roofing/'],
  ['building', 'Commercial', '/commercial-roofing/'],
  ['sun', 'Solar', '/solar/'],
  ['siding', 'Siding', '/siding/'],
  ['gutter', 'Gutters', '/gutters/'],
  ['guard', 'Gutter Guards', '/gutters/gutter-guards/'],
];

const heroText = () =>
  `<p class="pfix-sv-hero__eyebrow">Our services</p>` +
  `<h1 class="pfix-sv-hero__title">Expert Roofing and Exterior Services</h1>` +
  `<p class="pfix-sv-hero__sub">From roofing and siding to solar and gutters, we deliver quality craftsmanship that protects your home and boosts its curb appeal.</p>` +
  `<nav class="pfix-sv-hero__services" aria-label="Our services">` +
  SERVICES.map(([icon, name, href]) => `<a class="pfix-sv-hero__service" href="${href}">${ICONS[icon]}<span>${name}</span></a>`).join('') +
  `</nav>` +
  `<div class="pfix-sv-hero__ctas">` +
  `<a class="pfix-sv-hero__btn pfix-sv-hero__btn--primary" href="#${FORM_ID}">Get a free estimate${ICONS.arrow}</a>` +
  `<a class="pfix-sv-hero__btn pfix-sv-hero__btn--ghost" href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a>` +
  `</div>`;

const withClass = (n, add) => {
  const has = n.attrs.some((a) => a.name === 'class');
  const cls = [...new Set([...classes(n), ...add])].join(' ');
  return has ? n.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: cls } : a)) : [...n.attrs, { name: 'class', value: cls }];
};

/** /services/: the hero's text column, background and preload. Returns true if it changed. */
export function collectServicesHero(doc, html, ed, { pathname = '' } = {}, changes = []) {
  if (pathname !== SERVICES_PATH) return false;
  if (!fs.existsSync(path.join(ROOT, 'custom', 'site-fixes', path.basename(SERVICES_HERO_PHOTO)))) {
    console.warn(`services hero: the photo ${SERVICES_HERO_PHOTO} is missing, hero left as is`);
    return false;
  }
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  const hero = find(doc, (c) => hasClass(c, 'hero-section') && (hasClass(c, 'hero-section-service') || hasClass(c, 'pfix-sv-hero')));
  const text = hero && find(hero, (c) => hasClass(c, 'text-section'));
  if (!text || !free(text)) return false;

  if (!hasClass(hero, 'pfix-sv-hero')) ed.retag(hero, withClass(hero, ['pfix-sv-hero']));
  ed.inner(text, heroText());
  // Preload the new photo instead of the old one (which the page no longer shows).
  const preload = `<link rel="preload" as="image" type="image/webp" href="${SERVICES_HERO_PHOTO}" fetchpriority="high">`;
  for (const l of findAll(doc, (c) => c.tagName === 'link' && attr(c, 'rel') === 'preload' && attr(c, 'href') === OLD_PHOTO)) if (free(l)) ed.outer(l, '');
  const headEnd = headEndOffset(html);
  if (headEnd >= 0 && !html.includes(preload)) ed.replace(headEnd, headEnd, preload);
  changes.push('services page hero: a label, the heading, a line without "windows" (not a Panda service), service chips and estimate and call buttons, over a sharper, lighter copy of the photo');
  return true;
}
