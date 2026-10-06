// The Roof Types page (/roofing/types/): its sections under the hero.
//
// As captured, under the intro ("Roof Types and Materials", text and the Inc. 5000 badges
// beside a photo) came "Gorgeous Roofing Options for East Coast Homes": white text on Panda
// lime over three white cards with lime headings (both hard to read), naming asphalt shingles,
// metal roofing and flat roofs in a sentence each, with nothing to compare them by and no way
// to act on them. Then the projects row, the testimonials, the project gallery and the white
// version of "About Our Team". Now:
//  - the intro keeps its words, set as a label, heading and paragraphs beside a rounded photo
//    (a class for site-fixes.css);
//  - "Gorgeous Roofing Options for East Coast Homes" keeps its heading and paragraph over four
//    cards: the page's three options (in its own words) and GAF solar shingles, each with a
//    drawn swatch of the material, what sets it apart and what it's best for, and a link to
//    the page that says more. Each card has an id the hero's chips lead to;
//  - the four side by side in a table (how they look, how long they last, the upfront cost,
//    the roof they suit and what they're best for);
//  - how to choose, on charcoal green, with estimate and call buttons;
//  - "Whatever You Choose, It's Installed Right": GAF Master Elite, the upgraded warranties,
//    the one-day install and financing, as icon cards on Panda orange;
//  - roof type questions, as accordions (and FAQPage structured data), with a call band;
//  - after the testimonials, the offers band the other service pages have (offers-page.mjs);
//  - "About Our Team" gets the charcoal green it has on /roofing/ (the classes
//    /customer-service/'s estimate block uses, site-fixes.css).
// The words come from the page and from what the site already says elsewhere: /roofing/,
// /roofing-costs/, /commercial-roofing/, /solar-options/, /warranty/ and Panda's blog posts on
// how long a roof lasts and on roof warranties. No prices (every roof is different). The hero
// is services-hero.mjs's; the projects row, the testimonials and the gallery are unchanged.
//
// Applied by site-fixes.mjs; rendered again on every run (found by its own class).
import { attr, hasClass, classes, esc, find, findAll, headEndOffset } from './html-edit.mjs';
import { offersStripHtml } from './offers-page.mjs';

export const TYPES_PATH = '/roofing/types/';
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// The hero's estimate form (service-forms.mjs).
const FORM_ID = 'pfix-lead-1';
// Where the hero's chips lead.
export const TYPE_ANCHORS = { asphalt: 'asphalt-shingles', metal: 'metal-roofing', flat: 'flat-roofing', solar: 'solar-shingles' };
const COMPARE_ANCHOR = 'compare-roof-types';
// The intro's class (site-fixes.css), and "About Our Team"'s: the dark version's text and
// button colors, and the dark background and heading.
const INTRO_CLASS = 'pfix-rt-intro';
const ABOUT_CLASSES = ['pfix-about', 'pfix-cs-estimate'];

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  star: line('M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z'),
  clock: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2'),
  building: line('M4 21V4h11v17M15 9h5v12M2.5 21h19M7.5 8h2M7.5 12h2M7.5 16h2M11 8h1M11 12h1M11 16h1'),
  sun: line('M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5V4.5M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4'),
  coin: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM14.8 9.2c-.5-.8-1.5-1.3-2.8-1.3-1.7 0-2.8.8-2.8 2s1.2 1.7 2.8 2 2.8.9 2.8 2.1-1.1 2-2.8 2c-1.4 0-2.5-.6-3-1.5M12 6.3v1.6M12 16v1.7'),
  home: line('M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5'),
  swatch: line('M4 4h7v16H4zM11 8.5l5.5-3.2 3.5 6-9 5.2M7.5 16.5v.1'),
  storm: line('M7 15a5 5 0 1 1 1.6-9.7A6 6 0 0 1 20 9a4 4 0 0 1-1 7.9M13 13l-2.5 4h3L11 21'),
  badge: line('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.9L7 21l5-2.6 5 2.6-1.5-7.1M9.6 9l1.6 1.6L14.6 7.4'),
  shield: line('M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6'),
  bolt: line('M13 2.5L5 13.5h6l-1 8 8-11h-6z'),
  card: line('M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3 10h18M7 15h4'),
  check: line('M5 12.5l4.2 4.2L19 7', 2.2),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  info: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.5v.1', 2),
  swipe: line('M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4', 2),
  plus: line('M12 5v14M5 12h14', 2.2),
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
};

