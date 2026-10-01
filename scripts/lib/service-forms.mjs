// Estimate forms built for each service. Every page's form cards (in the hero, beside "About
// Our Team", on blog posts) held the same form: "10% OFF Roof Replacement" with a "Get a Free
// Roof Inspection" button, even on the siding, gutter and solar pages, and a project type
// with no siding option. It sent leads to Salesforce (no longer used), Zapier, AccuLynx and
// Five9, and on page load asked every visitor for their location to fill in the address.
//
// Each card now has a form for its page (custom/site-fixes/service-forms.json): the siding,
// gutter, solar, commercial and attic insulation pages get one for their service, the
// roofing pages keep the roof replacement offer with a roofing form, and every other page
// gets the general form ("default"), which asks what the visitor needs. Each has its own
// heading, line and button, the contact fields and questions about the job, with the
// page's own service chosen already where it has one. The Google rating and the reviews
// link stay. The forms are not connected to anything yet: on submit, site-fixes.js says so
// and gives the phone number, so nobody thinks a request went through. The old form's
// scripts (lead routing, address lookup, the location prompt) are removed from every page,
// including the ones that only loaded them without a form. (The careers pages' own
// placeholders for them, which switch the location prompt off, are left alone.)
//
// Applied by site-fixes.mjs; the forms are rendered again on every run.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { attr, hasClass, esc, find, findAll, rawText } from './html-edit.mjs';

const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
const OLD_FORM_SCRIPT = /lead-form|address-field|submitToZapier|navigator\.geolocation|acculynx|five9|00NHo00000Xc7bb/;
// The careers pages' placeholders: they switch the location prompt off (kept).
const PROMPT_OFF = /getCurrentPosition\s*=\s*function/;

let data;
const forms = () => (data ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'custom', 'site-fixes', 'service-forms.json'), 'utf8')));
/** The form for a page: its service's, or the general one. */
export function serviceForm(pathname) {
  const all = Object.entries(forms());
  const [key, f] = all.find(([, x]) => x.pages.includes(pathname)) || all.find(([, x]) => x.default) || [];
  return key ? { key, ...f } : null;
}

/** One form; `n` tells the page's forms apart (ids). */
export function renderServiceForm(f, pathname, n) {
  const id = (name) => `pfix-lead-${n}-${name}`;
  const field = (name, type, label, autocomplete, required = true) =>
    `<label class="pfix-lead__field"><span class="pfix-lead__sr">${esc(label)}</span>` +
    `<input type="${type}" name="${name}" id="${id(name)}" class="input-field" placeholder="${esc(label)}${required ? '' : ' (optional)'}" autocomplete="${autocomplete}"${required ? ' required' : ''}></label>`;
  const question = (q) => {
    const selected = q.selected?.[pathname] || '';
    return (
      `<label class="field-label pfix-lead__question" for="${id(q.name)}">${esc(q.label)}` +
      `<select name="${esc(q.name)}" id="${id(q.name)}" class="input-field" required>` +
      `<option value=""${selected ? '' : ' selected'} disabled>Choose one</option>` +
      q.options.map((o) => `<option${o === selected ? ' selected' : ''}>${esc(o)}</option>`).join('') +
      `</select></label>`
    );
  };
  const consent = (name, text) =>
    `<label class="pfix-lead__consent"><input type="checkbox" name="${name}" id="${id(name)}"><span>${text}</span></label>`;
  return (
    `<div class="pfix-lead" data-pfix-lead="${esc(f.key)}">` +
    `<form class="pfix-lead__form cf7-container" id="pfix-lead-${n}" method="post" data-pfix-lead-form novalidate>` +
    `<input type="hidden" name="service" value="${esc(f.key)}"><input type="hidden" name="page" value="${esc(pathname)}">` +
    `<div class="name-row">${field('first_name', 'text', 'First name', 'given-name')}${field('last_name', 'text', 'Last name', 'family-name')}</div>` +
    `<div class="name-row">${field('email', 'email', 'Email', 'email')}${field('phone', 'tel', 'Phone', 'tel')}</div>` +
    (f.business ? field('business', 'text', 'Business name', 'organization', false) : '') +
    field('address', 'text', 'Street address, city, ZIP', 'street-address') +
    f.questions.map(question).join('') +
    consent(
      'sms_consent',
      'I agree to receive automated Customer Care text messages from Panda Exteriors at the phone number provided. Consent is not a condition to purchase. Msg &amp; data rates may apply. Msg frequency varies. Reply HELP for help and STOP to cancel. I also agree to Panda Exteriors’s <a href="/terms-and-conditions/" target="_blank">Terms of Use</a> and <a href="/privacy-policy/" target="_blank">Privacy Policy</a>.'
    ) +
    consent('email_consent', 'I agree to receive automated Customer Care email messages from Panda Exteriors at the email provided.') +
    `<p class="pfix-lead__error" role="alert" hidden></p>` +
    `<button type="submit" class="submit-btn">${esc(f.button)}</button>` +
    `<noscript><p class="pfix-lead__call">Or call <a href="${PHONE.href}">${PHONE.text}</a> to book your free estimate.</p></noscript>` +
    `</form>` +
    `<div class="pfix-lead__done" role="status" tabindex="-1" hidden>` +
    `<p class="pfix-lead__done-title">Thanks<span data-pfix-lead-name></span>!</p>` +
    `<p>Online estimate requests aren’t switched on yet, so this one didn’t reach us. Please give us a call and we’ll book your free estimate.</p>` +
    `<a class="submit-btn pfix-lead__done-call" href="${PHONE.href}">Call ${PHONE.text}</a>` +
    `</div></div>`
  );
}

