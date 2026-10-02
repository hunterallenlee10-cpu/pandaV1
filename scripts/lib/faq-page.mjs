// The FAQ page (/faqs/): its hero and its questions, redesigned to match the rest of the site.
//
//  - Hero: "Frequently Asked Questions" and "Everything You Need to Know About Panda
//    Exteriors." over a photo of bare roof decking mid tear-off (preloaded as a 1,450 px PNG).
//    It now has a headline and a line, a search box that narrows the questions as you type
//    (site-fixes.js; hidden without JavaScript), a chip per topic with its number of
//    questions and a call link, over an aerial photo of a Panda solar-shingle roof
//    (faq-hero.webp, a 1,600 px copy of a 2,000 px photo already on the site). The lead form
//    beside it is unchanged.
//  - Questions: three blocks (About Us, Roofing, Solar), each a list of questions beside a
//    pale green panel showing one answer at a time (a second, phone-only copy of every
//    question and answer below them). It is now one section: a topic menu that follows you
//    down the page (the current topic highlighted) and a "Still have a question?" card with
//    call and estimate buttons, beside the questions grouped by topic, each group with its
//    icon, a line about it and a link to its service page, every question an accordion
//    (<details>, so it works without JavaScript). The three commercial roofing questions
//    are their own group. FAQPage structured data is added for search engines.
//
// The words are the page's own (custom/site-fixes/faq-page.json), with a missing full stop
// added; edit them there and run `npm run update:site`. Applied by site-fixes.mjs; both
// parts are rendered again on every run.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { attr, hasClass, classes, esc, find, findAll, headEndOffset } from './html-edit.mjs';

export const FAQ_PATH = '/faqs/';
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// The hero's estimate form (service-forms.mjs).
const FORM_ID = 'pfix-lead-1';
const SECTION_ID = 'faq-questions';
// The old hero photo, which the page preloads.
const OLD_HERO_PHOTO = '/wp-content/uploads/2025/03/Group-9550-1-1.png';

let data;
const faqPage = () => (data ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'custom', 'site-fixes', 'faq-page.json'), 'utf8')));

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  panda: line('M7.5 8.5a2.5 2.5 0 1 1-2.6-3.4M16.5 8.5a2.5 2.5 0 1 0 2.6-3.4M12 20c-4.4 0-7.5-2.9-7.5-6.6S7.6 6.5 12 6.5s7.5 3.2 7.5 6.9S16.4 20 12 20zM9.2 12.3v.1M14.8 12.3v.1M10.8 16h2.4'),
  roof: line('M3 11.5L12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5'),
  building: line('M4 21V4h11v17M15 9h5v12M2.5 21h19M7.5 8h2M7.5 12h2M7.5 16h2M11 8h1M11 12h1M11 16h1M17.5 13h0M17.5 17h0'),
  sun: line('M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5V4.5M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4'),
  search: line('M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zM16 16l5 5', 2.1),
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  chat: line('M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5zM9 9.2a3 3 0 1 1 3.8 2.9c-.5.2-.8.6-.8 1.1M12 14.4v.1'),
};
const groupId = (g) => `faq-${g.id}`;
const questionId = (g, i) => `faq-${g.id}-${i + 1}`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function heroText() {
  const { hero, groups } = faqPage();
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    `<p class="pfix-fq-hero__eyebrow">${esc(hero.eyebrow)}</p>` +
    `<h1 class="pfix-fq-hero__title">${esc(hero.title)}</h1>` +
    `<p class="pfix-fq-hero__sub">${esc(hero.sub)}</p>` +
    // Shown by site-fixes.js, which does the searching.
    `<form class="pfix-fq-search" role="search" action="#${SECTION_ID}" data-pfix-faq-search hidden>` +
    `<label class="pfix-fq-search__label" for="pfix-fq-search">Search the questions</label>` +
    `<span class="pfix-fq-search__box">${ICONS.search}` +
    `<input type="search" id="pfix-fq-search" name="q" placeholder="Search questions, e.g. “snow”" autocomplete="off" aria-controls="${SECTION_ID}">` +
    `</span></form>` +
    `<div class="pfix-fq-hero__topics" role="list" aria-label="Topics">` +
    groups
      .map((g) => `<a class="pfix-fq-hero__topic" role="listitem" href="#${groupId(g)}">${ICONS[g.icon] || ''}${esc(g.short || g.title)}<span>${g.items.length}</span></a>`)
      .join('') +
    `</div>` +
    `<p class="pfix-fq-hero__call">Can’t find your answer? <a href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a></p>`
  );
}

