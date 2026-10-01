// The Media page (/media/). The header's "Media" menu item (Blog and Podcast under it)
// went nowhere: its own link was "#". It now leads to this page, which sets the blog and
// the podcast side by side:
//  - the newest blog post, large, with the next few below it;
//  - Panda Vision, the company's video podcast: the newest episode in a player, every
//    episode, and the ways to watch it (on the page, on Apple Podcasts, in any podcast app).
//
// The page is generated rather than captured: it is a built page (TEMPLATE) with everything
// between its header and its footer replaced, and its title, description, canonical address,
// social tags and structured data rewritten for /media/. The posts come from the site's own
// feed (site/feed/index.xml), so the page shows the newest post of whichever capture it is
// built from; the podcast comes from custom/media/podcast.json, which
// scripts/tools/media-podcast.mjs refreshes from the show's feed.
//
// collectMediaNav (run by customize.mjs on every page) points the menu item at the page;
// buildMediaPage writes it (03-build.mjs, scripts/tools/update-built-site.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { parse, parseFragment } from 'parse5';
import { ROOT } from './config.mjs';
import { attr, hasClass, esc, textOf, clean, findAll, find, makeEditor, editText, textNodes, headEndOffset } from './html-edit.mjs';

export const MEDIA_DIR = path.join(ROOT, 'custom', 'media');
export const MEDIA_PATH = '/media/';
// Where the stylesheet and script are published in site/ (and linked from the page).
export const MEDIA_FILES = { 'media.css': '/_custom/media/media.css', 'media.js': '/_custom/media/media.js' };
// The built page whose header and footer the Media page reuses.
const TEMPLATE = '/podcast/';
// Posts listed under the newest one.
const MORE_POSTS = 3;
const WORDS_PER_MINUTE = 238;
// The phone-only first entry of the menu's dropdown, which leads to the page itself
// (like "About Us" under About). It said "Blog", the same as the entry below it.
const PHONE_LABEL = 'Media Hub';

// ------------------------------------------------------------ the menu item
/** Points the header's "Media" menu item (and its phone-only first entry) at /media/. */
export function collectMediaNav(doc, html, ed, changes, { current = false } = {}) {
  let n = 0;
  for (const item of findAll(doc, (c) => hasClass(c, 'has_dropdown'))) {
    const link = (item.childNodes || []).find((c) => c.tagName === 'a');
    if (!link || clean(textOf(link)) !== 'Media') continue;
    const href = attr(link, 'href') || '';
    const wantCurrent = current && attr(link, 'aria-current') !== 'page';
    if (href === '#' || href === '' || wantCurrent) {
      const attrs = link.attrs.map((a) => (a.name === 'href' ? { name: 'href', value: MEDIA_PATH } : a));
      if (!link.attrs.some((a) => a.name === 'href')) attrs.push({ name: 'href', value: MEDIA_PATH });
      if (wantCurrent) attrs.push({ name: 'aria-current', value: 'page' });
      ed.retag(link, attrs);
      n++;
    }
    const menu = (item.childNodes || []).find((c) => hasClass(c, 'sub_menu'));
    const phone = menu && (menu.childNodes || []).find((c) => hasClass(c, 'mobile-show'));
    const phoneLink = phone && find(phone, (c) => c.tagName === 'a');
    if (phoneLink && clean(textOf(phoneLink)) === 'Blog') {
      ed.retag(phoneLink, phoneLink.attrs.map((a) => (a.name === 'href' ? { name: 'href', value: MEDIA_PATH } : a)));
      for (const t of textNodes(phoneLink)) editText(ed, html, t, (s) => s.replace('Blog', PHONE_LABEL));
    }
  }
  if (n) changes.push(`header menu: "Media" -> ${MEDIA_PATH} (it went nowhere)`);
  return n > 0;
}

// --------------------------------------------------------------- the posts
const cdata = (s) => (s || '').replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1');
const tag = (xml, name) => cdata(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(xml)?.[1] || '').trim();
const tags = (xml, name) => [...xml.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'g'))].map((m) => cdata(m[1]).trim());
const plain = (html) => clean(textOf(parseFragment(html)));
const metaContent = (doc, key) => attr(find(doc, (c) => c.tagName === 'meta' && (attr(c, 'property') === key || attr(c, 'name') === key)) || {}, 'content') || '';

