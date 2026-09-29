// Shared configuration for the capture / build / verify scripts.
// Everything can be overridden with environment variables so the same
// scripts can be pointed at a local test fixture (see scripts/test/).
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://pandaexteriors.com').replace(/\/+$/, '');
const siteUrl = new URL(SITE_ORIGIN);
export const SITE_PROTOCOL = siteUrl.protocol;
export const SITE_PORT = siteUrl.port;
export const SITE_HOST = siteUrl.hostname.replace(/^www\./, '');
// Hostnames that are "the main site" (apex + www). Everything else is external.
export const SITE_HOSTS = new Set([SITE_HOST, `www.${SITE_HOST}`]);

export const PATHS = {
  site: process.env.SITE_DIR ? path.resolve(process.env.SITE_DIR) : path.join(ROOT, 'site'),
  docs: process.env.DOCS_DIR ? path.resolve(process.env.DOCS_DIR) : path.join(ROOT, 'docs'),
  // Intermediate state (inventory JSON, per-page capture records, full-size PNG screenshots).
  work: process.env.WORK_DIR ? path.resolve(process.env.WORK_DIR) : path.join(ROOT, '.work'),
  // Raw HTTP response cache: every byte fetched from the network lands here first.
  cache: process.env.CACHE_DIR ? path.resolve(process.env.CACHE_DIR) : path.join(ROOT, '.cache', 'http'),
};

// Normal, current desktop / mobile Chrome user agents (Playwright 1.56 ships Chromium 141).
export const UA_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
export const UA_MOBILE =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';

export const POLITENESS = {
  // Hard cap on simultaneous requests to the main site (all scripts + the browser share it).
  maxConcurrent: Number(process.env.MAX_CONCURRENT || 2),
  // Pause (ms, jittered ±25%) a slot waits after each request before starting the next.
  delayMs: Number(process.env.DELAY_MS || 500),
  // Third-party static hosts (Google Fonts etc.) get their own, equally small, limiter.
  externalMaxConcurrent: 2,
  externalDelayMs: 200,
  timeoutMs: 90_000,
  retries: 3,
};

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1, userAgent: UA_DESKTOP },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1, userAgent: UA_MOBILE },
};

// Paths on the main site that are never requested, whatever robots.txt says:
// admin, login, account, API and other back-end endpoints.
export const FORBIDDEN_PATHS = [
  /^\/wp-admin(\/|$)/i,
  /^\/wp-login\.php/i,
  /^\/wp-json(\/|$)/i,
  /^\/xmlrpc\.php/i,
  /^\/wp-cron\.php/i,
  /^\/wp-comments-post\.php/i,
  /^\/wp-signup\.php/i,
  /^\/wp-activate\.php/i,
  /^\/wp-trackback\.php/i,
  /^\/wp-mail\.php/i,
  /^\/(my-)?account(\/|$)/i,
  /^\/login(\/|$)/i,
  /^\/admin(\/|$)/i,
  /^\/cart(\/|$)/i,
  /^\/checkout(\/|$)/i,
  /^\/cgi-bin(\/|$)/i,
  /\/trackback\/?$/i,
];
// Query strings that indicate back-end, stateful or infinite URL spaces.
export const FORBIDDEN_QUERY = [
  /(^|&)rest_route=/i,
  /(^|&)replytocom=/i,
  /(^|&)preview(_id|_nonce)?=/i,
  /(^|&)add-to-cart=/i,
  /(^|&)wc-ajax=/i,
  /(^|&)doing_wp_cron/i,
  /(^|&)action=/i,
  /(^|&)share=/i,
  /(^|&)nonce=/i,
  /(^|&)_wpnonce=/i,
  /(^|&)s=/i,
];

