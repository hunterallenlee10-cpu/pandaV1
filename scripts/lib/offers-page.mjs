// The Offers page (/offers/), redesigned. As captured it was a hero over the same drone photo
// as /service-areas/ (pinned to the screen, so blown up), with "We make sure our team is the
// best available…" as its only line, then five identical alternating lime and cream bands,
// each a flyer picture beside a heading and a "Learn More" button. Only two of them were
// offers (10% off a roof replacement, $1,500 off solar); the other three were the financing,
// the satisfaction guarantee and the installation warranty. The flyers had the offer text,
// "Spring" wording and a phone number that isn't the site's (877 213 1240) baked into them,
// and the descriptions were light grey on cream.
//
// Now (content in custom/site-fixes/offers-page.json, written only from what the offer
// pages already say, so it can be edited there and applied with `npm run update:site`):
//  - hero: a photo of a Panda GAF solar roof (dark shingles, white dormers) that scrolls with
//    the page, a headline and line about both offers, the two offers as tickets, and "See
//    the offers" and call buttons; the lead form beside it is unchanged;
//  - the two offers as coupon cards: photo, amount, what you get, a "Claim" button that
//    leads to the hero's form with the offer's project already chosen (site-fixes.js), the
//    offer's own page and its fine print;
//  - what comes with every project: financing, the guarantee and the installation warranty
//    as three cards, each linking to its page;
//  - how to claim an offer, in three steps, and a free estimate and call band.
// (Lists are divs with list roles: the site's stylesheet forces white text and bullets on
// every ul and li.)
//
// The five offer pages it links to (/blog/offer/…/) get a new hero photo and a readable line
// under the heading (collectOfferDetailPage, the "details" in the JSON). Three of the heroes
// were the flyer pictures, blown up behind the heading with their baked-in text ("Spring
// Savings", "877 213 1240") showing through; the other two were 550 px photos stretched to
// the screen's width. All five sat under a 90% black overlay, and the picture kept its own
// shape, so it stopped short of the right edge. The line under the heading had slipped out
// of its styled paragraph into a bare one (dark grey on the dark hero); on the two offers it
// was an internal note ("… Panda Exteriors Internal Promotion"), now the offer in a sentence.
//
// Applied by site-fixes.mjs. The sections are rendered again on every run, so editing the
// JSON and running `npm run update:site` updates the page.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { attr, classes, hasClass, esc, find, findAll, textOf, clean, headEndOffset } from './html-edit.mjs';

export const OFFERS_PATH = '/offers/';
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// The hero's estimate form (service-forms.mjs).
const FORM_ID = 'pfix-lead-1';
// Other names a page's form gives an offer's project (/solar/'s form: "Solar panels").
const PROJECT_ALIASES = { Solar: ['Solar panels'] };

let data;
const offersPage = () => (data ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'custom', 'site-fixes', 'offers-page.json'), 'utf8')));
/** The hero photo (site-fixes.css sets it as the hero's background). */
export const offersHeroPhoto = () => offersPage().hero.photo[0];

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  card: line('M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3 10h18M7 15h4'),
  shield: line('M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6'),
  badge: line('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.9L7 21l5-2.6 5 2.6-1.5-7.1M9.6 9l1.6 1.6L14.6 7.4'),
};
const CHECK = line('M5 12.5l4.2 4.2L19 7');
const PHONE_ICON = svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>');
const DOWN_ICON = svg('<path d="M11 4h2v12.2l4.6-4.6 1.4 1.4-7 7-7-7 1.4-1.4 4.6 4.6z" fill="currentColor"/>');
const ARROW = '<span aria-hidden="true"> →</span>';

const picture = (src, w, h, alt, exists) =>
  `<picture>${exists(`${src}.webp`) ? `<source type="image/webp" srcset="${esc(src)}.webp">` : ''}` +
  `<img src="${esc(src)}" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async"></picture>`;

