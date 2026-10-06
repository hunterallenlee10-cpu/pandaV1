// The Attic Insulation page (/roofing/attic-insulation/): its sections under the hero.
//
// As captured, under the hero came the intro ("Attic Insulation Installation", text beside a
// photo of an insulated attic) and "Best East Coast Attic Insulation Contractors": white text
// on Panda lime (its heading not even a heading) over four white cards with lime headings
// (both hard to read). Then the testimonials and "About Our Team". Nothing on why insulation
// matters, how to tell an attic needs it, how the job works or common questions. Now:
//  - the intro keeps its words, set as a label, heading and paragraphs beside a rounded photo
//    (a class for site-fixes.css), with the facts it gives (over three decades of combined
//    experience, A-rated by the BBB, environmentally friendly products) under the paragraphs;
//  - "Why Attic Insulation Matters": the band's paragraph on warm air rising, four benefits
//    and a drawing of heat escaping an attic without insulation and held in with it;
//  - signs an attic needs insulation, as /roofing/'s icon cards (service-pages.mjs), with
//    Panda's guides on the blog;
//  - "Best East Coast Attic Insulation Contractors": the band's heading (now an h2) and first
//    paragraph over its four cards in their own words, as white icon cards on Panda orange;
//  - how it works, in three steps on charcoal green (service-pages.mjs);
//  - attic insulation questions (and FAQPage structured data), with a call band;
//  - after the testimonials, the offers band the other service pages have (offers-page.mjs).
// The words come from the page, /roofing/replacement/'s questions, /financing/ and Panda's blog
// posts on attic insulation, hot upstairs rooms and ice dams. The hero is services-hero.mjs's.
//
// Applied by site-fixes.mjs; rendered again on every run (found by its own attribute).
import { attr, hasClass, classes, esc, find, findAll, headEndOffset } from './html-edit.mjs';
import { offersStripHtml } from './offers-page.mjs';
import { renderSigns, renderSteps, renderFaq, faqLd } from './service-pages.mjs';

export const ATTIC_PATH = '/roofing/attic-insulation/';
// The intro's class (site-fixes.css).
const INTRO_CLASS = 'pfix-ai-intro';

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  badge: line('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.9L7 21l5-2.6 5 2.6-1.5-7.1M9.6 9l1.6 1.6L14.6 7.4'),
  shield: line('M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6'),
  leaf: line('M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19c3-4 6-6.5 9.5-8.5'),
  coin: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM14.8 9.2c-.5-.8-1.5-1.3-2.8-1.3-1.7 0-2.8.8-2.8 2s1.2 1.7 2.8 2 2.8.9 2.8 2.1-1.1 2-2.8 2c-1.4 0-2.5-.6-3-1.5M12 6.3v1.6M12 16v1.7'),
  home: line('M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5'),
  roof: line('M3 12L12 4l9 8M6.5 9.5l5.5-4.5 5.5 4.5M5.5 10v10h13V10'),
  ice: line('M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 6l2.5-1.5M9.5 19.5L12 18l2.5 1.5'),
  bolt: line('M13 2.5L5 13.5h6l-1 8 8-11h-6z'),
  star: line('M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z'),
  card: line('M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3 10h18M7 15h4'),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
};

// What the intro says about the company and the hero about the products.
const FACTS = [
  ['badge', '30+ years of combined experience'],
  ['shield', 'A-rated by the BBB'],
  ['leaf', 'Environmentally friendly products'],
];

// Why it matters: the band's second paragraph, and what the blog says insulation does.
const WHY = {
  id: 'why-insulate',
  eyebrow: 'Why it matters',
  title: 'Why Attic Insulation Matters',
  text: 'Attic insulation can be applied in a variety of forms, and it’s very effective at maintaining the interior air temperature of your home, especially in the winter. Warm air tends to rise, and without proper insulation in your attic, much of your heating will escape.',
  items: [
    ['coin', 'Lower energy bills', 'When you refresh or install new insulation in your attic, your heating and cooling don’t have to work as hard, and you’re bound to notice lower utility bills.'],
    ['home', 'Comfort on every floor', 'No more drafty mornings, or upstairs rooms that stay hot in summer even with the air conditioning running.'],
    ['roof', 'A healthier roof', 'Less heat and moisture in the attic means less stress on the roof deck and shingles, and fewer conditions for mold.'],
    ['ice', 'Fewer ice dams', 'Heat escaping into the attic warms the roof deck, melting snow that refreezes at the eaves. Good insulation helps keep the roof cold.'],
  ],
};

