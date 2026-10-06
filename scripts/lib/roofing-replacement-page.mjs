// The Roof Replacement page (/roofing/replacement/): the sections its other modules don't cover.
//
// As captured, under the hero came the intro ("Your Local Roof Replacement Experts", text
// beside a YouTube video) and "Signs You May Need a Roof Replacement": white text on Panda lime
// over three white cards with lime headings (both hard to read). Then the sections
// service-pages.mjs adds (what comes with a new roof, how it works, questions), the projects
// row, the testimonials and "About Our Team". Now:
//  - the intro keeps its words, set as a label, heading and paragraphs beside the video in a
//    rounded frame (a class for site-fixes.css), with the three facts the page gives (one-day
//    installs, GAF Master Elite, BBB A-rated) under the paragraphs;
//  - "Signs You May Need a Roof Replacement" keeps its heading and its three signs in its own
//    words, as the icon cards /roofing/'s signs use (service-pages.mjs's renderSigns), with
//    three more from /roofing/ (age, granules, sagging) and Panda's guides on the blog;
//  - "Roofing Styles for Your New Roof": the band's paragraph on GAF's roofing styles over the
//    four roof types as small cards (their swatches and words from roofing-types-page.mjs),
//    each leading to its card on /roofing/types/;
//  - after the testimonials, the offers band the other service pages have (offers-page.mjs).
// The hero is services-hero.mjs's; "What Comes With Your New Roof", "How Your Roof
// Replacement Works" and the questions are service-pages.mjs's (custom/site-fixes/
// service-pages.json), and come after this block.
//
// Applied by site-fixes.mjs; rendered again on every run (found by its own attribute).
import { attr, hasClass, classes, esc, find, findAll } from './html-edit.mjs';
import { offersStripHtml } from './offers-page.mjs';
import { renderSigns } from './service-pages.mjs';
import { SWATCHES, TYPES, TYPE_ANCHORS } from './roofing-types-page.mjs';

export const REPLACEMENT_PATH = '/roofing/replacement/';
const TYPES_PATH = '/roofing/types/';
// The intro's class (site-fixes.css).
const INTRO_CLASS = 'pfix-rr-intro';

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  bolt: line('M13 2.5L5 13.5h6l-1 8 8-11h-6z'),
  badge: line('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.9L7 21l5-2.6 5 2.6-1.5-7.1M9.6 9l1.6 1.6L14.6 7.4'),
  shield: line('M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6'),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
};

// What the intro says about the company, under its paragraphs.
const FACTS = [
  ['bolt', 'One-day installations'],
  ['badge', 'GAF Master Elite Certified'],
  ['shield', 'A-rated by the BBB'],
];

// The band's three signs in its own words, then three from /roofing/'s signs.
const SIGNS = {
  id: 'replacement-signs',
  eyebrow: 'Is it time?',
  title: 'Signs You May Need a Roof Replacement',
  intro: 'It may be scary to realize that your home needs a roof replacement, but you can relax knowing Panda Exteriors is on the job. If you’re unsure whether your home actually needs one, keep an eye out for these tell-tale signs:',
  items: [
    ['shingle', 'Missing roofing material', 'From loose shingles that find their way onto your lawn to whole sections wavering in the wind, missing roofing is a clear sign you need a new roof.'],
    ['drop', 'Stains on the ceiling', 'Yellow and brown spots on your ceiling are a sure sign your home has been compromised: water is likely finding its way inside.'],
    ['patch', 'Dark areas on the roof', 'If your roof looks darker in some places, it’s likely water damage, and a replacement will be in store.'],
    ['calendar', 'Your roof is 20+ years old', 'Most asphalt shingle roofs last 20 to 25 years. Past that, problems can form out of sight, even before you see a leak.'],
    ['granules', 'Granules in your gutters', 'Bald spots on the shingles and granules collecting in your gutters mean the shingles are breaking down.'],
    ['sag', 'Sagging spots or daylight in the attic', 'Dips, soft spots or sunlight peeking through the roof boards can mean the decking underneath is damaged.'],
  ],
  footer: 'Seeing more than one of these? A full replacement usually makes more sense than patching, and our team works efficiently, so most homes have their new roof in as little as one day.',
  reads: [
    ['/blog/5-signs-its-time-to-replace-your-roof-before-it-costs-you-more/', '5 signs it’s time to replace your roof'],
    ['/blog/how-long-does-a-roof-really-last/', 'How long does a roof really last?'],
    ['/storm-damage/', 'Storm damage? Free inspection'],
  ],
};

// The band's paragraph on GAF's roofing styles, over the four roof types.
const STYLES = {
  eyebrow: 'Choose your new roof',
  title: 'Roofing Styles for Your New Roof',
  text: 'Our roofers only use the best products in the industry, all from GAF. They come in a range of roofing styles for your East Coast home and are guaranteed to look stunning.',
  more: [`${TYPES_PATH}#compare-roof-types`, 'Compare all roof types'],
};

