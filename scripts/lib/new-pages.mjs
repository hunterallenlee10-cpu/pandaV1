// The pages added in the site restructure (README, "Site restructure"):
//  - /financing/: financing through Service Finance, LLC (it was an old offer post, which the
//    footer's "Financing" link led to);
//  - /warranty/: the satisfaction guarantee, the installation warranty and the manufacturers'
//    warranties on one page (two old offer posts, one of them the footer's "Warranty" link);
//  - /storm-damage/: storm damage and insurance claims, the service the site's many insurance
//    posts are about (the first 24 hours, what insurance usually covers, how Panda helps with
//    the claim, questions, and every guide);
//  - /solar-options/: the two ways to go solar, solar panels and GAF solar shingles, side by
//    side (the header menu's "Solar" entry and the footer's "Solar" link lead here);
//  - /locations/<office>/: one page per office (the seven on /contact-us/), with its address,
//    phone, a map of its state, its jobs there (the US map's numbers), the services and the
//    other offices.
//
// Like the Media page, each is generated rather than captured: a built page (TEMPLATE) with
// everything between its header and its footer replaced, and its title, description,
// canonical address, social tags and structured data rewritten. Each opens with a hero
// beside the estimate form (service-forms.mjs: the page's form, or the general one). The
// words are in custom/new-pages/pages.json (offices: custom/site-fixes/contact-page.json and
// custom/us-map/areas.json); the stylesheet is custom/new-pages/new-pages.css.
//
// buildNewPages writes them (03-build.mjs, scripts/tools/update-built-site.mjs); NEW_PAGES
// lists their addresses (the sitemap gets them, the header menu and footer link four of
// them: merged-pages.mjs and site-fixes.mjs). NEW_PAGES=0 leaves them out.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';
import { ROOT, SITE_ORIGIN } from './config.mjs';
import { attr, hasClass, esc, find, findAll, makeEditor, headEndOffset } from './html-edit.mjs';
import { serviceForm, renderServiceForm } from './service-forms.mjs';
import { contactPage, officeMap } from './contact-page.mjs';
import { COVERED, NOT_COVERED, CLAIM_STEPS } from './roofing-costs-page.mjs';
import { loadUsMap } from './us-map.mjs';

export const NEW_PAGES_ON = (process.env.NEW_PAGES ?? (process.env.SITE_ORIGIN ? '0' : '1')) === '1';
export const NEW_PAGES_DIR = path.join(ROOT, 'custom', 'new-pages');
export const NEW_PAGES_FILES = { 'new-pages.css': '/_custom/new-pages/new-pages.css' };
// The built page whose header and footer the new pages reuse.
const TEMPLATE = '/faqs/';
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
const EMAIL = 'info@pandaexteriors.com';
// The date the pages were added, for the sitemap.
export const NEW_PAGES_DATE = '2026-10-05T00:00:00+00:00';

let data;
const content = () => (data ??= JSON.parse(fs.readFileSync(path.join(NEW_PAGES_DIR, 'pages.json'), 'utf8')));

