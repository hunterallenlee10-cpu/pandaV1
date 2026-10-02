// The Refer & Earn page (/referrals/), rebuilt around the Panda Exteriors app.
//
// On the live site the page is Panda's GetTheReferral sign-up laid over the whole page; in
// this copy that became a short "online referrals aren't switched on yet, please call"
// note, so the page explained nothing. Referrals are sent from the Panda Exteriors app, so
// the page now explains the program and sends people to the app:
//  - hero: a headline and line about the program, "Download on the App Store" and "Get it
//    on Google Play" buttons, on computers a QR code for each store (drawn as SVG when the
//    page is built, so a phone's camera opens the store), and a phone showing the Panda
//    logo and four reward notifications (drawn in HTML and CSS around the logo already on
//    the site);
//  - what you can earn: $25 for downloading the app, $50 when a referral is qualified,
//    $150 when they buy and a $200 bonus for every three sold, with a worked example;
//  - how it works, in three steps (the company code the live page shows is in the first);
//  - a closing band with the store buttons (and, on computers, the QR codes) again and the
//    phone number.
// The amounts and the store links are the ones on Panda's live GetTheReferral page (the
// $25 for downloading the app was added on request; bath referrals are left out, like
// Panda Bath). The page's description (search results and share cards) says the same.
//
// The words are in custom/site-fixes/referrals-page.json; edit them there and run
// `npm run update:site`. Applied by site-fixes.mjs; the page is rendered again on every run
// (found by its own class on a page an earlier build changed).
import fs from 'node:fs';
import path from 'node:path';
import qrcode from 'qrcode-generator';
import { ROOT } from './config.mjs';
import { attr, hasClass, esc, find, findAll } from './html-edit.mjs';

export const REFERRALS_PATH = '/referrals/';
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// The Panda logo (the mascot over "Panda Exteriors"), already on the site.
const LOGO = { src: '/wp-content/uploads/2025/07/bighead-274x300.png', src2x: '/wp-content/uploads/2025/07/bighead-768x841.png', width: 274, height: 300 };

let data;
const referralsPage = () => (data ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'custom', 'site-fixes', 'referrals-page.json'), 'utf8')));

const svg = (body, box = '0 0 24 24') => `<svg viewBox="${box}" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  apple: svg('<path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>'),
  play: svg('<path fill="currentColor" d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"/>'),
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  download: line('M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14', 2.1),
  calendar: line('M4.5 6.5A1.5 1.5 0 0 1 6 5h12a1.5 1.5 0 0 1 1.5 1.5V19A1.5 1.5 0 0 1 18 20.5H6A1.5 1.5 0 0 1 4.5 19zM4.5 10h15M8.5 3v4M15.5 3v4M9 15l2 2 4-4'),
  home: line('M3 11.5L12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5'),
  star: line('M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z'),
  check: line('M5 12.5l4.5 4.5L19 7.5', 2.6),
};
const REWARD_ICONS = ['download', 'calendar', 'home', 'star'];
const money = (n) => `$${Number(n).toLocaleString('en-US')}`;

function storeButtons(where) {
  const { apps } = referralsPage();
  const btn = (href, icon, small, big, store) =>
    `<a class="pfix-rf-store" href="${esc(href)}" target="_blank" rel="noopener" data-store="${store}" aria-label="${esc(`${small} ${big}`)} (opens in a new tab)">` +
    `${ICONS[icon]}<span><small>${esc(small)}</small><b>${esc(big)}</b></span></a>`;
  return (
    `<div class="pfix-rf-stores pfix-rf-stores--${where}">` +
    btn(apps.ios, 'apple', 'Download on the', 'App Store', 'ios') +
    btn(apps.android, 'play', 'Get it on', 'Google Play', 'android') +
    `</div>`
  );
}

// A QR code as an SVG: one square per dark module, with the 4-module quiet zone scanners need.
function qrSvg(url, label) {
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
  return (
    `<svg class="pfix-rf-qr__code" viewBox="0 0 ${n + 8} ${n + 8}" role="img" aria-label="${esc(label)}" shape-rendering="crispEdges">` +
    `<rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#14180f"/></svg>`
  );
}