// A drawn swatch of each material, the top of its card (no photo of every type exists:
// a metal roof is not among Panda's project photos). Pattern ids are unique on the page.
const sw = (key, defs, body) =>
  `<svg class="pfix-rt-swatch__art" viewBox="0 0 480 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>${defs}</defs>${body}` +
  `<rect width="480" height="170" fill="url(#pfix-rt-${key}-shade)"/></svg>`;
const shade = (key, from, to) =>
  `<linearGradient id="pfix-rt-${key}-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`;
export const SWATCHES = {
  // Staggered rows of shingle tabs, in charcoal.
  asphalt: sw(
    'asphalt',
    `<pattern id="pfix-rt-asphalt-p" width="56" height="44" patternUnits="userSpaceOnUse">` +
      `<rect width="56" height="44" fill="#2d312c"/>` +
      `<rect x="1" y="1" width="26" height="20" rx="1.5" fill="#545a51"/><rect x="29" y="1" width="26" height="20" rx="1.5" fill="#4b5048"/>` +
      `<rect x="-13" y="23" width="26" height="20" rx="1.5" fill="#4e544b"/><rect x="15" y="23" width="26" height="20" rx="1.5" fill="#585e55"/><rect x="43" y="23" width="26" height="20" rx="1.5" fill="#4e544b"/>` +
      `<path d="M0 21.5h56M0 43.5h56" stroke="#20231f" stroke-width="2"/></pattern>` +
      shade('asphalt', 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.28)'),
    `<rect width="480" height="170" fill="url(#pfix-rt-asphalt-p)"/>`
  ),
  // Standing seams on dark steel.
  metal: sw(
    'metal',
    `<linearGradient id="pfix-rt-metal-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4c5a63"/><stop offset=".55" stop-color="#6f7f89"/><stop offset="1" stop-color="#3d4950"/></linearGradient>` +
      `<pattern id="pfix-rt-metal-p" width="48" height="170" patternUnits="userSpaceOnUse">` +
      `<rect x="0" width="3" height="170" fill="#c9d3d9" opacity=".55"/><rect x="3" width="3" height="170" fill="#28323a" opacity=".55"/>` +
      `<rect x="24" width="1" height="170" fill="#ffffff" opacity=".08"/></pattern>` +
      shade('metal', 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.22)'),
    `<rect width="480" height="170" fill="url(#pfix-rt-metal-g)"/><rect width="480" height="170" fill="url(#pfix-rt-metal-p)"/>`
  ),
  // A white membrane with welded seams, a rooftop unit and a drain.
  flat: sw(
    'flat',
    `<pattern id="pfix-rt-flat-p" width="480" height="48" patternUnits="userSpaceOnUse">` +
      `<rect width="480" height="48" fill="#eef1f3"/><path d="M0 46.5h480" stroke="#cdd5db" stroke-width="2"/><path d="M0 42.5h480" stroke="#dde3e8" stroke-width="1"/></pattern>` +
      shade('flat', 'rgba(255,255,255,0.15)', 'rgba(20,24,15,0.16)'),
    `<rect width="480" height="170" fill="url(#pfix-rt-flat-p)"/>` +
      `<rect x="318" y="34" width="96" height="62" rx="4" fill="#c4ccd2"/><rect x="318" y="34" width="96" height="10" rx="3" fill="#b1bac1"/>` +
      `<path d="M330 56h72M330 66h72M330 76h72M330 86h72" stroke="#9aa5ad" stroke-width="2"/>` +
      `<circle cx="120" cy="112" r="11" fill="#d5dce1"/><circle cx="120" cy="112" r="6" fill="#9aa5ad"/>`
  ),
  // Dark solar cells, flush in the roof, with a sheen.
  solar: sw(
    'solar',
    `<pattern id="pfix-rt-solar-p" width="40" height="34" patternUnits="userSpaceOnUse">` +
      `<rect width="40" height="34" fill="#121925"/><rect x="1.5" y="1.5" width="37" height="31" rx="1.5" fill="#1d2838"/>` +
      `<path d="M20 1.5v31M1.5 17h37" stroke="#2c3b52" stroke-width="1"/></pattern>` +
      `<linearGradient id="pfix-rt-solar-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".45" stop-color="#9fc3ff" stop-opacity=".16"/><stop offset=".6" stop-color="#ffffff" stop-opacity="0"/></linearGradient>` +
      shade('solar', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.25)'),
    `<rect width="480" height="170" fill="url(#pfix-rt-solar-p)"/><rect width="480" height="170" fill="url(#pfix-rt-solar-g)"/>`
  ),
};

