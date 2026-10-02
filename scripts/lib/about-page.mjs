// The About page (/about/): its first two sections, redesigned to match the rest of the page.
//
//  - Hero: "About Us" and "We make sure our team is the best available to give you the best
//    results possible!" over a photo of an office ceiling (a projector and ceiling tiles). It
//    now introduces the company: a headline with the jobs completed (from the US map's
//    areas.json, so it always matches the map further down), a line about what Panda does,
//    the jobs, local offices, states and Google rating (google-reviews.json), "Get a free
//    estimate" and call buttons and the GAF, BBB and Inc. 5000 credentials, over a photo of a
//    Panda roofer in a Panda hoodie and harness on a roof (about-hero.webp, a 165 KB copy of a
//    551 KB PNG already on the site). The lead form beside it is unchanged.
//  - "Our Mission": two long paragraphs beside a small photo. It now leads with the idea the
//    first paragraph ends on (the work is only as good as the team), keeps that paragraph, and
//    sets what the second one promised as three points (trained, certified and licensed; no
//    sales pressure; no cut corners) and the areas it named as a line of places, beside a
//    photo collage: a Panda truck at a job while the crew roofs the building (about-team.webp,
//    a smaller copy of a photo already on the site), the section's old photo, and a "30+ years
//    of combined experience" badge.
//
// Every word comes from the page itself, the map's data or the Google rating. Applied by
// site-fixes.mjs; both sections are rendered again on every run (they are found by their
// own classes on a page an earlier build changed), so `npm run update:site` updates them.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { hasClass, classes, esc, find, textOf, clean, headEndOffset } from './html-edit.mjs';
import { loadUsMap } from './us-map.mjs';
import { loadReviewWall } from './review-wall.mjs';

export const ABOUT_PATH = '/about/';
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// The hero's estimate form (service-forms.mjs).
const FORM_ID = 'pfix-lead-1';
// The photos are in custom/site-fixes/ (SITE_FIXES_FILES). The hero's (site-fixes.css sets it
// as the hero's background, and it is preloaded) is a webp copy of
// /wp-content/uploads/2025/03/eaf2e8a6-efc7-47c5-8d45-932796dd33bc-1-min.png; the mission's is
// a 1,100 px copy of /wp-content/uploads/2025/07/3-Jul-14-2025-07_57am-5LCD.jpg. With them,
// the section's own photo of a crew on a commercial roof.
export const ABOUT_HERO_PHOTO = '/_custom/site-fixes/about-hero.webp';
export const ABOUT_TEAM_PHOTO = '/_custom/site-fixes/about-team.webp';
const customFile = (url) => path.join(ROOT, 'custom', 'site-fixes', path.basename(url));
const MISSION_PHOTO = { src: '/wp-content/uploads/2025/03/0814d5a8-0065-43ba-9b1f-06520da4e690-3.png', width: 534, height: 328 };
const MISSION_ID = 'our-mission';

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  check: line('M5 12.5l4.5 4.5L19 7.5', 2.6),
  badge: line('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.9L7 21l5-2.6 5 2.6-1.5-7.1M9.6 9l1.6 1.6L14.6 7.4'),
  handshake: line('M3 11l4-4 3 1 2-2 3 1 3-1 3 3-4 4M7 7l-4 4 6 6 2-1M10 14l2 2M12 12l3 3M14 10l3 3'),
  hammer: line('M14.5 4.5l5 5-2 2-5-5zM12.5 6.5L4 15l3 3 8.5-8.5M3 21l3-3'),
  pin: line('M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4z'),
};
const STAR = '<svg class="pfix-ab-hero__star" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="currentColor"/></svg>';

const fmt = (n) => n.toLocaleString('en-US');
const withClass = (n, add) => {
  const has = n.attrs.some((a) => a.name === 'class');
  const cls = [...new Set([...classes(n), ...add])].join(' ');
  return has ? n.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: cls } : a)) : [...n.attrs, { name: 'class', value: cls }];
};

function numbers() {
  const { states, areas } = loadUsMap();
  const jobs = states.reduce((n, s) => n + (Number(s.jobs) || 0), 0);
  const { place } = loadReviewWall();
  return { jobs, states: states.length, offices: areas.length, rating: Number(place.rating) || 0 };
}

function heroText() {
  const n = numbers();
  const stat = (value, label) => `<div class="pfix-ab-hero__stat" role="listitem"><b>${value}</b><span>${esc(label)}</span></div>`;
  return (
    `<p class="pfix-ab-hero__eyebrow">About Panda Exteriors</p>` +
    `<h1 class="pfix-ab-hero__title">${n.jobs ? esc(`The team behind ${fmt(n.jobs)} jobs across the East Coast`) : 'The team behind your new exterior'}</h1>` +
    `<p class="pfix-ab-hero__sub">Roofing, solar, siding and gutters from trained, certified and licensed crews, ` +
    `with ${n.offices} local offices, no sales pressure and no corners cut.</p>` +
    `<div class="pfix-ab-hero__stats" role="list">` +
    (n.jobs ? stat(fmt(n.jobs), 'Jobs completed') : '') +
    stat(n.offices, 'Local offices') +
    stat(n.states, 'States served') +
    (n.rating ? stat(`${esc(n.rating.toFixed(1))}${STAR}`, 'Google rating') : '') +
    `</div>` +
    `<div class="pfix-ab-hero__ctas">` +
    `<a class="pfix-ab-hero__btn pfix-ab-hero__btn--primary" href="#${FORM_ID}">Get a free estimate${ICONS.arrow}</a>` +
    `<a class="pfix-ab-hero__btn pfix-ab-hero__btn--ghost" href="${PHONE.href}">${ICONS.phone}` +
    `<span class="pfix-ab-hero__long">Call ${PHONE.text}</span><span class="pfix-ab-hero__short" aria-hidden="true">Call us</span></a>` +
    `</div>` +
    `<div class="pfix-ab-hero__trust" role="list">` +
    `<span role="listitem">${ICONS.check}GAF Master Elite contractor</span>` +
    `<span role="listitem">${ICONS.check}BBB A-rated business</span>` +
    `<span role="listitem">${ICONS.check}Inc. 5000 No. 1 in construction</span>` +
    `</div>`
  );
}

