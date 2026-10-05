// The two solar product pages: /solar/ (solar panels) and /solar/gaf-solar-roof/ (GAF solar
// shingles), the parts their other modules don't cover. Solar panels and solar shingles are
// different products, and the pages didn't say so: both heroes said "solar roofing", and the
// menu's only entry under Solar was "GAF Solar Roof". The page that shows both side by side
// is Solar Options (/solar-options/, new-pages.mjs); each product page is about its product.
//
//  - Both: their own title and description (as captured, /solar/ was "Solar Roofing Services"
//    and both had the same description), in the head, the social tags and the page's data.
//  - /solar/: its two cards, "Roof Solar Panel Installations" (one for panels, one for GAF
//    solar shingles), go: what solar panels are, beside a photo, opens its sections instead
//    (service-pages.mjs).
//  - /solar/gaf-solar-roof/: as captured, under the intro (text beside a photo) came "Why Use
//    GAF Solar Shingles?": white text on Panda lime over four white cards (hard to read), then
//    the project row and the testimonials, and nothing else. Now, built like the Gutter
//    Guards page (and with its styles, site-fixes.css .pfix-gg):
//     - the intro keeps its words, set as a label, heading and two paragraphs beside a
//       rounded photo;
//     - the benefits (the section's own heading, words and four cards) as white cards with
//       an icon each and dark text, on a light band;
//     - solar shingles and solar panels side by side: what each one is, a link to the
//       panels page and a button to Solar Options for the full comparison;
//     - how a solar shingle project works, in three steps;
//     - questions about solar shingles, answered from what the site says (this page, the
//       Solar page and the blog's "Solar Shingles vs. Traditional Solar Panels"), as
//       accordions, with FAQPage structured data;
//     - a "Not sure which is right for your home?" band, its second button to Solar Options;
//     - after the testimonials, the offers band the other service pages have
//       (offers-page.mjs; "Claim" picks the solar shingles in the page's form).
// The heroes are services-hero.mjs's; /solar/'s other sections are service-pages.mjs's,
// roofing-page.mjs's ("Our Process") and gutters-page.mjs's ("Why Choose Panda for Solar?").
//
// Applied by site-fixes.mjs; rendered again on every run (found by its own class).
import { attr, hasClass, esc, find, findAll, clean, textOf, headEndOffset } from './html-edit.mjs';
import { offersStripHtml } from './offers-page.mjs';

export const SOLAR_PATH = '/solar/';
export const SOLAR_SHINGLES_PATH = '/solar/gaf-solar-roof/';
// The page with both products and the full comparison (new-pages.mjs).
const SOLAR_OPTIONS_COMPARE = '/solar-options/#compare';
// The hero's estimate form (service-forms.mjs).
const FORM_ID = 'pfix-lead-1';
// Where the hero's "GAF solar shingles" chip leads (services-hero.mjs).
const BENEFITS_ID = 'solar-shingles';
// Each page's own title and description.
const HEADS = {
  [SOLAR_PATH]: {
    title: 'Solar Panel Installation | Panda Exteriors',
    description: 'Solar panels mounted on the roof you already have, designed around your energy use and budget. Get a free, no-obligation solar panel estimate from Panda Exteriors.',
  },
  [SOLAR_SHINGLES_PATH]: {
    title: 'GAF Timberline Solar Shingles | Panda Exteriors',
    description: 'GAF Timberline Solar shingles: a new roof that makes its own power, flush with the rest of the roof and with no panels on top. Installed by GAF Master Elite certified crews.',
  },
};

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  layers: line('M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5'),
  home: line('M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5'),
  wind: line('M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7'),
  shield: line('M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6'),
  roof: line('M3 11.5L12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5'),
  sun: line('M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5V4.5M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4'),
  check: line('M5 12.5l4.2 4.2L19 7'),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  plus: line('M12 5v14M5 12h14', 2.2),
};