const head = (key, eyebrow, title, intro) =>
  `<div class="pfix-of__head">${eyebrow ? `<p class="pfix-of__eyebrow">${esc(eyebrow)}</p>` : ''}` +
  `<h2 class="pfix-of__title" id="pfix-of-${key}">${esc(title)}</h2>${intro ? `<p class="pfix-of__intro">${esc(intro)}</p>` : ''}</div>`;
const section = (key, inner, id = '') =>
  `<section class="pfix-of__sec pfix-of__sec--${key}"${id ? ` id="${esc(id)}"` : ''} aria-labelledby="pfix-of-${key}"><div class="pfix-of__inner">${inner}</div></section>`;

/** The hero's text column. */
function renderHero(page) {
  const { hero, offers } = page;
  const ticket = (o) =>
    `<a class="pfix-of-hero__deal" href="#pfix-of-deal-${esc(o.key)}" role="listitem">` +
    `<b>${esc(o.amount)} <span>${esc(o.unit)}</span></b><span>${esc(o.title)}</span></a>`;
  return (
    `<p class="pfix-of-hero__eyebrow">${esc(hero.eyebrow)}</p>` +
    `<h1 class="pfix-of-hero__title">${esc(hero.title)}</h1>` +
    `<p class="pfix-of-hero__sub">${esc(hero.text)}</p>` +
    `<div class="pfix-of-hero__deals" role="list" aria-label="Current offers">${offers.items.map(ticket).join('')}</div>` +
    `<div class="pfix-of-hero__ctas">` +
    `<a class="pfix-of-hero__btn pfix-of-hero__btn--primary" href="#${esc(offers.id)}">${DOWN_ICON}See the offers</a>` +
    `<a class="pfix-of-hero__btn pfix-of-hero__btn--ghost" href="${PHONE.href}">${PHONE_ICON}` +
    `<span class="pfix-of-hero__long">Call ${PHONE.text}</span><span class="pfix-of-hero__short" aria-hidden="true">Call us</span></a>` +
    `</div>`
  );
}

function renderOffers(o, exists, { formId = FORM_ID, pick = null, top = null, after = '' } = {}) {
  const deal = (d) => {
    const [src, w, h, alt] = d.img;
    return (
      `<article class="pfix-of-deal pfix-of-deal--${esc(d.key)}" id="pfix-of-deal-${esc(d.key)}" role="listitem" aria-labelledby="pfix-of-deal-${esc(d.key)}-title">` +
      `<div class="pfix-of-deal__media">${exists(src) ? picture(src, w, h, alt, exists) : ''}<span class="pfix-of-deal__tag">${esc(d.tag)}</span></div>` +
      `<div class="pfix-of-deal__body">` +
      `<p class="pfix-of-deal__amount"><b>${esc(d.amount)}</b> <span>${esc(d.unit)}</span></p>` +
      `<h3 class="pfix-of-deal__title" id="pfix-of-deal-${esc(d.key)}-title">${esc(d.title)}</h3>` +
      `<p class="pfix-of-deal__text">${esc(d.text)}</p>` +
      `<div class="pfix-of-list" role="list">${d.points.map((p) => `<div role="listitem">${CHECK}<span>${esc(p)}</span></div>`).join('')}</div>` +
      `<div class="pfix-of-deal__actions">` +
      (formId && (!pick || pick(d.project))
        ? `<a class="pfix-of-btn pfix-of-btn--primary" href="#${formId}" data-pfix-project="${esc(pick ? pick(d.project) : d.project)}">${esc(d.cta)}</a>`
        : `<a class="pfix-of-btn pfix-of-btn--primary" href="${esc(d.href)}">${esc(d.cta)}</a>`) +
      `<a class="pfix-of-link" href="${esc(d.href)}">Offer details${ARROW}</a>` +
      `</div>` +
      `<p class="pfix-of-deal__fine">${esc(d.fine)}</p>` +
      `</div></article>`
    );
  };
  const h = top || o;
  return section('offers', head('offers', h.eyebrow, h.title, h.intro) + `<div class="pfix-of-deals" role="list">${o.items.map(deal).join('')}</div>` + after, top ? '' : o.id);
}

