// The blog (/blog/, /blog/page/N/ and every post), redesigned (custom/blog/).
//
//  - /blog/: "Panda Exteriors Roofing Blog" over a lime "Featured" card that cut its title
//    off ("What H...") beside a cover picture with its own title baked in, a grid of six
//    cards and numbered pages. It is now a hero with a search box and a chip per topic, the
//    newest post as a large featured card, and every post as a card (12 at a time, with
//    "Load more"); the search and the topic chips narrow the cards as you type or tap
//    (blog.js). Without JavaScript every card shows.
//  - /blog/page/N/: the same design, with that page's posts and page links.
//  - Posts: the cover picture (which already carries the title, the panda and "READ THE
//    BLOG") was blown up behind the heading, so the two titles ran over each other; the
//    lead form filled the hero (and the whole first screen on phones); the article ran the
//    full 1,140 px width; a hidden second hero repeated the heading (a second h1) and the
//    form; and "Related Posts" showed the same three 2023 posts on every post. Each post now
//    opens with a clean title header (breadcrumb, title, the post's own summary, author,
//    date and read time) and the cover shown whole below it; the article is set in a
//    readable column beside a sidebar that follows you down the page with "On this page"
//    links and a compact free-estimate card (its button opens the estimate form in a
//    dialog); a call-and-estimate band sits partway down and at the end (in place of the
//    "Call Now - Get a Free Estimate" picture 61 posts ended with); share links follow the
//    article; and "Keep reading" shows three posts on the same topic.
//
// The posts keep their wording. Topics are grouped from what each post is about
// (custom/blog/blog.json: six topics, the words that place a post in one and per-post
// overrides), since the WordPress categories are mostly "Residential Roofing". Applied by
// site-fixes.mjs; everything here is rendered again on every run.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';
import { ROOT, SITE_ORIGIN } from './config.mjs';
import { attr, hasClass, classes, esc, textOf, clean, find, findAll } from './html-edit.mjs';
import { serviceForm, renderServiceForm } from './service-forms.mjs';
import { loadReviewWall, GOOGLE_G } from './review-wall.mjs';

export const BLOG_DIR = path.join(ROOT, 'custom', 'blog');
export const BLOG_FILES = {
  'blog.css': '/_custom/blog/blog.css',
  'blog.js': '/_custom/blog/blog.js',
};
export const BLOG_PATH = '/blog/';
const PHONE = { href: 'tel:+18772138536', text: '(877) 213-8536' };
// Sections under /blog/ that aren't posts: page links, the offer pages and the project pages.
const NOT_POSTS = new Set(['page', 'offer', 'project', 'category', 'tag', 'author', 'feed']);
const WORDS_PER_MINUTE = 230;

let config;
export const blogConfig = () => (config ??= JSON.parse(fs.readFileSync(path.join(BLOG_DIR, 'blog.json'), 'utf8')));

/** The post a path is (its slug), or '' for anything else. */
export function postSlug(pathname = '') {
  const m = /^\/blog\/([^/]+)\/$/.exec(pathname);
  return m && !NOT_POSTS.has(m[1]) ? m[1] : '';
}
/** The listing page a path is (1 for /blog/, N for /blog/page/N/), or 0. */
export function listingPage(pathname = '') {
  if (pathname === BLOG_PATH) return 1;
  const m = /^\/blog\/page\/(\d+)\/$/.exec(pathname);
  return m ? Number(m[1]) : 0;
}

// ----------------------------------------------------------------- topics
// The topics are listed in the order the blog shows them; a post goes in the first topic of
// matchOrder whose words its address or title has, or else in the topic without words.
/** The topic of a post, from its slug and title (or blog.json's overrides). */
export function topicFor(slug, title = '') {
  const { overrides = {}, topics, matchOrder = topics.map((t) => t.key) } = blogConfig();
  const key = overrides[slug];
  if (key && topics.some((t) => t.key === key)) return key;
  const text = `${slug} ${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const hit = matchOrder.map((k) => topics.find((t) => t.key === k)).find((t) => t?.match && new RegExp(t.match, 'i').test(text));
  return (hit || topics.find((t) => !t.match) || topics[topics.length - 1]).key;
}
export const topicByKey = (key) => blogConfig().topics.find((t) => t.key === key) || blogConfig().topics[blogConfig().topics.length - 1];

// ------------------------------------------------------------ the posts
// Site URLs (as delivered, https://pandaexteriors.com/…) -> root-relative paths.
const localUrl = (u, origin) => {
  if (!u) return u;
  const host = new URL(origin || SITE_ORIGIN).hostname.replace(/^www\./, '');
  return u.replace(new RegExp(`https?://(?:www\\.)?${host.replace(/\./g, '\\.')}(?=/)`, 'g'), '');
};
const metaOf = (doc) => {
  const out = {};
  for (const m of findAll(doc, (c) => c.tagName === 'meta')) {
    const k = attr(m, 'property') || attr(m, 'name');
    if (k && !(k in out)) out[k] = attr(m, 'content') || '';
  }
  return out;
};
const stripSite = (t) => clean(t || '').replace(/\s*[|–-]\s*Panda Exteriors(?: Blog)?\s*$/i, '');
// The post's cover picture: in the hero as delivered, or the cover a run of this module made.
function coverOf(doc, origin) {
  const box = find(doc, (c) => c.attrs?.some((a) => a.name === 'data-pfix-post-cover')) || find(doc, (c) => hasClass(c, 'video-background'));
  const img = box && find(box, (c) => c.tagName === 'img');
  if (!img) return null;
  const webp = find(box, (c) => c.tagName === 'source' && attr(c, 'type') === 'image/webp');
  const pick = (n, ...keys) => keys.map((k) => attr(n, k)).find((v) => v && !v.startsWith('data:')) || '';
  return {
    src: localUrl(pick(img, 'data-lazy-src', 'src'), origin),
    srcset: localUrl(pick(img, 'data-lazy-srcset', 'srcset'), origin),
    webp: webp ? localUrl(pick(webp, 'data-lazy-srcset', 'srcset'), origin) : '',
    alt: attr(img, 'alt') || '',
  };
}
const articleOf = (doc) => find(doc, (c) => hasClass(c, 'rich-text-blog'));
// Words in the article itself (not this module's bands).
function wordCount(article) {
  const walk = (n) => {
    if (n.attrs?.some((a) => a.name === 'data-pfix-post-cta')) return '';
    if (n.nodeName === '#text') return n.value;
    if (['script', 'style', 'noscript'].includes(n.tagName)) return '';
    return (n.childNodes || []).map(walk).join(' ');
  };
  return article ? walk(article).split(/\s+/).filter((w) => /\w/.test(w)).length : 0;
}