// The page's own benefits section ("Why Use GAF Solar Shingles?").
const BENEFITS = {
  title: 'Why Use GAF Solar Shingles?',
  text: 'GAF solar shingles may be a new product to the market, but the brand itself has been around for decades. GAF is the gold standard for residential shingles, and they apply this level of caliber to their solar products as well. At Panda Exteriors, all our contractors are GAF Master Elite certified, and in many cases, we can install an entire roof in a day. While the benefits of solar are well known by this point, GAF solar shingles have a few additional advantages:',
  items: [
    ['layers', 'Easy Installation', 'Unlike traditional panels that sit on top of your existing roof, GAF solar shingles do not need to be mounted. You’ll avoid excessive holes being put into your roof.'],
    ['home', 'Curb Appeal', 'Big, clunky solar panels can often kill the aesthetic of your home. GAF’s product offers a visually seamless alternative.'],
    ['wind', 'Durability', 'These solar shingles are built to be strong, just as all GAF products are. They can even withstand winds up to 130 MPH.'],
    ['shield', 'Warranty Protection', 'You’ll receive the same best-in-class warranty for GAF solar shingles as you do for their other roofing products.'],
  ],
};
// Solar shingles and solar panels, side by side (this page's product first).
const COMPARE = [
  {
    icon: 'roof',
    name: 'GAF solar shingles',
    line: 'The roof itself makes power',
    points: ['Installed as part of a new roof', 'Lie flush with the rest of the roof, barely noticeable from the street', 'No racks, and no mounts drilled into the roof deck'],
    here: true,
  },
  {
    icon: 'sun',
    name: 'Solar panels',
    line: 'Mounted on your existing roof',
    points: ['Added to the roof you already have', 'Generally a lower cost per watt installed', 'The most power per square foot, for smaller or partly shaded roofs'],
    link: ['/solar/', 'Explore solar panels'],
  },
];
const STEPS = [
  ['Free solar estimate', 'We look at your roof, how much sun it gets and how much energy you use, and give you a clear, no-obligation quote.'],
  ['A new roof and solar in one', 'Our GAF Master Elite certified crew installs the solar shingles as part of your new GAF roof, with no racks mounted on top.'],
  ['Clean power, protected', 'Your new roof makes clean power for your home, backed by GAF’s best-in-class warranty and our team’s support.'],
];
const FAQ = [
  ['What’s the difference between solar shingles and solar panels?', 'Solar panels are mounted on racks on top of your existing roof. GAF solar shingles are the roof itself: they lie flush with the rest of the roof and make power, installed as part of a new roof. We install both and will help you choose.'],
  ['Do I need a new roof to get solar shingles?', 'GAF Timberline Solar shingles are installed as part of a full roof replacement, which makes them a cost-effective choice when your roof is nearing the end of its life: you take care of your roof and solar in one project. If your roof is in good shape, solar panels may suit you better.'],
  ['How much power do solar shingles make?', 'It depends on your roof’s size and how much sun it gets. Panels make a little more power per square foot, so shingles need more roof area for the same output: they suit medium to large roofs with open sun. The GAF Timberline Solar roof we installed below makes about 7 kW.'],
  ['How durable are GAF solar shingles?', 'They’re built to be strong, just as all GAF products are, and designed to handle wind, rain, hail and snow. They can even withstand winds up to 130 MPH.'],
  ['What warranty comes with them?', 'You’ll receive the same best-in-class warranty for GAF solar shingles as you do for GAF’s other roofing products, with one manufacturer behind both the roof and the solar.'],
  ['Can I finance a solar roof?', 'Yes. Talk to us about the financing options for your project at your free estimate, and ask about $1,500 off your solar project.'],
];

const head = (id, eyebrow, title, text = '') =>
  `<div class="pfix-gg__head"><p class="pfix-gg__eyebrow">${esc(eyebrow)}</p>` +
  `<h2 class="pfix-gg__title" id="${id}">${esc(title)}</h2>${text ? `<p class="pfix-gg__sub">${esc(text)}</p>` : ''}</div>`;