// ------------------------------------------------------------------ the offices
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
const officeSlug = (o) => `${o.city}-${o.state}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
/** The office pages: [{ path, office, vars }]. */
export function officePages() {
  if (!NEW_PAGES_ON) return [];
  const base = content().offices.path;
  const { states } = loadUsMap();
  return contactPage().offices.items.map((o) => {
    const jobs = states.find((s) => s.code === o.state)?.jobs || 0;
    return { path: `${base}${officeSlug(o)}/`, office: o, vars: { city: o.city, st: o.state, state: o.name, phone: o.phone, jobs: jobs.toLocaleString('en-US'), jobsN: jobs } };
  });
}
/** Where an office's page is ('' when the new pages are off). */
export const officePagePath = (o) => (NEW_PAGES_ON ? `${content().offices.path}${officeSlug(o)}/` : '');

/** Every new page's address. */
export const newPagePaths = () => (NEW_PAGES_ON ? [...Object.keys(content().pages), ...officePages().map((p) => p.path)] : []);
export const isNewPage = (pathname) => newPagePaths().includes(pathname);

// ------------------------------------------------------------------ pieces
const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  mail: line('M3.5 6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5zM4 6.5l8 6 8-6'),
  pin: line('M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4z'),
  route: line('M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 17h7.5a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7H17'),
  card: line('M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3 10h18M7 15h4'),
  coin: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM14.8 9.2c-.5-.8-1.5-1.3-2.8-1.3-1.7 0-2.8.8-2.8 2s1.2 1.7 2.8 2 2.8.9 2.8 2.1-1.1 2-2.8 2c-1.4 0-2.5-.6-3-1.5M12 6.3v1.6M12 16v1.7'),
  check: line('M5 12.5l4.2 4.2L19 7', 2.2),
  calendar: line('M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5zM4 10h16M8.5 3v4M15.5 3v4M8 14h3'),
  shield: line('M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6'),
  badge: line('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.9L7 21l5-2.6 5 2.6-1.5-7.1M9.6 9l1.6 1.6L14.6 7.4'),
  layers: line('M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5'),
  tag: line('M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9zM8 8.5v.1'),
  umbrella: line('M3 12a9 9 0 0 1 18 0zM12 12v6.5a2 2 0 0 1-4 0'),
  sun: line('M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'),
  roof: line('M3 12l9-8 9 8M5.5 10v10h13V10M10 20v-6h4v6'),
  home: line('M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5'),
  search: line('M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.8-4.8'),
  users: line('M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.2a6.5 6.5 0 0 1 3.5 5.8'),
  clock: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2'),
  cross: line('M6 6l12 12M18 6L6 18', 2.2),
  info: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.1', 2),
  book: line('M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z'),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  star: line('M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z'),
  solar: line('M4 15l2-8h12l2 8zM4 15h16M9 7l-1 8M15 7l1 8M5 11h14M12 15v5M8 20h8'),
  building: line('M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3'),
  siding: line('M3 6h18M3 10h18M3 14h18M3 18h18'),
  gutter: line('M3 6h18v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM17 11v8a2 2 0 0 1-2 2'),
};
const ARROW = `<span class="pnp-arrow">${ICONS.arrow}</span>`;
const tel = (phone) => `tel:+1${phone.replace(/\D/g, '')}`;
const directions = (o) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Panda Exteriors, ${o.street}, ${o.locality}`)}`;

const picture = (img, alt, exists, { eager = false } = {}) => {
  const [src, w, h] = img;
  const webp = src.endsWith('.webp') ? '' : exists(`${src}.webp`) ? `${src}.webp` : '';
  return (
    `<picture>${webp ? `<source type="image/webp" srcset="${esc(webp)}">` : ''}` +
    `<img src="${esc(src)}" alt="${esc(alt || '')}" width="${w}" height="${h}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}></picture>`
  );
};
let uid = 0;
const head = (eyebrow, title, intro, id) =>
  `<div class="pnp-head">${eyebrow ? `<p class="pnp-eyebrow">${esc(eyebrow)}</p>` : ''}<h2 class="pnp-title" id="${id}">${esc(title)}</h2>${intro ? `<p class="pnp-intro">${esc(intro)}</p>` : ''}</div>`;
// (tone: "orange" or "dark", a band of colour in place of the white and light tint the
// sections take in turn)
const TONES = ['orange', 'dark'];
const section = (cls, inner, { id = '', label, tone = '' } = {}) =>
  `<section class="pnp-sec pnp-sec--${cls}${TONES.includes(tone) ? ` pnp-sec--${tone}` : ''}"${id ? ` id="${esc(id)}"` : ''} aria-labelledby="${label}"><div class="pnp-inner">${inner}</div></section>`;
const linkHtml = ([label, href], cls = 'pnp-link') => `<a class="${cls}" href="${esc(href)}">${esc(label)}${ARROW}</a>`;

