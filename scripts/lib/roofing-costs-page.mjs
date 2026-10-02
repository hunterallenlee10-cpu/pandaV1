// The Roofing Costs page (/roofing-costs/): its sections under the hero.
//
// As captured, under the intro ("Cost of Roof Replacements", text beside a photo) came
// "Quality Roof Replacements": white text on Panda lime over three white cards with lime
// headings (both hard to read), then the testimonials and the "About Our Team" form. The page
// said what a roof costs nowhere, and nothing about insurance. Now:
//  - the intro keeps its words (with Panda Exteriors' name, not "Panda Contractors"), set as a
//    label, heading and paragraphs beside a rounded photo (a class for site-fixes.css);
//  - "What affects the cost of a new roof": six cards, no prices (every roof is different);
//  - "Quality Roof Replacements": the page's own paragraph and three cards, as icon cards;
//  - insurance roofing, on charcoal green: what storm damage insurance usually covers and
//    doesn't, how Panda helps from the inspection to the supplements (in four steps), that
//    Panda is the homeowner's roofing advocate and not a public adjuster, Panda's guides on
//    the blog, and buttons for a free storm-damage inspection;
//  - roofing cost questions, as accordions;
//  - after the testimonials, the offers band the other service pages have (offers-page.mjs).
// The words come from the page and from Panda's own blog posts on insurance claims. The hero
// is services-hero.mjs's; the testimonials and the form are unchanged.
//
// Applied by site-fixes.mjs; rendered again on every run (found by its own class).
import { attr, hasClass, esc, find, findAll } from './html-edit.mjs';
import { offersStripHtml } from './offers-page.mjs';

export const COSTS_PATH = '/roofing-costs/';
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// The hero's estimate form (service-forms.mjs).
const FORM_ID = 'pfix-lead-1';
// Where the hero's chips lead.
export const COST_ANCHOR = 'roof-cost';
export const INSURANCE_ANCHOR = 'insurance-claims';
const FINANCING = '/blog/offer/find-out-about-our-no-interest-financial-options/';
// The intro called the company by a name it doesn't use.
const NAME_FIX = ['Panda Contractors', 'Panda Exteriors'];

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  ruler: line('M3 17.5L17.5 3 21 6.5 6.5 21zM7 13.5l1.8 1.8M10 10.5l1.8 1.8M13 7.5l1.8 1.8'),
  layers: line('M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5'),
  deck: line('M3 11.5L12 4l9 7.5M5.5 9.5V20h13V9.5M9 13h6M9 16.5h6'),
  code: line('M9 3h6l1 3h3v15H5V6h3zM9 3v3h6M8.5 12.5l2.3 2.3 4.7-4.8'),
  badge: line('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.9L7 21l5-2.6 5 2.6-1.5-7.1M9.6 9l1.6 1.6L14.6 7.4'),
  shield: line('M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6'),
  bolt: line('M13 2.5L5 13.5h6l-1 8 8-11h-6z'),
  swatch: line('M4 4h7v16H4zM11 8.5l5.5-3.2 3.5 6-9 5.2M7.5 16.5v.1'),
  card: line('M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3 10h18M7 15h4'),
  check: line('M5 12.5l4.2 4.2L19 7', 2.2),
  cross: line('M6.5 6.5l11 11M17.5 6.5l-11 11', 2.2),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  book: line('M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z'),
  info: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.5v.1', 2),
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  plus: line('M12 5v14M5 12h14', 2.2),
};