function stylesHtml() {
  const card = (t) =>
    `<a class="pfix-rr-style" href="${TYPES_PATH}#${TYPE_ANCHORS[t.key]}" role="listitem">` +
    `<span class="pfix-rr-style__swatch">${SWATCHES[t.key]}</span>` +
    `<span class="pfix-rr-style__body"><span class="pfix-rr-style__kicker">${esc(t.tag[1])}</span>` +
    `<span class="pfix-rr-style__name">${esc(t.name)}</span>` +
    `<span class="pfix-rr-style__text">${esc(t.kicker)}</span>` +
    `<span class="pfix-rr-style__more">Learn more${ICONS.arrow}</span></span></a>`;
  return (
    `<section class="pfix-sp__sec pfix-rr-styles" aria-labelledby="pfix-rr-styles"><div class="pfix-sp__inner">` +
    `<div class="pfix-sp__head"><p class="pfix-sp__eyebrow">${esc(STYLES.eyebrow)}</p>` +
    `<h2 class="pfix-sp__title" id="pfix-rr-styles">${esc(STYLES.title)}</h2><p class="pfix-sp__intro">${esc(STYLES.text)}</p></div>` +
    `<div class="pfix-rr-styles__grid" role="list">${TYPES.map(card).join('')}</div>` +
    `<p class="pfix-rr-styles__more"><a class="pfix-rr-btn" href="${esc(STYLES.more[0])}">${esc(STYLES.more[1])}${ICONS.arrow}</a></p>` +
    `</div></section>`
  );
}

export const roofingReplacementHtml = () =>
  `<div class="pfix-sp pfix-sp--roofing pfix-rr" data-pfix-rr>${renderSigns(SIGNS, 'rr-signs')}${stylesHtml()}</div>`;

const factsHtml = () =>
  `<div class="pfix-rr-facts" role="list" data-pfix-rr-facts>${FACTS.map(([icon, text]) => `<span role="listitem">${ICONS[icon]}${esc(text)}</span>`).join('')}</div>`;

const withClasses = (n, add) => n.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: [...new Set([...classes(n), ...add])].join(' ') } : a));

/** /roofing/replacement/: the intro's class and facts, the signs and styles, and the offers band. */
export function collectRoofingReplacementPage(doc, html, ed, { pathname = '', siteDir = '' } = {}, changes = []) {
  if (pathname !== REPLACEMENT_PATH) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  let done = false;

  // The intro: text beside the video, styled by its class, with the page's facts.
  const intro = find(doc, (c) => c.tagName === 'div' && hasClass(c, 'Service-container') && !!find(c, (x) => hasClass(x, 'Flex-text')));
  if (intro) {
    const l = intro.sourceCodeLocation.startTag;
    if (!hasClass(intro, INTRO_CLASS) && !ed.overlaps(l.startOffset, l.endOffset)) {
      ed.retag(intro, withClasses(intro, [INTRO_CLASS]));
      changes.push('roof replacement page: the intro as a label, heading and paragraphs beside the video in a rounded frame');
    }
    const facts = factsHtml();
    const old = find(intro, (c) => attr(c, 'data-pfix-rr-facts') !== undefined);
    const text = find(intro, (c) => hasClass(c, 'Flex-text'));
    if (old) {
      if (free(old) && html.slice(old.sourceCodeLocation.startOffset, old.sourceCodeLocation.endOffset) !== facts) ed.outer(old, facts);
    } else if (text?.sourceCodeLocation.endTag && !ed.overlaps(text.sourceCodeLocation.endTag.startOffset, text.sourceCodeLocation.endTag.startOffset)) {
      ed.append(text, facts);
      changes.push('roof replacement page: one-day installs, GAF Master Elite and BBB A-rated under the intro');
    }
    done = true;
  }

  // "Signs You May Need a Roof Replacement" (as captured) or the block an earlier build made.
  const block = roofingReplacementHtml();
  const old = find(doc, (c) => attr(c, 'data-pfix-rr') !== undefined) || find(doc, (c) => c.tagName === 'div' && hasClass(c, 'roofers-section') && !!find(c, (x) => hasClass(x, 'Roof-grid')));
  if (old && free(old)) {
    const { startOffset, endOffset } = old.sourceCodeLocation;
    if (html.slice(startOffset, endOffset) !== block) {
      ed.outer(old, block);
      changes.push('roof replacement page: six signs as icon cards (was three white cards on lime) and the four roof styles');
    }
    done = true;
  }

  // The offers band, after the testimonials (once; offers-page.mjs renders it again after).
  if (!find(doc, (c) => attr(c, 'data-pfix-offers-strip') !== undefined)) {
    const reviews = findAll(doc, (c) => c.tagName === 'div' && hasClass(c, 'Client-Logo-section'))[0];
    const at = reviews?.sourceCodeLocation.endOffset;
    if (at !== undefined && !ed.overlaps(at, at)) {
      ed.replace(at, at, offersStripHtml(doc, { siteDir, pathname }));
      changes.push('roof replacement page: the offers band added after the testimonials');
      done = true;
    }
  }
  return done;
}