/**
 * Puts the page's service form in each of its form cards and removes the old forms' scripts.
 * Returns true when the page has the forms (and so needs site-fixes.css and .js).
 */
export function collectServiceForms(doc, html, ed, { pathname }, changes) {
  const f = serviceForm(pathname);
  if (!f) return false;
  const oldForm = (x) => x.tagName === 'form' && /^lead-form/.test(attr(x, 'id') || '');
  const cards = findAll(doc, (c) => hasClass(c, 'form-card') && find(c, (x) => oldForm(x) || x.attrs?.some((a) => a.name === 'data-pfix-lead')));
  let replaced = 0;
  cards.forEach((card, i) => {
    const n = i + 1;
    const form = renderServiceForm(f, pathname, n);
    const heading = find(card, (c) => hasClass(c, 'heading-form'));
    const line = find(card, (c) => hasClass(c, 'form-text-p'));
    if (heading) ed.inner(heading, `\n${esc(f.title)}\n`);
    if (line) ed.inner(line, `\n${esc(f.text)}\n`);
    const own = find(card, (c) => c.attrs?.some((a) => a.name === 'data-pfix-lead'));
    if (own) {
      const { startOffset, endOffset } = own.sourceCodeLocation;
      if (html.slice(startOffset, endOffset) !== form) ed.outer(own, form);
      return;
    }
    // The block holding the old form (and its own script).
    const old = find(card, oldForm);
    let block = old;
    while (block.parentNode && block.parentNode !== card && !hasClass(block, 'oxy-html-code')) block = block.parentNode;
    ed.outer(block, form);
    replaced++;
  });
  if (replaced) changes.push(`service form: ${replaced} "10% OFF Roof Replacement" form(s) -> "${f.title}" (not connected yet: on submit it says so and gives the phone number)`);
  // The old forms' scripts: lead routing, Google address lookup, the location prompt.
  let removed = 0;
  for (const s of findAll(doc, (c) => c.tagName === 'script')) {
    const src = attr(s, 'src') || '';
    const drop = src ? /maps\.googleapis\.com\/maps\/api\/js/.test(src) : OLD_FORM_SCRIPT.test(rawText(s)) && !PROMPT_OFF.test(rawText(s));
    const { startOffset, endOffset } = s.sourceCodeLocation;
    if (drop && !ed.overlaps(startOffset, endOffset)) {
      ed.outer(s, '');
      removed++;
    }
  }
  // Google's address suggestion lists left in a rendered page.
  for (const el of findAll(doc, (c) => hasClass(c, 'pac-container'))) {
    const { startOffset, endOffset } = el.sourceCodeLocation;
    if (!ed.overlaps(startOffset, endOffset)) ed.outer(el, '');
  }
  if (removed) changes.push(`service form: ${removed} script(s) of the old forms removed (lead routing, address lookup, location prompt)`);
  return cards.length > 0;
}