// The roof types: the page's three options in its own words, and GAF solar shingles (from
// /solar-options/ and /solar/gaf-solar-roof/).
export const TYPES = [
  {
    key: 'asphalt',
    tag: ['star', 'Most popular'],
    kicker: 'Classic and cost-effective',
    name: 'Asphalt Shingles',
    text: 'Although a classic and standard option, asphalt shingles come in a range of colors, allowing you to customize the appearance of your home. For East Coast homes, asphalt shingles are a quality and cost-effective option.',
    points: [
      'GAF shingles in a wide range of colors and styles',
      'Dimensional architectural shingles, with better wind ratings than basic 3-tab',
      'Architectural shingles typically last 20 to 30 years',
      'GAF’s upgraded warranties, through a Master Elite contractor',
    ],
    best: 'Most homes: a quality roof at a great value',
    link: ['/roofing/replacement/', 'Roof replacement'],
  },
  {
    key: 'metal',
    tag: ['clock', 'Longest lasting'],
    kicker: 'Built for the long haul',
    name: 'Metal Roofing',
    text: 'Metal roofing for East Coast homes has become an increasingly popular option. It can last upwards of 50 years and has top-rated durability.',
    points: [
      'Designed to last up to twice as long as traditional shingles',
      'Top-rated durability through East Coast weather',
      'Costs more up front, with fewer replacements over the years',
      'Installed by a GAF Metal Certified contractor',
    ],
    best: 'Homeowners who plan to stay for many years',
    link: ['/roofing-costs/', 'What a new roof costs'],
  },
  {
    key: 'flat',
    tag: ['building', 'Flat & low-slope roofs'],
    kicker: 'For commercial-style roofs',
    name: 'Flat Roofing',
    text: 'If you own a commercial building or a commercial-style home, we also have flat roofing options, from affordable systems to the top of the range.',
    points: [
      'TPO: some of the best longevity of any flat rubber roof',
      'EPDM: the classic, affordable rubber roof',
      'Mod Bit: built-up asphalt layers for superior waterproofing',
      'PVC: lightweight, and seals out the weather securely',
    ],
    best: 'Commercial buildings and commercial-style homes',
    link: ['/commercial-roofing/', 'Commercial roofing'],
  },
  {
    key: 'solar',
    tag: ['sun', 'Makes its own power'],
    kicker: 'Your roof and your power source',
    name: 'GAF Solar Shingles',
    text: 'GAF Timberline Solar shingles lie flush with the rest of the roof: your roof and your power source in one install, to lower your energy bills.',
    points: [
      'Installed as part of a new roof, with no racks on top',
      'A low profile, barely noticeable from the street',
      'Built to withstand winds up to 130 MPH',
      'A 25-year warranty on power production',
    ],
    best: 'A roof that needs replacing soon, and lower energy bills',
    link: ['/solar/gaf-solar-roof/', 'GAF solar shingles'],
  },
];
// The section's own heading and paragraphs (the second, which led into the three cards, with
// GAF solar shingles too).
const OPTIONS = {
  title: 'Gorgeous Roofing Options for East Coast Homes',
  text: 'Not all homes benefit from standard roofing solutions. If you have a uniquely shaped residence, or you’d simply like a premium look, Panda Exteriors has an option for you. We offer reliable and affordable GAF products that come with best-in-class warranties, allowing you to feel completely confident in your roofing project.',
};
// Spanish tile is a project of Panda's, not a type the page offers.
const TILE = ['/blog/project/spanish-tile/', 'See the Spanish tile roof we installed'];