// A house in section: heat escaping through the roof without insulation; held in with it.
const house = (insulated) => {
  const arrows = insulated
    ? // Heat rises to the insulation and turns back down into the rooms.
      [70, 160, 250]
        .map((x) => `<path d="M${x} 186c-6-10 6-18 0-28s6-18 0-26c0-8 10-12 16-6M${x + 10} 136l6-4-1 7" class="pfix-ai-house__heat"/>`)
        .join('')
    : // Heat rises through the attic and out of the roof.
      [92, 160, 228]
        .map((x) => `<path d="M${x} 186c-6-10 6-18 0-28s6-18 0-28 6-18 0-28 6-18 0-28 6-18 0-26M${x - 6} 52l6-8 6 8" class="pfix-ai-house__heat"/>`)
        .join('');
  return (
    `<svg class="pfix-ai-house" viewBox="0 0 320 214" role="img" aria-label="${insulated ? 'With insulation, heat stays in the rooms below the attic' : 'Without enough insulation, heat rises through the attic and out of the roof'}" focusable="false">` +
    `<rect x="0" y="200" width="320" height="14" rx="3" class="pfix-ai-house__ground"/>` +
    `<rect x="40" y="112" width="240" height="88" class="pfix-ai-house__rooms"/>` +
    `<path d="M160 104v96M40 156h240" class="pfix-ai-house__walls"/>` +
    `<path d="M24 116L160 22l136 94z" class="pfix-ai-house__attic"/>` +
    `<path d="M14 120L160 16l146 104" class="pfix-ai-house__roof"/>` +
    (insulated
      ? `<path d="M42 112l21-14h194l21 14z" class="pfix-ai-house__insulation"/>` +
        `<path d="M66 105l8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6 8 6" class="pfix-ai-house__fluff"/>`
      : `<path d="M60 112l8-4 6 4M200 112l8-4 6 4" class="pfix-ai-house__fluff pfix-ai-house__fluff--thin"/>`) +
    `<path d="M40 112h240" class="pfix-ai-house__ceiling"/>` +
    arrows +
    `</svg>`
  );
};

const SIGNS = {
  id: 'insulation-signs',
  eyebrow: 'Is it time?',
  title: 'Signs Your Attic Needs Insulation',
  intro: 'Insulation is found all throughout the house, and often it can be difficult to pinpoint where the problem is. In many cases, the attic is to blame. Watch for these:',
  items: [
    ['bolt', 'Skyrocketing utility bills', 'Bills that keep climbing, or an HVAC system that seems to run all the time, often mean heat is escaping through the attic.'],
    ['wave', 'Draftiness in your home', 'Cold spots on winter mornings and rooms that never feel quite warm are a common sign of an insulation problem.'],
    ['home', 'Uneven temperatures', 'Upstairs rooms that stay hot in summer, or a home that feels different from one floor to the next.'],
    ['ice', 'Ice dams in winter', 'Thick ice along the roof edge means heat is escaping into the attic and warming the roof deck above it.'],
    ['layers', 'Flattened or patchy insulation', 'Thin, compressed or missing spots and gaps between sections can’t slow the flow of heat.'],
    ['drop', 'Damp insulation or a musty smell', 'Moisture, mildew or dark stains on the attic wood mean the attic needs attention before it affects the roof.'],
  ],
  footer: 'Noticing one or more of these? We’ll check your attic and tell you honestly what it needs.',
  reads: [
    ['/blog/is-your-attic-costing-you-money-this-spring-how-insulation-affects-roof-health-and-energy-bills/', 'Is your attic costing you money?'],
    ['/blog/why-your-upstairs-gets-so-hot-in-summer-the-connection-between-roofing-ventilation-and-exterior-materials/', 'Why your upstairs gets so hot'],
    ['/blog/ice-dams-101-what-they-are-and-how-to-stop-them/', 'Ice dams 101'],
  ],
};