// ------------------------------------------------------------------ sections
function cards(s) {
  const id = `pnp-h-${++uid}`;
  const card = ([icon, title, text, link]) =>
    `<div class="pnp-card" role="listitem"><span class="pnp-card__icon">${ICONS[icon] || ICONS.check}</span><h3>${esc(title)}</h3><p>${esc(text)}</p>${link ? linkHtml(link) : ''}</div>`;
  return section(
    'cards',
    head(s.eyebrow, s.title, s.intro, id) + `<div class="pnp-cards pnp-cards--${s.items.length}" role="list">${s.items.map(card).join('')}</div>`,
    { id: s.id, label: id, tone: s.tone }
  );
}
function split(s, exists) {
  const id = `pnp-h-${++uid}`;
  return section(
    `split${s.flip ? ' pnp-sec--flip' : ''}`,
    `<div class="pnp-split">` +
      `<div class="pnp-split__media">${picture(s.img, s.alt, exists)}</div>` +
      `<div class="pnp-split__body">${head(s.eyebrow, s.title, '', id)}` +
      (s.paragraphs || []).map((p) => `<p class="pnp-p">${esc(p)}</p>`).join('') +
      (s.list?.length ? `<div class="pnp-list" role="list">${s.list.map((x) => `<div role="listitem">${ICONS.check}<span>${esc(x)}</span></div>`).join('')}</div>` : '') +
      (s.note ? `<p class="pnp-fine">${esc(s.note)}</p>` : '') +
      (s.link ? linkHtml(s.link) : '') +
      `</div></div>`,
    { id: s.id, label: id, tone: s.tone }
  );
}
function steps(s) {
  const id = `pnp-h-${++uid}`;
  return section(
    'steps',
    head(s.eyebrow, s.title, s.intro, id) +
      `<div class="pnp-steps pnp-steps--${s.items.length}" role="list">${s.items
        .map(([t, x], i) => `<div class="pnp-step" role="listitem"><span class="pnp-step__n" aria-hidden="true">${i + 1}</span><h3><span class="pnp-sr">Step ${i + 1}: </span>${esc(t)}</h3><p>${esc(x)}</p></div>`)
        .join('')}</div>` +
      (s.link ? `<p class="pnp-center">${linkHtml(s.link)}</p>` : ''),
    { id: s.id, label: id }
  );
}
function covered(s) {
  const id = `pnp-h-${++uid}`;
  const list = (items, icon, cls) => `<div class="pnp-list pnp-list--${cls}" role="list">${items.map((x) => `<div role="listitem">${ICONS[icon]}<span>${esc(x)}</span></div>`).join('')}</div>`;
  return section(
    'covered',
    head(s.eyebrow, s.title, s.intro, id) +
      `<div class="pnp-covered">` +
      `<div class="pnp-covered__col pnp-covered__col--yes"><h3>Usually covered</h3>${list(COVERED, 'check', 'yes')}</div>` +
      `<div class="pnp-covered__col pnp-covered__col--no"><h3>Usually not covered</h3>${list(NOT_COVERED, 'cross', 'no')}</div>` +
      `</div>`,
    { id: s.id, label: id }
  );
}
const claimSteps = (s) => steps({ ...s, items: CLAIM_STEPS });
const note = (s) =>
  `<div class="pnp-inner"><div class="pnp-note">${ICONS.info}<p><b>${esc(s.title)}</b> ${esc(s.text)}</p></div></div>`;
