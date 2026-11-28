// The home page's SEO, structure and conversion work, and the header menu every page shares.
// Applied last (customize.mjs, after launch.mjs), so it sees the page as the other fixes
// leave it; every step gives the same result on a page that already has it.
//
// Every page (siteNav):
//  - Header menu: the top level is Services, Storm Damage, Financing, Service Areas, Reviews
//    and About, beside the phone button (was eight entries). Financing opens what a project
//    costs (Roofing Costs, Offers, Warranty); About opens the company (Projects, Careers,
//    Charity & Community, Contact Us, Blog, Podcast). FAQs, Refer & Earn, the Panda Shop and
//    the Media page are in the footer; every address still works.
//
// The home page (homePage), with its words in custom/home/home.json:
//  - Head: a title and description that name the service, the states and the phone number,
//    with the share tags to match; one JSON-LD @graph (RoofingContractor with its rating,
//    the states served and the seven offices, WebSite, WebPage, the five services and the
//    FAQ) in place of Rank Math's (which described the page as an Article by a Person).
//  - Structure: a skip link, and <header>, <nav>, <main> and <footer> in place of the page
//    builder's divs (same classes, so nothing looks different).
//  - Leftovers: a printed [smartslider3] shortcode and a hidden row of five video-testimonial
//    cards that all carried the same cut-off quote (and no video) are removed.
//  - Headings: one h1 (services-hero.mjs), "East Coast" merged into the services heading
//    (site-fixes.mjs), the second "About Our Team" and two headings that didn't say what their
//    sections show are renamed.
//  - Pictures: a description for every photo that had none (two roof photos said "Andersen
//    Windows" and "Provia").
//  - Trust: the Google rating and review count, linked to /reviews/, in the hero and in both
//    form cards, with the GAF badges.
//  - New sections: storm damage and insurance claims, how it works, financing and warranty
//    under the hero; the offices by state under the map; questions (<details>) above the
//    estimate form. They use the design of the pages added in the site restructure
//    (custom/new-pages/new-pages.css) and only facts those pages already state.
// The two-step estimate form is service-forms.mjs (custom/home/home.js runs it); the license
// line is footer.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';
import { ROOT, SITE_ORIGIN } from './config.mjs';
import { attr, hasClass, esc, clean, textOf, find, findAll, makeEditor, headEndOffset } from './html-edit.mjs';
import { renderSections, NEW_PAGE_ICONS as ICONS, NEW_PAGES_FILES, officePagePath } from './new-pages.mjs';
import { loadReviewWall } from './review-wall.mjs';
import { contactPage } from './contact-page.mjs';
import { loadUsMap } from './us-map.mjs';

export const HOME_DIR = path.join(ROOT, 'custom', 'home');
export const HOME_FILES = { 'home.css': '/_custom/home/home.css', 'home.js': '/_custom/home/home.js' };
export const homeFiles = () => Object.entries(HOME_FILES).map(([name, url]) => [path.join(HOME_DIR, name), url]);

const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536', e164: '+1-877-213-8536' };
const FORM_ID = 'pfix-lead-1';
let data;
const home = () => (data ??= JSON.parse(fs.readFileSync(path.join(HOME_DIR, 'home.json'), 'utf8')));

const loc = (n) => n.sourceCodeLocation;
/** One round of edits: parse, collect, apply. */
function pass(html, fn) {
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const ed = makeEditor(html);
  fn(doc, ed);
  return ed.count ? ed.apply() : html;
}
const setAttrs = (n, values) => {
  const out = n.attrs.map((a) => (a.name in values ? { name: a.name, value: values[a.name] } : a));
  for (const [k, v] of Object.entries(values)) if (!n.attrs.some((a) => a.name === k)) out.push({ name: k, value: v });
  return out;
};
const ARROW = `<span class="pnp-arrow">${ICONS.arrow}</span>`;