// Side by side. Lifespans from Panda's "How long does a roof really last?" (architectural
// shingles, rubber flat roofs) and the page (metal); the rest from the cards' sources.
const COMPARE = {
  rows: [
    ['Look', ['Classic, in a wide range of colors and dimensional styles', 'Clean lines and a sleek, modern look', 'A membrane you won’t see from the ground', 'Lies flush with the rest of the roof, barely noticeable from the street']],
    ['How long it lasts', ['20 to 30 years (architectural shingles)', 'Upwards of 50 years', '15 to 25 years (EPDM, TPO)', 'A 25-year warranty on power production']],
    ['Upfront cost', ['The most affordable', 'Higher than shingles, and designed to last up to twice as long', 'Depends on the system: EPDM is the affordable classic', 'The highest: a new roof and solar in one']],
    ['Roof shape', ['Sloped roofs', 'Sloped roofs', 'Flat and low-slope roofs', 'Sloped roofs with open sun']],
    ['Best for', TYPES.map((t) => t.best)],
  ],
  note: 'Lifespans are typical ranges: your climate, your attic’s ventilation and the quality of the installation all play a part.',
  read: ['/blog/how-long-does-a-roof-really-last/', 'How long does a roof really last?'],
};

// How to choose (from the cards, /roofing-costs/ and the blog's advice on shingles).
const CHOOSE = {
  title: 'How to Choose the Right Roof',
  text: 'Every home is different, and so is every homeowner’s plan for it. We’ll walk you through your options at your free estimate; these are the questions that matter most.',
  items: [
    ['coin', 'Your budget', 'Asphalt shingles cost the least up front. Metal and solar shingles cost more, and give it back in lifespan or in lower energy bills.'],
    ['clock', 'How long you’ll stay', 'Staying for decades? Metal is designed to last up to twice as long as shingles. Moving in a few years? New shingles add curb appeal for less.'],
    ['home', 'Your roof’s shape', 'Sloped roofs suit shingles, metal and solar shingles. Flat and low-slope roofs need a system made for them, like TPO or EPDM.'],
    ['swatch', 'The look you want', 'From classic shingle colors to the clean lines of metal, choose a roof that suits your home’s style, not one that looks like every other on the street.'],
    ['sun', 'Your energy goals', 'Want lower energy bills? GAF solar shingles turn your new roof into a power source, with no panels mounted on top.'],
    ['storm', 'East Coast weather', 'Wind, hail, snow and ice: we’ll recommend the shingles and materials with the wind and impact ratings your area needs.'],
  ],
  facts: [
    ['badge', 'GAF Master Elite'],
    ['shield', 'BBB A-rated'],
    ['card', 'Flexible financing'],
  ],
};

// Why Panda (from /roofing/'s questions, /warranty/ and /financing/).
const WHY = {
  title: 'Whatever You Choose, It’s Installed Right',
  text: 'Our accomplished East Coast roofing team has over 30 years of combined experience. When you hire us for your roofing project, you get:',
  items: [
    ['badge', 'GAF Master Elite contractors', 'A status held by less than 2% of roofing companies. Certified installers follow strict guidelines and complete ongoing training.', ['/about/', 'About us']],
    ['shield', 'Upgraded warranties', 'GAF’s upgraded warranties, like the Golden Pledge, are available only through Master Elite contractors like us.', ['/warranty/', 'Our warranties']],
    ['bolt', 'Installed in as little as one day', 'Our crews tear off the old roof, fix any damaged decking, install your new roof and clean up before they leave.', ['/roofing/replacement/', 'Roof replacement']],
    ['card', 'Flexible financing', 'Spread the cost through Service Finance, LLC. Homeowners may qualify for delayed payments and even no-interest loans.', ['/financing/', 'About financing']],
  ],
};