// What goes into the price (no prices: every roof is different).
const FACTORS = [
  ['ruler', 'Size and pitch', 'The bigger and steeper the roof, the more materials and labor it takes to replace it.'],
  ['layers', 'Roofing material', 'Traditional shingles are less expensive than metal roofing, but metal roofing is designed to last up to twice as long.'],
  ['deck', 'What’s under the shingles', 'When the old roof comes off, any rotten or damaged decking underneath has to be replaced before the new roof goes on.'],
  ['code', 'Building code items', 'Ice and water barrier at the eaves and valleys, drip edge, proper ventilation and the right underlayment and flashing are required when a roof is replaced.'],
  ['badge', 'Who installs it', 'Choosing the cheaper option often costs more down the line. Our certified crews install to manufacturer specs, so you keep your warranty protection.'],
  ['shield', 'Insurance and financing', 'Storm damage may be covered by your homeowners insurance, and flexible financing can make the rest more affordable.'],
];
// The page's own "Quality Roof Replacements" band.
const QUALITY = {
  title: 'Quality Roof Replacements',
  text: 'Like with any purchase that you make, you pay for quality. And more often than not, choosing the cheaper option will end up costing you more down the line. The same principle applies to roofing materials and roofing companies. By working with the top East Coast roof replacement company, you’ll enjoy benefits like:',
  items: [
    ['bolt', 'Streamlined Service', 'We offer a hassle-free speedy installation service.'],
    ['swatch', 'Style Options', 'Select from our comprehensive stock of roofing styles to find the perfect new roof for your home.', ['Roofing types', '/roofing/types/']],
    ['card', 'Friendly Financing', 'Our flexible financing plans make upgrading your home’s roof that much more affordable.', ['About financing', FINANCING]],
  ],
};
// Insurance roofing, from Panda's guides on the blog.
const COVERED = [
  'Wind tearing off or creasing shingles',
  'Hail leaving impact marks or bruises',
  'Tree limbs or debris hitting the roof',
  'Damage from the weight of snow or ice',
];
const NOT_COVERED = ['Old, worn-out shingles', 'Long-term leaks from neglect', 'Damage from a lack of maintenance or improper earlier repairs'];
const CLAIM_STEPS = [
  ['Free storm-damage inspection', 'We inspect your roof, gutters and attic for obvious and hidden damage, photograph everything and tell you honestly whether it looks cosmetic or claim-worthy.'],
  ['Decide whether to file', 'We help you think through your deductible and your coverage (ACV or RCV). If a claim makes sense, you call your insurance company to open it.'],
  ['We meet your adjuster', 'A Panda representative can be on the roof with the adjuster, pointing out the damage slope by slope, so nothing gets overlooked.'],
  ['Your new roof, and supplements', 'Once the claim is approved, the insurance scope is our baseline. If tear-off uncovers hidden damage, we help submit a supplement for the extra work.'],
];
const GUIDES = [
  ['Insurance-paid roof replacements: a simple guide', '/blog/insurance-paid-roof-replacements-a-simple-guide-for-wind-hail-and-ice-damage-claims/'],
  ['Actual cash value vs. replacement cost', '/blog/actual-cash-value-vs-replacement-cost-how-your-roof-insurance-payout-is-calculated/'],
  ['Roof insurance deductibles, explained', '/blog/roof-insurance-deductibles-explained-what-will-you-pay-after-storm-damage/'],
  ['Denied or lowballed? Re-opening your claim', '/blog/denied-or-lowballed-how-panda-exteriors-helps-you-re-open-your-winter-roof-insurance-claim/'],
];
const FAQ = [
  ['How much does a new roof cost?', 'Every roof is different. The price depends on the size and pitch of your roof, the material you choose, the condition of the decking underneath and the code items it needs. We’ll inspect your roof and give you a free, no-obligation estimate.'],
  ['Is metal roofing worth the extra cost?', 'Traditional shingles are less expensive than metal roofing, but metal roofing is designed to last up to twice as long as traditional shingles.'],
  ['Will my insurance pay for a new roof?', 'Often, when the damage is sudden and storm-related: wind, hail, falling limbs or the weight of snow and ice. Old age and wear and tear usually aren’t covered. Your deductible and your type of coverage affect what you pay.'],
  ['What’s the difference between ACV and RCV coverage?', 'Actual cash value (ACV) pays for the roof’s depreciated value, so an older roof gets a smaller payout. Replacement cost value (RCV) is meant to pay for a new roof of similar kind and quality: often an ACV payment first, then the withheld depreciation once the roof is replaced. You pay the deductible either way.'],
  ['What if my claim was denied or underpaid?', 'A denial or lowball offer doesn’t always have to be the final word. A second-opinion inspection, with a detailed photo report and a line-item estimate, can be used to ask your insurance company for a reinspection or a supplement.'],
  ['Can I finance my new roof?', 'Yes. Spread the cost with flexible financing through Service Finance, LLC. Homeowners may qualify for delayed payments and even no-interest loans.'],
];

