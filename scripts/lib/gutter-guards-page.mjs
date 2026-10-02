// The Gutter Guards page (/gutters/gutter-guards/): its sections under the hero.
//
// As captured, under the intro (text beside a photo) came "Protect Your Home With Quality
// Gutter Guards": white text on Panda lime over four white cards with lime headings (both hard
// to read), then the testimonials and the "About Our Team" form. Now:
//  - the intro keeps its words, set as a label, heading and two paragraphs beside a rounded
//    photo (a class for site-fixes.css);
//  - the benefits (the page's own heading, line and four cards) as white cards with an icon each
//    and dark text, on a light band;
//  - how a gutter guard project works, in three steps;
//  - questions about gutter guards, answered from what the site says (this page, the Gutters
//    page and the offers' promises), as accordions;
//  - a "Need new gutters too?" band leading to the Gutters page;
//  - after the testimonials, the offers band the other service pages have (offers-page.mjs).
// The hero is services-hero.mjs's; the testimonials and the form are unchanged.
//
// Applied by site-fixes.mjs; rendered again on every run (found by its own class).
import { attr, hasClass, esc, find, findAll } from './html-edit.mjs';
import { offersStripHtml } from './offers-page.mjs';

export const GUARDS_PATH = '/gutters/gutter-guards/';
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// The hero's estimate form (service-forms.mjs).
const FORM_ID = 'pfix-lead-1';
// Where the hero's "Why gutter guards" chip leads.
const BENEFITS_ID = 'guard-benefits';

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  leaf: line('M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7'),
  bird: line('M4 13c3 0 5-2 6-5 2 3 5 4 9 3-1 4-4 7-9 7-3 0-5-1-6-2zM10 8l-1-3M14 18l-1 3'),
  drop: line('M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z'),
  ladder: line('M8 3v18M16 3v18M8 7h8M8 11h8M8 15h8M8 19h8'),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  plus: line('M12 5v14M5 12h14', 2.2),
};

// The page's own benefits section.
const BENEFITS = {
  title: 'Protect Your Home With Quality Gutter Guards',
  text: 'Gutter guards are something that many homeowners have never seen. Once you install them in your home, you will never go back. These guards prevent a whole list of problems that you’ve likely already dealt with. Without these frustrations, your life will be much smoother and worry-free.',
  items: [
    ['leaf', 'No Clogging', 'Guards seal off the top channel of your gutters, so leaves and debris have no way of gathering inside.'],
    ['bird', 'Pest Resistance', 'Without the channel, birds and squirrels cannot make nests.'],
    ['drop', 'Water Flow Control', 'Gutter guards have perforated holes that control how much water enters the gutters. This prevents overflowing.'],
    ['ladder', 'Reduces Maintenance', 'Without any clogging issues, you’ll no longer have to climb up on a ladder, or hire someone else, to clean out your gutters every year.'],
  ],
};
const STEPS = [
  ['Free estimate', 'We check your gutters, fascia and drainage and give you a clear estimate, at no cost.'],
  ['Guards for your gutters', 'We fit guards to the gutters you have, or install them with a new gutter system if yours are worn out.'],
  ['Installed by our certified team', 'Our trained and certified crew installs your guards, with a project manager keeping you updated along the way.'],
];
const FAQ = [
  ['What do gutter guards do?', 'Guards seal off the top channel of your gutters, so leaves and debris have no way of gathering inside. Their perforated holes control how much water enters the gutters, which prevents overflowing.'],
  ['Do gutter guards keep pests out?', 'Yes. Without the open channel, birds and squirrels cannot make nests in your gutters.'],
  ['Will I still have to clean my gutters?', 'Without clogging issues, you’ll no longer have to climb up on a ladder, or hire someone else, to clean out your gutters every year.'],
  ['Can you put guards on my existing gutters?', 'Yes. We can install gutter guards on the gutters you have, or with a new gutter system if yours are sagging, leaking or pulling away from the house.'],
  ['What warranty comes with them?', 'Our gutter guards come with the manufacturer’s warranty, and every project is backed by our 100% satisfaction guarantee and our installation warranty: if our workmanship proves faulty within two years of installation, we’ll correct it at no cost to you.'],
  ['Are you licensed and insured?', 'Yes, we’re fully licensed and insured, and our ownership team brings 30 years of combined experience in home remodeling.'],
];

const head = (id, eyebrow, title, text = '') =>
  `<div class="pfix-gg__head"><p class="pfix-gg__eyebrow">${esc(eyebrow)}</p>` +
  `<h2 class="pfix-gg__title" id="${id}">${esc(title)}</h2>${text ? `<p class="pfix-gg__sub">${esc(text)}</p>` : ''}</div>`;