// ---------------------------------------------------------------- the header menu
const ownLink = (li) => (li.childNodes || []).find((c) => c.tagName === 'a');
const hrefOf = (li) => attr(ownLink(li) || {}, 'href') || '';
const subItem = (label, href) =>
  `<div class="oxy-container-840-100 oxy-container li"><a class="oxy-text-link-840-101 oxy-text-link Nav-Link Nav-Link-Hover" href="${esc(href)}" target="_self">\n${esc(label)}\n</a></div>`;
// The two dropdowns beside Services, each for one kind of visitor: [label, address].
// Financing: what a project costs and what comes with it. About: the company.
// FAQs, Refer & Earn and the Panda Shop are in the footer (footer.mjs), as is the Media page.
const FINANCING = ['Financing', '/financing/'];
const FINANCING_MENU = [
  ['Roofing Costs', '/roofing-costs/'],
  ['Offers', '/offers/'],
  ['Warranty', '/warranty/'],
];
const ABOUT_MENU = [
  ['Projects', '/past-projects/'],
  ['Careers', '/careers/'],
  ['Charity & Community', '/charity-and-community/'],
  ['Contact Us', '/contact-us/'],
  ['Blog', '/blog/'],
  ['Podcast', '/podcast/'],
];
const STORM = ['Storm Damage', '/storm-damage/'];

/** The header menu's top level, on every page. Returns the page (changed or not). */
export function siteNav(html) {
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const menu = find(doc, (c) => hasClass(c, 'Menus-ul'));
  if (!menu || !loc(menu).endTag) return html;
  const top = (menu.childNodes || []).filter((c) => c.tagName && hasClass(c, 'li'));
  const by = (p) => top.find((li) => hrefOf(li) === p);
  const [services, about, areas, reviews] = ['/services/', '/about/', '/service-areas/', '/reviews/'].map(by);
  if (!services || !about || !areas || !reviews) return html;
  const sub = (about.childNodes || []).find((c) => hasClass(c, 'sub_menu'));
  if (!sub || !loc(sub).endTag) return html;
  const src = (n) => html.slice(loc(n).startOffset, loc(n).endOffset);
  // A plain top-level entry: a copy of Service Areas' with another label and address.
  const areasSrc = src(areas);
  const areasLabel = clean(textOf(ownLink(areas)));
  const plain = ([label, href]) =>
    areasSrc
      .replace(/href="[^"]*"/, `href="${href}"`)
      .replace(new RegExp(`(>\\s*)${areasLabel}(\\s*<)`), `$1${label}$2`)
      .replace(/\bservice_Area_Link\b/, 'pfix-nav-top');
  // A dropdown: About's own markup (its link, arrow and the entry phones show for the page
  // itself) around the entries.
  const open = html.slice(loc(about).startOffset, loc(sub).startTag.endOffset);
  const close = html.slice(loc(sub).endTag.startOffset, loc(about).endOffset);
  const phone = (sub.childNodes || []).filter((c) => c.tagName && hasClass(c, 'li') && hasClass(c, 'mobile-show')).map(src).join('');
  const items = (list) => list.map(([l, h]) => subItem(l, h)).join('\n');
  const aboutSrc = open + phone + items(ABOUT_MENU) + close;
  // Financing's: a copy of About's with its own label, address and entries.
  const relabel = (text, from, [label, href]) => text.replace(/href="\/about\/"/g, `href="${href}"`).replace(new RegExp(`(>\\s*)${from}(\\s*<)`, 'g'), `$1${label}$2`);
  const financingSrc = relabel(open, 'About', FINANCING).replace(/\bAbout-menu\b/, 'pfix-nav-financing') + relabel(phone, 'About Us', FINANCING) + items(FINANCING_MENU) + close;
  const out = [src(services), plain(STORM), financingSrc, areasSrc, src(reviews), aboutSrc].join('');
  const from = loc(menu).startTag.endOffset;
  const to = loc(menu).endTag.startOffset;
  return html.slice(from, to) === out ? html : html.slice(0, from) + out + html.slice(to);
}