/** One post's details, from its page (as delivered or as built). */
export function postFromHtml(html, pathname, { origin = SITE_ORIGIN } = {}) {
  const slug = postSlug(pathname);
  if (!slug) return null;
  const doc = parse(html);
  const meta = metaOf(doc);
  if (meta['og:type'] && meta['og:type'] !== 'article') return null;
  const article = articleOf(doc);
  if (!article) return null;
  // The heading as written (the share title is Title Cased by the SEO plugin, and some end
  // in "| Panda Exteriors Blog").
  const h1 = find(doc, (c) => c.tagName === 'h1');
  const title = clean(h1 ? textOf(h1) : '') || stripSite(meta['og:title']);
  const words = wordCount(article);
  const date = meta['article:published_time'] || '';
  const author = (meta['twitter:label1'] === 'Written by' && meta['twitter:data1']) || 'Panda Exteriors';
  const ogW = Number(meta['og:image:width']) || 0;
  const ogH = Number(meta['og:image:height']) || 0;
  const cover = coverOf(doc, origin);
  return {
    slug,
    href: `/blog/${slug}/`,
    title,
    description: clean(meta.description || meta['og:description'] || ''),
    date,
    modified: meta['article:modified_time'] || date,
    author,
    section: meta['article:section'] || '',
    topic: topicFor(slug, title),
    words,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    cover: cover && { ...cover, width: ogW || 1200, height: ogH || 675 },
  };
}

// The posts, newest first. Read once per run from the pages as delivered (site/_raw/), or
// the built pages where those are missing; 03-build.mjs hands them over from the capture
// cache instead (primeBlogPosts), since site/ is written page by page.
let primed = null;
const cache = new Map();
export function primeBlogPosts(pages, { origin = SITE_ORIGIN } = {}) {
  primed = sortPosts(pages.map(({ pathname, html }) => postFromHtml(html, pathname, { origin })).filter(Boolean));
}
const sortPosts = (list) => list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.slug.localeCompare(b.slug));
export function loadBlogPosts(siteDir, { origin = SITE_ORIGIN } = {}) {
  if (primed) return primed;
  if (!siteDir) return [];
  if (cache.has(siteDir)) return cache.get(siteDir);
  const dir = path.join(siteDir, 'blog');
  const list = [];
  for (const slug of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    if (NOT_POSTS.has(slug)) continue;
    const raw = path.join(siteDir, '_raw', 'blog', slug, 'index.html');
    const built = path.join(dir, slug, 'index.html');
    const file = fs.existsSync(raw) ? raw : built;
    if (!fs.existsSync(file)) continue;
    const post = postFromHtml(fs.readFileSync(file, 'utf8'), `/blog/${slug}/`, { origin });
    if (post) list.push(post);
  }
  sortPosts(list);
  cache.set(siteDir, list);
  return list;
}

// --------------------------------------------------------------- pieces
const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const line = (d, w = 1.9) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICONS = {
  search: line('M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zM16 16l5 5', 2.1),
  arrow: line('M5 12h14M13 6l6 6-6 6', 2.2),
  back: line('M19 12H5M11 6l-6 6 6 6', 2.2),
  phone: svg('<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>'),
  clock: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2'),
  calendar: line('M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5zM4 10h16M8 3v4M16 3v4'),
  shield: line('M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6zM8.8 12.2l2.2 2.2 4.4-4.6'),
  roof: line('M3 11.5L12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5'),
  sun: line('M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5V4.5M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4'),
  home: line('M3.5 10.5 12 4l8.5 6.5M5.5 9v11h13V9M5.5 13h13M5.5 16.5h13M3 9.5h-.5'),
  clipboard: line('M9 3.5h6v3H9zM8 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H16M8.5 12.5l2 2 4-4M8.5 17.5h7'),
  grid: line('M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'),
  list: line('M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01', 2.2),
  close: line('M6 6l12 12M18 6L6 18', 2.2),
  link: line('M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1'),
  mail: line('M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM4.5 6.5 12 13l7.5-6.5'),
  facebook: svg('<path fill="currentColor" d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z"/>'),
  x: svg('<path fill="currentColor" d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.2L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z"/>'),
  linkedin: svg('<path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4z"/>'),
  star: svg('<path fill="currentColor" d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/>'),
  chevron: line('M9 6l6 6-6 6', 2.2),
};
const topicIcon = (t) => ICONS[t.icon] || ICONS.roof;