const POINTS = [
  ['badge', 'Trained, certified and licensed', 'Our experts are fully trained, certified and licensed contractors, with more than 30 years of combined experience.'],
  ['handshake', 'No sales pressure', 'We treat every customer right, and we won’t pressure you to make a sale.'],
  ['hammer', 'No corners cut', 'Top-tier roofing and solar work, built properly on every job, whatever its size.'],
];
const PLACES = ['Laurel, MD', 'Philadelphia, PA', 'Fairfax, VA', 'Cherry Hill, NJ'];

function missionSection() {
  const point = ([icon, title, text]) =>
    `<div class="pfix-ab-mission__point" role="listitem"><span class="pfix-ab-mission__icon">${ICONS[icon]}</span>` +
    `<span class="pfix-ab-mission__point-text"><b>${esc(title)}</b><span>${esc(text)}</span></span></div>`;
  return (
    `<section class="pfix-ab-mission" id="${MISSION_ID}" aria-labelledby="${MISSION_ID}-title"><div class="container pfix-ab-mission__inner">` +
    `<div class="pfix-ab-mission__text">` +
    `<p class="pfix-ab-mission__eyebrow">Our mission</p>` +
    `<h2 class="pfix-ab-mission__title" id="${MISSION_ID}-title">Every job is only as good as the team behind it</h2>` +
    `<p class="pfix-ab-mission__lead">Creating a positive and lighthearted experience for our customers is a big part of what keeps us going at Panda Exteriors. ` +
    `As an exterior remodeler serving the East Coast, we’ve seen homes and businesses in all kinds of conditions. No matter the scope of the damage, ` +
    `the work completed on these properties is only as good as the team involved.</p>` +
    `<div class="pfix-ab-mission__points" role="list">${POINTS.map(point).join('')}</div>` +
    `<p class="pfix-ab-mission__places">${ICONS.pin}<span>Serving ${PLACES.map((p) => `<b>${esc(p)}</b>`).join(', ')} and neighborhoods across the East Coast</span></p>` +
    `</div>` +
    `<div class="pfix-ab-mission__media">` +
    `<figure class="pfix-ab-mission__photo pfix-ab-mission__photo--main"><img src="${ABOUT_TEAM_PHOTO}" alt="A Panda Exteriors truck at a job site while the crew roofs the building" width="1100" height="825" loading="lazy" decoding="async"></figure>` +
    `<figure class="pfix-ab-mission__photo pfix-ab-mission__photo--inset"><picture>` +
    `<source type="image/webp" srcset="${MISSION_PHOTO.src}.webp">` +
    `<img src="${MISSION_PHOTO.src}" alt="A Panda Exteriors crew laying out a commercial roof" width="${MISSION_PHOTO.width}" height="${MISSION_PHOTO.height}" loading="lazy" decoding="async"></picture></figure>` +
    `<div class="pfix-ab-mission__badge"><b>30+</b><span>years of combined experience</span></div>` +
    `</div>` +
    `</div></section>`
  );
}

/**
 * /about/: the hero's text column and the "Our Mission" section. Returns true if it changed
 * either (on the page as captured, or as an earlier build left it).
 */
export function collectAboutPage(doc, html, ed, { pathname = '' } = {}, changes = []) {
  if (pathname !== ABOUT_PATH) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  let done = false;

  const hero = find(doc, (c) => hasClass(c, 'hero-section') && (hasClass(c, 'about') || hasClass(c, 'pfix-ab-hero')));
  const text = hero && find(hero, (c) => hasClass(c, 'text-section'));
  if (text && free(text)) {
    if (!fs.existsSync(customFile(ABOUT_HERO_PHOTO))) {
      console.warn(`about page: the hero photo ${ABOUT_HERO_PHOTO} is missing from the site, hero left as is`);
    } else {
      if (!hasClass(hero, 'pfix-ab-hero')) ed.retag(hero, withClass(hero, ['pfix-ab-hero']));
      ed.inner(text, heroText());
      const headEnd = headEndOffset(html);
      const preload = `<link rel="preload" as="image" type="image/webp" href="${ABOUT_HERO_PHOTO}" fetchpriority="high">`;
      if (headEnd >= 0 && !html.includes(preload)) ed.replace(headEnd, headEnd, preload);
      const n = numbers();
      changes.push(
        `about page hero: introduces the company (${fmt(n.jobs)} jobs, ${n.offices} offices, ${n.states} states, ${n.rating} Google rating), with estimate and call buttons and its credentials, over a photo of a Panda roofer (was "About Us" over an office ceiling)`
      );
      done = true;
    }
  }

  const mission =
    find(doc, (c) => hasClass(c, 'pfix-ab-mission')) ||
    find(doc, (c) => hasClass(c, 'Service-container') && find(c, (h) => h.tagName === 'h2' && clean(textOf(h)) === 'Our Mission'));
  if (mission && free(mission)) {
    ed.outer(mission, missionSection());
    changes.push('about page mission: a headline, the first paragraph, three points and the areas served beside a photo collage (was two long paragraphs and a small photo)');
    done = true;
  }
  return done;
}