function links(s) {
  const id = `pnp-h-${++uid}`;
  return section(
    'links',
    `<div class="pnp-links"><h2 class="pnp-links__title" id="${id}">${ICONS.book}${esc(s.title)}</h2>` +
      `<div class="pnp-links__list" role="list">${s.items.map(([t, href]) => `<a class="pnp-links__item" role="listitem" href="${esc(href)}"><span>${esc(t)}</span>${ARROW}</a>`).join('')}</div></div>`,
    { id: s.id, label: id }
  );
}
function faq(s) {
  const id = `pnp-h-${++uid}`;
  return section(
    'faq',
    head(s.eyebrow, s.title, s.intro, id) +
      `<div class="pnp-faq">${s.items.map(([q, a]) => `<details class="pnp-faq__item"><summary><span>${esc(q)}</span></summary><p>${esc(a)}</p></details>`).join('')}</div>`,
    { id: s.id, label: id }
  );
}
const cta = (c, phone = PHONE) =>
  `<section class="pnp-cta-band" aria-label="${esc(c.title)}"><div class="pnp-inner"><div class="pnp-cta">` +
  `<div><p class="pnp-cta__title">${esc(c.title)}</p><p class="pnp-cta__text">${esc(c.text)}</p></div>` +
  `<div class="pnp-cta__btns"><a class="pnp-btn pnp-btn--light" href="#pfix-lead-1">Get a free estimate</a>` +
  `<a class="pnp-btn pnp-btn--outline" href="${esc(phone.href)}">${ICONS.phone}Call ${esc(phone.text)}</a></div>` +
  `</div></div></section>`;

// Products side by side (/solar-options/): each a photo with its one-line tag, what it is, a
// checklist, who it suits and a button to its own page. Each has an id, for the hero's chips.
function showcase(s, exists) {
  const id = `pnp-h-${++uid}`;
  const item = (o) =>
    `<div class="pnp-option" id="${esc(o.id)}" role="listitem">` +
    `<div class="pnp-option__media">${picture(o.img, o.alt, exists)}<span class="pnp-option__tag">${ICONS[o.icon] || ICONS.check}${esc(o.tag)}</span></div>` +
    `<div class="pnp-option__body"><h3 class="pnp-option__name">${esc(o.name)}</h3><p class="pnp-option__text">${esc(o.text)}</p>` +
    `<div class="pnp-list" role="list">${o.points.map((x) => `<div role="listitem">${ICONS.check}<span>${esc(x)}</span></div>`).join('')}</div>` +
    (o.best ? `<p class="pnp-option__best"><b>Best for:</b> ${esc(o.best)}</p>` : '') +
    `<a class="pnp-btn pnp-btn--primary pnp-option__btn" href="${esc(o.link[1])}">${esc(o.link[0])}${ARROW}</a>` +
    `</div></div>`;
  return section('showcase', head(s.eyebrow, s.title, s.intro, id) + `<div class="pnp-options" role="list">${s.items.map(item).join('')}</div>`, { id: s.id, label: id });
}
// A comparison table: a column per product, a row per question ([label, one cell per column]).
// On phones each row stacks, its cells labelled with their column.
function compare(s) {
  const id = `pnp-h-${++uid}`;
  const cols = s.columns.map(([icon, name]) => `<th scope="col"><span class="pnp-compare__col">${ICONS[icon] || ICONS.check}${esc(name)}</span></th>`).join('');
  const rows = s.rows
    .map(([label, ...cells]) => `<tr><th scope="row">${esc(label)}</th>${cells.map((c, i) => `<td data-label="${esc(s.columns[i][1])}">${esc(c)}</td>`).join('')}</tr>`)
    .join('');
  return section(
    'compare',
    head(s.eyebrow, s.title, s.intro, id) +
      `<div class="pnp-compare"><table class="pnp-compare__table" aria-labelledby="${id}"><thead><tr><td></td>${cols}</tr></thead><tbody>${rows}</tbody></table></div>` +
      (s.note ? `<p class="pnp-compare__note">${ICONS.info}<span>${esc(s.note)}</span></p>` : ''),
    { id: s.id, label: id }
  );
}

const RENDER = { cards, split, steps, covered, claimSteps, note, links, faq, showcase, compare };