// Third-party analytics / advertising / call-tracking. Requests to these are
// blocked while capturing (so the crawl does not register fake visits) and the
// snippets are commented out in the copy.
export const TRACKERS = [
  { name: 'Google Analytics (gtag.js)', re: /googletagmanager\.com\/gtag\//i },
  { name: 'Google Tag Manager', re: /googletagmanager\.com/i },
  { name: 'Google Analytics', re: /google-analytics\.com|analytics\.google\.com|stats\.g\.doubleclick\.net/i },
  { name: 'Google Ads', re: /googleadservices\.com|googleads\.g\.doubleclick\.net|\.doubleclick\.net|google\.com\/pagead|google\.[a-z.]+\/ads\/|pagead2\.googlesyndication\.com|googlesyndication\.com/i },
  { name: 'Meta Pixel', re: /connect\.facebook\.net\/[^/]+\/fbevents|connect\.facebook\.net\/signals|facebook\.com\/tr[/?]/i },
  { name: 'Microsoft Clarity', re: /clarity\.ms/i },
  { name: 'Microsoft Advertising UET', re: /bat\.bing\.com/i },
  { name: 'Hotjar', re: /hotjar\.(com|io)/i },
  { name: 'LinkedIn Insight', re: /snap\.licdn\.com|px\.ads\.linkedin\.com/i },
  { name: 'TikTok Pixel', re: /analytics\.tiktok\.com/i },
  { name: 'Pinterest Tag', re: /s\.pinimg\.com\/ct|ct\.pinterest\.com/i },
  { name: 'X (Twitter) Pixel', re: /static\.ads-twitter\.com|analytics\.twitter\.com|t\.co\/i\/adsct/i },
  { name: 'Snap Pixel', re: /sc-static\.net\/scevent|tr\.snapchat\.com/i },
  { name: 'Reddit Pixel', re: /redditstatic\.com\/ads|alb\.reddit\.com/i },
  { name: 'Nextdoor Pixel', re: /ads\.nextdoor\.com/i },
  { name: 'CallRail', re: /callrail\.com|calltrk\.com/i },
  { name: 'CallTrackingMetrics', re: /(^|[./])tctm\.co\/|calltrackingmetrics\.com/i },
  { name: 'WhatConverts', re: /whatconverts\.com|iconnode\.com/i },
  { name: 'Invoca', re: /invocacdn\.com|invoca\.net/i },
  { name: 'CallSource', re: /callsource\.com/i },
  { name: 'Marchex', re: /marchex\.io|voicestar\.com/i },
  { name: 'HubSpot tracking', re: /js\.hs-scripts\.com|js\.hs-analytics\.net|track\.hubspot\.com|js\.hs-banner\.com|js\.hsadspixel\.net/i },
  { name: 'Klaviyo', re: /static\.klaviyo\.com\/onsite|a\.klaviyo\.com/i },
  { name: 'Segment', re: /cdn\.segment\.com|api\.segment\.io/i },
  { name: 'Mouseflow', re: /mouseflow\.com/i },
  { name: 'FullStory', re: /fullstory\.com/i },
  { name: 'Lucky Orange', re: /luckyorange\.(com|net)/i },
  { name: 'Crazy Egg', re: /crazyegg\.com/i },
  { name: 'AdRoll', re: /adroll\.com/i },
  { name: 'Quantcast', re: /quantserve\.com|quantcount\.com/i },
  { name: 'Yandex Metrica', re: /mc\.yandex\./i },
  { name: 'Matomo', re: /\/matomo\.(js|php)|\/piwik\.(js|php)/i },
];

// Inline-snippet signatures (used when a <script> has no src).
export const TRACKER_INLINE = [
  { name: 'Google Tag Manager', re: /googletagmanager\.com\/gtm\.js|['"]GTM-[A-Z0-9]{4,10}['"]/ },
  { name: 'Google Analytics (gtag.js)', re: /\bgtag\s*\(\s*['"](config|js)['"]/ },
  { name: 'Google Analytics', re: /GoogleAnalyticsObject|google-analytics\.com\/analytics\.js|\bga\s*\(\s*['"]create['"]/ },
  { name: 'Meta Pixel', re: /\bfbq\s*\(\s*['"]init['"]|connect\.facebook\.net\/[^'"]*fbevents/ },
  { name: 'Microsoft Clarity', re: /clarity\.ms\/tag/ },
  { name: 'Microsoft Advertising UET', re: /bat\.bing\.com\/bat\.js/ },
  { name: 'Hotjar', re: /static\.hotjar\.com|_hjSettings/ },
  { name: 'LinkedIn Insight', re: /_linkedin_partner_id|snap\.licdn\.com/ },
  { name: 'TikTok Pixel', re: /analytics\.tiktok\.com|\bttq\.load\s*\(/ },
  { name: 'Pinterest Tag', re: /s\.pinimg\.com\/ct\/core\.js|\bpintrk\s*\(\s*['"]load['"]/ },
  { name: 'X (Twitter) Pixel', re: /static\.ads-twitter\.com|\btwq\s*\(\s*['"]init['"]/ },
  { name: 'Snap Pixel', re: /sc-static\.net\/scevent|\bsnaptr\s*\(\s*['"]init['"]/ },
  { name: 'Reddit Pixel', re: /redditstatic\.com\/ads|\brdt\s*\(\s*['"]init['"]/ },
  { name: 'Nextdoor Pixel', re: /ads\.nextdoor\.com|\bndp\s*\(\s*['"]init['"]/ },
  { name: 'CallRail', re: /cdn\.callrail\.com|calltrk\.com/ },
  { name: 'CallTrackingMetrics', re: /tctm\.co\/t\.js|calltrackingmetrics/ },
  { name: 'WhatConverts', re: /whatconverts\.com|iconnode\.com/ },
  { name: 'Invoca', re: /invocacdn\.com/ },
  { name: 'Segment', re: /cdn\.segment\.com\/analytics\.js/ },
  { name: 'Mouseflow', re: /cdn\.mouseflow\.com/ },
  { name: 'FullStory', re: /fullstory\.com\/s\/fs\.js|_fs_org/ },
  { name: 'Lucky Orange', re: /luckyorange\.(com|net)/ },
  { name: 'Crazy Egg', re: /script\.crazyegg\.com/ },
  { name: 'AdRoll', re: /adroll\.com\/j\/|adroll_adv_id/ },
];

// Third-party hosts whose static files (CSS / JS libraries / fonts / images) are
// downloaded into site/_external/<host>/ so the copy works offline.
// Adobe Fonts (use.typekit.net) is deliberately NOT here: its licence ties
// fonts to the licensed domain, so it stays pointing at the live service.
export const LOCALIZE_HOSTS = [
  /^fonts\.googleapis\.com$/i,
  /^fonts\.gstatic\.com$/i,
  /^cdnjs\.cloudflare\.com$/i,
  /^cdn\.jsdelivr\.net$/i,
  /^unpkg\.com$/i,
  /^code\.jquery\.com$/i,
  /^ajax\.googleapis\.com$/i,
  /^(maxcdn|stackpath|netdna)\.bootstrapcdn\.com$/i,
  /^use\.fontawesome\.com$/i,
  /^ka-f\.fontawesome\.com$/i,
  /^i[0-3]\.wp\.com$/i, // Jetpack image CDN (serves the site's own uploads)
  /^s[0-2]\.wp\.com$/i,
  /^c[0-2]\.wp\.com$/i,
];
// Subdomains of the main site that only serve static files (e.g. a CDN) are
// also localized; see isLocalizableHost().

// Other hostnames of the SAME server that the pages load files from (e.g. the
// hosting provider's app URL embedded in image srcsets). Their files are copied
// like the site's own, share the site's request limit (same machine), and
// their own robots.txt is honoured. Pages on these hosts are never crawled.
export const ORIGIN_ALIASES = new Set(
  (process.env.ORIGIN_ALIASES ?? (process.env.SITE_ORIGIN ? '' : 'wordpressmu-1425697-5386286.cloudwaysapps.com'))
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
);

// Sitemap sections whose URLs are only captured when a page actually links to
// them. pandaexteriors.com lists ~5,500 auto-generated /blog/project/ posts in
// its sitemaps, of which only ~20 are linked from the site; the owner chose to
// copy what a visitor can reach by clicking. Set SITEMAP_ONLY_EXCLUDE='' to
// capture every sitemap URL.
export const SITEMAP_ONLY_EXCLUDE = (process.env.SITEMAP_ONLY_EXCLUDE ?? (process.env.SITE_ORIGIN ? '' : '/blog/project/'))
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

// Remove every link to the excluded sub-sites (the city sections) from the copy
// instead of pointing it at the live site; the owner wants the build to contain
// the main website only. Form values that point into a sub-site are redirected
// to the matching main-site page. REMOVE_SUBSITE_LINKS=0 keeps the links.
export const REMOVE_SUBSITE_LINKS =
  (process.env.REMOVE_SUBSITE_LINKS ?? (process.env.SITE_ORIGIN ? '0' : '1')) === '1';

// The site's old map sections (a picture of a Google Map on the "Local East Coast
// Exterior Remodelers" band, and a Google Maps widget on Past Projects that needs the
// live WordPress API) are replaced by the animated US map in custom/us-map/ — see
// scripts/lib/customize.mjs. CUSTOM_US_MAP=0 keeps the original sections.
export const CUSTOM_US_MAP = (process.env.CUSTOM_US_MAP ?? (process.env.SITE_ORIGIN ? '0' : '1')) === '1';

// Fixes for problems found in the site audit (broken widgets, a carousel that never
// starts, missing pictures, placeholder content, typos...) — see scripts/lib/site-fixes.mjs.
// SITE_FIXES=0 keeps the pages exactly as captured.
export const SITE_FIXES = (process.env.SITE_FIXES ?? (process.env.SITE_ORIGIN ? '0' : '1')) === '1';

// Pages taken off the copy on request (path prefixes, comma-separated). The owner wants
// nothing about Panda Interiors / Panda Bath on the site, and /interiors/ is the only
// page about them. Removed pages are not built, links to them are removed like the
// sub-site links, their sitemap entries and the files only they used are left out, and
// their address redirects to the home page (scripts/03-build.mjs). REMOVE_PAGES='' keeps them.
export const REMOVED_PAGES = (process.env.REMOVE_PAGES ?? (process.env.SITE_ORIGIN ? '' : '/interiors/'))
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);
export const isRemovedPage = (pathname) => REMOVED_PAGES.some((p) => pathname.startsWith(p) || pathname === p.replace(/\/+$/, ''));

export function isSitemapOnlyExcluded(u) {
  const p = new URL(u).pathname;
  return SITEMAP_ONLY_EXCLUDE.some((prefix) => p.startsWith(prefix));
}

export function isOriginAlias(host) {
  return ORIGIN_ALIASES.has(String(host).toLowerCase());
}

export const CACHE_BUSTING_KEYS = new Set(['ver', 'v', 'version', 't', 'ts', 'timestamp', '_', 'rev', 'cb', 'm', 'time', 'build', 'itok']);

export function isSiteHost(host) {
  return SITE_HOSTS.has(String(host).toLowerCase());
}

export function isSiteUrl(u) {
  try {
    const url = u instanceof URL ? u : new URL(u);
    if (!/^https?:$/.test(url.protocol)) return false;
    if (!isSiteHost(url.hostname)) return false;
    // When pointed at a local fixture the port matters too.
    if (SITE_PORT && url.port !== SITE_PORT) return false;
    return true;
  } catch {
    return false;
  }
}

export function isForbidden(u) {
  const url = u instanceof URL ? u : new URL(u);
  if (FORBIDDEN_PATHS.some((re) => re.test(url.pathname))) return true;
  const q = url.search.replace(/^\?/, '');
  if (q && FORBIDDEN_QUERY.some((re) => re.test(q))) return true;
  return false;
}

export function trackerFor(u) {
  const s = String(u);
  const hit = TRACKERS.find((t) => t.re.test(s));
  return hit ? hit.name : null;
}

export function isLocalizableHost(host) {
  host = String(host).toLowerCase();
  if (isOriginAlias(host)) return true;
  if (LOCALIZE_HOSTS.some((re) => re.test(host))) return true;
  // e.g. cdn.pandaexteriors.com, but not the apex/www (those are the site itself).
  if (host.endsWith(`.${SITE_HOST}`) && !isSiteHost(host) && /^(cdn|static|assets|media|img|images)\d*\./.test(host)) return true;
  return false;
}
