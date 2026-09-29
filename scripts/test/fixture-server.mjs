#!/usr/bin/env node
// A local, synthetic "WordPress-like" site used to dry-run the whole pipeline
// without touching the real website. All content is placeholder text.
//
//   node scripts/test/fixture-server.mjs            # serves http://localhost:8099
//   SITE_ORIGIN=http://localhost:8099 WORK_DIR=... node scripts/01-inventory.mjs
//
// It exercises the hard cases (lazy images, srcset, <picture>, CSS @import /
// url() / @font-face, late-injected images, a slide-cloning carousel, escaped
// URLs in data-settings JSON, GTM / gtag / Meta Pixel / CallRail, forms,
// redirects, robots.txt Disallow, admin links, sub-sites) and it records
// politeness: peak concurrent requests, any non-GET request and any request
// to a forbidden back-end path. GET /__fixture_stats returns those numbers.
import http from 'node:http';
import fs from 'node:fs';
import sharp from 'sharp';

const PORT = Number(process.env.FIXTURE_PORT || 8099);
const O = `http://localhost:${PORT}`;
const J = O.replace(/\//g, '\\/');
const U = '/wp-content/uploads/2024/01';
const T = '/wp-content/themes/panda';

const stats = { requests: 0, inFlight: 0, maxInFlight: 0, violations: [], paths: {} };

// ------------------------------------------------------------------ images
async function jpg(w, h, color, label) {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-family="DejaVu Sans" font-size="${Math.max(12, Math.round(h / 8))}" fill="#fff" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer();
}
async function png(w, h, color, label) {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="55%" font-family="DejaVu Sans" font-size="${Math.round(h / 3)}" fill="#fff" text-anchor="middle">${label}</text></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
const files = new Map(); // path -> { type, body }
async function buildFiles() {
  const add = (p, type, body) => files.set(p, { type, body });
  for (const [w, h] of [[300, 200], [768, 512], [1024, 683]]) add(`${U}/photo-${w}x${h}.jpg`, 'image/jpeg', await jpg(w, h, '#2b5ca8', `photo ${w}`));
  add(`${U}/photo.jpg`, 'image/jpeg', await jpg(1600, 1067, '#2b5ca8', 'photo full'));
  add(`${U}/hero.jpg`, 'image/jpeg', await jpg(1600, 600, '#394a59', 'hero desktop'));
  add(`${U}/hero-mobile.jpg`, 'image/jpeg', await jpg(800, 800, '#59394a', 'hero mobile'));
  add(`${U}/lazy-a.jpg`, 'image/jpeg', await jpg(600, 400, '#2f7d4f', 'lazy data-src'));
  add(`${U}/lazy-b.jpg`, 'image/jpeg', await jpg(900, 600, '#7d2f6c', 'lazy b full'));
  add(`${U}/lazy-b-600x400.jpg`, 'image/jpeg', await jpg(600, 400, '#7d2f6c', 'lazy b 600'));
  add(`${U}/pic.jpg`, 'image/jpeg', await jpg(600, 300, '#8a6d1f', 'picture jpg'));
  add(`${U}/pic.webp`, 'image/webp', await sharp(await jpg(600, 300, '#8a6d1f', 'picture webp')).webp().toBuffer());
  add(`${U}/pic-mobile.webp`, 'image/webp', await sharp(await jpg(400, 400, '#1f8a82', 'picture mobile')).webp().toBuffer());
  add(`${U}/inline-bg.jpg`, 'image/jpeg', await jpg(800, 300, '#a33', 'inline style bg'));
  add(`${U}/inline-style-tag.jpg`, 'image/jpeg', await jpg(800, 300, '#3a3', 'style tag bg'));
  add(`${U}/data-bg.jpg`, 'image/jpeg', await jpg(800, 300, '#33a', 'data-bg'));
  add(`${U}/late.jpg`, 'image/jpeg', await jpg(300, 200, '#555', 'late image'));
  add(`${U}/og-image.jpg`, 'image/jpeg', await jpg(1200, 630, '#123', 'og image'));
  add(`${U}/post-one-featured.jpg`, 'image/jpeg', await jpg(800, 400, '#246', 'featured'));
  add(`${U}/slideshow-1.jpg`, 'image/jpeg', await jpg(800, 300, '#642', 'slideshow 1'));
  add(`${U}/slideshow-2.jpg`, 'image/jpeg', await jpg(800, 300, '#426', 'slideshow 2'));
  add(`${U}/poster.jpg`, 'image/jpeg', await jpg(640, 360, '#000', 'video poster'));
  for (const [i, c] of [[1, '#c0392b'], [2, '#27ae60'], [3, '#2980b9']]) add(`${U}/slide-${i}.jpg`, 'image/jpeg', await jpg(600, 200, c, `slide ${i}`));
  add(`${U}/icon-192.png`, 'image/png', await png(192, 192, '#c00', 'P'));
  add(`${U}/icon-512.png`, 'image/png', await png(512, 512, '#c00', 'P'));
  add(`${U}/apple-touch-icon.png`, 'image/png', await png(180, 180, '#c00', 'P'));
  add('/favicon.ico', 'image/x-icon', await png(32, 32, '#c00', 'P'));
  add(`${T}/img/pattern.png`, 'image/png', await png(40, 40, '#ddd', '·'));
  add(`${T}/img/unused-bg.jpg`, 'image/jpeg', await jpg(400, 200, '#999', 'css only'));
  const noise = Buffer.alloc(1400 * 1000 * 3);
  for (let i = 0; i < noise.length; i++) noise[i] = (Math.random() * 256) | 0;
  add(`${U}/big-photo.jpg`, 'image/jpeg', await sharp(noise, { raw: { width: 1400, height: 1000, channels: 3 } }).jpeg({ quality: 95 }).toBuffer());
  add(`${U}/logo.svg`, 'image/svg+xml', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40"><rect width="160" height="40" rx="6" fill="#c00"/><text x="80" y="26" font-family="DejaVu Sans" font-size="18" fill="#fff" text-anchor="middle">PANDA TEST</text></svg>'));
  add(`${T}/sprite.svg`, 'image/svg+xml', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><symbol id="phone" viewBox="0 0 24 24"><path d="M6 2h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 4 4a2 2 0 0 1 2-2z" fill="#c00"/></symbol></svg>'));
  add(`${T}/img/arrow.svg`, 'image/svg+xml', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M2 8h10M8 3l5 5-5 5" stroke="#c00" stroke-width="2" fill="none"/></svg>'));
  add(`${U}/intro.mp4`, 'video/mp4', Buffer.alloc(2048, 1));
  add(`${U}/brochure.pdf`, 'application/pdf', Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'));
  add(`${T}/fonts/brand.ttf`, 'font/ttf', fs.readFileSync('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'));
  add(`${T}/data/items.json`, 'application/json', Buffer.from(JSON.stringify({ items: ['Loaded from items.json (1)', 'Loaded from items.json (2)'] })));
  add(`${T}/style.css`, 'text/css', Buffer.from(`@import url("parts/extra.css");
@font-face { font-family: "Brand"; src: url("fonts/brand.ttf") format("truetype"); font-weight: 400; font-display: swap; }
body { margin: 0; font-family: Roboto, Arial, sans-serif; color: #222; background: #fff; }
h1, h2 { font-family: "Brand", serif; }
.site-header { display: flex; gap: 16px; align-items: center; padding: 12px 24px; background: #fff; border-bottom: 1px solid #ddd; position: sticky; top: 0; z-index: 10; flex-wrap: wrap; }
.hero { height: 420px; background: #333 url("../../uploads/2024/01/hero.jpg") center/cover no-repeat; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 42px; }
@media (max-width: 600px) { .hero { height: 300px; background-image: url('../../uploads/2024/01/hero-mobile.jpg'); font-size: 28px; } }
.slider { overflow: hidden; width: 600px; max-width: 100%; margin: 24px auto; }
.slider-track { display: flex; transform: translateX(-100%); }
.slide { flex: 0 0 100%; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; padding: 24px; }
.data-bg, .inline-bg, .inline-bg-2, .slideshow { height: 180px; background-size: cover; background-position: center; }
.icon-arrow::after { content: ""; display: inline-block; width: 16px; height: 16px; background: url(/wp-content/themes/panda/img/arrow.svg) no-repeat; }
footer { padding: 24px; background: #f4f4f4; }
img { max-width: 100%; height: auto; display: block; }
.unused { background: url(img/unused-bg.jpg); }
`));
  add(`${T}/parts/extra.css`, 'text/css', Buffer.from('.pattern { height: 60px; background: url(/wp-content/themes/panda/img/pattern.png) repeat; }\n'));
  add(`${T}/main.js`, 'application/javascript', Buffer.from(`(function () {
  document.querySelectorAll('.slider').forEach(function (slider) {
    var slides = Array.prototype.slice.call(slider.children);
    var track = document.createElement('div'); track.className = 'slider-track';
    slides.forEach(function (s) { track.appendChild(s); });
    var first = slides[0].cloneNode(true), last = slides[slides.length - 1].cloneNode(true);
    first.className += ' clone'; last.className += ' clone';
    track.insertBefore(last, track.firstChild); track.appendChild(first);
    slider.appendChild(track); slider.classList.add('slider-ready');
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      if (el.dataset.src) el.src = el.dataset.src;
      if (el.dataset.lazySrc) { el.src = el.dataset.lazySrc; if (el.dataset.lazySrcset) el.srcset = el.dataset.lazySrcset; }
      if (el.dataset.bg) el.style.backgroundImage = 'url(' + el.dataset.bg + ')';
      el.classList.add('lazyloaded'); io.unobserve(el);
    });
  }, { rootMargin: '200px' });
  document.querySelectorAll('img[data-src], img[data-lazy-src], [data-bg]').forEach(function (el) { io.observe(el); });
  setTimeout(function () {
    var box = document.querySelector('.late-box');
    if (box) { var i = new Image(); i.src = pandaCfg.assets.replace('themes/panda/', 'uploads/2024/01/') + 'late.jpg'; i.width = 300; i.alt = 'late'; box.appendChild(i); }
  }, 1200);
  document.querySelectorAll('[data-settings]').forEach(function (el) {
    try { var s = JSON.parse(el.getAttribute('data-settings')); if (s.background_slideshow_gallery) el.style.backgroundImage = 'url(' + s.background_slideshow_gallery[0].url + ')'; } catch (e) {}
  });
  fetch(pandaCfg.assets + 'data/items.json').then(function (r) { return r.json(); }).then(function (d) {
    var ul = document.querySelector('.items'); if (ul) d.items.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
  }).catch(function () {});
  fetch(pandaCfg.ajaxurl, { method: 'POST', body: 'action=view_count' }).catch(function () {});
})();
`));
  add('/wp-content/plugins/dyn/style.php', 'text/css', Buffer.from('.dyn { color: #b00; font-weight: bold; }\n'));
}

// ------------------------------------------------------------------- pages
function layout({ title, path, body, head = '', api = `${O}/wp-json/` }) {
  return `<!DOCTYPE html>
<html lang="en-US">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | Panda Test Exteriors</title>
<meta name="description" content="Placeholder description for ${title}.">
<link rel="canonical" href="${O}${path}">
<meta property="og:title" content="${title}">
<meta property="og:url" content="${O}${path}">
<meta property="og:image" content="${O}${U}/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${O}${U}/og-image.jpg">
<meta name="generator" content="WordPress 6.6.2">
<link rel="https://api.w.org/" href="${api}">
<link rel="alternate" type="application/rss+xml" title="Feed" href="${O}/feed/">
<link rel="alternate" type="application/rss+xml" title="Comments Feed" href="${O}/comments/feed/">
<link rel="shortlink" href="${O}/?p=12">
<link rel="icon" href="${O}${U}/icon-192.png" sizes="192x192">
<link rel="apple-touch-icon" href="${O}${U}/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&amp;display=swap">
<link rel="stylesheet" id="panda-style-css" href="${O}${T}/style.css?ver=1.2" media="all">
<link rel="stylesheet" href="${O}/wp-content/plugins/dyn/style.php?color=red" media="all">
<style id="inline-css">.inline-bg-2{background-image:url('${O}${U}/inline-style-tag.jpg')}</style>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"RoofingContractor","name":"Panda Test Exteriors","url":"${O}/","logo":"${O}${U}/logo.svg","image":"${O}${U}/og-image.jpg"}</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TEST123');</script>
<!-- End Google Tag Manager -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TEST45678"></script>
<script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-TEST45678');</script>
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '123456789012345');fbq('track', 'PageView');</script>
<script type="text/javascript" src="//cdn.callrail.com/companies/123456789/abcdef0123456789/12/swap.js"></script>
<script>var pandaCfg = {"ajaxurl":"${J}\\/wp-admin\\/admin-ajax.php","assets":"${J}\\/wp-content\\/themes\\/panda\\/","home":"${J}"};</script>
<script src="${O}${T}/main.js?ver=1.2" defer></script>
<script>document.addEventListener('click', function () { gtag('event', 'click'); fbq('track', 'Lead'); });</script>
${head}
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TEST123" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=123456789012345&ev=PageView&noscript=1"/></noscript>
<header class="site-header">
  <a href="${O}/" class="logo"><img src="${O}${U}/logo.svg" alt="Logo" width="160" height="40"></a>
  <nav><a href="${O}/roofing/">Roofing</a> <a href="/siding/">Siding</a> <a href="${O}/about/">About</a> <a href="${O}/blog/">Blog</a> <a href="${O}/contact/">Contact</a> <a href="/old-page/">Old page</a></nav>
  <svg class="icon" width="24" height="24"><use href="${T}/sprite.svg#phone"></use></svg>
  <a href="tel:+15555550100" class="phone icon-arrow">(555) 555-0100</a>
</header>
<main>
<h1>${title}</h1>
${body}
</main>
<footer>
  <div class="pattern"></div>
  <p><a href="${O}/hidden-page/">Hidden page</a> · <a href="${O}/private/secret/">Private</a> · <a href="${O}/wp-login.php">Log in</a> · <a href="${O}/wp-admin/">Admin</a> · <a href="http://careers.localhost:${PORT}/">Careers</a> · <a href="${O}/es/">Español</a> · <a href="${O}/contact/?service=roofing">Roofing quote</a> · <a href="${O}${U}/brochure.pdf">Brochure (PDF)</a></p>
  <form role="search" method="get" class="search-form" action="${O}/"><label for="s">Search</label> <input type="search" id="s" name="s"> <button type="submit">Search</button></form>
  <p class="dyn">Placeholder footer text.</p>
</footer>
</body>
</html>`;
}

const lorem = (n) => Array.from({ length: n }, (_, i) => `<p>Placeholder paragraph ${i + 1}. This stand-in page exists only to exercise the capture scripts.</p>`).join('\n');

const HOME = `
<section class="hero">Hero with CSS background</section>
<div class="slider"><div class="slide"><img src="${O}${U}/slide-1.jpg" alt="s1" width="600" height="200"></div><div class="slide"><img src="${O}${U}/slide-2.jpg" alt="s2" width="600" height="200"></div><div class="slide"><img src="${O}${U}/slide-3.jpg" alt="s3" width="600" height="200"></div></div>
<div class="grid">
  <img src="${O}${U}/photo-300x200.jpg" srcset="${O}${U}/photo-300x200.jpg 300w, ${O}${U}/photo-768x512.jpg 768w, ${O}${U}/photo-1024x683.jpg 1024w, ${O}${U}/photo.jpg 1600w" sizes="(max-width: 600px) 100vw, 300px" alt="srcset" width="300" height="200">
  <img data-src="${O}${U}/lazy-a.jpg" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="lazy a" width="600" height="400" class="lazyload">
  <img data-lazy-src="${O}${U}/lazy-b.jpg" data-lazy-srcset="${O}${U}/lazy-b-600x400.jpg 600w, ${O}${U}/lazy-b.jpg 900w" src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20900%20600'%3E%3C/svg%3E" alt="lazy b" width="900" height="600"><noscript><img src="${O}${U}/lazy-b.jpg" alt="lazy b"></noscript>
  <picture><source media="(max-width: 600px)" srcset="${O}${U}/pic-mobile.webp" type="image/webp"><source srcset="${O}${U}/pic.webp" type="image/webp"><img src="${O}${U}/pic.jpg" alt="picture" width="600" height="300"></picture>
  <div class="inline-bg" style="background-image: url(&quot;${O}${U}/inline-bg.jpg&quot;)"></div>
  <div class="inline-bg-2"></div>
  <div class="data-bg" data-bg="${O}${U}/data-bg.jpg"></div>
  <div class="slideshow" data-settings='{"background_slideshow_gallery":[{"id":11,"url":"${J}\\/wp-content\\/uploads\\/2024\\/01\\/slideshow-1.jpg"},{"id":12,"url":"${J}\\/wp-content\\/uploads\\/2024\\/01\\/slideshow-2.jpg"}]}'></div>
  <video controls preload="none" poster="${O}${U}/poster.jpg" width="320"><source src="${O}${U}/intro.mp4" type="video/mp4"></video>
  <img src="${O}${U}/big-photo.jpg" alt="big" width="700" height="500">
  <img src="${O}${U}/missing.jpg" alt="missing on live too" width="100" height="60">
</div>
<div class="late-box"></div>
<ul class="items"></ul>
<iframe width="560" height="315" src="https://www.youtube.com/embed/aqz-KE-bpKQ" title="Video" loading="lazy"></iframe>
<iframe src="https://www.google.com/maps/embed?pb=!1m18" width="400" height="300" loading="lazy" title="Map"></iframe>
${lorem(8)}
<p><a href="${O}/blog/post-one/">Read post one</a> · <a href="${O}/?p=12">Short link</a></p>`;

const CONTACT = `
<div role="form" class="wpcf7" id="wpcf7-f5-o1" lang="en-US"><form action="${O}/contact/#wpcf7-f5-o1" method="post" class="wpcf7-form init" novalidate="novalidate">
<input type="hidden" name="_wpcf7" value="5"><input type="hidden" name="_wpnonce" value="abc123">
<p><label for="your-name">Your name</label><input type="text" id="your-name" name="your-name" required aria-required="true"></p>
<p><label for="your-email">Email</label><input type="email" id="your-email" name="your-email" required></p>
<p><label for="your-phone">Phone</label><input type="tel" id="your-phone" name="your-phone"></p>
<p><label for="service">Service</label><select id="service" name="service"><option>Roofing</option><option>Siding</option></select></p>
<p><label for="your-message">Message</label><textarea id="your-message" name="your-message"></textarea></p>
<p><input type="submit" value="Get my free quote" class="wpcf7-submit"></p>
</form></div>
<form action="https://example.us1.list-manage.com/subscribe/post?u=abc&amp;id=def" method="post" id="mc-embedded-subscribe-form" class="validate"><input type="email" name="EMAIL" placeholder="Email for newsletter"><input type="submit" value="Subscribe"></form>
${lorem(3)}`;

const posts = [
  ['/blog/post-one/', 'Post one'],
  ['/blog/post-two/', 'Post two'],
];
const postList = posts.map(([p, t]) => `<article><h2><a href="${O}${p}">${t}</a></h2><p>Excerpt placeholder.</p></article>`).join('\n');

const PAGES = {
  '/': ['Home', HOME],
  '/roofing/': ['Roofing', `<img src="${O}${U}/photo-768x512.jpg" alt="roof" width="768" height="512">${lorem(5)}`],
  '/siding/': ['Siding', lorem(6)],
  '/about/': ['About', lorem(4)],
  '/contact/': ['Contact', CONTACT],
  '/blog/': ['Blog', `${postList}<nav class="pagination"><a href="${O}/blog/page/2/">Older posts</a></nav>`],
  '/blog/page/2/': ['Blog – Page 2', `${postList}<nav class="pagination"><a href="${O}/blog/">Newer posts</a></nav>`],
  '/blog/post-one/': ['Post one', `<img src="${O}${U}/post-one-featured.jpg" alt="featured" width="800" height="400">${lorem(4)}<p><a href="${O}/category/news/">News</a> · <a href="${O}/tag/tips/">Tips</a> · <a href="${O}/author/admin/">Author</a></p>`],
  '/blog/post-two/': ['Post two', `${lorem(4)}<p><a href="${O}/category/news/">News</a></p>`],
  '/category/news/': ['Category: News', postList],
  '/tag/tips/': ['Tag: Tips', postList],
  '/author/admin/': ['Author: admin', postList],
  '/hidden-page/': ['Hidden page', lorem(2)],
  '/private/secret/': ['Secret', lorem(1)],
};
const SUBSITE = {
  '/es/': ['Inicio', `<p><a href="${O}/es/contacto/">Contacto</a></p>`],
  '/es/contacto/': ['Contacto', '<p>Página de ejemplo.</p>'],
};
const REDIRECTS = { '/old-page/': '/about/', '/about': '/about/', '/siding': '/siding/' };

function xml(body, stylesheet = true) {
  return `<?xml version="1.0" encoding="UTF-8"?>${stylesheet ? `<?xml-stylesheet type="text/xsl" href="//localhost:${PORT}/main-sitemap.xsl"?>` : ''}\n${body}`;
}
const SITEMAPS = {
  '/sitemap_index.xml': xml(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${O}/page-sitemap.xml</loc></sitemap><sitemap><loc>${O}/post-sitemap.xml</loc></sitemap></sitemapindex>`),
  '/page-sitemap.xml': xml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/roofing/', '/siding/', '/about/', '/contact/', '/blog/', '/private/secret/'].map((p) => `<url><loc>${O}${p}</loc></url>`).join('')}</urlset>`),
  '/post-sitemap.xml': xml(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"><url><loc>${O}/blog/post-one/</loc><image:image><image:loc>${O}${U}/post-one-featured.jpg</image:loc></image:image></url><url><loc>${O}/blog/post-two/</loc></url></urlset>`),
};
const FEED = (title) => `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${title}</title><link>${O}/</link>${posts.map(([p, t]) => `<item><title>${t}</title><link>${O}${p}</link></item>`).join('')}</channel></rss>`;
const ROBOTS = `User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\nDisallow: /private/\n\nSitemap: ${O}/sitemap_index.xml\n`;
const MANIFEST = JSON.stringify({ name: 'Panda Test', icons: [{ src: `${U}/icon-192.png`, sizes: '192x192', type: 'image/png' }, { src: `${O}${U}/icon-512.png`, sizes: '512x512', type: 'image/png' }] });

const FORBIDDEN = /^\/(wp-admin|wp-login\.php|wp-json|xmlrpc\.php)/;

// ------------------------------------------------------------------ server
await buildFiles();
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, O);
  const p = url.pathname;
  if (p === '/__fixture_stats') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ...stats, inFlight: stats.inFlight }));
  }
  stats.requests++;
  stats.inFlight++;
  stats.maxInFlight = Math.max(stats.maxInFlight, stats.inFlight);
  stats.paths[p] = (stats.paths[p] || 0) + 1;
  const send = (status, type, body, headers = {}) => {
    setTimeout(() => {
      stats.inFlight--;
      res.writeHead(status, { 'content-type': type, ...headers });
      res.end(req.method === 'HEAD' ? undefined : body);
    }, 40);
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    stats.violations.push(`${req.method} ${req.url}`);
    return send(405, 'text/plain', 'method not allowed');
  }
  if (FORBIDDEN.test(p)) {
    stats.violations.push(`GET ${req.url} (forbidden back-end path)`);
    return send(403, 'text/plain', 'forbidden');
  }
  if (p === '/' && url.searchParams.get('p') === '12') return send(301, 'text/html', '', { location: `${O}/blog/post-one/` });
  if (REDIRECTS[p]) return send(301, 'text/html', '', { location: `${O}${REDIRECTS[p]}` });
  if (p === '/robots.txt') return send(200, 'text/plain; charset=utf-8', ROBOTS);
  if (SITEMAPS[p]) return send(200, 'application/xml; charset=UTF-8', SITEMAPS[p]);
  if (p === '/main-sitemap.xsl') return send(200, 'text/xsl', '<?xml version="1.0"?><xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:template match="/"><html><body>Sitemap</body></html></xsl:template></xsl:stylesheet>');
  if (p === '/feed/') return send(200, 'application/rss+xml; charset=UTF-8', FEED('Panda Test Exteriors'));
  if (p === '/comments/feed/') return send(200, 'application/rss+xml; charset=UTF-8', FEED('Comments'));
  if (p === '/site.webmanifest') return send(200, 'application/manifest+json', MANIFEST);
  if (files.has(p)) {
    const f = files.get(p);
    return send(200, f.type, f.body);
  }
  if (PAGES[p]) {
    const [title, body] = PAGES[p];
    return send(200, 'text/html; charset=UTF-8', layout({ title, path: p, body }));
  }
  if (SUBSITE[p]) {
    const [title, body] = SUBSITE[p];
    return send(200, 'text/html; charset=UTF-8', layout({ title, path: p, body, api: `${O}/es/wp-json/` }));
  }
  return send(404, 'text/html; charset=UTF-8', layout({ title: 'Page not found', path: p, body: '<p>Sorry, that page does not exist. <a href="/">Go home</a>.</p>' }));
});
server.listen(PORT, () => console.log(`fixture site on ${O}`));
