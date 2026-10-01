#!/usr/bin/env node
// Fills custom/reviews/google-reviews.json (the reviews on /reviews/) with Panda's Google
// reviews, and updates the rating and review count shown above them. Two ways in:
//
//   node scripts/tools/google-reviews.mjs --takeout=<folder or .json>
//     From a Google Takeout export of the Google Business Profile (takeout.google.com, signed
//     in as an owner or manager of the profile; unzip it first). Every review is in it, so
//     this is the complete list. The rating and count are worked out from the export.
//
//   node scripts/tools/google-reviews.mjs --scrape [--headed]
//     Reads the reviews off the Google Maps listing in a browser (Playwright), scrolling until
//     it has them all. Run it on an ordinary home or office connection: Google shows cloud
//     servers a "limited view" of Maps with only a handful of reviews.
//
// Either way, only the five-star reviews with words in them are kept (that is all the page
// shows); the old list is replaced. Add --dry-run to see the result without writing it, then
// rebuild (node scripts/tools/update-built-site.mjs --only=/reviews/).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/config.mjs';
import { args } from '../lib/util.mjs';

const FILE = path.join(ROOT, 'custom', 'reviews', 'google-reviews.json');
const opts = args();
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const today = new Date();
const ymd = (d) => d.toISOString().slice(0, 10);

// Google's machine translations keep the reviewer's own words after "(Original)".
function originalText(s) {
  const t = String(s || '').replace(/\r/g, '');
  const m = /\(Original\)\s*\n([\s\S]*)$/.exec(t);
  return (m ? m[1] : t.replace(/^\(Translated by Google\)\s*/, '')).trim();
}

// ---- Google Takeout (Business Profile) --------------------------------------------------
const STARS = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
function fromTakeout(where) {
  const files = [];
  const walk = (p) => {
    const st = fs.statSync(p);
    if (st.isDirectory()) for (const f of fs.readdirSync(p)) walk(path.join(p, f));
    else if (/\.json$/i.test(p)) files.push(p);
  };
  walk(path.resolve(where));
  const all = [];
  const seen = new Set();
  for (const f of files) {
    let j;
    try {
      j = JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch {
      continue;
    }
    const list = Array.isArray(j) ? j : Array.isArray(j.reviews) ? j.reviews : [];
    for (const r of list) {
      const rating = STARS[r.starRating] || Number(r.starRating) || 0;
      if (!rating) continue;
      const id = r.reviewId || r.name || `${r.reviewer?.displayName}|${r.createTime}`;
      if (seen.has(id)) continue;
      seen.add(id);
      all.push({
        name: r.reviewer?.isAnonymous ? 'A Google user' : r.reviewer?.displayName || 'A Google user',
        rating,
        date: (r.createTime || '').slice(0, 7),
        avatar: r.reviewer?.isAnonymous ? '' : r.reviewer?.profilePhotoUrl || '',
        text: originalText(r.comment),
      });
    }
  }
  if (!all.length) throw new Error(`No Business Profile reviews found in ${where} (looked in ${files.length} .json file(s))`);
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
  return { reviews: all, rating: Math.round(avg * 10) / 10, count: all.length };
}

// ---- Google Maps --------------------------------------------------------------------------
// "3 months ago" -> "2026-07"; "a year ago" -> "2025" (only the year is sure).
function fromRelative(s) {
  const m = /(\d+|an?|one)\s+(minute|hour|day|week|month|year)s?\s+ago/i.exec(s || '');
  if (!m) return '';
  const n = /^\d+$/.test(m[1]) ? Number(m[1]) : 1;
  const d = new Date(today);
  const unit = m[2].toLowerCase();
  if (unit === 'year') return String(d.getUTCFullYear() - n);
  if (unit === 'month') d.setUTCMonth(d.getUTCMonth() - n);
  if (unit === 'week') d.setUTCDate(d.getUTCDate() - 7 * n);
  if (unit === 'day') d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 7);
}

