// Shared Playwright routines. The live capture (02) and the local verification
// (04) use exactly the same visit / scroll / screenshot procedure so their
// screenshots are comparable.
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { VIEWPORTS } from './config.mjs';

export const CONTEXT_DEFAULTS = {
  locale: 'en-US',
  timezoneId: 'America/New_York',
  colorScheme: 'light',
  serviceWorkers: 'block', // so every request passes through our route handler
  acceptDownloads: false,
};

export async function launchBrowser() {
  // When an HTTPS proxy is configured (as in sandboxed CI/cloud environments),
  // route internet traffic through it but keep the local verification server
  // direct: Playwright otherwise forces loopback traffic through the proxy too.
  if (process.env.HTTPS_PROXY) process.env.PLAYWRIGHT_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK = '1';
  const proxy = process.env.HTTPS_PROXY
    ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1,[::1],*.localhost' }
    : undefined;
  return chromium.launch({
    proxy,
    args: ['--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars'],
  });
}

// Seeded Math.random so "random" widgets (testimonial rotators etc.) pick the
// same item on the live site and on the copy.
const INIT_SCRIPT = `(() => {
  let s = 0x2f6b3a1d;
  Math.random = function () {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();`;

export async function newContext(browser, vpName) {
  const vp = VIEWPORTS[vpName];
  const context = await browser.newContext({
    ...CONTEXT_DEFAULTS,
    viewport: { width: vp.width, height: vp.height },
    userAgent: vp.userAgent,
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    deviceScaleFactor: vp.deviceScaleFactor,
  });
  await context.addInitScript(INIT_SCRIPT);
  return context;
}

async function settle(page, ms) {
  await page.waitForLoadState('networkidle', { timeout: ms }).catch(() => {});
}

/**
 * Load a URL like a visitor: wait for load, nudge the mouse (sites that delay
 * scripts until first interaction), scroll slowly to the bottom so lazy images,
 * sliders and delayed scripts load, wait for the network to go quiet, then go
 * back to the top.
 */
export async function visit(page, url, vpName) {
  const vp = VIEWPORTS[vpName];
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForLoadState('load', { timeout: 60_000 }).catch(() => {});
  await settle(page, 10_000);
  try {
    await page.mouse.move(vp.width / 2, Math.min(300, vp.height / 2));
    await page.mouse.move(vp.width / 2 + 40, Math.min(340, vp.height / 2 + 40), { steps: 4 });
  } catch {
    /* mobile contexts without a mouse are fine */
  }
  const step = Math.round(vp.height * 0.6);
  let y = 0;
  let stable = 0;
  let lastHeight = 0;
  for (let i = 0; i < 250; i++) {
    const height = await page.evaluate(() =>
      Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0),
    );
    if (y + vp.height >= height) {
      stable = height === lastHeight ? stable + 1 : 0;
      if (stable >= 3) break;
      await page.waitForTimeout(400);
    }
    lastHeight = height;
    y = Math.min(y + step, Math.max(0, height - vp.height));
    if (vp.isMobile) await page.evaluate((top) => window.scrollTo(0, top), y);
    else await page.mouse.wheel(0, step).catch(() => page.evaluate((top) => window.scrollTo(0, top), y));
    await page.waitForTimeout(220);
    if (y > 60_000) break; // runaway infinite scroll guard
  }
  await settle(page, 20_000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await settle(page, 8_000);
  return response;
}

/**
 * Freeze moving parts so live and local screenshots compare like with like:
 * every carousel on its first slide (Swiper instances are found by the live
 * object on the element, whatever class names the page builder uses), videos
 * at 0s, every lazy image loaded, fonts ready.
 */
export async function prepareForScreenshot(page) {
  await page
    .evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const swipers = new Set();
      document.querySelectorAll('[class*="swiper"]').forEach((el) => {
        if (el.swiper) swipers.add(el.swiper);
      });
      for (const s of swipers) {
        try { s.autoplay && s.autoplay.stop && s.autoplay.stop(); } catch {}
        try { if (s.params) s.params.autoplay = false; } catch {}
        try { s.update && s.update(); } catch {}
        try { s.params && s.params.loop ? s.slideToLoop(0, 0, false) : s.slideTo(0, 0, false); } catch {}
      }
      try {
        const $ = window.jQuery;
        if ($) {
          $('.slick-initialized').each(function () {
            try { $(this).slick('slickPause'); $(this).slick('slickGoTo', 0, true); } catch {}
          });
          $('.owl-carousel').each(function () {
            try { $(this).trigger('stop.owl.autoplay'); $(this).trigger('to.owl.carousel', [0, 0]); } catch {}
          });
        }
      } catch {}
      try {
        Object.keys(window).filter((k) => /^revapi\d+$/.test(k)).forEach((k) => {
          try { window[k].revpause(); window[k].revshowslide(1); } catch {}
        });
      } catch {}
      document.querySelectorAll('video').forEach((v) => {
        try { v.pause(); v.currentTime = 0; } catch {}
      });
      // Load every image now (native lazy ones included) and wait, so the
      // full-page screenshot never catches a half-loaded slide or avatar.
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
      const pending = [...document.images].filter((img) => !img.complete);
      await Promise.race([
        Promise.all(pending.map((img) => new Promise((r) => {
          img.addEventListener('load', r, { once: true });
          img.addEventListener('error', r, { once: true });
        }))),
        sleep(8000),
      ]);
      if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, sleep(5000)]);
    })
    .catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(600);
}