function sectionsHtml() {
  const benefits =
    `<section class="pfix-gg__sec" id="${BENEFITS_ID}" aria-labelledby="pfix-ss-benefits"><div class="pfix-gg__inner">` +
    head('pfix-ss-benefits', 'Why solar shingles', BENEFITS.title, BENEFITS.text) +
    `<div class="pfix-gg-benefits" role="list">` +
    BENEFITS.items
      .map(([icon, title, text]) => `<div class="pfix-gg-benefit" role="listitem"><span class="pfix-gg-benefit__icon">${ICONS[icon]}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`)
      .join('') +
    `</div></div></section>`;
  const compare =
    `<section class="pfix-gg__sec pfix-ss-compare" aria-labelledby="pfix-ss-compare"><div class="pfix-gg__inner">` +
    head('pfix-ss-compare', 'Know the difference', 'Solar Shingles or Solar Panels?', 'They are two different products, and we install both.') +
    `<div class="pfix-ss-options" role="list">` +
    COMPARE.map(
      (o) =>
        `<div class="pfix-ss-option${o.here ? ' pfix-ss-option--here' : ''}" role="listitem">` +
        `<div class="pfix-ss-option__top"><span class="pfix-ss-option__icon">${ICONS[o.icon]}</span>` +
        `<h3>${esc(o.name)}<span>${esc(o.line)}</span></h3></div>` +
        `<div class="pfix-ss-option__list" role="list">${o.points.map((p) => `<div role="listitem">${ICONS.check}<span>${esc(p)}</span></div>`).join('')}</div>` +
        (o.here ? `<p class="pfix-ss-option__here">You’re on this page</p>` : `<a class="pfix-ss-option__link" href="${esc(o.link[0])}">${esc(o.link[1])}${ICONS.arrow}</a>`) +
        `</div>`
    ).join('') +
    `</div><p class="pfix-ss-more"><a class="pfix-gg-btn pfix-gg-btn--outline" href="${SOLAR_OPTIONS_COMPARE}">Compare all solar options${ICONS.arrow}</a></p></div></section>`;
  const steps =
    `<section class="pfix-gg__sec pfix-gg__sec--steps" aria-labelledby="pfix-ss-steps"><div class="pfix-gg__inner">` +
    head('pfix-ss-steps', 'How it works', 'How Your Solar Roof Project Works') +
    `<div class="pfix-gg-steps" role="list">` +
    STEPS.map(
      ([title, text], i) =>
        `<div class="pfix-gg-step" role="listitem"><span class="pfix-gg-step__n" aria-hidden="true">${i + 1}</span>` +
        `<h3><span class="pfix-gg-sr">Step ${i + 1}: </span>${esc(title)}</h3><p>${esc(text)}</p></div>`
    ).join('') +
    `</div></div></section>`;
  const faq =
    `<section class="pfix-gg__sec" aria-labelledby="pfix-ss-faq"><div class="pfix-gg__inner pfix-gg__inner--narrow">` +
    head('pfix-ss-faq', 'Questions', 'Solar Shingle Questions, Answered') +
    `<div class="pfix-gg-faq">` +
    FAQ.map(([q, a]) => `<details class="pfix-gg-faq__item"><summary>${esc(q)}<span class="pfix-gg-faq__icon">${ICONS.plus}</span></summary><p>${esc(a)}</p></details>`).join('') +
    `</div></div></section>`;
  const band =
    `<section class="pfix-gg-band" aria-labelledby="pfix-ss-band"><div class="pfix-gg__inner pfix-gg-band__inner">` +
    `<div><h2 class="pfix-gg-band__title" id="pfix-ss-band">Not sure which is right for your home?</h2>` +
    `<p class="pfix-gg-band__text">At your free solar estimate we’ll look at your roof and your energy use, and help you choose between GAF solar shingles and solar panels.</p></div>` +
    `<div class="pfix-gg-band__btns"><a class="pfix-gg-btn pfix-gg-btn--light" href="#${FORM_ID}">Get a free estimate${ICONS.arrow}</a>` +
    `<a class="pfix-gg-btn pfix-gg-btn--outline" href="${SOLAR_OPTIONS_COMPARE}">Compare solar options</a></div>` +
    `</div></section>`;
  return `<div class="pfix-gg pfix-gg--solar">${benefits}${compare}${steps}${faq}${band}</div>`;
}

const faqLd = (url) =>
  `<script type="application/ld+json" data-pfix-ss-ld>${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(url ? { url } : {}),
    mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }).replace(/</g, '\\u003c')}</script>`;

// The page's title and description: the title, its social and structured-data copies, and the
// descriptions.
function solarHead(doc, html, ed, pathname, changes) {
  const want = HEADS[pathname];
  if (!want) return false;
  let n = 0;
  const set = (node, value) => {
    const l = node.sourceCodeLocation;
    if (attr(node, 'content') === value || ed.overlaps(l.startOffset, l.endOffset)) return;
    ed.retag(node, node.attrs.map((a) => (a.name === 'content' ? { name: 'content', value } : a)));
    n++;
  };
  const title = find(doc, (c) => c.tagName === 'title');
  if (title && clean(textOf(title)) !== want.title && !ed.overlaps(title.sourceCodeLocation.startOffset, title.sourceCodeLocation.endOffset)) {
    ed.inner(title, esc(want.title));
    n++;
  }
  for (const m of findAll(doc, (c) => c.tagName === 'meta')) {
    const key = attr(m, 'property') || attr(m, 'name');
    if (key === 'og:title' || key === 'twitter:title') set(m, want.title);
    else if (key === 'description' || key === 'og:description' || key === 'twitter:description') set(m, want.description);
  }
  // The page's own entry in its structured data (name and description).
  for (const script of findAll(doc, (c) => c.tagName === 'script' && attr(c, 'type') === 'application/ld+json' && hasClass(c, 'rank-math-schema-pro'))) {
    const text = (script.childNodes || []).map((t) => t.value || '').join('');
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      continue;
    }
    let edited = false;
    for (const item of data['@graph'] || []) {
      const types = [].concat(item['@type'] || []);
      if (!types.includes('WebPage') && !types.includes('Article')) continue;
      if (item.name !== undefined && item.name !== want.title) (item.name = want.title), (edited = true);
      if (item.headline !== undefined && item.headline !== want.title) (item.headline = want.title), (edited = true);
      if (item.description !== undefined && item.description !== want.description) (item.description = want.description), (edited = true);
    }
    const l = script.sourceCodeLocation;
    if (edited && !ed.overlaps(l.startTag.endOffset, l.endTag.startOffset)) {
      ed.inner(script, JSON.stringify(data).replace(/</g, '\\u003c'));
      n++;
    }
  }
  if (n) changes.push(`solar page head: title "${want.title}" and its own description`);
  return n > 0;
}

