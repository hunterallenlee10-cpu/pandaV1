// The Customer Service page (/customer-service/), redesigned as a help page for customers.
//
// As captured it was a thin strip with "Panda Exteriors Customer Service" over a cropped photo,
// then "Call Our Team Today to Get Started", a sales block about roof replacements, beside the
// estimate form. Nothing on it helped someone who already works with Panda. Now:
//  - a hero: "Panda Exteriors Customer Service", a line, and the main line, email and local
//    offices (the Contact page's cards) as large tap targets;
//  - "How can we help?": six cards leading to what customers look for, each with the site's own
//    words: the installation warranty, the satisfaction guarantee, financing (the three offer
//    pages the footer's Warranty and Financing links lead to), leaving a Google review (the
//    review wall's link) or reading reviews, referring a friend (the Refer & Earn page) and
//    the FAQs;
//  - the estimate block, kept for new customers, headed "Planning a new project?", on the
//    charcoal green of the "About Our Team" blocks (pfix-about) instead of white.
//
// Applied by site-fixes.mjs; rendered again on every run (found by its own class).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { hasClass, classes, esc, find, textOf, clean } from './html-edit.mjs';

export const CUSTOMER_SERVICE_PATH = '/customer-service/';
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
const EMAIL = 'info@pandaexteriors.com';
const ESTIMATE_TITLE = 'Planning a new project?';
// The estimate block's classes: the "About Our Team" blocks' text and button colors
// (site-fixes.css), and its own for the dark background and heading.
const ESTIMATE_CLASSES = ['pfix-about', 'pfix-cs-estimate'];

const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  mail: line('M3.5 6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5zM4 6.5l8 6 8-6'),
  pin: line('M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4z'),
  badge: line('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.9L7 21l5-2.6 5 2.6-1.5-7.1M9.6 9l1.6 1.6L14.6 7.4'),
  shield: line('M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6'),
  card: line('M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM3 10h18M7 15h4'),
  star: line('M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z'),
  gift: line('M4 11h16v9.5H4zM3 7.5h18V11H3zM12 7.5V20.5M12 7.5S10.5 3 8 3.8 7.4 7.5 12 7.5zM12 7.5s1.5-4.5 4-3.7.6 3.7-4 3.7z'),
  help: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.4 9.3a2.7 2.7 0 1 1 3.6 2.6c-.6.3-1 .8-1 1.5v.6M12 17v.1', 2),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  external: line('M14 5h5v5M19 5l-8 8M17 14v4.5A1.5 1.5 0 0 1 15.5 20h-10A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7H10', 2),
};

// The Google review link (the review wall's), so it stays the same everywhere.
function writeReviewUrl() {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'custom', 'reviews', 'google-reviews.json'), 'utf8'));
    return data.writeReviewUrl || data.place?.writeReviewUrl || '';
  } catch {
    return '';
  }
}

function topics() {
  const review = writeReviewUrl();
  // [icon, title, text, [label, href, external?], second link?]
  return [
    [
      'badge',
      'Installation warranty',
      'Our certified professionals install every product correctly. If our workmanship proves faulty within two years of installation, we’ll correct it at no cost to you. Some products have a longer installation warranty; your contract has the exact terms.',
      ['About the installation warranty', '/warranty/#installation-warranty'],
    ],
    [
      'shield',
      '100% satisfaction guarantee',
      'Every project, from roofing to gutters, is backed by our satisfaction guarantee, on top of the manufacturers’ warranties on the products we install.',
      ['About the guarantee', '/warranty/#satisfaction-guarantee'],
    ],
    [
      'card',
      'Financing',
      'Spread the cost with flexible financing through Service Finance, LLC. Homeowners may qualify for delayed payments and even no-interest loans.',
      ['About financing', '/financing/'],
    ],
    [
      'star',
      'Leave a review',
      'Had a great experience with Panda? Tell others about it on Google; it helps your neighbors find a contractor they can trust.',
      review ? ['Write a Google review', review, true] : ['Read our reviews', '/reviews/'],
      review ? ['Read our reviews', '/reviews/'] : null,
    ],
    [
      'gift',
      'Refer a friend',
      'Earn $25 for downloading the Panda Exteriors app, then up to $200 for every friend you refer for a new roof, siding or solar.',
      ['How Refer & Earn works', '/referrals/'],
    ],
    ['help', 'Questions & answers', 'Answers about our company, roofing, commercial roofing and solar, all in one place.', ['Read the FAQs', '/faqs/']],
  ];
}

const link = ([label, href, external], cls) =>
  `<a class="${cls}" href="${esc(href)}"${external ? ' target="_blank" rel="noopener"' : ''}>${esc(label)}${external ? ICONS.external : ICONS.arrow}${external ? '<span class="pfix-cs-sr"> (opens in a new tab)</span>' : ''}</a>`;