const head = (id, eyebrow, title, text = '', light = false) =>
  `<div class="pfix-rc__head"><p class="pfix-rc__eyebrow${light ? ' pfix-rc__eyebrow--light' : ''}">${esc(eyebrow)}</p>` +
  `<h2 class="pfix-rc__title" id="${id}">${esc(title)}</h2>${text ? `<p class="pfix-rc__sub">${esc(text)}</p>` : ''}</div>`;
const more = ([label, href]) => `<a class="pfix-rc-more" href="${esc(href)}">${esc(label)}${ICONS.arrow}</a>`;

function sectionsHtml() {
  const factors =
    `<section class="pfix-rc__sec" id="${COST_ANCHOR}" aria-labelledby="pfix-rc-cost"><div class="pfix-rc__inner">` +
    head('pfix-rc-cost', 'What you’re paying for', 'What Affects the Cost of a New Roof', 'Every roof is different, so every estimate is too. These are the things that shape the price of yours.') +
    `<div class="pfix-rc-cards" role="list">` +
    FACTORS.map(([icon, title, text]) => `<div class="pfix-rc-card" role="listitem"><span class="pfix-rc-card__icon">${ICONS[icon]}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`).join('') +
    `</div></div></section>`;
  const quality =
    `<section class="pfix-rc__sec pfix-rc__sec--light" aria-labelledby="pfix-rc-quality"><div class="pfix-rc__inner">` +
    head('pfix-rc-quality', 'You pay for quality', QUALITY.title, QUALITY.text) +
    `<div class="pfix-rc-cards" role="list">` +
    QUALITY.items
      .map(
        ([icon, title, text, link]) =>
          `<div class="pfix-rc-card" role="listitem"><span class="pfix-rc-card__icon">${ICONS[icon]}</span><h3>${esc(title)}</h3><p>${esc(text)}</p>${link ? more(link) : ''}</div>`
      )
      .join('') +
    `</div></div></section>`;
  const list = (items, icon, cls) => `<div class="pfix-rc-cover__list" role="list">${items.map((t) => `<p class="${cls}" role="listitem">${ICONS[icon]}<span>${esc(t)}</span></p>`).join('')}</div>`;
  const insurance =
    `<section class="pfix-rc-ins" id="${INSURANCE_ANCHOR}" aria-labelledby="pfix-rc-ins"><div class="pfix-rc__inner">` +
    head(
      'pfix-rc-ins',
      'Insurance roofing',
      'Storm Damage? Insurance May Pay for Your New Roof',
      'Most homeowners insurance policies cover sudden, storm-related roof damage. We walk you through the process, from the first inspection to the final shingle.',
      true
    ) +
    `<div class="pfix-rc-cover">` +
    `<div class="pfix-rc-cover__col pfix-rc-cover__col--yes"><h3>Usually covered</h3>${list(COVERED, 'check', 'pfix-rc-cover__yes')}</div>` +
    `<div class="pfix-rc-cover__col pfix-rc-cover__col--no"><h3>Usually not covered</h3>${list(NOT_COVERED, 'cross', 'pfix-rc-cover__no')}</div>` +
    `</div>` +
    `<h3 class="pfix-rc-ins__steps-title">How we help with your claim</h3>` +
    `<div class="pfix-rc-steps" role="list">` +
    CLAIM_STEPS.map(
      ([title, text], i) =>
        `<div class="pfix-rc-step" role="listitem"><span class="pfix-rc-step__n" aria-hidden="true">${i + 1}</span>` +
        `<h4><span class="pfix-rc-sr">Step ${i + 1}: </span>${esc(title)}</h4><p>${esc(text)}</p></div>`
    ).join('') +
    `</div>` +
    `<div class="pfix-rc-ins__foot">` +
    `<div class="pfix-rc-note">${ICONS.info}<p><b>Your roofing advocate, not a public adjuster.</b> You stay in control of your claim and talk to your insurance company; we bring the roofing facts, photos and a detailed estimate, and sometimes the best advice is not to file at all.</p></div>` +
    `<div class="pfix-rc-guides"><p class="pfix-rc-guides__title">${ICONS.book}Our insurance guides</p>` +
    GUIDES.map(([label, href]) => `<a href="${esc(href)}">${esc(label)}${ICONS.arrow}</a>`).join('') +
    `</div></div>` +
    `<div class="pfix-rc-ins__ctas"><a class="pfix-rc-btn pfix-rc-btn--primary" href="#${FORM_ID}">Get a free storm-damage inspection${ICONS.arrow}</a>` +
    `<a class="pfix-rc-btn pfix-rc-btn--ghost" href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a></div>` +
    `</div></section>`;
  const faq =
    `<section class="pfix-rc__sec" aria-labelledby="pfix-rc-faq"><div class="pfix-rc__inner pfix-rc__inner--narrow">` +
    head('pfix-rc-faq', 'Questions', 'Roofing Cost Questions, Answered') +
    `<div class="pfix-rc-faq">` +
    FAQ.map(([q, a]) => `<details class="pfix-rc-faq__item"><summary>${esc(q)}<span class="pfix-rc-faq__icon">${ICONS.plus}</span></summary><p>${esc(a)}</p></details>`).join('') +
    `</div></div></section>`;
  return `<div class="pfix-rc">${factors}${quality}${insurance}${faq}</div>`;
}