// Dates as WordPress shows them (it shows the publishing date in UTC).
const TZ = 'UTC';
const longDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: TZ }) : '');
const shortDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: TZ }) : '');
const isoDay = (iso) => (iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ }) : '');
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
const topicHref = (key) => (key ? `${BLOG_PATH}?topic=${encodeURIComponent(key)}#articles` : `${BLOG_PATH}#articles`);
// Lower-case words a card is found by (the search in blog.js matches every word typed).
const searchText = (p) => clean(`${p.title} ${p.description} ${topicByKey(p.topic).label}`).toLowerCase();

// The widest picture a cover has (its srcset's largest width, else its share size).
const coverWidth = (c) => Math.max(c.width || 0, ...String(c.srcset || '').split(',').map((s) => Number((/\s(\d+)w\s*$/.exec(s.trim()) || [])[1]) || 0));
// Only the sizes a slot can use (a card never needs the 2,560 px picture): up to maxW wide,
// or the smallest there is.
function trimSrcset(srcset, maxW) {
  if (!srcset || !maxW) return srcset;
  const items = srcset.split(',').map((x) => x.trim()).filter(Boolean).map((x) => ({ x, w: Number((/\s(\d+)w$/.exec(x) || [])[1]) || 0 }));
  if (items.some((i) => !i.w)) return srcset;
  const keep = items.filter((i) => i.w <= maxW);
  return (keep.length ? keep : [items.reduce((a, b) => (b.w < a.w ? b : a))]).map((i) => i.x).join(', ');
}
function coverPicture(cover, { sizes, eager = false, alt = '', maxW = 0 }) {
  const ss = (s) => (s ? ` srcset="${esc(trimSrcset(s, maxW))}" sizes="${esc(sizes)}"` : '');
  return (
    `<picture>${cover.webp ? `<source type="image/webp"${ss(cover.webp)}>` : ''}` +
    `<img src="${esc(cover.src)}"${ss(cover.srcset)} alt="${esc(alt)}" width="${cover.width}" height="${cover.height}"` +
    `${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></picture>`
  );
}

const CARD_SIZES = '(max-width: 767px) calc(100vw - 32px), (max-width: 1199px) calc(50vw - 40px), 370px';
function postCard(p, { featured = false, heading = 'h3' } = {}) {
  const t = topicByKey(p.topic);
  return (
    `<article class="pfix-blog-card" data-pfix-blog-card data-topic="${esc(t.key)}" data-search="${esc(searchText(p))}"${featured ? ' data-featured' : ''}>` +
    `<a class="pfix-blog-card__link" href="${esc(p.href)}">` +
    `<span class="pfix-blog-card__media">${p.cover ? coverPicture(p.cover, { sizes: CARD_SIZES, maxW: 1100 }) : ''}</span>` +
    `<span class="pfix-blog-card__body">` +
    `<span class="pfix-topic" data-topic="${esc(t.key)}">${esc(t.label)}</span>` +
    `<${heading} class="pfix-blog-card__title">${esc(p.title)}</${heading}>` +
    (p.description ? `<span class="pfix-blog-card__text">${esc(p.description)}</span>` : '') +
    `<span class="pfix-blog-card__meta"><time datetime="${isoDay(p.date)}">${shortDate(p.date)}</time>` +
    `<span aria-hidden="true">·</span><span>${p.minutes} min read</span></span>` +
    `</span></a></article>`
  );
}

// ------------------------------------------------------- /blog/, /blog/page/N/
// WordPress shows the newest post as "Featured" on every listing page and six more per page.
const PER_PAGE = 6;
export const listingPages = (posts) => Math.max(1, Math.ceil((posts.length - 1) / PER_PAGE));
const pageHref = (n) => (n === 1 ? BLOG_PATH : `${BLOG_PATH}page/${n}/`);

function pager(page, pages) {
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  let items = '';
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) items += `<li class="pfix-blog-pager__gap" aria-hidden="true">…</li>`;
    items +=
      n === page
        ? `<li><span class="pfix-blog-pager__num is-current" aria-current="page">${n}</span></li>`
        : `<li><a class="pfix-blog-pager__num" href="${pageHref(n)}" aria-label="Page ${n}">${n}</a></li>`;
  });
  const step = (n, label, icon, cls) =>
    n >= 1 && n <= pages
      ? `<a class="pfix-blog-pager__step pfix-blog-pager__step--${cls}" href="${pageHref(n)}" rel="${cls}">${cls === 'prev' ? icon : ''}<span>${label}</span>${cls === 'next' ? icon : ''}</a>`
      : `<span class="pfix-blog-pager__step pfix-blog-pager__step--${cls} is-off" aria-hidden="true">${cls === 'prev' ? icon : ''}<span>${label}</span>${cls === 'next' ? icon : ''}</span>`;
  return (
    `<nav class="pfix-blog-pager" aria-label="Blog pages">` +
    step(page - 1, 'Newer', ICONS.back, 'prev') +
    `<ol class="pfix-blog-pager__nums">${items}</ol>` +
    step(page + 1, 'Older', ICONS.arrow, 'next') +
    `</nav>`
  );
}