function pageHtml() {
  const hero =
    `<section class="pfix-cs-hero" aria-labelledby="pfix-cs-title"><div class="pfix-cs__inner">` +
    `<p class="pfix-cs__eyebrow pfix-cs__eyebrow--light">Customer service</p>` +
    `<h1 class="pfix-cs-hero__title" id="pfix-cs-title">Panda Exteriors Customer Service</h1>` +
    `<p class="pfix-cs-hero__sub">Questions about your project, your warranty or your financing? Here’s how to reach us and find what you need.</p>` +
    `<div class="pfix-cs-quick">` +
    `<a class="pfix-cs-quick__item pfix-cs-quick__item--call" href="${PHONE.href}"><span class="pfix-cs-quick__icon">${ICONS.phone}</span><span><small>Call us</small><b>${PHONE.text}</b></span></a>` +
    `<a class="pfix-cs-quick__item" href="mailto:${EMAIL}"><span class="pfix-cs-quick__icon">${ICONS.mail}</span><span><small>Email us</small><b>${EMAIL}</b></span></a>` +
    `<a class="pfix-cs-quick__item" href="/contact-us/#offices"><span class="pfix-cs-quick__icon">${ICONS.pin}</span><span><small>Your local office</small><b>7 offices and their numbers</b></span></a>` +
    `</div>` +
    `</div></section>`;
  return `<div class="pfix-cs">${hero}${helpTopics()}</div>`;
}

/**
 * "How can we help?": the help topics as cards. Also on /contact-us/ ("Already a customer?"),
 * where the page went when it was merged into Contact Us (MERGED_PAGES).
 */
export function helpTopics({ eyebrow = 'Help topics', title = 'How can we help?', intro = '', id = '' } = {}) {
  return (
    `<section class="pfix-cs__sec"${id ? ` id="${esc(id)}"` : ''} aria-labelledby="pfix-cs-help"><div class="pfix-cs__inner">` +
    `<div class="pfix-cs__head"><p class="pfix-cs__eyebrow">${esc(eyebrow)}</p><h2 class="pfix-cs__title" id="pfix-cs-help">${esc(title)}</h2>${intro ? `<p class="pfix-cs__intro">${esc(intro)}</p>` : ''}</div>` +
    `<div class="pfix-cs-topics" role="list">` +
    topics()
      .map(
        ([icon, title, text, first, second]) =>
          `<div class="pfix-cs-topic" role="listitem"><span class="pfix-cs-topic__icon">${ICONS[icon]}</span>` +
          `<h3>${esc(title)}</h3><p>${esc(text)}</p>` +
          `<div class="pfix-cs-topic__links">${link(first, 'pfix-cs-topic__link')}${second ? link(second, 'pfix-cs-topic__link pfix-cs-topic__link--quiet') : ''}</div></div>`
      )
      .join('') +
    `</div></div></section>`
  );
}

/** /customer-service/: the hero and help topics, and the estimate block's heading. */
export function collectCustomerServicePage(doc, html, ed, { pathname = '' } = {}, changes = []) {
  if (pathname !== CUSTOMER_SERVICE_PATH) return false;
  const free = (n) => !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  let done = false;

  const block = pageHtml();
  const old = find(doc, (c) => hasClass(c, 'pfix-cs')) || find(doc, (c) => c.tagName === 'div' && hasClass(c, 'hero-section') && hasClass(c, 'customer'));
  if (old && free(old)) {
    const { startOffset, endOffset } = old.sourceCodeLocation;
    if (html.slice(startOffset, endOffset) !== block) {
      ed.outer(old, block);
      changes.push('customer service page: a hero with call, email and local offices, and six help topics (was a title strip and a sales block)');
    }
    done = true;
  }

  // The estimate block: for new customers now.
  const estimate = find(doc, (c) => hasClass(c, 'fprm'));
  const box = estimate && find(estimate, (c) => hasClass(c, 'Request-Container'));
  if (box && !ESTIMATE_CLASSES.every((c) => hasClass(box, c))) {
    const l = box.sourceCodeLocation.startTag;
    if (!ed.overlaps(l.startOffset, l.endOffset)) {
      const cls = [...new Set([...classes(box), ...ESTIMATE_CLASSES])].join(' ');
      ed.retag(box, box.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: cls } : a)));
      changes.push('customer service page: the estimate block on charcoal green (was white)');
      done = true;
    }
  }
  const title = estimate && find(estimate, (c) => c.tagName === 'h2');
  if (title && free(title) && clean(textOf(title)) !== ESTIMATE_TITLE) {
    ed.inner(title, ESTIMATE_TITLE);
    changes.push(`customer service page: the estimate block is headed "${ESTIMATE_TITLE}"`);
    done = true;
  }
  return done;
}