// The band's heading, first paragraph and four cards, in their own words.
const PANDA = {
  title: 'Best East Coast Attic Insulation Contractors',
  text: 'Our East Coast insulation company is the best in the business. As a talented team of roofers, we know what it takes to make a roofing project pop. Attic insulation is an often overlooked addition that many other companies refuse to install. When you hire Panda Exteriors, however, you’ll always have it available.',
  items: [
    ['bolt', 'Quick Installations', 'We can do an entire East Coast roof replacement in just one day, so attic insulation will take us no time at all.', ['/roofing/replacement/', 'Roof replacement']],
    ['star', 'Top-Tier Products', 'All our quality insulation products come from industry-trusted brands that boast peak performance.'],
    ['shield', 'Warranties', 'We have a variety of best-in-class warranties that ensure your installation will last.', ['/warranty/', 'Our warranties']],
    ['card', 'Financing', 'You don’t have to worry about costs with us. All our prices are affordable, but we also have an array of financing options you can benefit from.', ['/financing/', 'About financing']],
  ],
};

const STEPS = {
  id: 'how-it-works',
  title: 'How Your Attic Insulation Project Works',
  items: [
    ['Free attic check and estimate', 'We look at how much insulation your attic has and where, check for gaps, damp or flattened spots and moisture, and give you a clear estimate at no cost.'],
    ['A plan for your home', 'We recommend the right insulation for your attic, and tell you honestly if your roof needs attention too, so you can do both at once.'],
    ['Quick, clean installation', 'Our crews install your new insulation in no time at all and clean up before they leave, so you can start feeling the difference right away.'],
  ],
};

const FAQ = {
  title: 'Attic Insulation Questions, Answered',
  items: [
    ['How do I know if my attic needs more insulation?', 'Watch for high or climbing energy bills, drafts, rooms that are hotter or colder than the rest of the house, ice dams in winter, and insulation in the attic that looks flattened, patchy or damp. We’ll check your attic for free.'],
    ['Can attic insulation really lower my energy bills?', 'Yes. Warm air tends to rise, and without proper insulation in your attic, much of your heating escapes. When you refresh or install new insulation, your heating and cooling don’t have to work as hard, and you’re bound to notice lower utility bills.'],
    ['Does attic insulation help in the summer too?', 'It does. Insulation slows heat moving between the attic and your living space in both directions, so less of the attic’s summer heat pushes down into the rooms below, especially upstairs.'],
    ['Can insulation help prevent ice dams?', 'It’s part of the fix. Ice dams form when heat escaping into the attic warms the roof deck and melts snow that refreezes at the cold eaves. Consistent insulation, along with sealing air leaks and good ventilation, helps keep the roof uniformly cold.'],
    ['Are your insulation products safe for my family?', 'Yes. All our insulation products are environmentally friendly and residential approved, ensuring that you and your loved ones are safe.'],
    ['Can you add insulation when you replace my roof?', 'Yes. No home roofing project is complete without good insulation, and we can take care of both at once.'],
    ['Can I finance my attic insulation?', 'Yes. Financing through Service Finance, LLC covers attic insulation as well as roofing. Homeowners may qualify for delayed payments and even no-interest loans.'],
  ],
};
const CTA = {
  title: 'Ready for a more comfortable home?',
  text: 'Get a free attic insulation estimate, and ask about our financing options.',
};

const more = ([href, label]) => `<a class="pfix-ai-more" href="${esc(href)}">${esc(label)}${ICONS.arrow}</a>`;

function whyHtml() {
  return (
    `<section class="pfix-sp__sec pfix-ai-why" id="${WHY.id}" aria-labelledby="pfix-ai-why"><div class="pfix-sp__inner pfix-ai-why__grid">` +
    `<div class="pfix-ai-why__text"><div class="pfix-sp__head"><p class="pfix-sp__eyebrow">${esc(WHY.eyebrow)}</p>` +
    `<h2 class="pfix-sp__title" id="pfix-ai-why">${esc(WHY.title)}</h2><p class="pfix-sp__intro">${esc(WHY.text)}</p></div>` +
    `<div class="pfix-ai-benefits" role="list">` +
    WHY.items.map(([icon, title, text]) => `<div class="pfix-ai-benefit" role="listitem"><span class="pfix-ai-benefit__icon">${ICONS[icon]}</span><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div></div>`).join('') +
    `</div></div>` +
    `<figure class="pfix-ai-diagram">` +
    `<div class="pfix-ai-diagram__panel pfix-ai-diagram__panel--bad">${house(false)}<p><b>Without enough insulation</b>Heat rises through the attic and out of the roof.</p></div>` +
    `<div class="pfix-ai-diagram__panel pfix-ai-diagram__panel--good">${house(true)}<p><b>With proper insulation</b>Heat stays in the rooms you’re paying to warm.</p></div>` +
    `</figure>` +
    `</div></section>`
  );
}