const FAQ = [
  ['What roofing materials do you install?', 'We offer a variety of roofing options from GAF, from asphalt shingles to metal roofing, as well as flat roofs and GAF Timberline Solar shingles. We’ll help you choose the best option for your home and budget.'],
  ['Is metal roofing worth the extra cost?', 'Traditional shingles are less expensive than metal roofing, but metal roofing is designed to last up to twice as long. If you plan to stay in your home for many years, the longer life can make it the better value.'],
  ['What’s the difference between 3-tab and architectural shingles?', 'Architectural shingles are thicker and dimensional, with better wind ratings than basic 3-tab shingles, and they typically come with longer warranties: 30 to 50 years, against 20 to 25 for 3-tab.'],
  ['How long does each type of roof last?', 'Architectural asphalt shingles typically last 20 to 30 years, metal roofing upwards of 50 years, and flat rubber roofs (EPDM, TPO) 15 to 25 years. Your climate, attic ventilation and the quality of the installation all play a part.'],
  ['Do I need a new roof for solar shingles?', 'Yes. GAF Timberline Solar shingles are installed as part of a full roof replacement, which makes them a cost-effective choice when your roof is nearing the end of its life. If your roof is in good shape, solar panels can be added to the roof you already have.'],
  ['Do you install flat roofs on homes?', 'Yes. If you own a commercial building or a commercial-style home, we also have flat roofing options: TPO, EPDM, Mod Bit and PVC.'],
  ['Does the roof type affect my warranty?', 'It can. Architectural shingles typically come with longer warranties than basic 3-tab shingles, and as a GAF Master Elite contractor we can offer GAF’s upgraded warranties, like the Golden Pledge.'],
  ['Can I finance my new roof?', 'Yes. Spread the cost with flexible financing through Service Finance, LLC. Homeowners may qualify for delayed payments and even no-interest loans.'],
];
const CTA = {
  title: 'Not sure which roof is right for you?',
  text: 'We’ll look at your roof, talk through your options and give you a free estimate. Ask about 10% off a roof replacement.',
};

const head = (id, eyebrow, title, text = '') =>
  `<div class="pfix-rt__head"><p class="pfix-rt__eyebrow">${esc(eyebrow)}</p>` +
  `<h2 class="pfix-rt__title" id="${id}">${esc(title)}</h2>${text ? `<p class="pfix-rt__sub">${esc(text)}</p>` : ''}</div>`;
const more = ([href, label], cls = 'pfix-rt-more') => `<a class="${cls}" href="${esc(href)}">${esc(label)}${ICONS.arrow}</a>`;
// On orange (the call band), the estimate button is white.
const buttons = (onOrange = false) =>
  `<div class="pfix-rt-ctas"><a class="pfix-rt-btn ${onOrange ? 'pfix-rt-btn--light' : 'pfix-rt-btn--primary'}" href="#${FORM_ID}">Get a free estimate${ICONS.arrow}</a>` +
  `<a class="pfix-rt-btn pfix-rt-btn--ghost" href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a></div>`;

function typesHtml() {
  const card = (t) =>
    `<article class="pfix-rt-type pfix-rt-type--${t.key}" id="${TYPE_ANCHORS[t.key]}" role="listitem" aria-labelledby="pfix-rt-type-${t.key}">` +
    `<div class="pfix-rt-swatch">${SWATCHES[t.key]}<span class="pfix-rt-swatch__tag">${ICONS[t.tag[0]]}${esc(t.tag[1])}</span></div>` +
    `<div class="pfix-rt-type__body">` +
    `<p class="pfix-rt-type__kicker">${esc(t.kicker)}</p>` +
    `<h3 class="pfix-rt-type__name" id="pfix-rt-type-${t.key}">${esc(t.name)}</h3>` +
    `<p class="pfix-rt-type__text">${esc(t.text)}</p>` +
    `<div class="pfix-rt-list" role="list">${t.points.map((p) => `<p role="listitem">${ICONS.check}<span>${esc(p)}</span></p>`).join('')}</div>` +
    `<p class="pfix-rt-type__best"><b>Best for</b>${esc(t.best)}</p>` +
    more(t.link) +
    `</div></article>`;
  return (
    `<section class="pfix-rt__sec pfix-rt__sec--cream" id="roof-types" aria-labelledby="pfix-rt-types"><div class="pfix-rt__inner">` +
    head('pfix-rt-types', 'Your roofing options', OPTIONS.title, OPTIONS.text) +
    `<div class="pfix-rt-types" role="list">${TYPES.map(card).join('')}</div>` +
    `<div class="pfix-rt-types__foot"><p>Have a tile roof? ${more(TILE, 'pfix-rt-inline')}</p>` +
    `<a class="pfix-rt-btn pfix-rt-btn--outline" href="#${COMPARE_ANCHOR}">Compare them side by side${ICONS.arrow}</a></div>` +
    `</div></section>`
  );
}

