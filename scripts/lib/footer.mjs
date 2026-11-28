// The footer (every page but /careers/, which has its own). As delivered: the logo, a line
// saying Panda specializes "in roofing and solar solutions", and three short lists (Company,
// Products, Help) that left out siding, gutter guards, past projects, careers, service areas
// and the seven offices, with no phone number or way to get an estimate.
//
// It becomes: the logo, a line about all four services and where Panda works, the Google
// rating (custom/reviews/google-reviews.json), the main phone number and an estimate button,
// the social links (the page's own), then four lists: Services, Company, Help and the seven
// offices, each with its phone number and a link to its page (custom/site-fixes/
// contact-page.json, new-pages.mjs). The row under it (Site Map, Privacy Policy, Terms) and
// the copyright stay.
//
// Applied by site-fixes.mjs (before the site restructure's footer link swaps); rendered again
// on every run, so `npm run update:site` keeps it in step with this file and the data.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { find, hasClass, esc } from './html-edit.mjs';
import { contactPage } from './contact-page.mjs';
import { officePagePath, isNewPage, NEW_PAGES_ON } from './new-pages.mjs';
import { loadReviewWall } from './review-wall.mjs';
import { JOBS_TOTAL, statesServed } from './us-map.mjs';

const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
const LOGO = '/wp-content/uploads/2025/03/image-1-5.png';
// [label, address]. Pages added in the site restructure only when it is on (isNewPage).
const LISTS = [
  ['Services', [
    ['Roofing', '/roofing/'],
    ['Roof Replacement', '/roofing/replacement/'],
    ['Storm Damage', '/storm-damage/'],
    ['Solar Options', '/solar-options/'],
    ['Siding', '/siding/'],
    ['Gutters', '/gutters/'],
    ['Gutter Guards', '/gutters/gutter-guards/'],
  ]],
  ['Company', [
    ['About Us', '/about/'],
    ['Past Projects', '/past-projects/'],
    ['Reviews', '/reviews/'],
    ['Careers', '/careers/'],
    ['Charity & Community', '/charity-and-community/'],
    ['Blog & Podcast', '/media/'],
    ['Panda Shop', 'https://pandaexteriors.myshopify.com/'],
  ]],
  ['Help', [
    ['Contact Us', '/contact-us/'],
    ['Service Areas', '/service-areas/'],
    ['Offers', '/offers/'],
    ['Financing', '/financing/'],
    ['Warranty', '/warranty/'],
    ['FAQs', '/faqs/'],
    ['Refer & Earn', '/referrals/'],
  ]],
];
// (pages the site restructure adds: left out of the lists when it is off)
const NEW = ['/storm-damage/', '/solar-options/', '/financing/', '/warranty/'];
const shown = ([, href]) => !NEW.includes(href) || isNewPage(href);

const svg = (d, w = 2) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const PHONE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/></svg>';
const ARROW = svg('M5 12h14M13 6l6 6-6 6', 2.2);
const STAR = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 0 0 .95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 0 0-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 0 0-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 0 0-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 0 0 .95-.69z" fill="currentColor"/></svg>';
const PIN = svg('M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', 1.8);

const tel = (phone) => `tel:+1${phone.replace(/\D/g, '')}`;

// The license line under the lists: a number per state (custom/site-fixes/licenses.json).
// A state whose number has not been supplied yet says TODO, so nothing unverified is
// published as a license number.
let licenseData;
const licenses = () => (licenseData ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'custom', 'site-fixes', 'licenses.json'), 'utf8')));
function licenseLine() {
  const { label, items = [] } = licenses();
  if (!items.length) return '';
  const item = (l) =>
    `<span class="pfix-ft__license" role="listitem">${esc(l.label)} #${l.number ? esc(l.number) : '<span class="pfix-ft__todo" data-todo="license">TODO</span>'}</span>`;
  return `<div class="pfix-ft__licenses"><span class="pfix-ft__licenses-label">${esc(label)}</span><span class="pfix-ft__licenses-list" role="list" aria-label="Contractor license numbers by state">${items.map(item).join('')}</span></div>`;
}