/** Full-page PNG (for pixel diffs); optionally also a compact JPEG copy for docs. */
export async function screenshot(page, pngFile, jpgFile) {
  fs.mkdirSync(path.dirname(pngFile), { recursive: true });
  const buf = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide', timeout: 180_000 });
  fs.writeFileSync(pngFile, buf);
  if (jpgFile) {
    fs.mkdirSync(path.dirname(jpgFile), { recursive: true });
    await sharp(buf, { limitInputPixels: false }).jpeg({ quality: 72, progressive: true, mozjpeg: true }).toFile(jpgFile);
  }
  const meta = await sharp(buf, { limitInputPixels: false }).metadata();
  return { width: meta.width, height: meta.height, bytes: buf.length };
}

// Runs inside the page: every URL the rendered DOM refers to, including
// computed CSS backgrounds (and ::before/::after) for the current viewport.
export function collectDomUrls() {
  const urls = new Set();
  const add = (u) => {
    if (!u) return;
    u = String(u).trim();
    if (!u || /^(data:|blob:|javascript:|about:|mailto:|tel:|#)/i.test(u)) return;
    try {
      urls.add(new URL(u, document.baseURI).href);
    } catch {}
  };
  const addSrcset = (s) => {
    if (!s) return;
    for (const part of String(s).split(/,\s+/)) add(part.trim().split(/\s+/)[0]);
  };
  const addCss = (v) => {
    if (!v || v === 'none') return;
    for (const m of String(v).matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)) add(m[2]);
  };
  const cssProps = ['backgroundImage', 'maskImage', 'webkitMaskImage', 'listStyleImage', 'borderImageSource', 'content', 'cursor'];
  for (const el of document.querySelectorAll('*')) {
    for (const attr of el.attributes) {
      const n = attr.name.toLowerCase();
      const v = attr.value;
      if (/srcset$/.test(n)) addSrcset(v);
      else if (n === 'style') addCss(v);
      else if (el.tagName === 'A' || el.tagName === 'FORM') continue;
      else if (n === 'src' || n === 'poster' || n === 'data' || n === 'xlink:href' || /(^|-)src$/.test(n)) add(v);
      else if (
        (/^data-(src|lazy-src|original|orig-file|medium-file|large-file|full-url|large_image|bg|background|image|img|thumb|thumbnail|poster|video|mp4|webm|full|url|lazyload|splash|rocket-src|fallback)$/.test(n) ||
          /^data-[a-z0-9_-]*-(src|url|image|img|bg|background|poster|thumb|video)$/.test(n)) &&
        !/\s/.test(v.trim()) && !/^\d+(\.\d+)?(px|%|w|x)?$/i.test(v.trim()) && !/^(image|video|audio|font|text|application)\/[\w.+-]+$/i.test(v.trim())
      ) add(v);
      else if (n === 'href' && (el.tagName === 'LINK' || el.namespaceURI === 'http://www.w3.org/2000/svg')) {
        const rel = (el.getAttribute('rel') || '').toLowerCase();
        if (!/canonical|alternate|shortlink|pingback|edituri|wlwmanifest|api\.w\.org|preconnect|dns-prefetch|next|prev/.test(rel)) add(v);
      }
    }
    const cs = getComputedStyle(el);
    for (const p of cssProps) addCss(cs[p]);
    for (const pseudo of ['::before', '::after']) {
      const ps = getComputedStyle(el, pseudo);
      if (ps.content && ps.content !== 'none' && ps.content !== 'normal') addCss(ps.content);
      addCss(ps.backgroundImage);
      addCss(ps.maskImage || ps.webkitMaskImage);
    }
  }
  for (const m of document.querySelectorAll('meta[content]')) {
    const k = (m.getAttribute('property') || m.getAttribute('name') || m.getAttribute('itemprop') || '').toLowerCase();
    if (/^(og:image|og:image:url|og:image:secure_url|og:video|twitter:image|msapplication-tileimage|thumbnail)/.test(k)) add(m.getAttribute('content'));
  }
  for (const e of performance.getEntriesByType('resource')) add(e.name);
  return [...urls];
}
