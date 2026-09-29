// Minimal robots.txt parser (RFC 9309): user-agent groups, Allow/Disallow with
// `*` and `$` wildcards, longest-match wins (Allow wins ties), Crawl-delay, Sitemap.

function patternToRegex(pattern) {
  let anchored = false;
  if (pattern.endsWith('$')) {
    anchored = true;
    pattern = pattern.slice(0, -1);
  }
  const body = pattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
}

export class Robots {
  constructor(text = '', userAgent = '*') {
    this.sitemaps = [];
    this.groups = []; // { agents: [], rules: [{allow, pattern, re}], crawlDelay }
    this.userAgent = userAgent;
    this.#parse(text);
    this.group = this.#selectGroup();
  }

  #parse(text) {
    let current = null;
    let lastWasAgent = false;
    for (const rawLine of String(text).split(/\r?\n/)) {
      const line = rawLine.replace(/#.*$/, '').trim();
      if (!line) continue;
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      if (key === 'sitemap') {
        if (value) this.sitemaps.push(value);
        continue;
      }
      if (key === 'user-agent') {
        if (!current || !lastWasAgent) {
          current = { agents: [], rules: [], crawlDelay: null };
          this.groups.push(current);
        }
        current.agents.push(value.toLowerCase());
        lastWasAgent = true;
        continue;
      }
      lastWasAgent = false;
      if (!current) continue;
      if (key === 'allow' || key === 'disallow') {
        if (!value) continue; // empty Disallow = allow everything
        current.rules.push({ allow: key === 'allow', pattern: value, re: patternToRegex(value) });
      } else if (key === 'crawl-delay') {
        const n = Number(value);
        if (Number.isFinite(n)) current.crawlDelay = n;
      }
    }
  }

  #selectGroup() {
    const ua = this.userAgent.toLowerCase();
    // A group naming a token contained in our UA beats the wildcard group.
    const specific = this.groups.filter((g) => g.agents.some((a) => a !== '*' && ua.includes(a)));
    const chosen = specific.length ? specific : this.groups.filter((g) => g.agents.includes('*'));
    return {
      rules: chosen.flatMap((g) => g.rules),
      crawlDelay: chosen.map((g) => g.crawlDelay).find((d) => d != null) ?? null,
    };
  }

  get crawlDelay() {
    return this.group.crawlDelay;
  }

  isAllowed(pathAndQuery) {
    let best = null;
    for (const rule of this.group.rules) {
      if (rule.re.test(pathAndQuery)) {
        if (
          !best ||
          rule.pattern.length > best.pattern.length ||
          (rule.pattern.length === best.pattern.length && rule.allow && !best.allow)
        ) {
          best = rule;
        }
      }
    }
    return best ? best.allow : true;
  }

  matchingRule(pathAndQuery) {
    let best = null;
    for (const rule of this.group.rules) {
      if (rule.re.test(pathAndQuery) && (!best || rule.pattern.length > best.pattern.length)) best = rule;
    }
    return best ? `${best.allow ? 'Allow' : 'Disallow'}: ${best.pattern}` : null;
  }
}