function sectionsHtml() {
  const benefits =
    `<section class="pfix-gg__sec" id="${BENEFITS_ID}" aria-labelledby="pfix-gg-benefits"><div class="pfix-gg__inner">` +
    head('pfix-gg-benefits', 'Why gutter guards', BENEFITS.title, `${BENEFITS.text} The primary benefits of gutter protection guards include:`) +
    `<div class="pfix-gg-benefits" role="list">` +
    BENEFITS.items
      .map(([icon, title, text]) => `<div class="pfix-gg-benefit" role="listitem"><span class="pfix-gg-benefit__icon">${ICONS[icon]}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`)
      .join('') +
    `</div></div></section>`;
  const steps =
    `<section class="pfix-gg__sec pfix-gg__sec--steps" aria-labelledby="pfix-gg-steps"><div class="pfix-gg__inner">` +
    head('pfix-gg-steps', 'How it works', 'How Your Gutter Guard Project Works') +
    `<div class="pfix-gg-steps" role="list">` +
    STEPS.map(
      ([title, text], i) =>
        `<div class="pfix-gg-step" role="listitem"><span class="pfix-gg-step__n" aria-hidden="true">${i + 1}</span>` +
        `<h3><span class="pfix-gg-sr">Step ${i + 1}: </span>${esc(title)}</h3><p>${esc(text)}</p></div>`
    ).join('') +
    `</div></div></section>`;
  const faq =
    `<section class="pfix-gg__sec" aria-labelledby="pfix-gg-faq"><div class="pfix-gg__inner pfix-gg__inner--narrow">` +
    head('pfix-gg-faq', 'Questions', 'Gutter Guard Questions, Answered') +
    `<div class="pfix-gg-faq">` +
    FAQ.map(([q, a]) => `<details class="pfix-gg-faq__item"><summary>${esc(q)}<span class="pfix-gg-faq__icon">${ICONS.plus}</span></summary><p>${esc(a)}</p></details>`).join('') +
    `</div></div></section>`;
  const band =
    `<section class="pfix-gg-band" aria-labelledby="pfix-gg-band"><div class="pfix-gg__inner pfix-gg-band__inner">` +
    `<div><h2 class="pfix-gg-band__title" id="pfix-gg-band">Need new gutters too?</h2>` +
    `<p class="pfix-gg-band__text">If your gutters are sagging, leaking or pulling away from the house, we can replace them and add guards in one project.</p></div>` +
    `<div class="pfix-gg-band__btns"><a class="pfix-gg-btn pfix-gg-btn--light" href="/gutters/">Explore new gutters${ICONS.arrow}</a>` +
    `<a class="pfix-gg-btn pfix-gg-btn--outline" href="#${FORM_ID}">Get a free estimate</a></div>` +
    `</div></section>`;
  return `<div class="pfix-gg">${benefits}${steps}${faq}${band}</div>`;
}

/** /gutters/gutter-guards/: the intro's class, the sections and the offers band. */
export function collectGutterGuardsPage(doc, html, ed, { pathname = '', siteDir = '' } = {}, changes = []) {
  if (pathname !== GUARDS_PATH) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  let done = false;

  // The intro: text beside a photo, styled by its class.
  const intro = find(doc, (c) => c.tagName === 'div' && hasClass(c, 'Service-container') && !!find(c, (x) => hasClass(x, 'Flex-text')));
  if (intro && !hasClass(intro, 'pfix-gg-intro')) {
    const l = intro.sourceCodeLocation.startTag;
    if (!ed.overlaps(l.startOffset, l.endOffset)) {
      ed.retag(intro, intro.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: `${a.value} pfix-gg-intro` } : a)));
      done = true;
    }
  } else if (intro) done = true;

  // The benefits band (as captured) or the sections an earlier build made.
  const block = sectionsHtml();
  const built = find(doc, (c) => hasClass(c, 'pfix-gg'));
  const old = built || find(doc, (c) => c.tagName === 'div' && hasClass(c, 'roofers-section') && !!find(c, (x) => hasClass(x, 'Roof-grid')));
  if (old && free(old)) {
    const { startOffset, endOffset } = old.sourceCodeLocation;
    if (html.slice(startOffset, endOffset) !== block) {
      ed.outer(old, block);
      changes.push('gutter guards page: the benefits as icon cards (was white on lime), how it works, questions and a "Need new gutters too?" band');
    }
    done = true;
  }

  // The offers band, after the testimonials (once; offers-page.mjs renders it again after).
  if (!find(doc, (c) => attr(c, 'data-pfix-offers-strip') !== undefined)) {
    const reviews = findAll(doc, (c) => c.tagName === 'div' && hasClass(c, 'Client-Logo-section'))[0];
    const at = reviews?.sourceCodeLocation.endOffset;
    if (at !== undefined && !ed.overlaps(at, at)) {
      ed.replace(at, at, offersStripHtml(doc, { siteDir }));
      changes.push('gutter guards page: the offers band added after the testimonials');
      done = true;
    }
  }
  return done;
}