function questionsSection() {
  const { groups, help } = faqPage();
  const nav =
    `<nav class="pfix-fq__nav" aria-label="FAQ topics"><p class="pfix-fq__nav-title">Browse by topic</p><ul>` +
    groups
      .map(
        (g, i) =>
          `<li><a class="pfix-fq__nav-link${i === 0 ? ' is-current' : ''}" href="#${groupId(g)}" data-pfix-faq-nav="${groupId(g)}">` +
          `<span class="pfix-fq__nav-icon">${ICONS[g.icon] || ''}</span><span class="pfix-fq__nav-name">${esc(g.title)}</span>` +
          `<span class="pfix-fq__nav-count" data-pfix-faq-count="${groupId(g)}">${g.items.length}</span></a></li>`
      )
      .join('') +
    `</ul></nav>`;
  const helpCard =
    `<div class="pfix-fq__help"><span class="pfix-fq__help-icon">${ICONS.chat}</span>` +
    `<p class="pfix-fq__help-title">${esc(help.title)}</p><p class="pfix-fq__help-text">${esc(help.text)}</p>` +
    `<a class="pfix-fq__btn pfix-fq__btn--primary" href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a>` +
    `<a class="pfix-fq__btn pfix-fq__btn--ghost" href="#${FORM_ID}">Get a free estimate${ICONS.arrow}</a></div>`;
  const group = (g, gi) =>
    `<section class="pfix-fq__group" id="${groupId(g)}" aria-labelledby="${groupId(g)}-title" data-pfix-faq-group>` +
    `<header class="pfix-fq__group-head"><span class="pfix-fq__group-icon">${ICONS[g.icon] || ''}</span>` +
    `<div class="pfix-fq__group-text"><h2 class="pfix-fq__group-title" id="${groupId(g)}-title">${esc(g.title)}</h2>` +
    `<p class="pfix-fq__group-sub">${esc(g.text)} <span class="pfix-fq__group-count">${esc(plural(g.items.length, 'question', 'questions'))}</span></p></div>` +
    (g.link ? `<a class="pfix-fq__group-link" href="${esc(g.link[0])}">${esc(g.link[1])}${ICONS.arrow}</a>` : '') +
    `</header>` +
    `<div class="pfix-fq__list">` +
    g.items
      .map(
        ([q, a], i) =>
          `<details class="pfix-fq__item" id="${questionId(g, i)}"${gi === 0 && i === 0 ? ' open' : ''}>` +
          `<summary><span class="pfix-fq__q">${esc(q)}</span><span class="pfix-fq__toggle" aria-hidden="true"></span></summary>` +
          `<div class="pfix-fq__a"><p>${esc(a)}</p></div></details>`
      )
      .join('') +
    `</div></section>`;
  return (
    `<section class="pfix-fq" id="${SECTION_ID}" aria-label="Frequently asked questions" data-pfix-faq><div class="container pfix-fq__inner">` +
    `<aside class="pfix-fq__side">${nav}${helpCard}</aside>` +
    `<div class="pfix-fq__main">` +
    `<p class="pfix-fq__status" role="status" aria-live="polite" data-pfix-faq-status></p>` +
    groups.map(group).join('') +
    `<div class="pfix-fq__empty" data-pfix-faq-empty hidden><p class="pfix-fq__empty-title">No questions match your search.</p>` +
    `<p>Try another word, or call us at <a href="${PHONE.href}">${PHONE.text}</a> and we’ll answer it for you.</p></div>` +
    `</div></div></section>`
  );
}

const faqLd = (url) =>
  `<script type="application/ld+json" data-pfix-faq-ld>${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(url ? { url } : {}),
    mainEntity: faqPage().groups.flatMap((g) => g.items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))),
  }).replace(/</g, '\\u003c')}</script>`;

/**
 * /faqs/: the hero's text column, the questions (the three FAQ blocks as captured, or the
 * section an earlier build made) and the FAQPage structured data. Returns true if it
 * changed any of them.
 */
export function collectFaqPage(doc, html, ed, { pathname = '', siteOrigin } = {}, changes = []) {
  if (pathname !== FAQ_PATH) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  const { hero } = faqPage();
  let done = false;
  const headEnd = headEndOffset(html);
  const head = [];

  const heroBox = find(doc, (c) => hasClass(c, 'hero-section') && (hasClass(c, 'faq') || hasClass(c, 'pfix-fq-hero')));
  const text = heroBox && find(heroBox, (c) => hasClass(c, 'text-section'));
  if (text && free(text)) {
    if (!fs.existsSync(path.join(ROOT, 'custom', 'site-fixes', path.basename(hero.photo)))) {
      console.warn(`faq page: the hero photo ${hero.photo} is missing, hero left as is`);
    } else {
      if (!hasClass(heroBox, 'pfix-fq-hero')) {
        ed.retag(heroBox, heroBox.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: [...classes(heroBox), 'pfix-fq-hero'].join(' ') } : a)));
      }
      ed.inner(text, heroText());
      const preload = `<link rel="preload" as="image" type="image/webp" href="${hero.photo}" fetchpriority="high">`;
      if (!html.includes(preload)) head.push(preload);
      // The old hero photo, preloaded by the page, is no longer shown.
      for (const l of findAll(doc, (c) => c.tagName === 'link' && attr(c, 'rel') === 'preload' && attr(c, 'href') === OLD_HERO_PHOTO)) if (free(l)) ed.outer(l, '');
      changes.push('faq page hero: a headline, question search, topic chips and a call link over an aerial photo of a Panda solar roof (was "Frequently Asked Questions" over bare roof decking)');
      done = true;
    }
  }

  const own = find(doc, (c) => c.attrs?.some((a) => a.name === 'data-pfix-faq'));
  const blocks = own ? [own] : findAll(doc, (c) => hasClass(c, 'container') && c.childNodes?.some((k) => k.tagName && hasClass(k, 'Faq-container')));
  if (blocks.length && blocks.every(free)) {
    ed.outer(blocks[0], questionsSection());
    for (const b of blocks.slice(1)) ed.outer(b, '');
    const n = faqPage().groups.reduce((s, g) => s + g.items.length, 0);
    changes.push(
      own
        ? 'faq page questions: rendered again'
        : `faq page questions: ${blocks.length} question-and-panel blocks -> ${n} questions as accordions grouped by topic, with a topic menu, a help card and FAQPage structured data`
    );
    const ld = faqLd(siteOrigin ? siteOrigin + pathname : '');
    const old = find(doc, (c) => c.tagName === 'script' && c.attrs?.some((a) => a.name === 'data-pfix-faq-ld'));
    if (old) {
      if (free(old) && html.slice(old.sourceCodeLocation.startOffset, old.sourceCodeLocation.endOffset) !== ld) ed.outer(old, ld);
    } else head.push(ld);
    done = true;
  }
  if (head.length && headEnd >= 0) ed.replace(headEnd, headEnd, head.join(''));
  return done;
}