function hero(h, form, pathname, exists, { aside = '', side = '' } = {}) {
  const f = serviceForm(pathname);
  const chips = (h.chips || [])
    .map(([icon, label, href]) => (href ? `<a class="pnp-chip" href="${esc(href)}" role="listitem">${ICONS[icon] || ICONS.check}${esc(label)}</a>` : `<span class="pnp-chip" role="listitem">${ICONS[icon] || ICONS.check}${esc(label)}</span>`))
    .join('');
  const [src] = h.photo || [];
  const bg = src ? (src.endsWith('.webp') || !exists(`${src}.webp`) ? src : `${src}.webp`) : '';
  return (
    `<section class="pnp-hero${bg ? '' : ' pnp-hero--plain'}" aria-labelledby="pnp-title"${bg ? ` style="--pnp-hero: url('${esc(bg)}')"` : ''}><div class="pnp-inner pnp-hero__inner">` +
    `<div class="pnp-hero__text">` +
    `<p class="pnp-hero__eyebrow">${esc(h.eyebrow)}</p>` +
    `<h1 class="pnp-hero__title" id="pnp-title">${esc(h.title)}</h1>` +
    `<p class="pnp-hero__sub">${esc(h.sub)}</p>` +
    (chips ? `<div class="pnp-chips" role="list">${chips}</div>` : '') +
    aside +
    `<div class="pnp-hero__ctas"><a class="pnp-btn pnp-btn--primary" href="#pfix-lead-1">Get a free estimate${ARROW}</a>` +
    `<a class="pnp-btn pnp-btn--ghost" href="${side ? esc(side.href) : PHONE.href}">${ICONS.phone}Call ${esc(side ? side.text : PHONE.text)}</a></div>` +
    `</div>` +
    `<div class="pnp-form-card"><p class="pnp-form-card__title">${esc(form.title)}</p><p class="pnp-form-card__text">${esc(form.text)}</p>` +
    (f ? renderServiceForm(f, pathname, 1) : '') +
    `<p class="pnp-form-card__reviews"><a href="/reviews/">Read our customer reviews</a></p>` +
    `</div>` +
    `</div></section>`
  );
}

// ------------------------------------------------------------------ the pages
function contentPage(pathname, page, siteDir) {
  const exists = (src) => !siteDir || fs.existsSync(path.join(siteDir, decodeURIComponent(src)));
  uid = 0;
  const body =
    `<main class="pnp" id="main">` +
    hero(page.hero, page.form, pathname, exists) +
    page.sections.map((s) => RENDER[s.type](s, exists)).join('') +
    cta(page.cta) +
    `</main>`;
  const faqs = page.sections.filter((s) => s.type === 'faq').flatMap((s) => s.items);
  return { body, title: page.title, description: page.description, breadcrumb: page.breadcrumb, faqs };
}