const renderPromises = (p) =>
  section(
    'promises',
    head('promises', p.eyebrow, p.title, p.intro) +
      `<div class="pfix-of-promises" role="list">${p.items
        .map(
          (x) =>
            `<div class="pfix-of-promise" role="listitem"><span class="pfix-of-promise__icon">${ICONS[x.icon] || ICONS.badge}</span>` +
            `<h3>${esc(x.title)}</h3><p>${esc(x.text)}</p><a class="pfix-of-link" href="${esc(x.href)}">${esc(x.link)}${ARROW}</a></div>`
        )
        .join('')}</div>` +
      (p.note ? `<p class="pfix-of__note">${esc(p.note)}</p>` : '')
  );

const renderSteps = (s, cta) =>
  section(
    'steps',
    head('steps', '', s.title) +
      `<div class="pfix-of-steps" role="list">${s.items
        .map(
          ([title, text], i) =>
            `<div class="pfix-of-step" role="listitem"><span class="pfix-of-step__n" aria-hidden="true">${i + 1}</span>` +
            `<h3><span class="pfix-of-sr">Step ${i + 1}: </span>${esc(title)}</h3><p>${esc(text)}</p></div>`
        )
        .join('')}</div>` +
      (cta
        ? `<div class="pfix-of-cta"><div><p class="pfix-of-cta__title">${esc(cta.title)}</p><p class="pfix-of-cta__text">${esc(cta.text)}</p></div>` +
          `<div class="pfix-of-cta__btns"><a class="pfix-of-btn pfix-of-btn--primary" href="#${FORM_ID}">Get a free estimate</a>` +
          `<a class="pfix-of-btn pfix-of-btn--ghost" href="${PHONE.href}">${PHONE_ICON}Call ${PHONE.text}</a></div></div>`
        : '')
  );

/** The sections that take the place of the five offer bands. */
export function renderOffersPage({ siteDir } = {}) {
  const page = offersPage();
  const exists = (src) => !siteDir || fs.existsSync(path.join(siteDir, src));
  return `<div class="pfix-of" data-pfix-of>${renderOffers(page.offers, exists)}${renderPromises(page.promises)}${renderSteps(page.steps, page.cta)}</div>`;
}

/**
 * The "Limited Time Offers" band on other pages (the home page, /roofing/, /solar/,
 * /commercial-roofing/, /siding/, /gutters/, /thank-you/): three flyer pictures with
 * "Spring Savings" and a number that isn't the site's (877 213 1240) baked in, and "Panda
 * Exteriors Internal Promotion" in their text. It becomes the two offers as the /offers/
 * page's coupon cards, with a line about financing and a link to all the offers. "Claim"
 * picks the offer in the page's estimate form, or opens the offer's page where the form
 * doesn't list it (or there is none). Rendered again on every run (found by data-pfix-offers-strip).
 */
export function collectOffersStrip(doc, html, ed, { pathname, siteDir }, changes) {
  if (pathname === OFFERS_PATH) return false;
  const band = find(doc, (c) => attr(c, 'data-pfix-offers-strip') !== undefined) || find(doc, (c) => c.tagName === 'div' && hasClass(c, 'Offers-Section'));
  if (!band || ed.overlaps(band.sourceCodeLocation.startOffset, band.sourceCodeLocation.endOffset)) return false;
  const block = offersStripHtml(doc, { siteDir });
  const { startOffset, endOffset } = band.sourceCodeLocation;
  if (html.slice(startOffset, endOffset) === block) return true;
  ed.outer(band, block);
  changes.push('offers band: the flyer pictures ("Spring Savings", a number that isn\'t the site\'s) -> the two offers as coupon cards, with financing and a link to all offers');
  return true;
}

/**
 * The offers band's markup for a page (also added where a page had none, e.g.
 * /gutters/gutter-guards/). "Claim" picks the offer's project in the page's estimate form
 * when the form has it (the gutter and siding forms list only their own projects);
 * otherwise it opens the offer's page.
 */