async function fromMaps() {
  const { chromium } = await import('playwright');
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ headless: !opts.headed, proxy });
  const page = await browser.newPage({ locale: 'en-US', viewport: { width: 1300, height: 1000 } });
  const url = data.place.mapsUrl + (data.place.mapsUrl.includes('?') ? '&' : '?') + 'hl=en';
  let ok = false;
  for (let t = 0; t < 4 && !ok; t++) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    ok = await page.waitForSelector('[data-review-id]', { timeout: 20000 }).then(() => true, () => false);
  }
  if (!ok) throw new Error('Google Maps did not show any reviews (try --headed, or another connection)');
  const summary = await page.evaluate(() => {
    const t = document.body.innerText;
    const count = /([\d,]+)\s+reviews/.exec(t);
    const rating = /\n(\d\.\d)\n/.exec(t);
    return { count: count ? Number(count[1].replace(/,/g, '')) : 0, rating: rating ? Number(rating[1]) : 0 };
  });
  const seen = new Map();
  let stale = 0;
  for (let i = 0; stale < 25; i++) {
    await page.evaluate(() => document.querySelectorAll('button.w8nwRe[aria-expanded="false"]').forEach((b) => b.click()));
    await page.waitForTimeout(300);
    const batch = await page.evaluate(() =>
      [...document.querySelectorAll('div.jftiEf[data-review-id]')].map((el) => {
        const q = (s) => el.querySelector(s);
        const stars = q('span[role="img"][aria-label*="star"]');
        return {
          id: el.dataset.reviewId,
          name: q('.d4r55')?.innerText.trim() || el.getAttribute('aria-label') || '',
          meta: q('.RfnDt')?.innerText || '',
          avatar: q('img.NBa7we')?.src || '',
          rating: stars ? parseInt(stars.getAttribute('aria-label'), 10) : 0,
          when: q('.rsqaWe')?.innerText || q('.xRkPPb')?.innerText || '',
          text: q('.wiI7pd')?.innerText.trim() || '',
        };
      })
    );
    let added = 0;
    for (const r of batch) {
      const had = seen.get(r.id);
      if (!had) added++;
      if (!had || r.text.length > had.text.length) seen.set(r.id, r);
    }
    stale = added ? 0 : stale + 1;
    if (i % 10 === 0) process.stdout.write(`\r${seen.size} reviews read…`);
    await page.evaluate(() => {
      const els = document.querySelectorAll('div.jftiEf[data-review-id]');
      els[els.length - 1]?.scrollIntoView();
    });
    await page.mouse.move(250, 700);
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(1000);
  }
  process.stdout.write('\n');
  await browser.close();
  const reviews = [...seen.values()].map((r) => ({
    name: r.name,
    rating: r.rating,
    date: fromRelative(r.when),
    localGuide: /Local Guide/.test(r.meta),
    avatar: r.avatar.replace(/=w\d+-h\d+-/, '=w96-h96-'),
    text: originalText(r.text),
  }));
  if (summary.count && reviews.length < summary.count * 0.9) {
    console.warn(`Only ${reviews.length} of ${summary.count} reviews could be read (Google may be showing a limited view).`);
  }
  return { reviews, rating: summary.rating, count: summary.count };
}

// ---- Write ----------------------------------------------------------------------------------
if (!opts.takeout && !opts.scrape) {
  console.error('Usage: node scripts/tools/google-reviews.mjs --takeout=<folder or .json> | --scrape [--headed] [--dry-run]');
  process.exit(1);
}
let got;
try {
  got = opts.takeout ? fromTakeout(String(opts.takeout)) : await fromMaps();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const keep = got.reviews.filter((r) => r.rating === 5 && r.text);
if (!keep.length) {
  console.error(`Read ${got.reviews.length} review(s), none of them five stars with words: nothing written.`);
  process.exit(1);
}
const out = {
  ...data,
  place: { ...data.place, ...(got.rating ? { rating: got.rating } : {}), ...(got.count ? { count: got.count } : {}), asOf: ymd(today) },
  reviews: keep.map(({ rating, localGuide, ...r }) => ({ ...r, rating, ...(localGuide ? { localGuide } : {}) })),
};
console.log(`Read ${got.reviews.length} review(s): ${keep.length} five-star with words. Rating ${out.place.rating} from ${out.place.count} reviews.`);
if (opts['dry-run']) process.exit(0);
fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote ${path.relative(ROOT, FILE)}. Now run: node scripts/tools/update-built-site.mjs --only=/reviews/`);