const SERVICES = [
  ['roof', 'Roof replacement', '/roofing/replacement/'],
  ['umbrella', 'Storm damage', '/storm-damage/'],
  ['solar', 'Solar', '/solar-options/'],
  ['building', 'Commercial roofing', '/commercial-roofing/'],
  ['siding', 'Siding', '/siding/'],
  ['gutter', 'Gutters and gutter guards', '/gutters/'],
  ['home', 'Attic insulation', '/roofing/attic-insulation/'],
];
function officePage({ path: pathname, office: o, vars }, siteDir) {
  const exists = (src) => !siteDir || fs.existsSync(path.join(siteDir, decodeURIComponent(src)));
  const c = content().offices;
  const t = (s) => fill(s, vars);
  uid = 0;
  const local = { href: tel(o.phone), text: o.phone };
  const aside =
    `<div class="pnp-office-card">` +
    `<div class="pnp-office-card__map">${officeMap(o)}</div>` +
    `<div class="pnp-office-card__body">` +
    (o.hq ? `<p class="pnp-office-card__hq">${ICONS.star}${esc(c.hq)}</p>` : '') +
    `<p class="pnp-office-card__addr">${ICONS.pin}<span><b>Panda Exteriors ${esc(o.city)}</b><span>${esc(o.street)}</span><span>${esc(o.locality)}</span></span></p>` +
    `<p class="pnp-office-card__links"><a href="${esc(directions(o))}" target="_blank" rel="noopener">${ICONS.route}Directions<span class="pnp-sr"> (opens Google Maps)</span></a>` +
    `<a href="mailto:${EMAIL}">${ICONS.mail}${EMAIL}</a></p>` +
    (vars.jobsN >= c.minJobs ? `<p class="pnp-office-card__jobs"><b>${esc(vars.jobs)}</b> ${esc(t(c.jobs).replace(vars.jobs, '').trim())}</p>` : '') +
    `</div></div>`;
  const h = { eyebrow: t(c.eyebrow), title: t(c.title), sub: t(c.sub) };
  const services = section(
    'cards',
    head('', t(c.servicesTitle), '', 'pnp-h-services') +
      `<div class="pnp-services" role="list">${SERVICES.map(([icon, label, href]) => `<a class="pnp-service" role="listitem" href="${href}"><span class="pnp-card__icon">${ICONS[icon]}</span><span>${esc(label)}</span>${ARROW}</a>`).join('')}</div>`,
    { label: 'pnp-h-services' }
  );
  const why = cards({ title: t(c.whyTitle), items: c.why });
  const others = officePages().filter((p) => p.path !== pathname);
  const othersHtml = section(
    'others',
    head('', c.othersTitle, '', 'pnp-h-others') +
      `<div class="pnp-others" role="list">${others
        .map((p) => `<a class="pnp-other" role="listitem" href="${p.path}"><b>${esc(p.office.city)}, ${esc(p.office.state)}</b><span>${esc(p.office.name)}${p.office.hq ? ' · Headquarters' : ''}</span>${ARROW}</a>`)
        .join('')}</div>` +
      `<p class="pnp-center"><a class="pnp-link" href="/service-areas/">See every area we serve${ARROW}</a></p>`,
    { label: 'pnp-h-others' }
  );
  const body =
    `<main class="pnp pnp--office" id="main">` +
    hero(h, { title: 'Free Estimate', text: `From our ${o.city} team: roofing, solar, siding and more.` }, pathname, exists, { aside, side: local }) +
    services +
    why +
    othersHtml +
    cta({ title: t(c.cta.title), text: t(c.cta.text) }, local) +
    `</main>`;
  return {
    body,
    title: t(c.metaTitle),
    description: t(c.description),
    breadcrumb: `${o.city}, ${o.state}`,
    parent: ['Service Areas', '/service-areas/'],
    business: {
      '@type': 'RoofingContractor',
      name: `Panda Exteriors ${o.city}`,
      telephone: `+1-${o.phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}`,
      email: EMAIL,
      address: { '@type': 'PostalAddress', streetAddress: o.street, addressLocality: o.locality.split(',')[0], addressRegion: o.state, postalCode: /\d{5}/.exec(o.locality)?.[0], addressCountry: 'US' },
      geo: { '@type': 'GeoCoordinates', latitude: o.at[0], longitude: o.at[1] },
      areaServed: o.name,
    },
  };
}