/** The footer's upper part, with the page's own social links (`social`: their markup). */
export function renderFooter(social = '') {
  const { place } = loadReviewWall();
  const rating = Number(place.rating) || 5;
  const count = Number(place.count) || 0;
  const offices = contactPage().offices.items;
  const list = ([title, links]) =>
    `<nav class="pfix-ft__col" aria-label="${esc(title)}"><p class="pfix-ft__head">${esc(title)}</p>` +
    `<div class="pfix-ft__links" role="list">${links.filter(shown).map(([label, href]) => `<a role="listitem" href="${esc(href)}">${esc(label)}</a>`).join('')}</div></nav>`;
  const office = (o) => {
    const page = NEW_PAGES_ON ? officePagePath(o) : '';
    const name = `${esc(o.city)}, ${esc(o.state)}`;
    return (
      `<div class="pfix-ft__office" role="listitem">` +
      (page ? `<a class="pfix-ft__office-name" href="${esc(page)}">${name}</a>` : `<span class="pfix-ft__office-name">${name}</span>`) +
      (o.hq ? `<span class="pfix-ft__hq">HQ</span>` : '') +
      `<a class="pfix-ft__office-tel" href="${tel(o.phone)}">${esc(o.phone)}</a>` +
      `</div>`
    );
  };
  return (
    `<div class="pfix-ft">` +
    `<div class="pfix-ft__brand">` +
    `<a class="pfix-ft__logo" href="/" aria-label="Panda Exteriors home"><picture><source type="image/webp" srcset="${LOGO}.webp"><img src="${LOGO}" alt="Panda Exteriors" width="385" height="511" loading="lazy" decoding="async"></picture></a>` +
    `<p class="pfix-ft__about">Roofing, solar, siding and gutters from a GAF Master Elite contractor, with ${esc(JOBS_TOTAL.words)} jobs completed in ${esc(statesServed().sentence)}</p>` +
    `<a class="pfix-ft__rating" href="/reviews/"><span class="pfix-ft__stars">${STAR}<b>${esc(rating.toFixed(1))}</b></span>on Google${count ? ` · ${esc(count.toLocaleString('en-US'))} reviews` : ''}</a>` +
    `<div class="pfix-ft__ctas">` +
    `<a class="pfix-ft__btn pfix-ft__btn--call" href="${PHONE.href}">${PHONE_ICON}${PHONE.text}</a>` +
    `<a class="pfix-ft__btn pfix-ft__btn--estimate" href="/contact-us/">Free estimate${ARROW}</a>` +
    `</div>` +
    (social ? `<div class="pfix-ft__social">${social}</div>` : '') +
    `</div>` +
    LISTS.map(list).join('') +
    `<div class="pfix-ft__col pfix-ft__col--offices"><p class="pfix-ft__head">${PIN}Our offices</p>` +
    `<div class="pfix-ft__offices" role="list">${offices.map(office).join('')}</div></div>` +
    licenseLine() +
    `</div>`
  );
}

/** Every page's footer: its upper part -> renderFooter. Returns true if it changed. */
export function collectFooter(doc, html, ed, { pathname = '' } = {}, changes = []) {
  // (a <footer> on the home page: home-page.mjs)
  const footer = find(doc, (c) => ['div', 'footer'].includes(c.tagName) && hasClass(c, 'footer') && hasClass(c, 'bg-black'));
  const grid = footer && find(footer, (c) => hasClass(c, 'footer-grid'));
  if (!grid) return false;
  const loc = grid.sourceCodeLocation;
  if (ed.overlaps(loc.startOffset, loc.endOffset)) return false;
  // The page's social links (as delivered, or kept in an earlier build's footer).
  const box = find(grid, (c) => hasClass(c, 'pfix-ft__social')) || find(grid, (c) => hasClass(c, 'social-container'));
  const social = box ? html.slice(box.sourceCodeLocation.startTag.endOffset, box.sourceCodeLocation.endTag.startOffset).trim() : '';
  const out = renderFooter(social);
  const was = html.slice(loc.startTag.endOffset, loc.endTag.startOffset);
  if (was === out) return false;
  ed.inner(grid, out);
  changes.push(
    find(grid, (c) => hasClass(c, 'pfix-ft'))
      ? 'footer: rendered again'
      : 'footer: every service, the company and help pages, the seven offices with their phone numbers, the Google rating and call and estimate buttons (was three short lists that left out siding, past projects, careers and the offices)'
  );
  return true;
}
