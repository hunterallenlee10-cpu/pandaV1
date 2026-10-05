// The Contact Us page (/contact-us/), redesigned. As captured it was a heading and one line,
// seven office cards whose maps were Google static-map pictures that never loaded (they
// need an API key), phone numbers that couldn't be tapped and "Send Message" buttons that
// opened a form this copy can't send, then a lime band with the email address in orange
// (hard to read). Three offices had no street address.
//
// Now (content in custom/site-fixes/contact-page.json; edit it and run `npm run update:site`):
//  - hero: a headline, the main line and email as large tap-to-call / tap-to-email cards,
//    the headquarters' address, and a map of the East Coast with a pin per office (each
//    name links to its card);
//  - the seven offices, headquarters first: each card has a small map of its state with
//    the office pinned, its street address with "Get directions" (Google Maps) and its own
//    number as a call button;
//  - a closing band with the main line and email.
// The maps are drawn in the page (SVG) from the US map's state outlines
// (custom/us-map/us-states.json), like the site's other maps: no API key, nothing to load.
// The pop-up message form (which could not send) is removed with its buttons.
//
// Applied by site-fixes.mjs; the page is rendered again on every run.
import fs from 'node:fs';
import path from 'node:path';
import { geoAlbersUsa } from 'd3-geo';
import { ROOT } from './config.mjs';
import { attr, hasClass, esc, find, findAll, rawText } from './html-edit.mjs';
import { helpTopics } from './customer-service-page.mjs';

export const CONTACT_PATH = '/contact-us/';

let data;
let geo;
const contactPage = () => (data ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'custom', 'site-fixes', 'contact-page.json'), 'utf8')));
const states = () => (geo ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'custom', 'us-map', 'us-states.json'), 'utf8')));
const project = (lat, lon) => {
  const g = states();
  const [x, y] = geoAlbersUsa().scale(g.projection.scale).translate(g.projection.translate)([lon, lat]) || [0, 0];
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
};

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  mail: line('M3.5 6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5zM4 6.5l8 6 8-6'),
  pin: line('M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4z'),
  route: line('M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 17h7.5a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7H17'),
  star: line('M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z'),
};
const isIn = (n, root) => {
  for (let p = n; p; p = p.parentNode) if (p === root) return true;
  return false;
};
const tel = (phone) => `tel:+1${phone.replace(/\D/g, '')}`;
const directions = (o) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Panda Exteriors, ${o.street}, ${o.locality}`)}`;

// The states whose outlines cross a box [x0, y0, x1, y1].
const statesIn = ([x0, y0, x1, y1]) =>
  Object.entries(states().states).filter(([, s]) => s.bbox[0] < x1 && s.bbox[2] > x0 && s.bbox[1] < y1 && s.bbox[3] > y0);

// A pin: a dot with a soft ring that pulses (site-fixes.css).
const pin = ([x, y], r) => `<g class="pfix-ct-pin" transform="translate(${x} ${y})"><circle class="pfix-ct-pin__ring" r="${r * 2.2}"/><circle class="pfix-ct-pin__dot" r="${r}"/></g>`;

// The East Coast with a pin per office and the names in a column to the right.
function overviewMap(offices) {
  const box = [652, 186, 995, 588];
  const office = new Set(offices.map((o) => o.state));
  const shapes = statesIn(box)
    .map(([code, s]) => `<path class="pfix-ct-map__state${office.has(code) ? ' is-office' : ''}" d="${s.d}"/>`)
    .join('');
  const labelX = 884;
  const marks = offices
    .map((o) => {
      const [x, y] = project(...o.at);
      return (
        `<a href="#office-${esc(o.id)}" class="pfix-ct-map__office">` +
        `<path class="pfix-ct-map__lead" d="M${x} ${y}L${labelX - 6} ${o.label}"/>` +
        pin([x, y], 3.6) +
        `<text x="${labelX}" y="${o.label + 4}">${esc(`${o.city}, ${o.state}`)}${o.hq ? ' ★' : ''}</text></a>`
      );
    })
    .join('');
  return (
    `<svg class="pfix-ct-map pfix-ct-map--overview" viewBox="${box[0]} ${box[1]} ${box[2] - box[0]} ${box[3] - box[1]}" role="img" aria-labelledby="pfix-ct-map-title">` +
    `<title id="pfix-ct-map-title">Map of Panda Exteriors’ seven offices: ${esc(offices.map((o) => `${o.city}, ${o.state}`).join('; '))}</title>` +
    `<g aria-hidden="true">${shapes}</g>${marks}</svg>`
  );
}