export function offersStripHtml(doc, { siteDir } = {}) {
  const page = offersPage();
  const exists = (src) => !siteDir || fs.existsSync(path.join(siteDir, src));
  const form = find(doc, (c) => attr(c, 'id') === FORM_ID);
  const formId = form ? FORM_ID : null;
  const select = form && find(form, (c) => c.tagName === 'select' && attr(c, 'name') === 'project');
  const projects = new Set(select ? findAll(select, (c) => c.tagName === 'option').map((o) => clean(textOf(o))) : []);
  // The offer's project, or the name a page's own form gives it.
  const pick = (project) => [project, ...(PROJECT_ALIASES[project] || [])].find((p) => projects.has(p)) || null;
  const finance = page.promises.items.find((x) => x.icon === 'card');
  const after =
    `<p class="pfix-of-strip__more">` +
    (finance ? `<span>${ICONS.card}Ask about no-interest financing. <a class="pfix-of-link" href="${esc(finance.href)}">${esc(finance.link)}${ARROW}</a></span>` : '') +
    `<a class="pfix-of-btn pfix-of-btn--ghost" href="${OFFERS_PATH}">See all offers${ARROW}</a></p>`;
  const top = { eyebrow: 'Offers', title: 'Limited-Time Offers', intro: page.offers.intro };
  return `<div class="pfix-of pfix-of--strip" data-pfix-offers-strip>${renderOffers(page.offers, exists, { formId, pick, top, after })}</div>`;
}

/**
 * /offers/: the hero's text, photo and preload, and the offer bands -> the new sections
 * (rendered again on a page built before). Returns true when the page has them.
 */
export function collectOffersPage(doc, html, ed, { pathname, siteDir }, changes) {
  if (pathname !== OFFERS_PATH) return false;
  const page = offersPage();
  const photo = page.hero.photo[0];
  const exists = (src) => !siteDir || fs.existsSync(path.join(siteDir, src));
  const same = (node, text) => {
    const l = node.sourceCodeLocation;
    return html.slice(l.startTag.endOffset, l.endTag.startOffset) === text;
  };
  let done = false;

  // Hero: the text column and the photo (site-fixes.css), fetched with the page.
  const hero = find(doc, (c) => hasClass(c, 'hero-section') && (hasClass(c, 'offers-hero-page') || hasClass(c, 'pfix-of-hero')));
  const text = hero && find(hero, (c) => hasClass(c, 'text-section'));
  if (!text) console.warn(`site-fixes: ${pathname}: no hero text, offers hero left as is`);
  else if (!exists(photo)) console.warn(`site-fixes: ${pathname}: the hero photo is missing from the site, offers hero left as is`);
  else {
    const column = renderHero(page);
    if (!hasClass(hero, 'pfix-of-hero')) {
      ed.retag(hero, hero.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: [...classes(hero), 'pfix-of-hero'].join(' ') } : a)));
      ed.inner(text, column);
      changes.push('offers page: hero with both offers, a "See the offers" and a call button, over a new photo (a Panda GAF solar roof)');
    } else if (!same(text, column)) {
      ed.inner(text, column);
      changes.push('offers page: hero text rendered again');
    }
    const webp = exists(`${photo}.webp`) ? `${photo}.webp` : photo;
    const preload = find(doc, (c) => c.tagName === 'link' && attr(c, 'rel') === 'preload' && attr(c, 'data-pfix-of-hero') !== undefined);
    const tag = `<link rel="preload" as="image"${webp.endsWith('.webp') ? ' type="image/webp"' : ''} href="${esc(webp)}" fetchpriority="high" data-pfix-of-hero>`;
    if (!preload) {
      const headEnd = headEndOffset(html);
      if (headEnd >= 0) ed.replace(headEnd, headEnd, tag);
    } else if (html.slice(preload.sourceCodeLocation.startOffset, preload.sourceCodeLocation.endOffset) !== tag) ed.outer(preload, tag);
    done = true;
  }

  // The five offer bands -> offers, what comes with every project, how to claim.
  const block = renderOffersPage({ siteDir });
  const own = find(doc, (c) => attr(c, 'data-pfix-of') !== undefined);
  if (own) {
    const { startOffset, endOffset } = own.sourceCodeLocation;
    if (html.slice(startOffset, endOffset) !== block) {
      ed.outer(own, block);
      changes.push('offers page: sections rendered again');
    }
    done = true;
  } else {
    const box = find(doc, (c) => hasClass(c, 'Offers-deatils'));
    if (!box) console.warn(`site-fixes: ${pathname}: no offer bands, offers sections not added`);
    else {
      ed.retag(box, box.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: [...classes(box), 'pfix-offers'].join(' ') } : a)));
      ed.inner(box, block);
      changes.push(
        `offers page: the five flyer bands -> ${page.offers.items.length} offer cards, what comes with every project (financing, guarantee, warranty) and how to claim an offer`
      );
      done = true;
    }
  }
  return done;
}