// The two QR codes, for people on a computer (site-fixes.css shows them only there).
function qrCodes(where) {
  const { apps, qr } = referralsPage();
  const code = (url, icon, store, phone) =>
    `<figure class="pfix-rf-qr__item">${qrSvg(url, `QR code: the Panda Exteriors app on ${store}`)}` +
    `<figcaption>${ICONS[icon]}<span><b>${esc(store)}</b>${esc(phone)}</span></figcaption></figure>`;
  return (
    `<div class="pfix-rf-qr pfix-rf-qr--${where}">` +
    `<p class="pfix-rf-qr__text"><b>${esc(qr.title)}</b> ${esc(qr.sub)}</p>` +
    `<div class="pfix-rf-qr__codes">` +
    code(apps.ios, 'apple', 'App Store', 'iPhone') +
    code(apps.android, 'play', 'Google Play', 'Android') +
    `</div></div>`
  );
}

function hero() {
  const { hero: h, rewards } = referralsPage();
  const [download, qualified, sold, bonus] = rewards.items;
  // The phone is a picture of the idea, so it is hidden from screen readers.
  const phone =
    `<div class="pfix-rf-phone" aria-hidden="true"><div class="pfix-rf-phone__screen">` +
    `<span class="pfix-rf-phone__notch"></span>` +
    `<img class="pfix-rf-phone__logo" src="${LOGO.src}" srcset="${LOGO.src} 1x, ${LOGO.src2x} 2x" alt="" width="${LOGO.width}" height="${LOGO.height}" decoding="async">` +
    `<span class="pfix-rf-phone__label">Refer &amp; Earn</span>` +
    `<span class="pfix-rf-phone__note"><i>${ICONS.check}</i><span><b>Welcome bonus</b>App downloaded</span><em>+${money(download.amount)}</em></span>` +
    `<span class="pfix-rf-phone__note"><i>${ICONS.check}</i><span><b>Referral qualified</b>Appointment booked</span><em>+${money(qualified.amount)}</em></span>` +
    `<span class="pfix-rf-phone__note"><i>${ICONS.check}</i><span><b>Referral sold</b>New roof</span><em>+${money(sold.amount)}</em></span>` +
    `<span class="pfix-rf-phone__note pfix-rf-phone__note--bonus"><i>${ICONS.star}</i><span><b>3 referrals sold</b>Bonus unlocked</span><em>+${money(bonus.amount)}</em></span>` +
    `</div></div>`;
  return (
    `<section class="pfix-rf-hero" aria-labelledby="pfix-rf-title"><div class="pfix-rf__inner pfix-rf-hero__inner">` +
    `<div class="pfix-rf-hero__text">` +
    `<p class="pfix-rf__eyebrow pfix-rf__eyebrow--light">${esc(h.eyebrow)}</p>` +
    `<h1 class="pfix-rf-hero__title" id="pfix-rf-title">${esc(h.title)}</h1>` +
    `<p class="pfix-rf-hero__sub">${esc(h.sub)}</p>` +
    storeButtons('hero') +
    qrCodes('hero') +
    `<p class="pfix-rf-hero__note">${esc(h.note)}</p>` +
    `</div>` +
    `<div class="pfix-rf-hero__media">${phone}</div>` +
    `</div></section>`
  );
}

function rewardsSection() {
  const { rewards } = referralsPage();
  const [download, qualified, sold, bonus] = rewards.items;
  const card = (r, i) =>
    `<div class="pfix-rf-reward${r.bonus ? ' pfix-rf-reward--bonus' : ''}" role="listitem">` +
    `<span class="pfix-rf-reward__icon">${ICONS[REWARD_ICONS[i]] || ''}</span>` +
    `<b class="pfix-rf-reward__amount">${money(r.amount)}</b>` +
    `<span class="pfix-rf-reward__title">${esc(r.title)}</span>` +
    `<span class="pfix-rf-reward__text">${esc(r.text)}</span>` +
    `</div>`;
  // Three friends who buy: the download reward, three qualified-and-sold referrals and one bonus.
  const total = download.amount + 3 * (qualified.amount + sold.amount) + bonus.amount;
  return (
    `<section class="pfix-rf__sec" id="earn" aria-labelledby="pfix-rf-earn-title"><div class="pfix-rf__inner">` +
    `<div class="pfix-rf__head">` +
    `<p class="pfix-rf__eyebrow">${esc(rewards.eyebrow)}</p>` +
    `<h2 class="pfix-rf__title" id="pfix-rf-earn-title">${esc(rewards.title)}</h2>` +
    `<p class="pfix-rf__sub">${esc(rewards.sub)}</p>` +
    `</div>` +
    `<div class="pfix-rf-rewards" role="list">${rewards.items.map(card).join('')}</div>` +
    `<p class="pfix-rf-example"><b>Refer three friends who buy and earn ${money(total)}:</b> ` +
    `${money(download.amount)} for the app, ${money(qualified.amount + sold.amount)} for each of the three and a ${money(bonus.amount)} bonus.</p>` +
    `</div></section>`
  );
}