// One office's state, framed with a little of its neighbours, and the office pinned.
function officeMap(o) {
  const s = states().states[o.state];
  const [x0, y0, x1, y1] = s.bbox;
  // A frame of the card's shape (8:5) around the state, with a margin.
  const pad = Math.max(x1 - x0, y1 - y0) * 0.18 + 6;
  let w = x1 - x0 + 2 * pad;
  let h = y1 - y0 + 2 * pad;
  if (w / h < 1.6) w = h * 1.6;
  else h = w / 1.6;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const box = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
  const r = (n) => Math.round(n * 10) / 10;
  const shapes = statesIn(box)
    .map(([code, st]) => `<path class="pfix-ct-map__state${code === o.state ? ' is-office' : ''}" d="${st.d}"/>`)
    .join('');
  return (
    `<svg class="pfix-ct-map pfix-ct-map--office" viewBox="${r(box[0])} ${r(box[1])} ${r(w)} ${r(h)}" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">` +
    `${shapes}${pin(project(...o.at), Math.max(w, h) / 70)}</svg>`
  );
}

function hero() {
  const { hero: h, main, offices } = contactPage();
  const hq = offices.items.find((o) => o.hq) || offices.items[0];
  return (
    `<section class="pfix-ct-hero" aria-labelledby="pfix-ct-title"><div class="pfix-ct__inner pfix-ct-hero__inner">` +
    `<div class="pfix-ct-hero__text">` +
    `<p class="pfix-ct__eyebrow pfix-ct__eyebrow--light">${esc(h.eyebrow)}</p>` +
    `<h1 class="pfix-ct-hero__title" id="pfix-ct-title">${esc(h.title)}</h1>` +
    `<p class="pfix-ct-hero__sub">${esc(h.sub)}</p>` +
    `<div class="pfix-ct-quick">` +
    `<a class="pfix-ct-quick__item pfix-ct-quick__item--call" href="${esc(main.phone[1])}"><span class="pfix-ct-quick__icon">${ICONS.phone}</span>` +
    `<span><small>Call us</small><b>${esc(main.phone[0])}</b><em>${esc(main.phoneNote)}</em></span></a>` +
    `<a class="pfix-ct-quick__item" href="mailto:${esc(main.email)}"><span class="pfix-ct-quick__icon">${ICONS.mail}</span>` +
    `<span><small>Email us</small><b>${esc(main.email)}</b><em>${esc(main.emailNote)}</em></span></a>` +
    `<a class="pfix-ct-quick__item" href="#office-${esc(hq.id)}"><span class="pfix-ct-quick__icon">${ICONS.pin}</span>` +
    `<span><small>Headquarters</small><b>${esc(hq.street)}</b><em>${esc(hq.locality)}</em></span></a>` +
    `</div>` +
    `</div>` +
    `<div class="pfix-ct-hero__map">${overviewMap(offices.items)}</div>` +
    `</div></section>`
  );
}

function officesSection() {
  const { offices } = contactPage();
  const items = [...offices.items].sort((a, b) => (b.hq ? 1 : 0) - (a.hq ? 1 : 0));
  const card = (o) =>
    `<article class="pfix-ct-office${o.hq ? ' pfix-ct-office--hq' : ''}" id="office-${esc(o.id)}" aria-labelledby="office-${esc(o.id)}-name">` +
    `<div class="pfix-ct-office__map">${officeMap(o)}${o.hq ? `<span class="pfix-ct-office__badge">${ICONS.star}Headquarters</span>` : ''}</div>` +
    `<div class="pfix-ct-office__body">` +
    `<h3 class="pfix-ct-office__name" id="office-${esc(o.id)}-name">${esc(o.name)}<span>${esc(o.city)}</span></h3>` +
    `<p class="pfix-ct-office__address">${ICONS.pin}<span><span>${esc(o.street)}</span><span>${esc(o.locality)}</span></span></p>` +
    `<div class="pfix-ct-office__actions">` +
    `<a class="pfix-ct-btn pfix-ct-btn--call" href="${tel(o.phone)}">${ICONS.phone}${esc(o.phone)}</a>` +
    `<a class="pfix-ct-btn pfix-ct-btn--ghost" href="${esc(directions(o))}" target="_blank" rel="noopener">${ICONS.route}Directions<span class="pfix-ct-sr"> to the ${esc(o.name)} office (opens Google Maps)</span></a>` +
    `</div>` +
    `</div>` +
    `</article>`;
  return (
    `<section class="pfix-ct__sec" id="offices" aria-labelledby="pfix-ct-offices-title"><div class="pfix-ct__inner">` +
    `<div class="pfix-ct__head">` +
    `<p class="pfix-ct__eyebrow">${esc(offices.eyebrow)}</p>` +
    `<h2 class="pfix-ct__title" id="pfix-ct-offices-title">${esc(offices.title)}</h2>` +
    `<p class="pfix-ct__sub">${esc(offices.sub)}</p>` +
    `</div>` +
    `<div class="pfix-ct-offices">${items.map(card).join('')}</div>` +
    `</div></section>`
  );
}