/**
 * /blog/offer/…/: the hero's photo and the line under its heading (the "details" in the
 * JSON), rendered again on a page built before. Returns true when the page has them.
 */
export function collectOfferDetailPage(doc, html, ed, { pathname, siteDir }, changes) {
  const page = offersPage().details?.[pathname];
  if (!page) return false;
  const exists = (src) => !siteDir || fs.existsSync(path.join(siteDir, src));
  const hero = find(doc, (c) => hasClass(c, 'hero') && find(c, (x) => hasClass(x, 'video-background')));
  const bg = hero && find(hero, (c) => hasClass(c, 'video-background'));
  const pic = bg && find(bg, (c) => c.tagName === 'picture' || c.tagName === 'img');
  const text = hero && find(hero, (c) => hasClass(c, 'text-section'));
  const h1 = text && find(text, (c) => c.tagName === 'h1');
  const para = text && find(text, (c) => c.tagName === 'p' && hasClass(c, 'para'));
  const [src, w, h] = page.photo;
  if (!pic || !h1 || !para) {
    console.warn(`site-fixes: ${pathname}: no offer hero, left as is`);
    return false;
  }
  if (!exists(src)) {
    console.warn(`site-fixes: ${pathname}: the hero photo is missing from the site, offer hero left as is`);
    return false;
  }
  const slice = (n) => html.slice(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  const keep = (n, extra) => [...classes(n).filter((c) => !c.startsWith('pfix-offer-hero')), extra].join(' ');
  const photo =
    `<picture class="${esc(keep(pic.tagName === 'picture' ? pic : { attrs: [] }, 'pfix-offer-hero__photo'))}">` +
    (exists(`${src}.webp`) ? `<source type="image/webp" srcset="${esc(src)}.webp">` : '') +
    `<img src="${esc(src)}" alt="" width="${w}" height="${h}" fetchpriority="high" decoding="async" data-no-lazy=""></picture>`;
  const line = `<p class="${esc(keep(para, 'pfix-offer-hero__sub'))}">${esc(page.subtitle)}</p>`;
  const built = hasClass(hero, 'pfix-offer-hero');
  let n = 0;
  if (slice(pic) !== photo) {
    ed.outer(pic, photo);
    n++;
  }
  // Everything after the heading: the styled paragraph (empty as captured) and the bare ones
  // the line slipped into.
  const rest = { start: h1.sourceCodeLocation.endOffset, end: text.sourceCodeLocation.endTag.startOffset };
  if (html.slice(rest.start, rest.end) !== line) {
    ed.replace(rest.start, rest.end, line);
    n++;
  }
  if (!built) {
    ed.retag(hero, hero.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: [...classes(hero), 'pfix-offer-hero'].join(' ') } : a)));
    changes.push('offer page hero: a sharp photo across the whole hero in place of the blown-up flyer or small photo, and the line under the heading readable');
  } else if (n) changes.push('offer page hero: rendered again');
  return true;
}