// A local picture of the post: its social image (og:image) with every smaller size
// WordPress made of it, and their WebP copies when the site has all of them.
function localImage(siteDir, doc, alt) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(metaContent(doc, 'og:image')).pathname);
  } catch {
    return null;
  }
  const has = (p) => fs.existsSync(path.join(siteDir, p));
  if (!pathname.startsWith('/') || !has(pathname)) return null;
  const dir = path.posix.dirname(pathname);
  // The social image can itself be one of the sizes (name-1024x572.jpg): its siblings share
  // the name without the size.
  const m = /^(.*?)(?:-\d+x\d+)?(\.(?:png|jpe?g))$/i.exec(path.posix.basename(pathname));
  const sizes = [];
  if (m) {
    const re = new RegExp(`^${m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)x(\\d+)${m[2].replace('.', '\\.')}$`, 'i');
    for (const f of fs.readdirSync(path.join(siteDir, dir))) {
      const s = re.exec(f);
      if (s && `${dir}/${f}` !== pathname) sizes.push({ src: `${dir}/${f}`, w: Number(s[1]), h: Number(s[2]) });
    }
  }
  sizes.sort((a, b) => a.w - b.w);
  const width = Number(metaContent(doc, 'og:image:width')) || 0;
  const height = Number(metaContent(doc, 'og:image:height')) || 0;
  const webp = [pathname, ...sizes.map((s) => s.src)].every((p) => has(`${p}.webp`));
  return { src: pathname, alt, width, height, sizes, webp };
}

/** The newest posts in the site's feed whose pages are in the copy, newest first. */
export function latestPosts(siteDir, siteOrigin, count = 1 + MORE_POSTS) {
  const feed = path.join(siteDir, 'feed', 'index.xml');
  if (!fs.existsSync(feed)) return [];
  const host = new URL(siteOrigin).hostname.replace(/^www\./, '');
  const posts = [];
  for (const [, item] of fs.readFileSync(feed, 'utf8').matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    let u;
    try {
      u = new URL(tag(item, 'link'));
    } catch {
      continue;
    }
    if (u.hostname.replace(/^www\./, '') !== host) continue;
    const page = path.join(siteDir, decodeURIComponent(u.pathname), 'index.html');
    if (!fs.existsSync(page)) continue;
    const doc = parse(fs.readFileSync(page, 'utf8'));
    const title = plain(tag(item, 'title'));
    const words = plain(tag(item, 'content:encoded')).split(/\s+/).filter(Boolean).length;
    posts.push({
      href: u.pathname,
      title,
      date: new Date(tag(item, 'pubDate')),
      author: plain(tag(item, 'dc:creator')),
      category: metaContent(doc, 'article:section') || plain(tags(item, 'category')[0] || ''),
      excerpt: plain(tag(item, 'description')).replace(/\s*\[(?:…|&#8230;|\.\.\.)\]\s*$/, '').replace(/[\s,;:]+$/, ''),
      minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
      image: localImage(siteDir, doc, metaContent(doc, 'og:image:alt') || title),
    });
  }
  return posts.sort((a, b) => b.date - a.date).slice(0, count);
}

// ------------------------------------------------------------- the podcast
let podcastCache;
export function loadPodcast() {
  if (podcastCache) return podcastCache;
  const file = path.join(MEDIA_DIR, 'podcast.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const episodes = (data.episodes || []).map((e, i) => {
    if (!e.title || !e.video || !e.date) throw new Error(`custom/media/podcast.json: episode ${i + 1} needs a "title", a "video" and a "date"`);
    return { ...e, date: new Date(e.date) };
  });
  if (!data.show?.title || !episodes.length) throw new Error('custom/media/podcast.json: needs a show title and at least one episode');
  podcastCache = { show: data.show, episodes: episodes.sort((a, b) => b.date - a.date) };
  return podcastCache;
}

// A poster's WebP copy, and its small copy for the episode list (scripts/tools/media-podcast.mjs).
const webp = (src) => src.replace(/\.jpe?g$/i, '.webp');
const small = (src) => src.replace(/(\.jpe?g)$/i, '-sm$1');

/** Every file the page uses from custom/media/, as [source file, published path]. */
export function mediaFiles() {
  const { show, episodes } = loadPodcast();
  const images = [show.cover, ...episodes.flatMap((e) => (e.poster ? [e.poster, small(e.poster)] : []))].filter(Boolean).flatMap((p) => [p, webp(p)]);
  return [...Object.entries(MEDIA_FILES), ...[...new Set(images)].map((rel) => [rel, `/_custom/media/${rel}`])]
    .map(([rel, url]) => [path.join(MEDIA_DIR, rel), url])
    .filter(([file]) => fs.existsSync(file));
}

// ------------------------------------------------------------------ markup
const longDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });
const shortDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });
const isoDate = (d) => d.toISOString().slice(0, 10);
const minutes = (s) => `${Math.max(1, Math.round(s / 60))} min`;
const asset = (rel) => `/_custom/media/${rel}`;