// ------------------------------------------------------------------ head and template
function jsonLd(url, page, siteOrigin) {
  const crumbs = [{ name: 'Home', item: siteOrigin + '/' }, ...(page.parent ? [{ name: page.parent[0], item: siteOrigin + page.parent[1] }] : []), { name: page.breadcrumb, item: url }];
  const graph = [
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: page.title, description: page.description, isPartOf: { '@id': `${siteOrigin}/#website` }, breadcrumb: { '@id': `${url}#breadcrumb` } },
    { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })) },
  ];
  if (page.faqs?.length) graph.push({ '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: page.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  if (page.business) graph.push({ ...page.business, '@id': `${url}#business`, url, parentOrganization: { '@id': `${siteOrigin}/#organization` } });
  return `<script type="application/ld+json" class="pnp-ld">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;
}

function fromTemplate(html, doc, pathname, page, siteOrigin) {
  const ed = makeEditor(html);
  const url = siteOrigin + pathname;
  const body = find(doc, (c) => c.tagName === 'body');
  const blocks = (body?.childNodes || []).filter((c) => c.tagName);
  const nav = blocks.find((c) => hasClass(c, 'nav'));
  const footer = blocks.find((c) => hasClass(c, 'footer'));
  ed.replace(nav.sourceCodeLocation.endOffset, footer.sourceCodeLocation.startOffset, page.body);
  const slug = pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  ed.retag(body, body.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: a.value.replace(/\bpage-id-\d+\b/, `page-${slug}`) } : a)));
  const head = find(doc, (c) => c.tagName === 'head');
  const inHead = (pred) => findAll(head, pred);
  const titleEl = inHead((c) => c.tagName === 'title')[0];
  if (titleEl) ed.inner(titleEl, esc(page.title));
  const meta = { description: page.description, 'og:type': 'website', 'og:title': page.title, 'og:description': page.description, 'og:url': url, 'twitter:title': page.title, 'twitter:description': page.description };
  const drop = new Set(['og:updated_time', 'article:published_time', 'article:modified_time', 'article:section', 'twitter:label1', 'twitter:data1']);
  for (const m of inHead((c) => c.tagName === 'meta')) {
    const key = attr(m, 'property') || attr(m, 'name');
    if (drop.has(key)) ed.outer(m, '');
    else if (key in meta) ed.retag(m, m.attrs.map((a) => (a.name === 'content' ? { name: 'content', value: meta[key] } : a)));
  }
  let ldDone = false;
  const ld = jsonLd(url, page, siteOrigin);
  for (const el of inHead((c) => c.tagName === 'link' || c.tagName === 'script')) {
    const rel = attr(el, 'rel') || '';
    const href = attr(el, 'href') || attr(el, 'src') || '';
    if (rel === 'canonical') ed.retag(el, el.attrs.map((a) => (a.name === 'href' ? { name: 'href', value: url } : a)));
    else if (rel === 'shortlink' || (rel === 'alternate' && /\/wp-json\//.test(href))) ed.outer(el, '');
    // The template's hero photo, fetched early.
    else if (rel === 'preload' && attr(el, 'as') === 'image') ed.outer(el, '');
    // The template's own sections' styles and scripts (the map, the review carousel, the FAQ page's data).
    else if (/^\/_custom\/(us-map|reviews)\//.test(href) || (el.tagName === 'script' && attr(el, 'data-pfix-faq-ld') !== undefined)) ed.outer(el, '');
    else if (el.tagName === 'script' && attr(el, 'type') === 'application/ld+json') {
      ed.outer(el, ldDone ? '' : ld);
      ldDone = true;
    }
  }
  const headEnd = headEndOffset(html);
  const has = (u) => findAll(head, (c) => attr(c, 'href') === u || attr(c, 'src') === u).length > 0;
  ed.replace(headEnd, headEnd, (ldDone ? '' : ld) + (has(NEW_PAGES_FILES['new-pages.css']) ? '' : `<link rel="stylesheet" href="${NEW_PAGES_FILES['new-pages.css']}">`));
  return ed.apply();
}

/** Every new page: [{ path, html }] (none when the template page isn't in the site). */
export function buildNewPages({ siteDir, siteOrigin = SITE_ORIGIN }) {
  if (!NEW_PAGES_ON) return [];
  const templateFile = path.join(siteDir, TEMPLATE, 'index.html');
  if (!fs.existsSync(templateFile)) {
    console.warn(`new pages: the template page ${TEMPLATE} is not in the site, new pages not built`);
    return [];
  }
  const html = fs.readFileSync(templateFile, 'utf8');
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const body = find(doc, (c) => c.tagName === 'body');
  const blocks = (body?.childNodes || []).filter((c) => c.tagName);
  if (!blocks.some((c) => hasClass(c, 'nav')) || !blocks.some((c) => hasClass(c, 'footer'))) {
    console.warn(`new pages: no header and footer found in ${TEMPLATE}, new pages not built`);
    return [];
  }
  const pages = [
    ...Object.entries(content().pages).map(([p, page]) => [p, contentPage(p, page, siteDir)]),
    ...officePages().map((o) => [o.path, officePage(o, siteDir)]),
  ];
  return pages.map(([p, page]) => ({ path: p, html: fromTemplate(html, doc, p, page, siteOrigin) }));
}

/** The stylesheet: [file on disk, address on the site]. */
export const newPagesFiles = () => Object.entries(NEW_PAGES_FILES).map(([name, url]) => [path.join(NEW_PAGES_DIR, name), url]);