function pandaHtml() {
  return (
    `<section class="pfix-sp__sec pfix-ai-panda" aria-labelledby="pfix-ai-panda"><div class="pfix-sp__inner">` +
    `<div class="pfix-sp__head"><p class="pfix-sp__eyebrow">Why Panda Exteriors</p><h2 class="pfix-sp__title" id="pfix-ai-panda">${esc(PANDA.title)}</h2>` +
    `<p class="pfix-sp__intro">${esc(PANDA.text)}</p></div>` +
    `<div class="pfix-ai-cards" role="list">` +
    PANDA.items
      .map(([icon, title, text, link]) => `<div class="pfix-ai-card" role="listitem"><span class="pfix-ai-card__icon">${ICONS[icon]}</span><h3>${esc(title)}</h3><p>${esc(text)}</p>${link ? more(link) : ''}</div>`)
      .join('') +
    `</div></div></section>`
  );
}

export const atticInsulationHtml = () =>
  `<div class="pfix-sp pfix-sp--roofing pfix-ai" data-pfix-ai>${whyHtml()}${renderSigns(SIGNS, 'ai-signs')}${pandaHtml()}${renderSteps(STEPS)}${renderFaq(FAQ, CTA)}</div>`;

const factsHtml = () =>
  `<div class="pfix-ai-facts" role="list" data-pfix-ai-facts>${FACTS.map(([icon, text]) => `<span role="listitem">${ICONS[icon]}${esc(text)}</span>`).join('')}</div>`;

const withClasses = (n, add) => n.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: [...new Set([...classes(n), ...add])].join(' ') } : a));

/** /roofing/attic-insulation/: the intro's class and facts, the sections and the offers band. */
export function collectAtticInsulationPage(doc, html, ed, { pathname = '', siteDir = '', siteOrigin = '' } = {}, changes = []) {
  if (pathname !== ATTIC_PATH) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  let done = false;

  // The intro: text beside a photo, styled by its class, with the page's facts.
  const intro = find(doc, (c) => c.tagName === 'div' && hasClass(c, 'Service-container') && !!find(c, (x) => hasClass(x, 'Flex-text')));
  if (intro) {
    const l = intro.sourceCodeLocation.startTag;
    if (!hasClass(intro, INTRO_CLASS) && !ed.overlaps(l.startOffset, l.endOffset)) {
      ed.retag(intro, withClasses(intro, [INTRO_CLASS]));
      changes.push('attic insulation page: the intro as a label, heading and paragraphs beside a rounded photo');
    }
    const facts = factsHtml();
    const old = find(intro, (c) => attr(c, 'data-pfix-ai-facts') !== undefined);
    const text = find(intro, (c) => hasClass(c, 'Flex-text'));
    if (old) {
      if (free(old) && html.slice(old.sourceCodeLocation.startOffset, old.sourceCodeLocation.endOffset) !== facts) ed.outer(old, facts);
    } else if (text?.sourceCodeLocation.endTag && !ed.overlaps(text.sourceCodeLocation.endTag.startOffset, text.sourceCodeLocation.endTag.startOffset)) {
      ed.append(text, facts);
      changes.push('attic insulation page: experience, BBB A-rated and environmentally friendly products under the intro');
    }
    done = true;
  }

  // "Best East Coast Attic Insulation Contractors" (as captured) or the block an earlier build made.
  const block = atticInsulationHtml();
  const old = find(doc, (c) => attr(c, 'data-pfix-ai') !== undefined) || find(doc, (c) => c.tagName === 'div' && hasClass(c, 'roofers-section') && !!find(c, (x) => hasClass(x, 'Roof-grid')));
  if (old && free(old)) {
    const { startOffset, endOffset } = old.sourceCodeLocation;
    if (html.slice(startOffset, endOffset) !== block) {
      ed.outer(old, block);
      changes.push('attic insulation page: why it matters, signs, the four cards on Panda orange (was white on lime), how it works and questions');
    }
    done = true;
  }
  // The questions' structured data.
  const ld = faqLd({ faq: FAQ }, siteOrigin ? siteOrigin + ATTIC_PATH : '').replace('data-pfix-sp-ld', 'data-pfix-ai-ld');
  const oldLd = find(doc, (c) => c.tagName === 'script' && attr(c, 'data-pfix-ai-ld') !== undefined);
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
      changes.push('attic insulation page: the offers band added after the testimonials');
      done = true;
    }
  }
  return done;
}