const icon = (body, cls = '') => `<svg class="pmedia-icon${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
const stroke = (d) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
const ICONS = {
  arrow: icon(stroke('M5 12h14M13 6l6 6-6 6')),
  external: icon(stroke('M7 17 17 7M9 7h8v8')),
  play: icon('<path d="M8 5.6v12.8a1 1 0 0 0 1.52.85l10.2-6.4a1 1 0 0 0 0-1.7L9.52 4.75A1 1 0 0 0 8 5.6z" fill="currentColor"/>'),
  article: icon(stroke('M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7')),
  mic: icon(stroke('M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3')),
  screen: icon(stroke('M3 5h18v12H3zM8 21h8M12 17v4') + '<path d="M10.5 8.6v4.8l4-2.4z" fill="currentColor"/>'),
  podcast: icon(stroke('M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM12 15v6M8.2 15.8a5.5 5.5 0 1 1 7.6 0M5.6 18.3a9 9 0 1 1 12.8 0')),
  rss: icon(stroke('M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14') + '<circle cx="6" cy="18" r="1.6" fill="currentColor"/>'),
  copy: icon(stroke('M9 9h11v11H9zM5 15H4V4h11v1')),
  check: icon(stroke('m5 12.5 4.5 4.5L19 7')),
};

// A <picture> of a post image: the sizes up to maxWidth (the full image when it is no
// wider, or when it is all there is), in WebP where the site has it.
function picture(img, { sizes, loading = 'lazy', maxWidth = Infinity } = {}) {
  const all = [...img.sizes, ...(img.width ? [{ src: img.src, w: img.width, h: img.height }] : [])].sort((a, b) => a.w - b.w);
  const variants = all.filter((s) => s.w <= maxWidth);
  const used = variants.length ? variants : [all[0] || { src: img.src }];
  const set = (fn) => (used.every((s) => s.w) ? used.map((s) => `${fn(s.src)} ${s.w}w`).join(', ') : '');
  const src = used[used.length - 1];
  const ratio = img.width && img.height ? [img.width, img.height] : src.w && src.h ? [src.w, src.h] : null;
  const srcset = set((s) => s);
  return (
    `<picture>` +
    (img.webp ? `<source type="image/webp" srcset="${esc(set((s) => `${s}.webp`) || `${src.src}.webp`)}"${srcset ? ` sizes="${esc(sizes)}"` : ''}>` : '') +
    `<img src="${esc(src.src)}"${srcset ? ` srcset="${esc(srcset)}" sizes="${esc(sizes)}"` : ''}${ratio ? ` width="${ratio[0]}" height="${ratio[1]}"` : ''}` +
    ` alt="${esc(img.alt)}" loading="${loading}" decoding="async">` +
    `</picture>`
  );
}

function renderPost(post) {
  const img = post.image;
  const meta =
    `<p class="pmedia-meta"><span class="pmedia-chip pmedia-chip--new">New</span>` +
    (post.category ? `<span class="pmedia-chip">${esc(post.category)}</span>` : '') +
    `<time datetime="${isoDate(post.date)}">${longDate.format(post.date)}</time>` +
    `<span class="pmedia-dot" aria-hidden="true"></span><span>${post.minutes} min read</span></p>`;
  const initials = post.author.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    `<article class="pmedia-post">` +
    (img
      ? `<a class="pmedia-post__media" href="${esc(post.href)}" tabindex="-1" aria-hidden="true">${picture(img, { sizes: '(min-width: 1100px) 600px, (min-width: 1024px) 46vw, calc(100vw - 32px)', loading: 'eager' })}</a>`
      : '') +
    `<div class="pmedia-post__body">${meta}` +
    `<h3 class="pmedia-post__title"><a href="${esc(post.href)}">${esc(post.title)}</a></h3>` +
    (post.excerpt ? `<p class="pmedia-post__excerpt">${esc(post.excerpt)}…</p>` : '') +
    `<div class="pmedia-post__foot">` +
    (post.author ? `<span class="pmedia-author"><span class="pmedia-author__badge" aria-hidden="true">${esc(initials)}</span>By ${esc(post.author)}</span>` : '<span></span>') +
    `<a class="pmedia-btn pmedia-btn--green" href="${esc(post.href)}">Read the article${ICONS.arrow}<span class="pmedia-sr"> “${esc(post.title)}”</span></a>` +
    `</div></div></article>`
  );
}

const renderMorePost = (post) =>
  `<a class="pmedia-more__item" role="listitem" href="${esc(post.href)}">` +
  (post.image ? `<span class="pmedia-more__thumb">${picture({ ...post.image, alt: '' }, { sizes: '112px', maxWidth: 400 })}</span>` : '') +
  `<span class="pmedia-more__text"><span class="pmedia-more__name">${esc(post.title)}</span>` +
  `<span class="pmedia-more__meta"><time datetime="${isoDate(post.date)}">${shortDate.format(post.date)}</time> · ${post.minutes} min read</span></span>` +
  `${ICONS.arrow}</a>`;

const episodeLabel = (e) => (e.number ? `Episode ${e.number}` : 'Episode');
const episodeMeta = (e) => `${shortDate.format(e.date)} · ${minutes(e.duration)}`;
const posterUrl = (e, show) => (e.poster ? asset(e.poster) : show.cover ? asset(show.cover) : '');

function renderEpisode(e, show, current) {
  const poster = e.poster || show.cover;
  const hasSmall = e.poster && fs.existsSync(path.join(MEDIA_DIR, small(e.poster)));
  const set = (fn) => (hasSmall ? `${fn(asset(small(poster)))} 480w, ${fn(asset(poster))} 1280w` : fn(asset(poster)));
  const sizes = hasSmall ? ' sizes="(min-width: 1024px) 250px, (min-width: 640px) 30vw, 112px"' : '';
  return (
    `<a class="pmedia-ep${current ? ' is-current' : ''}" role="listitem" href="${esc(e.apple || show.apple)}" target="_blank" rel="noopener"` +
    ` data-video="${esc(e.video)}" data-type="${esc(e.videoType || 'video/mp4')}" data-poster="${esc(posterUrl(e, show))}"` +
    ` data-label="${esc(episodeLabel(e))}" data-title="${esc(e.title)}" data-meta="${esc(episodeMeta(e))}" data-date="${isoDate(e.date)}"` +
    ` data-summary="${esc(e.summary || '')}" data-apple="${esc(e.apple || show.apple)}"${current ? ' aria-current="true"' : ''}>` +
    `<span class="pmedia-ep__thumb">` +
    (poster
      ? `<picture><source type="image/webp" srcset="${esc(set(webp))}"${sizes}>` +
        `<img src="${esc(asset(hasSmall ? small(poster) : poster))}"${hasSmall ? ` srcset="${esc(set((x) => x))}"${sizes}` : ''} alt="" width="480" height="270" loading="lazy" decoding="async"></picture>`
      : '') +
    `<span class="pmedia-ep__play">${ICONS.play}</span><span class="pmedia-ep__now">Now playing</span>` +
    (e.duration ? `<span class="pmedia-ep__len">${minutes(e.duration)}</span>` : '') +
    `</span>` +
    `<span class="pmedia-ep__text"><span class="pmedia-ep__num">${esc(episodeLabel(e))}</span>` +
    `<span class="pmedia-ep__title">${esc(e.title)}</span><span class="pmedia-ep__meta"><time datetime="${isoDate(e.date)}">${shortDate.format(e.date)}</time></span></span>` +
    `</a>`
  );
}

function renderPodcast({ show, episodes }) {
  const e = episodes[0];
  const poster = posterUrl(e, show);
  const ways = [
    {
      icon: ICONS.screen,
      title: 'Right here',
      text: 'Press play above, or pick any episode below, and it streams right on this page at full quality (up to 4K), so Wi-Fi works best.',
    },
    {
      icon: ICONS.podcast,
      title: 'Apple Podcasts',
      text: `Follow ${esc(show.title)} on your iPhone, iPad, Mac or the web, and every new episode shows up on its own.`,
      action: `<a class="pmedia-btn pmedia-btn--ghost" href="${esc(show.apple)}" target="_blank" rel="noopener">Open in Apple Podcasts${ICONS.external}</a>`,
    },
    {
      icon: ICONS.rss,
      title: 'Any podcast app',
      text: 'Pocket Casts, Overcast, Castro and the rest: add the show with its feed link.',
      action:
        `<div class="pmedia-copy" data-pmedia-copy><label class="pmedia-sr" for="pmedia-feed">Feed link for ${esc(show.title)}</label>` +
        `<input class="pmedia-copy__field" id="pmedia-feed" type="text" value="${esc(show.feed)}" readonly spellcheck="false">` +
        `<button class="pmedia-copy__btn" type="button" hidden>${ICONS.copy}${ICONS.check}<span class="pmedia-copy__label">Copy link</span></button>` +
        `<span class="pmedia-sr" role="status" aria-live="polite"></span></div>`,
    },
  ];
  return (
    `<div class="pmedia-player" data-pmedia-player>` +
    `<video class="pmedia-player__video" controls preload="none" playsinline${poster ? ` poster="${esc(poster)}"` : ''} aria-label="${esc(`${show.title}, ${episodeLabel(e)}: ${e.title}`)}">` +
    `<source src="${esc(e.video)}" type="${esc(e.videoType || 'video/mp4')}">` +
    `<a href="${esc(e.apple || show.apple)}">Watch “${esc(e.title)}” on Apple Podcasts</a></video>` +
    `<button class="pmedia-player__start" type="button" hidden><span class="pmedia-player__ring">${ICONS.play}</span>` +
    `<span class="pmedia-player__cta">Play <span data-pmedia-field="label">${esc(episodeLabel(e))}</span></span></button>` +
    `<p class="pmedia-player__error" hidden>This episode can’t play here right now. <a data-pmedia-field="apple" href="${esc(e.apple || show.apple)}" target="_blank" rel="noopener">Watch it on Apple Podcasts</a>.</p>` +
    `</div>` +
    `<div class="pmedia-now" aria-live="polite">` +
    `<p class="pmedia-meta pmedia-meta--dark"><span class="pmedia-chip pmedia-chip--green" data-pmedia-field="label">${esc(episodeLabel(e))}</span>` +
    `<span data-pmedia-field="meta">${esc(episodeMeta(e))}</span></p>` +
    `<h3 class="pmedia-now__title" data-pmedia-field="title">${esc(e.title)}</h3>` +
    `<p class="pmedia-now__summary" data-pmedia-field="summary">${esc(e.summary || '')}</p>` +
    `</div>` +
    `<div class="pmedia-block"><h3 class="pmedia-block__title">How to watch</h3>` +
    `<div class="pmedia-ways" role="list">` +
    ways
      .map(
        (w, i) =>
          `<div class="pmedia-way" role="listitem"><span class="pmedia-way__icon">${w.icon}<span class="pmedia-way__step">${i + 1}</span></span>` +
          `<div class="pmedia-way__body"><h4 class="pmedia-way__title">${w.title}</h4><p class="pmedia-way__text">${w.text}</p>${w.action || ''}</div></div>`
      )
      .join('') +
    `</div></div>`
  );
}

// Every episode, in a row across the page under the two halves.
const renderEpisodes = ({ show, episodes }) =>
  `<section class="pmedia-shelf" id="episodes" aria-labelledby="pmedia-episodes-title"><div class="pmedia-shelf__inner">` +
  `<div class="pmedia-shelf__head"><div><p class="pmedia-kicker">${ICONS.mic}${esc(show.title)} podcast</p>` +
  `<h2 class="pmedia-panel__title" id="pmedia-episodes-title">Every episode <span class="pmedia-count">${episodes.length}</span></h2></div>` +
  `<p class="pmedia-shelf__note">Pick an episode to watch it.</p></div>` +
  `<div class="pmedia-eps" role="list">${episodes.map((ep, i) => renderEpisode(ep, show, i === 0)).join('')}</div>` +
  `</div></section>`;

export function renderMedia({ posts, podcast }) {
  const [post, ...more] = posts;
  const { show } = podcast;
  return (
    `<main class="pmedia" id="media">` +
    `<header class="pmedia-hero"><div class="pmedia-hero__inner">` +
    `<p class="pmedia-eyebrow">Panda Media</p>` +
    `<h1 class="pmedia-hero__title">Read the latest. <span>Watch the newest.</span></h1>` +
    `<p class="pmedia-hero__lead">Straight-talk roofing advice from our blog, side by side with ${esc(show.title)}, the video podcast about the people behind Panda.</p>` +
    `<nav class="pmedia-jump" aria-label="On this page">` +
    `<a class="pmedia-jump__link pmedia-jump__link--blog" href="#latest-article">${ICONS.article}Latest article</a>` +
    `<a class="pmedia-jump__link pmedia-jump__link--podcast" href="#panda-vision">${ICONS.play}Watch ${esc(show.title)}</a>` +
    `</nav></div></header>` +
    `<div class="pmedia-split">` +
    `<section class="pmedia-panel pmedia-panel--blog" id="latest-article" aria-labelledby="pmedia-blog-title"><div class="pmedia-panel__inner">` +
    `<div class="pmedia-panel__head"><p class="pmedia-kicker">${ICONS.article}From the blog</p>` +
    `<h2 class="pmedia-panel__title" id="pmedia-blog-title">Our latest article</h2></div>` +
    (post
      ? renderPost(post) +
        (more.length
          ? `<div class="pmedia-block"><h3 class="pmedia-block__title">More recent articles</h3><div class="pmedia-more" role="list">${more.map(renderMorePost).join('')}</div></div>`
          : '')
      : `<p class="pmedia-empty">Our newest articles are on the blog.</p>`) +
    `<a class="pmedia-link" href="/blog/">Browse every article${ICONS.arrow}</a>` +
    `</div></section>` +
    `<section class="pmedia-panel pmedia-panel--podcast" id="panda-vision" aria-labelledby="pmedia-podcast-title"><div class="pmedia-panel__inner">` +
    `<div class="pmedia-panel__head"><p class="pmedia-kicker">${ICONS.mic}${esc(show.title)} podcast</p>` +
    `<h2 class="pmedia-panel__title" id="pmedia-podcast-title">Watch the newest episode</h2></div>` +
    renderPodcast(podcast) +
    `</div></section>` +
    `</div>` +
    renderEpisodes(podcast) +
    `</main>`
  );
}

// ------------------------------------------------------------------ the page
const TITLE = 'Media | Panda Exteriors';
const DESCRIPTION =
  'The latest roofing advice from the Panda Exteriors blog, side by side with Panda Vision, our video podcast: every episode, and how to watch it on the web, Apple Podcasts or any podcast app.';

function jsonLd({ url, siteOrigin, post, podcast }) {
  const graph = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#webpage`,
    url,
    name: TITLE,
    description: DESCRIPTION,
    inLanguage: 'en-US',
    isPartOf: { '@type': 'WebSite', url: `${siteOrigin}/`, name: 'Panda Exteriors' },
    hasPart: [
      ...(post
        ? [{ '@type': 'BlogPosting', headline: post.title, url: siteOrigin + post.href, datePublished: post.date.toISOString(), ...(post.author ? { author: { '@type': 'Person', name: post.author } } : {}) }]
        : []),
      {
        '@type': 'PodcastSeries',
        name: podcast.show.title,
        url: podcast.show.apple,
        webFeed: podcast.show.feed,
        author: { '@type': 'Organization', name: 'Panda Exteriors' },
      },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>`;
}

/**
 * The Media page, built from the template page in siteDir. Returns { html, post, episodes }
 * or null (with a warning) when the template or the podcast data is missing.
 */
export function buildMediaPage({ siteDir, siteOrigin }) {
  const templateFile = path.join(siteDir, TEMPLATE, 'index.html');
  if (!fs.existsSync(templateFile)) {
    console.warn(`media page: the template page ${TEMPLATE} is not in the site, /media/ not built`);
    return null;
  }
  const podcast = loadPodcast();
  const posts = latestPosts(siteDir, siteOrigin);
  if (!posts.length) console.warn('media page: no blog posts found in site/feed/index.xml; the page links to the blog instead');
  const html = fs.readFileSync(templateFile, 'utf8');
  const doc = parse(html, { sourceCodeLocationInfo: true });
  const ed = makeEditor(html);
  const url = siteOrigin + MEDIA_PATH;

  // Body: everything between the header and the footer becomes the Media page.
  const body = find(doc, (c) => c.tagName === 'body');
  const blocks = (body?.childNodes || []).filter((c) => c.tagName);
  const nav = blocks.find((c) => hasClass(c, 'nav'));
  const footer = blocks.find((c) => hasClass(c, 'footer'));
  if (!nav || !footer || footer.sourceCodeLocation.startOffset < nav.sourceCodeLocation.endOffset) {
    console.warn(`media page: no header and footer found in ${TEMPLATE}, /media/ not built`);
    return null;
  }
  ed.replace(nav.sourceCodeLocation.endOffset, footer.sourceCodeLocation.startOffset, renderMedia({ posts, podcast }));
  collectMediaNav(doc, html, ed, [], { current: true });
  // The template's WordPress page id -> this page's own name.
  ed.retag(body, body.attrs.map((a) => (a.name === 'class' ? { name: 'class', value: a.value.replace(/\bpage-id-\d+\b/, 'page-media') } : a)));

  // Head: this page's title, description, address and social tags.
  const head = find(doc, (c) => c.tagName === 'head');
  const inHead = (pred) => findAll(head, pred);
  const titleEl = inHead((c) => c.tagName === 'title')[0];
  if (titleEl) ed.inner(titleEl, esc(TITLE));
  const content = { description: DESCRIPTION, 'og:type': 'website', 'og:title': TITLE, 'og:description': DESCRIPTION, 'og:url': url, 'twitter:title': TITLE, 'twitter:description': DESCRIPTION };
  const drop = new Set(['og:updated_time', 'article:published_time', 'article:modified_time', 'article:section', 'twitter:label1', 'twitter:data1']);
  for (const m of inHead((c) => c.tagName === 'meta')) {
    const key = attr(m, 'property') || attr(m, 'name');
    if (drop.has(key)) ed.outer(m, '');
    else if (key in content) ed.retag(m, m.attrs.map((a) => (a.name === 'content' ? { name: 'content', value: content[key] } : a)));
  }
  const ld = jsonLd({ url, siteOrigin, post: posts[0], podcast });
  let ldDone = false;
  for (const el of inHead((c) => c.tagName === 'link' || c.tagName === 'script')) {
    const rel = attr(el, 'rel') || '';
    const href = attr(el, 'href') || attr(el, 'src') || '';
    if (rel === 'canonical') ed.retag(el, el.attrs.map((a) => (a.name === 'href' ? { name: 'href', value: url } : a)));
    // The template page's own entries in the WordPress API, its short link and oEmbed.
    else if (rel === 'shortlink' || (rel === 'alternate' && /\/wp-json\//.test(href))) ed.outer(el, '');
    // Stylesheets and scripts of sections the Media page doesn't have.
    else if (/^\/_custom\/(us-map|reviews)\//.test(href)) ed.outer(el, '');
    else if (el.tagName === 'script' && attr(el, 'type') === 'application/ld+json') {
      ed.outer(el, ldDone ? '' : ld);
      ldDone = true;
    }
  }
  const headEnd = headEndOffset(html);
  if (headEnd < 0) throw new Error(`media page: ${TEMPLATE} has no </head>`);
  ed.replace(headEnd, headEnd, (ldDone ? '' : ld) + `<link rel="stylesheet" href="${MEDIA_FILES['media.css']}"><script src="${MEDIA_FILES['media.js']}" defer></script>`);
  // Connection hints for hosts only the template's own sections used (its video player).
  const out = ed.apply();
  const hint = /<link\b(?=[^>]*\brel="(?:preconnect|dns-prefetch)")[^>]*\bhref="https?:\/\/([^/"]+)[^"]*"[^>]*>/g;
  const html2 = out.replace(hint, (tagHtml, host) => (out.split(host).length - 1 > 1 ? tagHtml : ''));
  return { html: html2, post: posts[0] || null, episodes: podcast.episodes.length };
}