// ---------------------------------------------------------------- structured data
const tel164 = (phone) => `+1-${phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}`;
function jsonLd(old) {
  const h = home();
  const { place } = loadReviewWall();
  const offices = contactPage().offices.items;
  const { states } = loadUsMap();
  const origin = SITE_ORIGIN;
  const org = `${origin}/#organization`;
  // What Rank Math's graph already said about the company (logo, social profiles, email).
  // (or what an earlier run of this kept of it: the same node, by its @id)
  const was = (old?.['@graph'] || []).find((n) => n['@type'] === 'Organization' || n['@id'] === org) || {};
  const image = (old?.['@graph'] || []).find((n) => n['@type'] === 'ImageObject' && n.url);
  const area = states.map((s) => (s.code === 'DC' ? { '@type': 'City', name: 'Washington, D.C.' } : { '@type': 'State', name: s.name }));
  const address = (o) => ({ '@type': 'PostalAddress', streetAddress: o.street, addressLocality: o.locality.split(',')[0], addressRegion: o.state, postalCode: /\d{5}/.exec(o.locality)?.[0], addressCountry: 'US' });
  const hq = offices.find((o) => o.hq) || offices[0];
  const officeId = (o) => `${origin}${officePagePath(o) || '/contact-us/'}#business`;
  const graph = [
    {
      '@type': 'RoofingContractor',
      '@id': org,
      name: 'Panda Exteriors',
      url: `${origin}/`,
      logo: was.logo || undefined,
      image: image?.url,
      description: h.head.description,
      telephone: PHONE.e164,
      email: was.email,
      address: address(hq),
      geo: { '@type': 'GeoCoordinates', latitude: hq.at[0], longitude: hq.at[1] },
      areaServed: area,
      sameAs: was.sameAs,
      aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(place.rating), bestRating: 5, worstRating: 1, reviewCount: Number(place.count) },
      subOrganization: offices.map((o) => ({ '@id': officeId(o) })),
      hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Roofing, solar, siding and gutter services', itemListElement: h.services.map((s, i) => ({ '@type': 'Offer', itemOffered: { '@id': `${origin}/#service-${i + 1}` } })) },
    },
    // The seven offices, each a location of its own with its phone number.
    ...offices.map((o) => ({
      '@type': 'RoofingContractor',
      '@id': officeId(o),
      name: `Panda Exteriors ${o.city}`,
      url: `${origin}${officePagePath(o) || '/contact-us/'}`,
      image: image?.url,
      telephone: tel164(o.phone),
      address: address(o),
      geo: { '@type': 'GeoCoordinates', latitude: o.at[0], longitude: o.at[1] },
      areaServed: { '@type': 'State', name: o.name },
      parentOrganization: { '@id': org },
    })),
    { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'Panda Exteriors', publisher: { '@id': org }, inLanguage: 'en-US' },
    ...(image ? [{ '@type': 'ImageObject', '@id': `${origin}/#primaryimage`, url: image.url, contentUrl: image.url, width: Number(image.width) || undefined, height: Number(image.height) || undefined, inLanguage: 'en-US' }] : []),
    {
      '@type': 'WebPage',
      '@id': `${origin}/#webpage`,
      url: `${origin}/`,
      name: h.head.title,
      description: h.head.description,
      isPartOf: { '@id': `${origin}/#website` },
      about: { '@id': org },
      ...(image ? { primaryImageOfPage: { '@id': `${origin}/#primaryimage` } } : {}),
      mainEntity: { '@id': org },
      inLanguage: 'en-US',
    },
    ...h.services.map(([name, serviceType, href, description], i) => ({
      '@type': 'Service',
      '@id': `${origin}/#service-${i + 1}`,
      name,
      serviceType,
      description,
      url: `${origin}${href}`,
      provider: { '@id': org },
      areaServed: area,
    })),
    {
      '@type': 'FAQPage',
      '@id': `${origin}/#faq`,
      isPartOf: { '@id': `${origin}/#webpage` },
      mainEntity: h.faq.items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ];
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

// ---------------------------------------------------------------- the new sections
const STAR = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 0 0 .95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 0 0-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 0 0-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 0 0-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 0 0 .95-.69z" fill="currentColor"/></svg>';
const rating = () => {
  const { place } = loadReviewWall();
  return { value: (Number(place.rating) || 5).toFixed(1), count: (Number(place.count) || 0).toLocaleString('en-US') };
};
const ratingWords = () => `${rating().value} on Google · ${rating().count} reviews`;
// The GAF badges the page already shows further down, small. (No BBB logo file is in the
// repository: the BBB rating stays in words until one is supplied.)
const GAF_BADGES = [
  ['/wp-content/uploads/2025/04/brand-gaf.png', 'GAF President’s Club award'],
  ['/wp-content/uploads/2025/04/brand-gaf-pledge.png', 'GAF Diamond Pledge'],
];
function heroRating(siteDir) {
  const exists = (src) => !siteDir || fs.existsSync(path.join(siteDir, src));
  const badges = GAF_BADGES.filter(([src]) => exists(src))
    .map(([src, alt]) => `<picture>${exists(`${src}.webp`) ? `<source type="image/webp" srcset="${src}.webp">` : ''}<img src="${src}" alt="${esc(alt)}" width="120" height="120" decoding="async"></picture>`)
    .join('');
  return (
    `<div class="phome-rating">` +
    `<a class="phome-rating__link" href="/reviews/"><span class="phome-rating__stars" role="img" aria-label="Rated ${rating().value} out of 5">${STAR.repeat(5)}</span>` +
    `<span class="phome-rating__text"><b>${rating().value}</b> on Google · ${rating().count} reviews</span></a>` +
    (badges ? `<span class="phome-rating__badges">${badges}</span>` : '') +
    `<!-- TODO: BBB badge logo (no BBB logo file in the repository) -->` +
    `</div>`
  );
}
// A row of buttons and links at the foot of a section (inside its .pnp-inner).
const foot = (html, ...parts) => html.replace(/<\/div><\/section>$/, `<div class="phome-foot">${parts.filter(Boolean).join('')}</div></div></section>`);
const moreLink = ([label, href]) => `<a class="pnp-link" href="${esc(href)}">${esc(label)}${ARROW}</a>`;
const fine = (text) => (text ? `<p class="pnp-fine phome-fine">${esc(text)}</p>` : '');

function topSections() {
  const h = home();
  const [storm, process, financing, warranty] = renderSections(
    [
      ['cards', h.storm],
      ['steps', h.process],
      ['cards', h.financing],
      ['cards', h.warranty],
    ],
    { from: 100 }
  );
  const [cta, target, project] = h.storm.cta;
  return (
    `<div class="pnp phome" id="phome-top">` +
    foot(storm, fine(h.storm.note), `<a class="pnp-btn pnp-btn--primary" href="${esc(target)}" data-pfix-project="${esc(project)}">${esc(cta)}${ARROW}</a>`, moreLink(h.storm.link)) +
    foot(process, `<a class="pnp-btn pnp-btn--light" href="#${FORM_ID}">Get a free estimate${ARROW}</a>`, `<a class="pnp-btn pnp-btn--outline" href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a>`) +
    // TODO: a monthly payment example (no payment amounts, APRs or terms are in the repository).
    foot(financing, fine(h.financing.note), `<a class="pnp-btn pnp-btn--primary" href="${esc(h.financing.link[1])}">${esc(h.financing.link[0])}${ARROW}</a>`) +
    foot(warranty, `<a class="pnp-btn pnp-btn--light" href="${esc(h.warranty.link[1])}">${esc(h.warranty.link[0])}${ARROW}</a>`) +
    `</div>`
  );
}
function faqSection() {
  const h = home();
  const [faq] = renderSections([['faq', h.faq]], { from: 120 });
  return `<div class="pnp phome" id="phome-faq">${foot(faq, moreLink(h.faq.link))}</div>`;
}
// The office pages, grouped by state: plain links a crawler can follow. Only pages the site has.
function areaLinks(siteDir) {
  const h = home().areas;
  const exists = (p) => !siteDir || fs.existsSync(path.join(siteDir, p, 'index.html'));
  const offices = contactPage()
    .offices.items.map((o) => ({ ...o, page: officePagePath(o) }))
    .filter((o) => o.page && exists(o.page))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!offices.length) return '';
  const states = [...new Set(offices.map((o) => o.name))];
  const group = (state) =>
    `<div class="phome-areas__state" role="listitem"><h4 class="phome-areas__name">${esc(state)}</h4>` +
    offices
      .filter((o) => o.name === state)
      .map((o) => `<a class="phome-areas__link" href="${esc(o.page)}">${esc(o.city)}, ${esc(o.state)} roofing contractor${o.hq ? ' (headquarters)' : ''}</a>`)
      .join('') +
    `</div>`;
  return (
    `<div class="pnp phome" id="phome-areas"><nav class="pnp-sec phome-areas" aria-labelledby="phome-areas-title"><div class="pnp-inner">` +
    `<div class="pnp-head"><h3 class="pnp-title phome-areas__title" id="phome-areas-title">${esc(h.title)}</h3><p class="pnp-intro">${esc(h.intro)}</p></div>` +
    `<div class="phome-areas__grid" role="list">${states.map(group).join('')}</div>` +
    `<p class="pnp-center">${moreLink(h.link)}</p>` +
    `</div></nav></div>`
  );
}

