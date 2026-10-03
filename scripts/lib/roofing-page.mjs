// The Roofing page (/roofing/): the sections its other modules don't cover.
//
//  - "Our Process": three blue boxes with centred white text beside the heading and
//    paragraph, over a faded Panda mascot (the section's background picture), with no way to
//    act on it. It becomes a charcoal-green band like the other redesigned pages' "how it
//    works": the heading, paragraph and estimate and call buttons on the left, the three
//    steps as a numbered timeline on the right. The words are the section's own; it keeps
//    its id (process-section).
//  - "About Our Team" (the lead form above the footer) was the white version of the block,
//    with a navy button and its heading in a second, unstyled h2 (the styled one was empty):
//    it gets the charcoal green the block has on the other pages (the classes
//    /customer-service/'s estimate block uses, site-fixes.css), and the heading goes into
//    the styled h2.
//
// The hero is services-hero.mjs's; the "Signs it's time", "What goes into every new roof"
// and questions sections are service-pages.mjs's; "What Makes Our Roofers Stand Out?" is
// gutters-page.mjs's. Applied by site-fixes.mjs; rendered again on every run (found by its
// own class).
import { hasClass, classes, esc, find, textOf, clean } from './html-edit.mjs';

export const ROOFING_PATH = '/roofing/';
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// The hero's estimate form (service-forms.mjs).
const FORM_ID = 'pfix-lead-1';
const PROCESS_ID = 'process-section';
// The "About Our Team" block's classes: the dark version's text and button colors, and the
// dark background and heading (site-fixes.css).
const ABOUT_CLASSES = ['pfix-about', 'pfix-cs-estimate'];
const ABOUT_TITLE = 'About Our Team';

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  badge: line('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.9L7 21l5-2.6 5 2.6-1.5-7.1M9.6 9l1.6 1.6L14.6 7.4'),
  shield: line('M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6'),
  card: line('M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3 10h18M7 15h4'),
};

// The section's own words.
const PROCESS = {
  title: 'Our Process',
  text: 'At Panda Exteriors, our goal is to guide you through every step of your project, so you don’t have to stress during your renovations. From start to finish, our team will be there to ensure you get the best care for your East Coast home or business property.',
  steps: [
    ['Free Initial Consultation & Quote', 'To kick things off, our team will come assess your property and come up with a plan of action that works within your schedule and budget. We’ll also provide a free, accurate quote, so you know exactly what to expect from the very start!'],
    ['Efficient Exterior Services', 'No matter what part of your exterior needs work, you can count on our team to deliver. We offer comprehensive replacement and installation services for all areas of your exterior, so you can have peace of mind knowing your property is in good hands regardless of the project.'],
    ['Timeless Results You Can Trust', 'When you choose Panda Exteriors for your exterior projects, you can have peace of mind knowing you’re working with local experts you can trust. On top of our great services and financing options, we offer the best warranties to protect your investment for years to come.'],
  ],
  // What the page says elsewhere (the hero, the cards and "About Our Team").
  facts: [
    ['badge', 'GAF Master Elite'],
    ['shield', 'BBB A-rated'],
    ['card', 'Flexible financing'],
  ],
};

function processHtml() {
  const p = PROCESS;
  return (
    `<section class="pfix-rp-process" id="${PROCESS_ID}" aria-labelledby="pfix-rp-process-title"><div class="pfix-rp__inner">` +
    `<div class="pfix-rp-process__intro">` +
    `<p class="pfix-rp__eyebrow">How it works</p>` +
    `<h2 class="pfix-rp__title" id="pfix-rp-process-title">${esc(p.title)}</h2>` +
    `<p class="pfix-rp__text">${esc(p.text)}</p>` +
    `<div class="pfix-rp-facts" role="list">${p.facts.map(([icon, text]) => `<span role="listitem">${ICONS[icon]}${esc(text)}</span>`).join('')}</div>` +
    `<div class="pfix-rp-ctas"><a class="pfix-rp-btn pfix-rp-btn--primary" href="#${FORM_ID}">Get a free estimate${ICONS.arrow}</a>` +
    `<a class="pfix-rp-btn pfix-rp-btn--ghost" href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a></div>` +
    `</div>` +
    `<div class="pfix-rp-steps" role="list">` +
    p.steps
      .map(
        ([title, text], i) =>
          `<div class="pfix-rp-step" role="listitem"><span class="pfix-rp-step__n" aria-hidden="true">${i + 1}</span>` +
          `<div class="pfix-rp-step__body"><h3><span class="pfix-rp-sr">Step ${i + 1}: </span>${esc(title)}</h3><p>${esc(text)}</p></div></div>`
      )
      .join('') +
    `</div>` +
    `</div></section>`
  );
}

/** /roofing/: "Our Process" and the "About Our Team" block's colors. */
export function collectRoofingPage(doc, html, ed, { pathname = '' } = {}, changes = []) {
  if (pathname !== ROOFING_PATH) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  let done = false;

  // "Our Process" (as captured, or the section an earlier build made).
  const block = processHtml();
  const process = find(doc, (c) => hasClass(c, 'pfix-rp-process')) || find(doc, (c) => c.tagName === 'div' && hasClass(c, 'process-section'));
  if (process && free(process)) {
    const { startOffset, endOffset } = process.sourceCodeLocation;
    if (html.slice(startOffset, endOffset) !== block) {
      ed.outer(process, block);
      changes.push('roofing page process: the heading, paragraph, estimate and call buttons beside the three steps as a numbered timeline, on charcoal green (was blue boxes over a faded mascot)');
    }
    done = true;
  }

  // "About Our Team": the white version of the block, on charcoal green.
  const about = find(doc, (c) => c.tagName === 'div' && hasClass(c, 'Request-Container') && !hasClass(c, 'primary-bg'));
  if (about && !ABOUT_CLASSES.every((c) => hasClass(about, c))) {
    const l = about.sourceCodeLocation.startTag;
    if (!ed.overlaps(l.startOffset, l.endOffset)) {
      const cls = [...new Set([...classes(about), ...ABOUT_CLASSES])].join(' ');
      ed.retag(about, about.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: cls } : a)));
      changes.push('roofing page about: "About Our Team" on charcoal green, like the other pages (was white)');
      done = true;
    }
  } else if (about) done = true;
  // Its heading: the styled h2 was empty, with "About Our Team" in a bare h2 inside it (in
  // the page as captured; a browser shows it as a second, unstyled h2 after the empty one).
  // The words go into the styled h2, and the bare one (and the stray end tag) go.
  const col = about && find(about, (c) => hasClass(c, 'Local-text-col'));
  const styled = col && col.childNodes.find((c) => c.tagName === 'h2' && hasClass(c, 'heading'));
  const bare = styled && col.childNodes.find((c) => c.tagName === 'h2' && !c.attrs.length && clean(textOf(c)) === ABOUT_TITLE);
  if (styled && bare && !clean(textOf(styled))) {
    const from = styled.sourceCodeLocation.startOffset;
    let to = bare.sourceCodeLocation.endOffset;
    const stray = /^\s*<\/h2>/.exec(html.slice(to));
    if (stray) to += stray[0].length;
    if (!ed.overlaps(from, to)) {
      const tag = html.slice(styled.sourceCodeLocation.startTag.startOffset, styled.sourceCodeLocation.startTag.endOffset);
      ed.replace(from, to, `${tag}${esc(ABOUT_TITLE)}</h2>`);
      changes.push(`roofing page about heading: "${ABOUT_TITLE}" in the block's styled heading (was in a second, unstyled h2)`);
      done = true;
    }
  }
  return done;
}