function stepsSection() {
  const { steps, companyCode } = referralsPage();
  const step = (s, i) =>
    `<div class="pfix-rf-step" role="listitem"><span class="pfix-rf-step__num" aria-hidden="true">${i + 1}</span>` +
    `<b class="pfix-rf-step__title">${esc(s.title)}</b>` +
    `<span class="pfix-rf-step__text">${esc(s.text).replace('#code', `<strong>${esc(companyCode)}</strong>`)}</span></div>`;
  return (
    `<section class="pfix-rf__sec pfix-rf__sec--tint" id="how-it-works" aria-labelledby="pfix-rf-steps-title"><div class="pfix-rf__inner">` +
    `<div class="pfix-rf__head">` +
    `<p class="pfix-rf__eyebrow">${esc(steps.eyebrow)}</p>` +
    `<h2 class="pfix-rf__title" id="pfix-rf-steps-title">${esc(steps.title)}</h2>` +
    `</div>` +
    `<div class="pfix-rf-steps" role="list">${steps.items.map(step).join('')}</div>` +
    `</div></section>`
  );
}

function ctaSection() {
  const { cta } = referralsPage();
  return (
    `<section class="pfix-rf-cta" aria-labelledby="pfix-rf-cta-title"><div class="pfix-rf__inner pfix-rf-cta__inner">` +
    `<h2 class="pfix-rf-cta__title" id="pfix-rf-cta-title">${esc(cta.title)}</h2>` +
    `<p class="pfix-rf-cta__sub">${esc(cta.sub)}</p>` +
    storeButtons('cta') +
    qrCodes('cta') +
    `<p class="pfix-rf-cta__call">Questions about the program? <a href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a></p>` +
    `</div></section>`
  );
}

export const referralsPageHtml = () => `<div class="pfix-rf">${hero()}${rewardsSection()}${stepsSection()}${ctaSection()}</div>`;

/**
 * /referrals/: the page's content (the GetTheReferral sign-up as captured, the "not
 * connected yet" note or this page as an earlier build left it) becomes the Refer & Earn
 * page, and the page's description says what the program pays. Returns true if it changed.
 */
export function collectReferralsPage(doc, html, ed, { pathname = '' } = {}, changes = []) {
  if (pathname !== REFERRALS_PATH) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  const gtr = (x) => x.tagName === 'iframe' && /getthereferral\.com/.test(`${attr(x, 'src') || ''} ${attr(x, 'data-lazy-src') || ''}`);
  const content = (c) => gtr(c) || hasClass(c, 'pfix-referral-off');
  let done = false;

  // The page's own content container (the innermost one holding the sign-up or the note),
  // replaced whole so the sections can run the full width of the page.
  const box =
    find(doc, (c) => hasClass(c, 'pfix-rf')) ||
    findAll(doc, (c) => hasClass(c, 'oxy-container') && hasClass(c, 'container') && !!find(c, content)).pop();
  if (box && free(box)) {
    ed.outer(box, referralsPageHtml());
    changes.push('referrals page: the program explained ($25 for the app, $50 qualified, $150 sold, $200 bonus every 3) with App Store and Google Play links (was the live GetTheReferral sign-up)');
    done = true;
  }

  const { description } = referralsPage();
  for (const m of findAll(doc, (c) => c.tagName === 'meta' && ['description', 'og:description', 'twitter:description'].includes(attr(c, 'name') || attr(c, 'property')))) {
    if (attr(m, 'content') === description || !free(m)) continue;
    ed.retag(m, m.attrs.map((a) => (a.name === 'content' ? { name: 'content', value: description } : a)));
    done = true;
  }
  return done;
}