// ---------------------------------------------------------------- the home page
const SHORTCODE = /^\s*\[[a-z][\w-]*(\s[^\]]*)?\]\s*$/i;
const KEEP_OUT = new Set(['twitter:label1', 'twitter:data1', 'twitter:label2', 'twitter:data2', 'article:published_time', 'article:modified_time']);

/** The home page (`changes`: what was done, for the build's log). */
export function homePage(html, { siteDir = '' } = {}, changes = []) {
  const h = home();
  const before = html;

  // 1. The head.
  let out = pass(html, (doc, ed) => {
    for (const t of findAll(doc, (c) => c.tagName === 'title')) if (clean(textOf(t)) !== h.head.title && loc(t).endTag) ed.inner(t, esc(h.head.title));
    const meta = { description: h.head.description, 'og:title': h.head.title, 'og:description': h.head.description, 'twitter:title': h.head.title, 'twitter:description': h.head.description };
    for (const m of findAll(doc, (c) => c.tagName === 'meta')) {
      const key = attr(m, 'name') || attr(m, 'property');
      if (KEEP_OUT.has(key)) ed.outer(m, '');
      else if (key in meta && attr(m, 'content') !== meta[key]) ed.retag(m, setAttrs(m, { content: meta[key] }));
    }
    // One graph, in place of Rank Math's (or of the one an earlier run wrote).
    const scripts = findAll(doc, (c) => c.tagName === 'script' && attr(c, 'type') === 'application/ld+json');
    const text = (s) => (s.childNodes || []).map((c) => c.value || '').join('');
    let old = null;
    for (const s of scripts) {
      try {
        const j = JSON.parse(text(s));
        if (!old && j['@graph']) old = j;
      } catch {}
    }
    const ld = `<script type="application/ld+json" class="phome-ld">${jsonLd(old)}</script>`;
    scripts.forEach((s, i) => {
      const now = html.slice(loc(s).startOffset, loc(s).endOffset);
      if (i === 0) {
        if (now !== ld) ed.outer(s, ld);
      } else ed.outer(s, '');
    });
    // The preload of a picture the page no longer shows (the hero's old awards picture).
    for (const l of findAll(doc, (c) => c.tagName === 'link' && attr(c, 'rel') === 'preload' && /awards\.png/.test(attr(c, 'imagesrcset') || attr(c, 'href') || ''))) {
      if (!findAll(doc, (c) => c.tagName === 'img' && /awards\.png/.test(attr(c, 'src') || '')).length) ed.outer(l, '');
    }
  });

  // 2. Leftovers, headings, photo descriptions and the rating.
  out = pass(out, (doc, ed) => {
    const free = (n) => !ed.overlaps(loc(n).startOffset, loc(n).endOffset);
    for (const el of findAll(doc, (c) => hasClass(c, 'oxy-shortcode') && SHORTCODE.test(textOf(c)))) if (free(el)) ed.outer(el, '');
    // Five cards (Glenda S., Erica M., Joseph D., Joseph P., Glenda D.) with one cut-off quote
    // between them, a placeholder picture each and no video; hidden, but in the page.
    for (const el of findAll(doc, (c) => hasClass(c, 'Testimonial-container') && hasClass(c, 'd-none'))) if (free(el)) ed.outer(el, '');

    const rename = (el, text) => {
      if (el && loc(el).endTag && free(el) && clean(textOf(el)) !== text) ed.inner(el, `\n${esc(text)}\n`);
    };
    const heading = (box, re) => box && find(box, (c) => c.tagName === 'h2' && re.test(clean(textOf(c))));
    const video = find(doc, (c) => hasClass(c, 'Panda-Video'));
    rename(heading(video, /Top Roofing Choice/), h.headings.reviews);
    const services = find(doc, (c) => hasClass(c, 'Services-section'));
    const eastCoast = heading(services, /^East Coast$/);
    if (eastCoast && free(eastCoast)) ed.outer(eastCoast, '');
    for (const box of findAll(doc, (c) => hasClass(c, 'Slideer-section'))) rename(heading(box, /Looking For a Remodeler/), h.headings.beforeAfter);
    const request = find(doc, (c) => hasClass(c, 'Request-Container'));
    rename(heading(request, /^About Our Team$/), h.headings.estimate);
    // "Learn More" (to /about/) says where it leads, and the hero's video frame has a title.
    const more = request && find(request, (c) => c.tagName === 'a' && attr(c, 'href') === '/about/');
    const moreText = more && find(more, (c) => hasClass(c, 'button-atom__text'));
    if (moreText && loc(moreText).endTag && free(moreText) && /^Learn More$/i.test(clean(textOf(moreText)))) ed.inner(moreText, 'Learn more about Panda Exteriors');
    for (const f of findAll(doc, (c) => c.tagName === 'iframe' && !attr(c, 'title') && /youtube\.com\/embed/.test(attr(c, 'data-lazy-src') || attr(c, 'src') || ''))) {
      if (free(f)) ed.retag(f, setAttrs(f, { title: 'Panda Exteriors background video' }));
    }

    // Photo descriptions (and, for a gallery tile, its link's name, which repeats it).
    const alts = Object.entries(h.alts);
    for (const img of findAll(doc, (c) => c.tagName === 'img')) {
      const src = attr(img, 'src') || '';
      const alt = alts.find(([key]) => src.includes(key))?.[1];
      if (!alt || attr(img, 'alt') === alt || !free(img)) continue;
      ed.retag(img, setAttrs(img, { alt }));
      const tile = img.parentNode;
      if (tile && hasClass(tile, 'ppg__tile') && attr(tile, 'aria-label')) {
        const label = attr(tile, 'aria-label').replace(/^(.*? project photo \d+ of \d+)(?:: .*)?(, view larger)$/, `$1: ${alt}$2`);
        ed.retag(tile, setAttrs(tile, { 'aria-label': label }));
      }
    }

    // The rating: under the hero's buttons and awards, and as the form cards' reviews link.
    const hero = find(doc, (c) => hasClass(c, 'pfix-sv-hero'));
    const text = hero && find(hero, (c) => hasClass(c, 'text-section'));
    if (text && loc(text).endTag && !find(text, (c) => hasClass(c, 'phome-rating'))) ed.replace(loc(text).endTag.startOffset, loc(text).endTag.startOffset, heroRating(siteDir));
    for (const box of findAll(doc, (c) => /^total-reviews(-\d+)?$/.test(attr(c, 'id') || ''))) {
      const link = find(box, (c) => c.tagName === 'a');
      if (link && loc(link).endTag && free(link) && clean(textOf(link)) !== ratingWords()) ed.inner(link, esc(ratingWords()));
    }
  });

  // 3. Landmarks, the skip link and the new sections.
  out = pass(out, (doc, ed) => {
    const body = find(doc, (c) => c.tagName === 'body');
    const blocks = (body?.childNodes || []).filter((c) => c.tagName);
    const main = blocks.find((c) => c.tagName === 'main');
    const inside = main ? (main.childNodes || []).filter((c) => c.tagName) : blocks;
    const header = blocks.find((c) => hasClass(c, 'nav'));
    const footer = blocks.find((c) => hasClass(c, 'footer'));
    const hero = inside.find((c) => hasClass(c, 'pfix-sv-hero') || hasClass(c, 'hero'));
    if (!header || !footer || !hero) return;
    const first = blocks[0];
    if (!blocks.some((c) => hasClass(c, 'phome-skip'))) ed.replace(loc(first).startOffset, loc(first).startOffset, `<a class="phome-skip" href="#main">Skip to main content</a>`);
    if (header.tagName !== 'header') ed.retag(header, header.attrs, 'header');
    const menu = find(header, (c) => hasClass(c, 'main_menu'));
    if (menu && menu.tagName !== 'nav') ed.retag(menu, setAttrs(menu, { 'aria-label': 'Main' }), 'nav');
    if (footer.tagName !== 'footer') ed.retag(footer, footer.attrs, 'footer');
    if (!main) {
      ed.replace(loc(hero).startOffset, loc(hero).startOffset, `<main id="main" class="phome-main" tabindex="-1">`);
      ed.replace(loc(footer).startOffset, loc(footer).startOffset, `</main>`);
    }
    // A block of new sections: written after `anchor` (or before it), or again in place.
    const put = (id, markup, anchor, where) => {
      const own = inside.find((c) => attr(c, 'id') === id);
      if (own) {
        if (out.slice(loc(own).startOffset, loc(own).endOffset) !== markup) ed.outer(own, markup);
      } else if (anchor && markup) {
        const at = where === 'before' ? loc(anchor).startOffset : loc(anchor).endOffset;
        ed.replace(at, at, markup);
      }
    };
    put('phome-top', topSections(), hero, 'after');
    put('phome-areas', areaLinks(siteDir), inside.find((c) => hasClass(c, 'pmap-section') || hasClass(c, 'Client-section')), 'after');
    put('phome-faq', faqSection(), inside.find((c) => hasClass(c, 'Request-Container')), 'before');
  });

  // 4. The stylesheets and script the new parts use.
  const assets =
    [NEW_PAGES_FILES['new-pages.css'], HOME_FILES['home.css']].filter((href) => !out.includes(`href="${href}"`)).map((href) => `<link rel="stylesheet" href="${href}">`).join('') +
    (out.includes(`src="${HOME_FILES['home.js']}"`) ? '' : `<script src="${HOME_FILES['home.js']}" defer></script>`);
  const headEnd = headEndOffset(out);
  if (assets && headEnd >= 0) out = out.slice(0, headEnd) + assets + out.slice(headEnd);

  if (out !== before) changes.push('home page: title, description and structured data, landmarks and a skip link, headings, photo descriptions, the Google rating, and the storm damage, how it works, financing, warranty, office and FAQ sections');
  return out;
}