function listing(posts, page) {
  const { index: cfg, topics } = blogConfig();
  const pages = listingPages(posts);
  const isIndex = page === 1;
  const latest = posts[0];
  const count = (key) => posts.filter((p) => p.topic === key).length;
  const shown = isIndex ? posts : posts.slice(1 + PER_PAGE * (page - 1), 1 + PER_PAGE * page);

  const hero =
    `<section class="pfix-blog-hero">` +
    `<div class="container pfix-blog-hero__inner">` +
    `<p class="pfix-blog-hero__eyebrow">${esc(cfg.eyebrow)}</p>` +
    `<h1 class="pfix-blog-hero__title">${esc(isIndex ? cfg.title : cfg.pageTitle)}</h1>` +
    `<p class="pfix-blog-hero__sub">${esc(cfg.sub)}</p>` +
    // Shown by blog.js, which does the searching (on /blog/; from the other pages it opens
    // /blog/ with the words typed).
    `<form class="pfix-blog-search" role="search" action="${BLOG_PATH}" method="get" data-pfix-blog-search hidden>` +
    `<label class="pfix-blog-sr" for="pfix-blog-q">Search the blog</label>` +
    `<span class="pfix-blog-search__box">${ICONS.search}` +
    `<input type="search" id="pfix-blog-q" name="q" placeholder="Search articles, e.g. “ice dams” or “deductible”" autocomplete="off"${isIndex ? ' aria-controls="pfix-blog-grid"' : ''}>` +
    `<button type="submit" class="pfix-blog-search__go">Search</button></span></form>` +
    `<ul class="pfix-blog-hero__facts">` +
    `<li><b>${posts.length}</b> articles</li><li><b>${topics.length}</b> topics</li>` +
    (latest ? `<li>Newest: <time datetime="${isoDay(latest.date)}">${shortDate(latest.date)}</time></li>` : '') +
    `</ul></div></section>`;

  const feature =
    isIndex && latest
      ? `<article class="pfix-blog-feature" data-pfix-blog-feature>` +
        `<a class="pfix-blog-feature__link" href="${esc(latest.href)}">` +
        `<span class="pfix-blog-feature__media">${latest.cover ? coverPicture(latest.cover, { sizes: '(max-width: 1023px) calc(100vw - 24px), 740px', eager: true, maxW: 1600 }) : ''}</span>` +
        `<span class="pfix-blog-feature__body">` +
        `<span class="pfix-blog-feature__labels"><span class="pfix-blog-feature__new">Latest article</span>` +
        `<span class="pfix-topic" data-topic="${esc(latest.topic)}">${esc(topicByKey(latest.topic).label)}</span></span>` +
        `<h2 class="pfix-blog-feature__title">${esc(latest.title)}</h2>` +
        (latest.description ? `<span class="pfix-blog-feature__text">${esc(latest.description)}</span>` : '') +
        `<span class="pfix-blog-feature__meta"><span class="pfix-blog-avatar" aria-hidden="true">${esc(initials(latest.author))}</span>` +
        `<span>By ${esc(latest.author)}</span><span aria-hidden="true">·</span><time datetime="${isoDay(latest.date)}">${shortDate(latest.date)}</time>` +
        `<span aria-hidden="true">·</span><span>${latest.minutes} min read</span></span>` +
        `<span class="pfix-blog-feature__more">Read the article${ICONS.arrow}</span>` +
        `</span></a></article>`
      : '';

  const chip = (key, label, n, icon) =>
    `<a class="pfix-blog-topic${!key && isIndex ? ' is-active' : ''}" href="${topicHref(key)}" data-pfix-blog-topic="${esc(key)}">` +
    `${icon || ''}<span class="pfix-blog-topic__name">${esc(label)}</span><span class="pfix-blog-topic__n">${n}</span></a>`;
  const toolbar =
    `<div class="pfix-blog-toolbar">` +
    `<h2 class="pfix-blog-toolbar__title" id="pfix-blog-list-title">${isIndex ? 'All articles' : `Page ${page} of ${pages}`}</h2>` +
    `<div class="pfix-blog-topics" role="group" aria-label="${isIndex ? 'Filter by topic' : 'Browse by topic'}">` +
    chip('', 'All', posts.length, ICONS.grid) +
    topics.map((t) => chip(t.key, t.label, count(t.key), topicIcon(t))).join('') +
    `</div></div>`;

  const grid =
    `<p class="pfix-blog-status" role="status" aria-live="polite" data-pfix-blog-status></p>` +
    `<div class="pfix-blog-grid" id="pfix-blog-grid"${isIndex ? ` data-pfix-blog-grid data-per="${Number(cfg.perLoad) || 12}"` : ''} aria-labelledby="pfix-blog-list-title">` +
    shown.map((p) => postCard(p, { featured: isIndex && p === latest })).join('') +
    `</div>` +
    (isIndex
      ? `<div class="pfix-blog-empty" data-pfix-blog-empty hidden><p class="pfix-blog-empty__title">No articles match your search.</p>` +
        `<p>Try another word or topic, or call us at <a href="${PHONE.href}">${PHONE.text}</a> and we’ll answer your question.</p>` +
        `<button type="button" class="pfix-blog-btn pfix-blog-btn--ghost" data-pfix-blog-reset>Show all articles</button></div>` +
        `<div class="pfix-blog-more"><button type="button" class="pfix-blog-btn" data-pfix-blog-more hidden>Load more articles</button></div>`
      : pager(page, pages) + `<p class="pfix-blog-all"><a href="${BLOG_PATH}#articles">See every article on one page${ICONS.arrow}</a></p>`);

  return (
    `<div class="pfix-blog" data-pfix-blog="${isIndex ? 'index' : 'page'}">` +
    hero +
    `<section class="pfix-blog-list" id="articles" aria-label="Articles"><div class="container">` +
    feature +
    toolbar +
    grid +
    `</div></section></div>`
  );
}