function ctaSection() {
  const { cta, main } = contactPage();
  return (
    `<section class="pfix-ct-cta" aria-labelledby="pfix-ct-cta-title"><div class="pfix-ct__inner pfix-ct-cta__inner">` +
    `<div><h2 class="pfix-ct-cta__title" id="pfix-ct-cta-title">${esc(cta.title)}</h2><p class="pfix-ct-cta__text">${esc(cta.text)}</p></div>` +
    `<div class="pfix-ct-cta__actions">` +
    `<a class="pfix-ct-btn pfix-ct-btn--dark" href="${esc(main.phone[1])}">${ICONS.phone}Call ${esc(main.phone[0])}</a>` +
    `<a class="pfix-ct-btn pfix-ct-btn--outline" href="mailto:${esc(main.email)}">${ICONS.mail}${esc(main.email)}</a>` +
    `</div>` +
    `</div></section>`
  );
}

// "Already a customer?": the Customer Service page's help topics (warranty, guarantee,
// financing, reviews, referrals, FAQs), merged into this page (MERGED_PAGES in config.mjs).
const customerSection = () =>
  `<div class="pfix-cs pfix-ct-help">${helpTopics({ eyebrow: 'Customer service', title: 'Already a customer?', intro: 'Your warranty, financing, reviews and referrals: everything you need after the job, in one place.', id: 'customer-service' })}</div>`;

const pageHtml = () => `<div class="pfix-ct">${hero()}${officesSection()}${customerSection()}${ctaSection()}</div>`;

/**
 * /contact-us/: the hero, office cards and contact band (as captured, or this page as an
 * earlier build left it) become the redesigned page, the pop-up form goes, and the page's
 * description lists the offices. Returns true if it changed anything.
 */
export function collectContactPage(doc, html, ed, { pathname = '' } = {}, changes = []) {
  if (pathname !== CONTACT_PATH) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  let done = false;

  const built = find(doc, (c) => hasClass(c, 'pfix-ct'));
  if (built) {
    if (free(built)) {
      ed.outer(built, pageHtml());
      done = true;
    }
  } else {
    // The heading and office cards, then the lime contact band: next to each other.
    const first = find(doc, (c) => c.tagName === 'div' && hasClass(c, 'Reviews-section') && hasClass(c, 'oxy-container'));
    const last = find(doc, (c) => c.tagName === 'div' && hasClass(c, 'Contact-section') && hasClass(c, 'oxy-container'));
    if (first && last && first.parentNode === last.parentNode && free(first) && free(last)) {
      ed.replace(first.sourceCodeLocation.startOffset, last.sourceCodeLocation.endOffset, pageHtml());
      done = true;
    }
  }
  if (done) changes.push('contact page: hero with call, email and an office map, seven office cards with drawn maps, addresses and call buttons (was broken map pictures and untappable numbers)');

  // The pop-up message form its "Send Message" buttons opened (it could not send).
  const modal = find(doc, (c) => attr(c, 'id') === 'contactModal');
  if (modal && free(modal)) {
    ed.outer(modal, '');
    changes.push('contact page: the pop-up message form that could not send is removed');
    done = true;
  }

  // Its submit button's spinner script, which fails without the form ("Cannot read
  // properties of null"), goes with it once no message form is left on the page.
  const formsLeft = findAll(doc, (c) => c.tagName === 'form' && hasClass(c, 'wpcf7-form')).filter((f) => !modal || !isIn(f, modal));
  if (!formsLeft.length) {
    for (const s of findAll(doc, (c) => c.tagName === 'script' && !attr(c, 'src') && /\.wpcf7-spinner/.test(rawText(c)) && /custom-submit-button/.test(rawText(c)))) {
      if (free(s)) {
        ed.outer(s, '');
        done = true;
      }
    }
  }

  const { description } = contactPage();
  for (const m of findAll(doc, (c) => c.tagName === 'meta' && ['description', 'og:description', 'twitter:description'].includes(attr(c, 'name') || attr(c, 'property')))) {
    if (attr(m, 'content') === description || !free(m)) continue;
    ed.retag(m, m.attrs.map((a) => (a.name === 'content' ? { name: 'content', value: description } : a)));
    done = true;
  }
  return done;
}
