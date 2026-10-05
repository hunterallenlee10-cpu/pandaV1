// The Siding, Gutters and Roofing pages (/siding/, /gutters/, /roofing/), made into one strong
// page per service.
// Each had a hero with the lead form, two cards and then sections shared with every other
// page: nothing on what the job involves, how to tell it's time, or common questions, and
// /siding/ said nothing about the two siding types it offers (only their logos in the hero).
//
// Under the cards, each page now gets (content in custom/site-fixes/service-pages.json,
// written only from what the site and its blog already say):
//  - /siding/: the two siding types side by side (James Hardie fiber cement, CertainTeed
//    vinyl), with an id the "Siding Types" card links to; /solar/: solar panels and GAF solar
//    shingles side by side the same way (an icon where a type has no logo, and a link to
//    the type's own page or section);
//  - signs it's time to replace, with links to the blog posts they come from (and, on
//    /commercial-roofing/, the roof systems and the buildings Panda roofs, each building
//    with a link to its project);
//  - /gutters/: what is checked on every gutter job; /roofing/: what goes into every new roof,
//    beside a photo of a roof Panda replaced;
//  - how the project works, in three steps;
// (Lists are divs with list roles: the site's stylesheet forces white text and bullets on
// every ul and li.)
//  - common questions (and FAQPage structured data), then a call and estimate band whose
//    estimate button leads to the hero's lead form.
// /gutters/ also opens its project gallery on the Gutters photos (project-gallery.mjs).
// /roofing/ has no "how it works" (its own "Our Process" is redesigned by roofing-page.mjs);
// its sections go under its services carousel ("after": the section's class as captured).
//
// Applied by site-fixes.mjs. The block is rendered again on every run, so editing the
// JSON and running `npm run update:site` updates the pages.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { hasClass, esc, find, headEndOffset } from './html-edit.mjs';

const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// The hero's estimate form (service-forms.mjs).
const FORM_ID = 'pfix-lead-1';

let data;
export const servicePages = () => (data ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'custom', 'site-fixes', 'service-pages.json'), 'utf8')));
/** The upgraded page for a path, if it has one. */
export const servicePage = (pathname) => servicePages()[pathname] || null;

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  wave: line('M3 8c3-3 6 3 9 0s6 3 9 0M3 16c3-3 6 3 9 0s6 3 9 0'),
  sun: line('M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'),
  crack: line('M4 4h16v16H4zM12 4l-2 5 4 3-3 4 1 4'),
  gap: line('M3 6h7v12H3zM14 6h7v12h-7M10 12h4'),
  drop: line('M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z'),
  window: line('M5 3h14v18H5zM5 12h14M12 3v18'),
  rain: line('M7 15a5 5 0 1 1 1.6-9.7A6 6 0 0 1 20 9a4 4 0 0 1-1 7.9M8 19l-1 2M12 18l-1 3M16 19l-1 2'),
  down: line('M8 3v9a4 4 0 0 0 4 4h6M15 13l3 3-3 3M5 21h4'),
  calendar: line('M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5zM4 10h16M8.5 3v4M15.5 3v4M8 14h3'),
  shingle: line('M3 17l9-9 9 9M6 14v6h12v-6M9.5 11.5l2 2M14 9.5l1.5-3'),
  granules: line('M3 9h18l-2 4H5zM8 17.5v.1M12 19v.1M16 17.5v.1M10 21v.1M14 21v.1'),
  sag: line('M3 7c3 0 6 6 9 6s6-6 9-6M5 17h14M8 13.5V17M16 13.5V17'),
  bolt: line('M13 2.5L5 13.5h6l-1 8 8-11h-6z'),
  layers: line('M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5'),
  shield: line('M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6'),
  home: line('M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5'),
  coin: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM14.8 9.2c-.5-.8-1.5-1.3-2.8-1.3-1.7 0-2.8.8-2.8 2s1.2 1.7 2.8 2 2.8.9 2.8 2.1-1.1 2-2.8 2c-1.4 0-2.5-.6-3-1.5M12 6.3v1.6M12 16v1.7'),
  sparkle: line('M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z'),
  clock: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2'),
  roll: line('M4 7a3 3 0 0 1 6 0v10a3 3 0 0 1-6 0zM7 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7'),
  // The buildings Panda roofs (/commercial-roofing/).
  medical: line('M4 21V7h16v14M2.5 21h19M10 21v-4h4v4M12 9.5v5M9.5 12h5M8 4h8v3H8z'),
  apartments: line('M3 21V9l5-3v15M8 21V4h9v17M17 10h4v11M2 21h20M11 8h1M14 8h1M11 12h1M14 12h1M11 16h1M14 16h1'),
  terrace: line('M3 13h18M5 13v8M19 13v8M3 17h18M8 13V9M16 13V9M6 9h12M9 9V5.5a3 3 0 0 1 6 0V9'),
  office: line('M4 21V4h11v17M15 9h5v12M2.5 21h19M7.5 8h2M7.5 12h2M7.5 16h2M11 8h1M11 12h1M11 16h1'),
};
const CHECK = line('M5 12.5l4.2 4.2L19 7');
const PHONE_ICON = svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>');
const ARROW = '<span aria-hidden="true"> →</span>';