/** /blog/ and /blog/page/N/: the hero, the featured post and the cards (in place of the
 *  heading, the "Featured" card, the grid and the page numbers). */
function collectBlogListing(doc, html, ed, { pathname, siteDir, siteOrigin }, changes) {
  const page = listingPage(pathname);
  const posts = loadBlogPosts(siteDir, { origin: siteOrigin });
  if (posts.length < 2) {
    if (siteDir) console.warn(`blog: ${pathname}: no posts found in ${siteDir}, listing left as is`);
    return false;
  }
  if (page > listingPages(posts)) return false;
  const own = find(doc, (c) => c.attrs?.some((a) => a.name === 'data-pfix-blog'));
  const box = own || find(doc, (c) => hasClass(c, 'container') && (c.childNodes || []).some((k) => k.tagName && hasClass(k, 'bde-post-loop')));
  if (!box || ed.overlaps(box.sourceCodeLocation.startOffset, box.sourceCodeLocation.endOffset)) return false;
  ed.outer(box, listing(posts, page));
  changes.push(
    own
      ? `blog listing: rendered again (${posts.length} posts)`
      : page === 1
        ? `blog listing: hero with search, topic filters, the newest post as a large featured card and all ${posts.length} posts as cards with "Load more" (was a lime card with a cut-off title and six cards a page)`
        : `blog listing: page ${page} in the blog's new design (hero, topic links, cards, page links)`
  );
  return true;
}

