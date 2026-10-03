// The Terms and Conditions page (/terms-and-conditions/), redesigned to match the rest of the site.
//
// As captured it was the Site Map page's layout: a heading, then the terms as one run of text
// the full width of the screen over a stray lime glow, and the two lists ("To participate,
// you must:", "By signing up, you confirm that you are:") white on white, so they showed as
// blank space. Now:
//  - a hero on the customer service page's dark green: the heading, a line, and the three
//    things most people come for (reply STOP, reply HELP, rates may apply) as cards;
//  - the terms in a white card on a light band, beside an "On this page" menu that follows
//    you down the page and a "Questions?" card (call, email). The opening paragraph (it names
//    the arbitration clause and class action waiver) is a "Please read carefully" notice,
//    each section is numbered, the lists show with check marks, and STOP and HELP look like
//    the words you type. A link to the Privacy Policy closes the card.
//
// The words are the page's own (custom/site-fixes/legal-pages.json, by page); edit them there
// and run `npm run update:site`. Applied by site-fixes.mjs; rendered again on every run
// (found by its own class).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { hasClass, esc, find } from './html-edit.mjs';

const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
const EMAIL = 'info@pandaexteriors.com';

let data;
const legalPages = () => (data ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'custom', 'site-fixes', 'legal-pages.json'), 'utf8')));

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  stop: line('M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7zM9 9l6 6M15 9l-6 6'),
  help: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.4 9.3a2.7 2.7 0 1 1 3.6 2.6c-.6.3-1 .8-1 1.5v.6M12 17v.1', 2),
  rates: line('M7 3.5h10A1.5 1.5 0 0 1 18.5 5v14a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5zM10.5 17.5h3M14.2 8.6c-.4-.7-1.2-1.1-2.2-1.1-1.3 0-2.2.7-2.2 1.6 0 2.2 4.6 1.2 4.6 3.4 0 .9-1 1.7-2.4 1.7-1.1 0-2-.5-2.4-1.3M12 6.3v1.2M12 14.2v1.2'),
  alert: line('M12 3.5 21.5 20h-19zM12 10v4.5M12 17.2v.1', 2),
  check: line('M5 12.5l4.2 4.2L19 7', 2.4),
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  mail: line('M3.5 6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5zM4 6.5l8 6 8-6'),
  shield: line('M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6'),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
};

const num = (i) => String(i + 1).padStart(2, '0');

// A paragraph (its words may carry <a>, <kbd>, <strong>: written by hand in the JSON) or a list.
const block = (b) =>
  Array.isArray(b)
    ? `<ul class="pfix-legal__list">${b.map((li) => `<li><span class="pfix-legal__check">${ICONS.check}</span><span>${li}</span></li>`).join('')}</ul>`
    : `<p>${b}</p>`;

function pageHtml(page) {
  const hero =
    `<section class="pfix-legal__hero" aria-labelledby="pfix-legal-title"><div class="pfix-legal__inner">` +
    `<p class="pfix-legal__eyebrow">${esc(page.eyebrow)}</p>` +
    `<h1 class="pfix-legal__title" id="pfix-legal-title">${esc(page.title)}</h1>` +
    `<p class="pfix-legal__sub">${esc(page.sub)}</p>` +
    `<ul class="pfix-legal__glance">` +
    page.glance
      .map(([icon, key, text]) => `<li><span class="pfix-legal__glance-icon">${ICONS[icon]}</span><span><b>${esc(key)}</b><small>${esc(text)}</small></span></li>`)
      .join('') +
    `</ul>` +
    `</div></section>`;

  const toc =
    `<nav class="pfix-legal__toc" aria-label="On this page"><p class="pfix-legal__toc-title">On this page</p><ol>` +
    page.sections.map((s, i) => `<li><a href="#${esc(s.id)}"><span>${num(i)}</span>${esc(s.title)}</a></li>`).join('') +
    `</ol></nav>`;
  const help =
    `<div class="pfix-legal__help"><p class="pfix-legal__help-title">Questions about these terms?</p>` +
    `<p class="pfix-legal__help-text">Our team is happy to help.</p>` +
    `<a class="pfix-legal__help-link pfix-legal__help-link--call" href="${PHONE.href}">${ICONS.phone}<span>${PHONE.text}</span></a>` +
    `<a class="pfix-legal__help-link" href="mailto:${EMAIL}">${ICONS.mail}<span>${EMAIL}</span></a>` +
    `</div>`;

  const notice =
    `<div class="pfix-legal__notice" role="note"><span class="pfix-legal__notice-icon">${ICONS.alert}</span>` +
    `<div><p class="pfix-legal__notice-title">${esc(page.notice.title)}</p><p>${page.notice.html}</p></div></div>`;
  const sections = page.sections
    .map(
      (s, i) =>
        `<section class="pfix-legal__sec" id="${esc(s.id)}" aria-labelledby="${esc(s.id)}-title">` +
        `<h2 class="pfix-legal__sec-title" id="${esc(s.id)}-title"><span class="pfix-legal__num">${num(i)}</span>${esc(s.title)}</h2>` +
        `<div class="pfix-legal__sec-body">${s.blocks.map(block).join('')}</div></section>`
    )
    .join('');
  const [relTitle, relText, relHref] = page.related;
  const related =
    `<a class="pfix-legal__related" href="${esc(relHref)}"><span class="pfix-legal__related-icon">${ICONS.shield}</span>` +
    `<span class="pfix-legal__related-text"><small>Related</small><b>${esc(relTitle)}</b><span>${esc(relText)}</span></span>` +
    `<span class="pfix-legal__related-arrow">${ICONS.arrow}</span></a>`;

  const body =
    `<div class="pfix-legal__body"><div class="pfix-legal__inner pfix-legal__layout">` +
    `<aside class="pfix-legal__side">${toc}${help}</aside>` +
    `<article class="pfix-legal__doc">${notice}${sections}${related}</article>` +
    `</div></div>`;
  return `<main class="pfix-legal">${hero}${body}</main>`;
}

/** /terms-and-conditions/: the hero, and the terms beside a menu of their sections. */
export function collectLegalPage(doc, html, ed, { pathname = '' } = {}, changes = []) {
  const page = legalPages()[pathname];
  if (!page) return false;
  const old =
    find(doc, (c) => hasClass(c, 'pfix-legal')) ||
    find(doc, (c) => c.tagName === 'div' && hasClass(c, 'site-map') && hasClass(c, 'oxy-container') && !!find(c, (x) => hasClass(x, 'privacy-para')));
  if (!old) return false;
  const { startOffset, endOffset } = old.sourceCodeLocation;
  if (ed.overlaps(startOffset, endOffset)) return false;
  const out = pageHtml(page);
  if (html.slice(startOffset, endOffset) !== out) {
    ed.outer(old, out);
    changes.push(`legal page: ${page.title}: a hero and the terms in numbered sections beside a menu (was full-width text with two invisible lists)`);
  }
  return true;
}
