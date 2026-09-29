// Polite, cached, GET-only HTTP client shared by every script (and by the
// Playwright request interceptor), so the whole capture respects one global
// limit: at most POLITENESS.maxConcurrent requests in flight to the main site,
// with a jittered pause after each one, robots.txt honoured, and admin /
// login / API paths never requested.
import { fetch, EnvHttpProxyAgent } from 'undici';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  PATHS,
  POLITENESS,
  SITE_ORIGIN,
  UA_DESKTOP,
  UA_MOBILE,
  isSiteUrl,
  isForbidden,
  isOriginAlias,
} from './config.mjs';
import { Robots } from './robots.mjs';

const dispatcher = new EnvHttpProxyAgent({
  connectTimeout: 30_000,
  headersTimeout: 60_000,
  bodyTimeout: 180_000,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

export const ACCEPT = {
  document: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  image: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  stylesheet: 'text/css,*/*;q=0.1',
  any: '*/*',
};

class Limiter {
  constructor(max, delayMs) {
    this.max = max;
    this.delayMs = delayMs;
    this.active = 0;
    this.waiting = [];
    this.peak = 0;
  }
  async run(fn) {
    if (this.active < this.max) this.active++;
    else await new Promise((resolve) => this.waiting.push(resolve)); // slot handed over by release()
    this.peak = Math.max(this.peak, this.active);
    try {
      return await fn();
    } finally {
      const pause = this.delayMs * (0.75 + Math.random() * 0.5);
      setTimeout(() => {
        const next = this.waiting.shift();
        if (next) next();
        else this.active--;
      }, pause);
    }
  }
}

function stripHash(u) {
  const url = new URL(u);
  url.hash = '';
  return url.href;
}

class Fetcher {
  constructor() {
    this.siteLimiter = new Limiter(POLITENESS.maxConcurrent, POLITENESS.delayMs);
    this.externalLimiters = new Map();
    this.inflight = new Map();
    this.robots = new Robots('');
    this.robotsText = null;
    this.aliasRobots = new Map(); // origin -> Promise<Robots> for ORIGIN_ALIASES hosts
    this.stats = { network: 0, cacheHits: 0, blockedRobots: 0, blockedForbidden: 0, errors: 0, bytes: 0 };
    this.logFile = path.join(PATHS.work, 'fetch-log.ndjson');
    fs.mkdirSync(PATHS.work, { recursive: true });
  }

  limiterFor(url) {
    // Alias hostnames are the same server, so they share the site's limit.
    if (isSiteUrl(url) || isOriginAlias(new URL(url).hostname)) return this.siteLimiter;
    const host = new URL(url).host;
    if (!this.externalLimiters.has(host)) {
      this.externalLimiters.set(host, new Limiter(POLITENESS.externalMaxConcurrent, POLITENESS.externalDelayMs));
    }
    return this.externalLimiters.get(host);
  }

  get peakSiteConcurrency() {
    return this.siteLimiter.peak;
  }

  // Load robots.txt once; everything else on the main site is checked against it.
  async loadRobots() {
    if (this.robotsText !== null) return this.robots;
    const res = await this.get(`${SITE_ORIGIN}/robots.txt`, { skipRobots: true, accept: 'text/plain,*/*' });
    this.robotsText = res.status === 200 ? res.body.toString('utf8') : '';
    this.robotsStatus = res.status;
    this.robots = new Robots(this.robotsText, UA_DESKTOP);
    if (this.robots.crawlDelay) {
      this.siteLimiter.delayMs = Math.max(this.siteLimiter.delayMs, this.robots.crawlDelay * 1000);
    }
    return this.robots;
  }

  // robots.txt of an alias hostname of the same server (loaded once per origin).
  aliasRobotsFor(u) {
    if (!this.aliasRobots.has(u.origin)) {
      this.aliasRobots.set(
        u.origin,
        this.get(`${u.origin}/robots.txt`, { skipRobots: true, accept: 'text/plain,*/*' }).then(
          (res) => new Robots(res.status === 200 ? res.body.toString('utf8') : '', UA_DESKTOP),
        ),
      );
    }
    return this.aliasRobots.get(u.origin);
  }

  cachePaths(key) {
    const dir = path.join(PATHS.cache, key.slice(0, 2));
    return { dir, meta: path.join(dir, `${key}.json`), body: path.join(dir, `${key}.bin`) };
  }

  cacheKey(url, variant) {
    return sha1(`${variant} ${url}`);
  }

  // Read-only cache lookup (never touches the network).
  readCache(url, variant = 'desktop') {
    url = stripHash(url);
    const p = this.cachePaths(this.cacheKey(url, variant));
    if (!fs.existsSync(p.meta)) return null;
    const meta = JSON.parse(fs.readFileSync(p.meta, 'utf8'));
    const body = fs.existsSync(p.body) ? fs.readFileSync(p.body) : Buffer.alloc(0);
    return { ...meta, body, fromCache: true };
  }

  log(entry) {
    fs.appendFileSync(this.logFile, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  }

  /**
   * GET a URL (never any other method). Redirects are NOT followed; the result
   * carries `location` (absolute) so callers can record and follow them.
   * opts: variant ('desktop'|'mobile' - only matters if the server varies by UA),
   *       accept, referer, skipRobots, refresh (ignore cache)
   */
  async get(url, opts = {}) {
    url = stripHash(url);
    const variant = opts.variant || 'desktop';
    const key = this.cacheKey(url, variant);
    if (!opts.refresh) {
      const cached = this.readCache(url, variant);
      if (cached) {
        this.stats.cacheHits++;
        return cached;
      }
    }
    if (this.inflight.has(key)) return this.inflight.get(key);
    const promise = this.#fetchAndStore(url, variant, key, opts).finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }

  async #fetchAndStore(url, variant, key, opts) {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return { url, status: -1, blocked: 'unsupported-protocol', headers: {}, body: Buffer.alloc(0) };
    const alias = isOriginAlias(u.hostname);
    if (isSiteUrl(u) || alias) {
      if (isForbidden(u)) {
        this.stats.blockedForbidden++;
        this.log({ url, blocked: 'forbidden' });
        return { url, status: -1, blocked: 'forbidden', headers: {}, body: Buffer.alloc(0) };
      }
      if (!opts.skipRobots) {
        const robots = alias ? await this.aliasRobotsFor(u) : await this.loadRobots();
        if (!robots.isAllowed(u.pathname + u.search)) {
          this.stats.blockedRobots++;
          const rule = robots.matchingRule(u.pathname + u.search);
          this.log({ url, blocked: 'robots', rule });
          return { url, status: -1, blocked: 'robots', rule, headers: {}, body: Buffer.alloc(0) };
        }
      }
    }

    const headers = {
      'user-agent': variant === 'mobile' ? UA_MOBILE : UA_DESKTOP,
      accept: opts.accept || ACCEPT.any,
      'accept-language': 'en-US,en;q=0.9',
    };
    if (opts.referer) headers.referer = opts.referer;

    const limiter = this.limiterFor(url);
    let lastError = null;
    for (let attempt = 0; attempt <= POLITENESS.retries; attempt++) {
      const started = Date.now();
      let result;
      try {
        result = await limiter.run(async () => {
          const res = await fetch(url, {
            method: 'GET',
            headers,
            redirect: 'manual',
            dispatcher,
            signal: AbortSignal.timeout(POLITENESS.timeoutMs),
          });
          const body = Buffer.from(await res.arrayBuffer());
          return { res, body };
        });
      } catch (err) {
        lastError = err;
        this.log({ url, variant, error: String(err?.cause?.code || err?.message || err), attempt });
        if (attempt < POLITENESS.retries) await sleep(2000 * 2 ** attempt);
        continue;
      }
      const { res, body } = result;
      this.stats.network++;
      this.stats.bytes += body.length;
      const resHeaders = {};
      for (const [k, v] of res.headers) resHeaders[k] = v;
      if ((res.status === 429 || res.status === 503) && attempt < POLITENESS.retries) {
        const ra = Number(resHeaders['retry-after']);
        const wait = Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 120_000) : 10_000 * 2 ** attempt;
        this.log({ url, variant, status: res.status, backoffMs: wait, attempt });
        await sleep(wait);
        continue;
      }
      let location = null;
      if (res.status >= 300 && res.status < 400 && resHeaders.location) {
        try {
          location = new URL(resHeaders.location, url).href;
        } catch {
          location = resHeaders.location;
        }
      }
      const meta = {
        url,
        variant,
        status: res.status,
        headers: resHeaders,
        location,
        contentType: (resHeaders['content-type'] || '').split(';')[0].trim().toLowerCase(),
        bytes: body.length,
        sha256: crypto.createHash('sha256').update(body).digest('hex'),
        fetchedAt: new Date().toISOString(),
        requestHeaders: headers,
      };
      const p = this.cachePaths(key);
      await fsp.mkdir(p.dir, { recursive: true });
      await fsp.writeFile(p.body, body);
      await fsp.writeFile(p.meta, JSON.stringify(meta, null, 1));
      this.log({ url, variant, status: res.status, bytes: body.length, ms: Date.now() - started, location });
      return { ...meta, body, fromCache: false };
    }
    this.stats.errors++;
    return { url, variant, status: 0, error: String(lastError?.cause?.code || lastError?.message || lastError), headers: {}, body: Buffer.alloc(0) };
  }

  // Follow redirects (recording every hop). Returns { final, chain }.
  async getFollow(url, opts = {}) {
    const chain = [];
    let current = url;
    for (let i = 0; i < 10; i++) {
      const res = await this.get(current, opts);
      chain.push({ url: current, status: res.status, location: res.location || null });
      if (res.status >= 300 && res.status < 400 && res.location) {
        current = res.location;
        continue;
      }
      return { final: res, chain };
    }
    return { final: { url: current, status: 0, error: 'too many redirects', headers: {}, body: Buffer.alloc(0) }, chain };
  }
}

export const fetcher = new Fetcher();