// ------------------------------------------------------------------ posts
const slugify = (s) =>
  clean(s)
    .toLowerCase()
    .replace(/[’'"]/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/, '') || 'section';
const isOwn = (name) => (c) => c.attrs?.some((a) => a.name === name);
const inOwnCta = (n) => {
  for (let a = n.parentNode; a; a = a.parentNode) if (isOwn('data-pfix-post-cta')(a)) return true;
  return false;
};
// The article's sections for "On this page": its h2s, or its h3s where it has fewer than
// two h2s (several posts use h3 for their sections).
function sectionHeadings(article) {
  const of = (tag) => findAll(article, (c) => c.tagName === tag && !inOwnCta(c) && clean(textOf(c)));
  const h2 = of('h2');
  if (h2.length >= 2) return h2;
  const h3 = of('h3');
  return h3.length >= 3 ? h3 : [];
}

function rating() {
  try {
    const { place } = loadReviewWall();
    return place.rating && place.count ? { rating: place.rating, count: place.count } : null;
  } catch {
    return null;
  }
}
const ratingLine = (r, cls) =>
  r
    ? `<a class="${cls}" href="/reviews/">${GOOGLE_G}<b>${r.rating.toFixed(1)}</b>` +
      `<span class="pfix-post-stars" aria-hidden="true">${ICONS.star.repeat(5)}</span>` +
      `<span>${r.count.toLocaleString('en-US')} Google reviews</span></a>`
    : '';

// A cover too small to show at the column's width (a 300 px photo) is left out; the header
// then doesn't reach under the column.
const hasCover = (post) => !!post.cover && coverWidth(post.cover) >= 560;

function postHero(post, { dek }) {
  const t = topicByKey(post.topic);
  return (
    `<section class="pfix-post-hero${hasCover(post) ? '' : ' pfix-post-hero--flat'}" data-pfix-post-hero>` +
    `<div class="container pfix-post-hero__inner">` +
    `<nav class="pfix-post-crumbs" aria-label="Breadcrumb"><ol>` +
    `<li><a href="/">Home</a></li><li><a href="${BLOG_PATH}">Blog</a></li>` +
    `<li><a href="${topicHref(t.key)}">${esc(t.label)}</a></li></ol></nav>` +
    `<h1 class="pfix-post-hero__title">${esc(post.title)}</h1>` +
    (dek ? `<p class="pfix-post-hero__dek">${esc(post.description)}</p>` : '') +
    `<div class="pfix-post-hero__meta">` +
    `<span class="pfix-post-hero__author"><span class="pfix-blog-avatar" aria-hidden="true">${esc(initials(post.author))}</span>` +
    `<span><span class="pfix-post-hero__by">Written by</span> <b>${esc(post.author)}</b></span></span>` +
    `<span class="pfix-post-hero__fact">${ICONS.calendar}<time datetime="${isoDay(post.date)}">${longDate(post.date)}</time></span>` +
    `<span class="pfix-post-hero__fact">${ICONS.clock}${post.minutes} min read</span>` +
    `</div></div></section>`
  );
}

const COVER_SIZES = '(max-width: 1023px) calc(100vw - 32px), 780px';
function postTop(post, toc) {
  const c = post.cover;
  const showCover = hasCover(post);
  const ratio = c ? c.width / c.height : 0;
  return (
    `<div class="pfix-post__top" data-pfix-post-top>` +
    (showCover
      ? `<figure class="pfix-post-cover${ratio < 1.3 || ratio > 2.1 ? ' pfix-post-cover--crop' : ''}" data-pfix-post-cover>` +
        coverPicture(c, { sizes: COVER_SIZES, eager: true, alt: c.alt || post.title }) +
        `</figure>`
      : '') +
    (toc.length
      ? `<details class="pfix-post-toc-m"><summary>${ICONS.list}<span>On this page</span><span class="pfix-post-toc-m__n">${plural(toc.length, 'section', 'sections')}</span></summary>` +
        `<ol>${toc.map((h) => `<li><a href="#${esc(h.id)}">${esc(h.text)}</a></li>`).join('')}</ol></details>`
      : '') +
    `<div class="pfix-post-progress" aria-hidden="true"><span data-pfix-post-progress></span></div>` +
    `</div>`
  );
}

function postSide(post, toc, formHref) {
  const r = rating();
  return (
    `<aside class="pfix-post__side" data-pfix-post-side aria-label="On this page and free estimate">` +
    `<div class="pfix-post__side-inner">` +
    (toc.length
      ? `<nav class="pfix-post-toc" aria-labelledby="pfix-post-toc-title">` +
        `<p class="pfix-post-toc__title" id="pfix-post-toc-title">${ICONS.list}On this page</p>` +
        `<div class="pfix-post-toc__bar" aria-hidden="true"><span data-pfix-post-progress></span></div>` +
        `<ol class="pfix-post-toc__list">${toc.map((h) => `<li><a href="#${esc(h.id)}" data-pfix-post-toc="${esc(h.id)}">${esc(h.text)}</a></li>`).join('')}</ol>` +
        `</nav>`
      : '') +
    `<div class="pfix-post-card">` +
    `<p class="pfix-post-card__eyebrow">Free estimate</p>` +
    `<p class="pfix-post-card__title">Have a question about your home?</p>` +
    `<p class="pfix-post-card__text">Roofing, siding, gutters and solar from a GAF Master Elite team. Ask about 10% off a roof replacement.</p>` +
    ratingLine(r, 'pfix-post-card__rating') +
    `<a class="pfix-post-btn pfix-post-btn--primary" href="${formHref}" data-pfix-post-open>Get my free estimate${ICONS.arrow}</a>` +
    `<a class="pfix-post-btn pfix-post-btn--ghost" href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a>` +
    `</div></div></aside>`
  );
}

function postFoot(post, canonical, title) {
  const t = topicByKey(post.topic);
  const u = encodeURIComponent(canonical);
  const tt = encodeURIComponent(title);
  const share = (href, label, icon, ext = true) =>
    `<a class="pfix-post-share__btn" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''} aria-label="${esc(label)}" title="${esc(label)}">${icon}</a>`;
  return (
    `<footer class="pfix-post__foot" data-pfix-post-foot>` +
    `<p class="pfix-post-foot__topic"><span>Filed under</span> <a class="pfix-topic" data-topic="${esc(t.key)}" href="${topicHref(t.key)}">${esc(t.label)}</a></p>` +
    `<div class="pfix-post-share"><span class="pfix-post-share__label">Share this article</span>` +
    share(`https://www.facebook.com/sharer/sharer.php?u=${u}`, 'Share on Facebook', ICONS.facebook) +
    share(`https://twitter.com/intent/tweet?url=${u}&text=${tt}`, 'Share on X', ICONS.x) +
    share(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`, 'Share on LinkedIn', ICONS.linkedin) +
    share(`mailto:?subject=${tt}&body=${u}`, 'Share by email', ICONS.mail, false) +
    // Shown by blog.js, which copies the link.
    `<button type="button" class="pfix-post-share__btn" data-pfix-post-copy="${esc(canonical)}" aria-label="Copy link" title="Copy link" hidden>${ICONS.link}</button>` +
    `<span class="pfix-post-share__done" role="status" aria-live="polite" data-pfix-post-copied></span>` +
    `</div></footer>`
  );
}

function postCta(kind, post, formHref) {
  const t = topicByKey(post.topic);
  const { title, text } = t.cta || {};
  if (kind === 'mid')
    return (
      `<aside class="pfix-post-cta pfix-post-cta--mid" data-pfix-post-cta="mid" aria-label="Free estimate">` +
      `<span class="pfix-post-cta__icon">${topicIcon(t)}</span>` +
      `<span class="pfix-post-cta__text"><span class="pfix-post-cta__title">${esc(title)}</span><span class="pfix-post-cta__line">${esc(text)}</span></span>` +
      `<a class="pfix-post-btn pfix-post-btn--primary" href="${formHref}" data-pfix-post-open>Get a free estimate${ICONS.arrow}</a>` +
      `</aside>`
    );
  const r = rating();
  return (
    `<aside class="pfix-post-cta pfix-post-cta--end" data-pfix-post-cta="end" aria-label="Free estimate">` +
    `<span class="pfix-post-cta__eyebrow">Free estimate · No pressure</span>` +
    `<span class="pfix-post-cta__title">${esc(title)}</span>` +
    `<span class="pfix-post-cta__line">${esc(text)}</span>` +
    `<span class="pfix-post-cta__actions">` +
    `<a class="pfix-post-btn pfix-post-btn--primary" href="${formHref}" data-pfix-post-open>Get a free estimate${ICONS.arrow}</a>` +
    `<a class="pfix-post-btn pfix-post-btn--light" href="${PHONE.href}">${ICONS.phone}Call ${PHONE.text}</a></span>` +
    `<span class="pfix-post-cta__trust">${ratingLine(r, 'pfix-post-cta__rating')}<span>GAF Master Elite</span><span>BBB A-rated</span></span>` +
    `</aside>`
  );
}

// "Keep reading": three posts on the same topic (the newest), topped up with the newest
// posts on other topics; and the estimate form the post's buttons open (a dialog).
function postAfter(post, posts, pathname) {
  const t = topicByKey(post.topic);
  const others = posts.filter((p) => p.slug !== post.slug);
  const same = others.filter((p) => p.topic === post.topic);
  const pick = [...same, ...others.filter((p) => p.topic !== post.topic)].slice(0, 3);
  const f = serviceForm(pathname);
  return (
    `<div class="pfix-post-after" data-pfix-post-after>` +
    (pick.length
      ? `<section class="pfix-post-more" aria-labelledby="pfix-post-more-title"><div class="container">` +
        `<div class="pfix-post-more__head"><div><p class="pfix-post-more__eyebrow">Keep reading</p>` +
        `<h2 class="pfix-post-more__title" id="pfix-post-more-title">${same.length ? `More on ${esc(t.label)}` : 'More from the blog'}</h2></div>` +
        `<a class="pfix-post-more__all" href="${same.length ? topicHref(t.key) : BLOG_PATH}">${same.length ? `All ${esc(t.label)} articles` : 'All articles'}${ICONS.arrow}</a></div>` +
        `<div class="pfix-blog-grid pfix-blog-grid--more">${pick.map((p) => postCard(p)).join('')}</div>` +
        `</div></section>`
      : '') +
    (f
      ? `<dialog class="pfix-post-dialog" id="pfix-post-estimate" aria-labelledby="pfix-post-estimate-title" data-pfix-post-dialog>` +
        `<div class="pfix-post-dialog__card">` +
        `<button type="button" class="pfix-post-dialog__close" data-pfix-post-close aria-label="Close">${ICONS.close}</button>` +
        `<p class="pfix-post-dialog__title" id="pfix-post-estimate-title">${esc(f.title)}</p>` +
        `<p class="pfix-post-dialog__text">${esc(f.text)}</p>` +
        ratingLine(rating(), 'pfix-post-dialog__rating') +
        renderServiceForm({ ...f }, pathname, 'post') +
        `</div></dialog>`
      : '') +
    `</div>`
  );
}

/** A post: the title header and cover, the article beside its sidebar, the call-and-estimate
 *  bands, share links and "Keep reading" (in place of the hero, its hidden copy, the share
 *  buttons, the "Call Now" picture and "Related Posts"). The article's words stay as they are. */
function collectBlogPost(doc, html, ed, { pathname, siteDir, siteOrigin }, changes) {
  const slug = postSlug(pathname);
  const posts = loadBlogPosts(siteDir, { origin: siteOrigin });
  const post = posts.find((p) => p.slug === slug) || postFromHtml(html, pathname, { origin: siteOrigin });
  if (!post) return false;
  const loc = (n) => n.sourceCodeLocation;
  const free = (n) => n && !ed.overlaps(loc(n).startOffset, loc(n).endOffset);

  const article = find(doc, (c) => hasClass(c, 'rich-text-blog'));
  const layout = find(doc, isOwn('data-pfix-post-layout')) || (article && article.parentNode && hasClass(article.parentNode, 'Blog-detail') ? article.parentNode : null);
  const box = layout?.parentNode;
  const section = box?.parentNode;
  const hero = find(doc, isOwn('data-pfix-post-hero')) || find(doc, (c) => hasClass(c, 'hero') && find(c, (x) => hasClass(x, 'Blog-Heading')) && !isInsideNode(c, section));
  if (!article || !layout || !box || !section || !hero || ![article, layout, hero].every(free)) {
    console.warn(`blog: ${pathname}: the post's layout wasn't found, post left as is`);
    return false;
  }
  const built = !!find(doc, isOwn('data-pfix-post-hero'));

  // The canonical address and title, for the share links.
  const canonical = attr(find(doc, (c) => c.tagName === 'link' && attr(c, 'rel') === 'canonical') || {}, 'href') || (siteOrigin || SITE_ORIGIN) + pathname;
  const shareTitle = `${post.title} | Panda Exteriors`;

  // The estimate form the buttons lead to without JavaScript: the "About Our Team" form
  // below the article (blog.js opens the dialog instead).
  const teamCard = findAll(doc, (c) => hasClass(c, 'form-card')).find((c) => !isInsideNode(c, hero) && !isInsideNode(c, section));
  const formHref = teamCard && attr(teamCard, 'id') ? `#${attr(teamCard, 'id')}` : '#pfix-post-estimate';

  // Sections for "On this page", each heading with an id to link to.
  const taken = new Set(findAll(doc, (c) => attr(c, 'id')).map((c) => attr(c, 'id')));
  const toc = [];
  for (const h of sectionHeadings(article)) {
    let id = attr(h, 'id');
    if (!id) {
      const base = slugify(textOf(h));
      id = base;
      for (let i = 2; taken.has(id); i++) id = `${base}-${i}`;
      taken.add(id);
      ed.retag(h, [...h.attrs, { name: 'id', value: id }]);
    }
    toc.push({ id, text: clean(textOf(h)), node: h });
  }

  // The summary under the title, unless the article opens with the same words.
  const firstPara = findAll(article, (c) => c.tagName === 'p' && clean(textOf(c)))[0];
  const norm = (s) => clean(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 60);
  const dek = !!post.description && !(firstPara && norm(textOf(firstPara)).startsWith(norm(post.description).slice(0, 50)));

  ed.outer(hero, postHero(post, { dek }));
  ed.retag(section, [{ name: 'class', value: 'pfix-post' }]);
  ed.retag(box, [{ name: 'class', value: 'container pfix-post__container' }]);
  ed.retag(layout, [{ name: 'class', value: `pfix-post__layout${hasCover(post) ? '' : ' pfix-post__layout--flat'}` }, { name: 'data-pfix-post-layout', value: '' }]);
  if (!hasClass(article, 'pfix-post__content')) ed.retag(article, [...article.attrs.filter((a) => a.name !== 'class'), { name: 'class', value: [...classes(article), 'pfix-post__content'].join(' ') }]);
  // The hidden copy of the hero (a second h1 and form) and "Related Posts" (the same three
  // 2023 posts on every post).
  for (const c of (box.childNodes || []).filter((k) => k.tagName && (hasClass(k, 'Blog-detail-img') || hasClass(k, 'Related-Posts')))) if (free(c)) ed.outer(c, '');

  // Above the article: the cover and the phone-size "On this page" (in place of the share
  // buttons).
  const top = find(layout, isOwn('data-pfix-post-top')) || find(layout, (c) => hasClass(c, 'bde-social-share-buttons'));
  if (top && free(top)) ed.outer(top, postTop(post, toc));
  else ed.replace(loc(layout).startTag.endOffset, loc(layout).startTag.endOffset, postTop(post, toc));

  // Partway down (from four sections up): a call-and-estimate band before the middle section.
  const mid = find(article, (c) => attr(c, 'data-pfix-post-cta') === 'mid');
  if (mid) ed.outer(mid, toc.length >= 4 ? postCta('mid', post, formHref) : '');
  else if (toc.length >= 4) {
    const before = toc[Math.floor(toc.length / 2)].node;
    ed.replace(loc(before).startOffset, loc(before).startOffset, postCta('mid', post, formHref));
  }
  // At the end: the band, in place of the "Call Now - Get a Free Estimate" picture.
  const end = find(article, (c) => attr(c, 'data-pfix-post-cta') === 'end');
  const banner = findAll(article, (c) => c.tagName === 'img' && (/^Call Now/i.test(attr(c, 'alt') || '') || /\/2025\/05\/Image-4(-\d+x\d+)?\.png/.test(attr(c, 'data-lazy-src') || attr(c, 'src') || '')))
    .map((img) => {
      let n = img;
      while (n.parentNode && n.parentNode !== article && ['picture', 'a', 'figure'].includes(n.parentNode.tagName)) n = n.parentNode;
      return n;
    })
    .filter(free);
  if (end) ed.outer(end, postCta('end', post, formHref));
  else if (banner.length) {
    ed.outer(banner[banner.length - 1], postCta('end', post, formHref));
    for (const b of banner.slice(0, -1)) ed.outer(b, '');
  } else ed.append(article, postCta('end', post, formHref));

  // After the article: its topic and share links; beside it, the sidebar.
  const foot = find(layout, isOwn('data-pfix-post-foot'));
  const side = find(layout, isOwn('data-pfix-post-side'));
  if (foot && side) {
    ed.outer(foot, postFoot(post, canonical, shareTitle));
    ed.outer(side, postSide(post, toc, formHref));
  } else {
    if (foot) ed.outer(foot, '');
    if (side) ed.outer(side, '');
    ed.replace(loc(article).endOffset, loc(article).endOffset, postFoot(post, canonical, shareTitle) + postSide(post, toc, formHref));
  }

  // The share buttons' script, which is missing (on the live site too): the buttons are gone.
  for (const s of findAll(doc, (c) => c.tagName === 'script' && /\/Social_Share_Buttons\//.test(attr(c, 'src') || ''))) if (free(s)) ed.outer(s, '');

  // Below it: "Keep reading" and the estimate dialog.
  const after = find(doc, isOwn('data-pfix-post-after'));
  if (after) ed.outer(after, postAfter(post, posts, pathname));
  else ed.replace(loc(section).endOffset, loc(section).endOffset, postAfter(post, posts, pathname));

  changes.push(
    built
      ? 'blog post: rendered again'
      : `blog post: a title header with the cover shown whole (it was blown up behind the title), a readable column beside a sidebar ` +
          `(${toc.length ? `${toc.length} sections, ` : ''}free-estimate card), call-and-estimate bands, share links and "Keep reading" on ${topicByKey(post.topic).label}` +
          `${banner.length ? ' (the "Call Now" picture is now a band)' : ''}`
  );
  return true;
}
function isInsideNode(node, ancestor) {
  if (!ancestor) return false;
  for (let a = node.parentNode; a; a = a.parentNode) if (a === ancestor) return true;
  return false;
}

/** The blog's pages (listing pages and posts). Returns true when the page uses blog.css/.js. */
export function collectBlogPages(doc, html, ed, { pathname = '', siteDir, siteOrigin = SITE_ORIGIN } = {}, changes = []) {
  if (listingPage(pathname)) return collectBlogListing(doc, html, ed, { pathname, siteDir, siteOrigin }, changes);
  if (postSlug(pathname) && find(doc, (c) => hasClass(c, 'rich-text-blog'))) return collectBlogPost(doc, html, ed, { pathname, siteDir, siteOrigin }, changes);
  return false;
}