/** /roofing-costs/: the intro's class and name, the sections and the offers band. */
export function collectRoofingCostsPage(doc, html, ed, { pathname = '', siteDir = '' } = {}, changes = []) {
  if (pathname !== COSTS_PATH) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  let done = false;

  // The intro: text beside a photo, styled by its class, with the company's name.
  const intro = find(doc, (c) => c.tagName === 'div' && hasClass(c, 'Service-container') && !!find(c, (x) => hasClass(x, 'Flex-text')));
  if (intro) {
    const l = intro.sourceCodeLocation;
    if (!hasClass(intro, 'pfix-rc-intro') && !ed.overlaps(l.startTag.startOffset, l.startTag.endOffset)) {
      ed.retag(intro, intro.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: `${a.value} pfix-rc-intro` } : a)));
    }
    const at = html.indexOf(NAME_FIX[0], l.startTag.endOffset);
    if (at !== -1 && at < l.endOffset && !ed.overlaps(at, at + NAME_FIX[0].length)) {
      ed.replace(at, at + NAME_FIX[0].length, NAME_FIX[1]);
      changes.push('roofing costs page: the intro names Panda Exteriors (was "Panda Contractors")');
    }
    done = true;
  }

  // The "Quality Roof Replacements" band (as captured) or the sections an earlier build made.
  const block = sectionsHtml();
  const built = find(doc, (c) => hasClass(c, 'pfix-rc'));
  const old = built || find(doc, (c) => c.tagName === 'div' && hasClass(c, 'roofers-section') && !!find(c, (x) => hasClass(x, 'Roof-grid')));
  if (old && free(old)) {
    const { startOffset, endOffset } = old.sourceCodeLocation;
    if (html.slice(startOffset, endOffset) !== block) {
      ed.outer(old, block);
      changes.push('roofing costs page: what affects the cost, the quality cards as icon cards (was white on lime), insurance roofing and questions');
    }
    done = true;
  }

  // The offers band, after the testimonials (once; offers-page.mjs renders it again after).
  if (!find(doc, (c) => attr(c, 'data-pfix-offers-strip') !== undefined)) {
    const reviews = findAll(doc, (c) => c.tagName === 'div' && hasClass(c, 'Client-Logo-section'))[0];
    const at = reviews?.sourceCodeLocation.endOffset;
    if (at !== undefined && !ed.overlaps(at, at)) {
      ed.replace(at, at, offersStripHtml(doc, { siteDir }));
      changes.push('roofing costs page: the offers band added after the testimonials');
      done = true;
    }
  }
  return done;
}