const picture = (src, w, h, alt, exists, cls = '') =>
  `<picture${cls ? ` class="${cls}"` : ''}>${exists(`${src}.webp`) ? `<source type="image/webp" srcset="${esc(src)}.webp">` : ''}` +
  `<img src="${esc(src)}" alt="${esc(alt)}"${w && h ? ` width="${w}" height="${h}"` : ''} loading="lazy" decoding="async"></picture>`;

const head = (key, eyebrow, title, intro) =>
  `<div class="pfix-sp__head">${eyebrow ? `<p class="pfix-sp__eyebrow">${esc(eyebrow)}</p>` : ''}` +
  `<h2 class="pfix-sp__title" id="pfix-sp-${key}">${esc(title)}</h2>${intro ? `<p class="pfix-sp__intro">${esc(intro)}</p>` : ''}</div>`;
const section = (key, cls, inner, id = '') =>
  `<section class="pfix-sp__sec pfix-sp__sec--${cls}"${id ? ` id="${esc(id)}"` : ''} aria-labelledby="pfix-sp-${key}"><div class="pfix-sp__inner">${inner}</div></section>`;

function renderTypes(t, exists) {
  const option = (o) =>
    `<article class="pfix-sp-type" role="listitem">` +
    `<div class="pfix-sp-type__top">${o.logo ? picture(o.logo[0], 0, 0, `${o.logo[1]} logo`, exists, 'pfix-sp-type__logo') : `<span class="pfix-sp-type__icon">${ICONS[o.icon] || ICONS.home}</span>`}` +
    `<h3 class="pfix-sp-type__name">${esc(o.name)}${o.brand ? ` <span>by ${esc(o.brand)}</span>` : ''}${o.tag ? ` <span>${esc(o.tag)}</span>` : ''}</h3></div>` +
    `<p class="pfix-sp-type__text">${esc(o.text)}</p>` +
    `<div class="pfix-sp-list" role="list">${o.points.map((p) => `<div role="listitem">${CHECK}<span>${esc(p)}</span></div>`).join('')}</div>` +
    `<p class="pfix-sp-type__best"><b>Best for</b> ${esc(o.best)}</p>` +
    (o.link ? `<a class="pfix-sp-link" href="${esc(o.link[0])}">${esc(o.link[1])}${ARROW}</a>` : '') +
    `</article>`;
  return section(
    'types',
    'types',
    head('types', t.eyebrow, t.title, t.intro) +
      `<div class="pfix-sp-types" role="list">${t.options.map(option).join('')}</div>` +
      (t.note ? `<p class="pfix-sp__note">${esc(t.note)} <a href="#${FORM_ID}">Get a free estimate${ARROW}</a></p>` : ''),
    t.id
  );
}

function renderSigns(s, key = 'signs') {
  return section(
    key,
    'signs',
    head(key, s.eyebrow || '', s.title, s.intro) +
      `<div class="pfix-sp-signs" role="list">` +
      s.items
        .map(
          ([icon, title, text, link]) =>
            `<div class="pfix-sp-sign" role="listitem"><span class="pfix-sp-sign__icon">${ICONS[icon] || ICONS.crack}</span><h3>${esc(title)}</h3><p>${esc(text)}</p>` +
            (link ? `<a class="pfix-sp-link" href="${esc(link[0])}">${esc(link[1])}${ARROW}</a>` : '') +
            `</div>`
        )
        .join('') +
      `</div>` +
      `<div class="pfix-sp-signs__foot">${s.footer ? `<p>${esc(s.footer)}</p>` : ''}` +
      (s.reads?.length
        ? `<p class="pfix-sp-reads"><span>Read more:</span> ${s.reads.map(([href, text]) => `<a href="${esc(href)}">${esc(text)}</a>`).join('')}</p>`
        : '') +
      `</div>`,
    s.id
  );
}

function renderCheck(c, exists, key = 'check') {
  const [src, w, h] = c.img;
  return section(
    key,
    'check',
    `<div class="pfix-sp-check">` +
      `<div class="pfix-sp-check__media">${picture(src, w, h, c.alt || '', exists)}</div>` +
      `<div class="pfix-sp-check__body">${head(key, c.eyebrow || '', c.title, c.intro)}` +
      `<div class="pfix-sp-list pfix-sp-list--big" role="list">${c.items.map((p) => `<div role="listitem">${CHECK}<span>${esc(p)}</span></div>`).join('')}</div>` +
      (c.link ? `<a class="pfix-sp-link" href="${esc(c.link[0])}">${esc(c.link[1])}${ARROW}</a>` : '') +
      `</div></div>`,
    c.id
  );
}