/** Both: the title and description; /solar/: its cards go; /solar/gaf-solar-roof/: the intro's class, the sections, the offers band. */
export function collectSolarPages(doc, html, ed, { pathname = '', siteDir = '', siteOrigin = '' } = {}, changes = []) {
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);

  solarHead(doc, html, ed, pathname, changes);
  if (pathname === SOLAR_PATH) {
    // Its two cards (one per product), as captured or as the services grid made them.
    const cards = find(doc, (c) => c.tagName === 'div' && hasClass(c, 'Team-section') && !!find(c, (x) => hasClass(x, 'pfix-svc-grid') || hasClass(x, 'Service-cards')));
    if (cards && free(cards)) {
      ed.outer(cards, '');
      changes.push('solar page: the cards for both products go (the Solar Options page shows both); what solar panels are opens its sections instead');
    }
    return true;
  }
  if (pathname !== SOLAR_SHINGLES_PATH) return false;
  let done = false;

  // The intro: text beside a photo, styled by its class (with the Gutter Guards page's).
  const intro = find(doc, (c) => c.tagName === 'div' && hasClass(c, 'Service-container') && !!find(c, (x) => hasClass(x, 'Flex-text')));
  const introClasses = ['pfix-gg-intro', 'pfix-ss-intro'];
  if (intro && !introClasses.every((k) => hasClass(intro, k))) {
    const l = intro.sourceCodeLocation.startTag;
    if (!ed.overlaps(l.startOffset, l.endOffset)) {
      const add = introClasses.filter((k) => !hasClass(intro, k)).join(' ');
      ed.retag(intro, intro.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: `${a.value} ${add}` } : a)));
      done = true;
    }
  } else if (intro) done = true;

  // The benefits band (as captured) or the sections an earlier build made.
  const block = sectionsHtml();
  const built = find(doc, (c) => hasClass(c, 'pfix-gg--solar'));
  const old = built || find(doc, (c) => c.tagName === 'div' && hasClass(c, 'roofers-section') && !!find(c, (x) => hasClass(x, 'Roof-grid')));
  if (old && free(old)) {
    const { startOffset, endOffset } = old.sourceCodeLocation;
    if (html.slice(startOffset, endOffset) !== block) {
      ed.outer(old, block);
      changes.push('solar shingles page: the benefits as icon cards (was white on lime), solar shingles and panels side by side, how it works, questions and a "Not sure which is right for your home?" band');
    }
    done = true;
  }

  // The questions' structured data.
  const ld = faqLd(siteOrigin ? siteOrigin + pathname : '');
  const oldLd = find(doc, (c) => c.tagName === 'script' && attr(c, 'data-pfix-ss-ld') !== undefined);
  if (oldLd) {
    const { startOffset, endOffset } = oldLd.sourceCodeLocation;
    if (html.slice(startOffset, endOffset) !== ld && free(oldLd)) ed.outer(oldLd, ld);
  } else {
    const headEnd = headEndOffset(html);
    if (headEnd >= 0 && !ed.overlaps(headEnd, headEnd)) ed.replace(headEnd, headEnd, ld);
  }

  // The offers band, after the testimonials (once; offers-page.mjs renders it again after).
  if (!find(doc, (c) => attr(c, 'data-pfix-offers-strip') !== undefined)) {
    const reviews = findAll(doc, (c) => c.tagName === 'div' && hasClass(c, 'Client-Logo-section'))[0];
    const at = reviews?.sourceCodeLocation.endOffset;
    if (at !== undefined && !ed.overlaps(at, at)) {
      ed.replace(at, at, offersStripHtml(doc, { siteDir, pathname }));
      changes.push('solar shingles page: the offers band added after the testimonials');
      done = true;
    }
  }
  return done;
}