function compareHtml() {
  const cols = TYPES.map((t) => `<th scope="col"><a href="#${TYPE_ANCHORS[t.key]}"><span class="pfix-rt-dot pfix-rt-dot--${t.key}" aria-hidden="true"></span>${esc(t.name)}</a></th>`).join('');
  const rows = COMPARE.rows
    .map(([label, cells], i) => `<tr${i === COMPARE.rows.length - 1 ? ' class="pfix-rt-compare__best"' : ''}><th scope="row">${esc(label)}</th>${cells.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('');
  return (
    `<section class="pfix-rt__sec" id="${COMPARE_ANCHOR}" aria-labelledby="pfix-rt-compare"><div class="pfix-rt__inner">` +
    head('pfix-rt-compare', 'Side by side', 'Compare Roof Types at a Glance', 'Each roof has its strengths: the right choice comes down to your home, your budget and how long you plan to stay.') +
    `<p class="pfix-rt-compare__hint">${ICONS.swipe}Swipe the table to see all four</p>` +
    `<div class="pfix-rt-compare" role="region" aria-labelledby="pfix-rt-compare" tabindex="0">` +
    `<table class="pfix-rt-compare__table"><thead><tr><td></td>${cols}</tr></thead><tbody>${rows}</tbody></table></div>` +
    `<p class="pfix-rt-compare__note">${ICONS.info}<span>${esc(COMPARE.note)} ${more(COMPARE.read, 'pfix-rt-inline')}</span></p>` +
    `</div></section>`
  );
}

function chooseHtml() {
  return (
    `<section class="pfix-rt-choose" aria-labelledby="pfix-rt-choose"><div class="pfix-rt__inner">` +
    `<div class="pfix-rt-choose__intro">` +
    `<p class="pfix-rt__eyebrow pfix-rt__eyebrow--light">Choosing your roof</p>` +
    `<h2 class="pfix-rt__title" id="pfix-rt-choose">${esc(CHOOSE.title)}</h2>` +
    `<p class="pfix-rt__sub">${esc(CHOOSE.text)}</p>` +
    `<div class="pfix-rt-facts" role="list">${CHOOSE.facts.map(([icon, text]) => `<span role="listitem">${ICONS[icon]}${esc(text)}</span>`).join('')}</div>` +
    buttons() +
    `</div>` +
    `<div class="pfix-rt-choose__grid" role="list">` +
    CHOOSE.items.map(([icon, title, text]) => `<div class="pfix-rt-factor" role="listitem"><span class="pfix-rt-factor__icon">${ICONS[icon]}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`).join('') +
    `</div></div></section>`
  );
}

function whyHtml() {
  return (
    `<section class="pfix-rt__sec pfix-rt__sec--orange" aria-labelledby="pfix-rt-why"><div class="pfix-rt__inner">` +
    head('pfix-rt-why', 'Why Panda Exteriors', WHY.title, WHY.text) +
    `<div class="pfix-rt-cards" role="list">` +
    WHY.items
      .map(([icon, title, text, link]) => `<div class="pfix-rt-card" role="listitem"><span class="pfix-rt-card__icon">${ICONS[icon]}</span><h3>${esc(title)}</h3><p>${esc(text)}</p>${more(link)}</div>`)
      .join('') +
    `</div></div></section>`
  );
}

function faqHtml() {
  return (
    `<section class="pfix-rt__sec" id="roof-type-questions" aria-labelledby="pfix-rt-faq"><div class="pfix-rt__inner pfix-rt__inner--narrow">` +
    head('pfix-rt-faq', 'Questions', 'Roof Type Questions, Answered') +
    `<div class="pfix-rt-faq">` +
    FAQ.map(([q, a]) => `<details class="pfix-rt-faq__item"><summary>${esc(q)}<span class="pfix-rt-faq__icon">${ICONS.plus}</span></summary><p>${esc(a)}</p></details>`).join('') +
    `</div>` +
    `<div class="pfix-rt-cta"><div><p class="pfix-rt-cta__title">${esc(CTA.title)}</p><p class="pfix-rt-cta__text">${esc(CTA.text)}</p></div>${buttons(true)}</div>` +
    `</div></section>`
  );
}

export const roofingTypesHtml = () => `<div class="pfix-rt">${typesHtml()}${compareHtml()}${chooseHtml()}${whyHtml()}${faqHtml()}</div>`;

const faqLd = (url) =>
  `<script type="application/ld+json" data-pfix-rt-ld>${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(url ? { url } : {}),
    mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }).replace(/</g, '\\u003c')}</script>`;

const withClasses = (n, add) => n.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: [...new Set([...classes(n), ...add])].join(' ') } : a));

/** /roofing/types/: the intro's class, the sections, the offers band and "About Our Team"'s colors. */
export function collectRoofingTypesPage(doc, html, ed, { pathname = '', siteDir = '', siteOrigin = '' } = {}, changes = []) {
  if (pathname !== TYPES_PATH) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  const freeTag = (n) => !ed.overlaps(n.sourceCodeLocation.startTag.startOffset, n.sourceCodeLocation.startTag.endOffset);
  let done = false;

  // The intro: text and badges beside a photo, styled by its class.
  const intro = find(doc, (c) => c.tagName === 'div' && hasClass(c, 'Service-container') && !!find(c, (x) => hasClass(x, 'Flex-text')));
  if (intro) {
    if (!hasClass(intro, INTRO_CLASS) && freeTag(intro)) {
      ed.retag(intro, withClasses(intro, [INTRO_CLASS]));
      changes.push('roof types page: the intro as a label, heading and paragraphs beside a rounded photo');
    }
    done = true;
  }

  // "Gorgeous Roofing Options" (as captured) or the sections an earlier build made.
  const block = roofingTypesHtml();
  const old = find(doc, (c) => hasClass(c, 'pfix-rt')) || find(doc, (c) => c.tagName === 'div' && hasClass(c, 'roofers-section') && !!find(c, (x) => hasClass(x, 'Roof-grid')));
  if (old && free(old)) {
    const { startOffset, endOffset } = old.sourceCodeLocation;
    if (html.slice(startOffset, endOffset) !== block) {
      ed.outer(old, block);
      changes.push('roof types page: four roof types (was three white cards on lime), side by side, how to choose, why Panda and questions');
    }
    done = true;
  }
  // The questions' structured data.
  const ld = faqLd(siteOrigin ? siteOrigin + TYPES_PATH : '');
  const oldLd = find(doc, (c) => c.tagName === 'script' && attr(c, 'data-pfix-rt-ld') !== undefined);
  if (oldLd) {
    if (free(oldLd) && html.slice(oldLd.sourceCodeLocation.startOffset, oldLd.sourceCodeLocation.endOffset) !== ld) ed.outer(oldLd, ld);
  } else if (done) {
    const headEnd = headEndOffset(html);
    if (headEnd >= 0 && !ed.overlaps(headEnd, headEnd)) ed.replace(headEnd, headEnd, ld);
  }

  // The offers band, after the testimonials (once; offers-page.mjs renders it again after).
  if (!find(doc, (c) => attr(c, 'data-pfix-offers-strip') !== undefined)) {
    const reviews = findAll(doc, (c) => c.tagName === 'div' && hasClass(c, 'Client-Logo-section'))[0];
    const at = reviews?.sourceCodeLocation.endOffset;
    if (at !== undefined && !ed.overlaps(at, at)) {
      ed.replace(at, at, offersStripHtml(doc, { siteDir, pathname }));
      changes.push('roof types page: the offers band added after the testimonials');
      done = true;
    }
  }

  // "About Our Team": the white version of the block, on charcoal green.
  const about = find(doc, (c) => c.tagName === 'div' && hasClass(c, 'Request-Container') && !hasClass(c, 'primary-bg'));
  if (about && !ABOUT_CLASSES.every((c) => hasClass(about, c)) && freeTag(about)) {
    ed.retag(about, withClasses(about, ABOUT_CLASSES));
    changes.push('roof types page about: "About Our Team" on charcoal green, like the other pages (was white)');
    done = true;
  }
  return done;
}