const renderSteps = (s) =>
  section(
    'steps',
    'steps',
    head('steps', '', s.title) +
      `<div class="pfix-sp-steps" role="list">${s.items.map(([title, text], i) => `<div class="pfix-sp-step" role="listitem"><span class="pfix-sp-steps__n" aria-hidden="true">${i + 1}</span><h3><span class="pfix-sp-sr">Step ${i + 1}: </span>${esc(title)}</h3><p>${esc(text)}</p></div>`).join('')}</div>`
  );

const renderFaq = (f, cta) =>
  section(
    'faq',
    'faq',
    head('faq', '', f.title) +
      `<div class="pfix-sp-faq">${f.items
        .map(([q, a]) => `<details class="pfix-sp-faq__item"><summary><span>${esc(q)}</span></summary><p>${esc(a)}</p></details>`)
        .join('')}</div>` +
      (cta
        ? `<div class="pfix-sp-cta"><div><p class="pfix-sp-cta__title">${esc(cta.title)}</p><p class="pfix-sp-cta__text">${esc(cta.text)}</p></div>` +
          `<div class="pfix-sp-cta__btns"><a class="pfix-sp-btn pfix-sp-btn--primary" href="#${FORM_ID}">Get a free estimate</a>` +
          `<a class="pfix-sp-btn pfix-sp-btn--ghost" href="${PHONE.href}">${PHONE_ICON}Call ${PHONE.text}</a></div></div>`
        : '')
  );

/** The block of new sections for one page. */
export function renderServicePage(page, { siteDir } = {}) {
  const exists = (src) => !siteDir || fs.existsSync(path.join(siteDir, src));
  const cards = (after) =>
    (page.cards || [])
      .map((c, i) => (!c.afterCheck === !after ? renderSigns(c, `cards-${i + 1}`) : ''))
      .join('');
  return (
    `<div class="pfix-sp pfix-sp--${esc(page.service)}" data-pfix-sp>` +
    (page.types ? renderTypes(page.types, exists) : '') +
    (page.signs ? renderSigns(page.signs) : '') +
    // More card and photo sections, for pages that took in another page's content (the site
    // restructure: MERGED_PAGES in config.mjs). Each can have an id that links lead to, and
    // card sections marked afterCheck go under the photo sections (/commercial-roofing/'s
    // buildings, so the card sections don't sit back to back).
    cards(false) +
    (page.check ? renderCheck(page.check, exists) : '') +
    (page.checks || []).map((c, i) => renderCheck(c, exists, `checks-${i + 1}`)).join('') +
    cards(true) +
    (page.steps ? renderSteps(page.steps) : '') +
    (page.faq ? renderFaq(page.faq, page.cta) : '') +
    `</div>`
  );
}

const faqLd = (page, url) =>
  `<script type="application/ld+json" data-pfix-sp-ld>${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(url ? { url } : {}),
    mainEntity: page.faq.items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }).replace(/</g, '\\u003c')}</script>`;

/**
 * Adds (or renders again) the new sections under the page's service cards, and the FAQ's
 * structured data. Returns true when the page has them.
 */
export function collectServicePage(doc, html, ed, { pathname, siteDir, siteOrigin }, changes) {
  const page = servicePage(pathname);
  if (!page) return false;
  const block = renderServicePage(page, { siteDir });
  const own = find(doc, (c) => c.attrs?.some((a) => a.name === 'data-pfix-sp'));
  if (own) {
    const { startOffset, endOffset } = own.sourceCodeLocation;
    if (html.slice(startOffset, endOffset) !== block) {
      ed.outer(own, block);
      changes.push('service page: sections rendered again');
    }
  } else {
    // Under the section with the service cards (its grid, or the cards as captured), or the
    // section the page names.
    const cards =
      find(doc, (c) => hasClass(c, 'Team-section') && find(c, (x) => hasClass(x, 'pfix-svc-grid') || hasClass(x, 'Service-cards'))) ||
      (page.after && find(doc, (c) => c.tagName === 'div' && hasClass(c, page.after)));
    if (!cards) {
      console.warn(`site-fixes: ${pathname}: no service cards section, service page sections not added`);
      return false;
    }
    const end = cards.sourceCodeLocation.endOffset;
    ed.replace(end, end, block);
    const parts = [page.types && 'types compared', page.signs && 'signs it’s time', page.cards && 'cards', page.check && 'what we check', page.checks && 'photo sections', page.steps && 'how it works', page.faq && 'questions'].filter(Boolean);
    changes.push(`service page: added ${parts.join(', ')} under the service cards`);
  }
  if (page.faq) {
    const ld = faqLd(page, siteOrigin ? siteOrigin + pathname : '');
    const old = find(doc, (c) => c.tagName === 'script' && c.attrs?.some((a) => a.name === 'data-pfix-sp-ld'));
    if (old) {
      const { startOffset, endOffset } = old.sourceCodeLocation;
      if (html.slice(startOffset, endOffset) !== ld) ed.outer(old, ld);
    } else {
      const headEnd = headEndOffset(html);
      if (headEnd >= 0) ed.replace(headEnd, headEnd, ld);
    }
  }
  return true;
}
