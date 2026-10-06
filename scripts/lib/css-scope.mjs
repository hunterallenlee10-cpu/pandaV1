// Rewrites a stylesheet so that its rules reach only inside an element, or only outside it,
// without changing their specificity (the added condition is inside :where()).
//
//   scopeCss(css, { inside: '.box' })   rules match only .box and what is in it; the custom
//                                        properties set on :root, html or body are set on .box
//                                        (their other declarations are left out: .box inherits
//                                        those from its own page)
//   scopeCss(css, { outside: '.box' })  rules no longer match .box or anything in it
//
// With { keep: (subject) => boolean }, a selector is left out when the element it styles (its
// last compound selector, as text) cannot be in the box, for instance a class the box lacks.
//
// A small hand-written reader, enough for the page builder's and the site's own CSS: it keeps
// comments out, copies @font-face, @keyframes and the like as they are, and goes into @media,
// @supports, @container and @layer blocks.
const COPY_AT = /^@(-[a-z]+-)?(font-face|keyframes|page|property|counter-style|font-feature-values|import|charset|namespace)\b/i;
const PSEUDO_ELEMENT = /::|:(?:before|after|first-line|first-letter)\b/i;

// Splits on a character at bracket depth 0, outside strings.
function splitTop(s, ch) {
  const out = [];
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ch && depth === 0) {
      out.push(s.slice(start, i));
      start = i + 1;
    }
  }
  out.push(s.slice(start));
  return out;
}

// The next ch at or after i that is outside strings and brackets, or -1.
function nextOutside(s, i, ch) {
  let depth = 0;
  let quote = '';
  for (; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ch && depth === 0) return i;
  }
  return -1;
}

// Where a pseudo-element starts in a selector (at depth 0), or its length.
function pseudoElementAt(sel) {
  let depth = 0;
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ':' && depth === 0 && PSEUDO_ELEMENT.test(sel.slice(i, i + 14))) return i;
  }
  return sel.length;
}

const ROOTISH = /^(?::root|html|body)$/i;

// The last compound selector: what the selector styles.
function subjectOf(sel) {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (depth === 0 && /[\s>+~]/.test(c)) start = i + 1;
  }
  return sel.slice(start);
}

function scopeSelector(sel, { inside, outside, keep }) {
  const s = sel.trim();
  if (!s) return null;
  if (keep && !keep(subjectOf(s))) return null;
  if (inside) {
    if (ROOTISH.test(s)) return null;
    // Other rules about the page itself (a state class on html or body) never apply in a box.
    if (/(^|[\s>+~])(?:html|body|:root)(?=$|[.#[:\s>+~])/i.test(s)) return null;
  }
  const at = pseudoElementAt(s);
  const cond = inside ? `:where(${inside}, ${inside} *)` : `:where(:not(${outside}, ${outside} *))`;
  return s.slice(0, at) + cond + s.slice(at);
}

export function scopeCss(css, opts) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let out = '';
  let i = 0;
  while (i < css.length) {
    const open = nextOutside(css, i, '{');
    const semi = nextOutside(css, i, ';');
    if (open === -1) break;
    // A statement at-rule (@import …;) before the next block.
    if (semi !== -1 && semi < open && css.slice(i, semi).trim().startsWith('@')) {
      out += css.slice(i, semi + 1).trim();
      i = semi + 1;
      continue;
    }
    const prelude = css.slice(i, open).trim();
    // The matching close brace.
    let depth = 1;
    let j = open + 1;
    let quote = '';
    for (; j < css.length && depth; j++) {
      const c = css[j];
      if (quote) {
        if (c === '\\') j++;
        else if (c === quote) quote = '';
      } else if (c === '"' || c === "'") quote = c;
      else if (c === '{') depth++;
      else if (c === '}') depth--;
    }
    const body = css.slice(open + 1, j - 1);
    i = j;
    if (!prelude) continue;
    if (prelude.startsWith('@')) {
      if (COPY_AT.test(prelude)) out += `${prelude}{${body}}`;
      else {
        const inner = scopeCss(body, opts);
        if (inner) out += `${prelude}{${inner}}`;
      }
      continue;
    }
    const parts = splitTop(prelude, ',');
    if (opts.inside && parts.some((p) => ROOTISH.test(p.trim()))) {
      const vars = splitTop(body, ';').map((d) => d.trim()).filter((d) => d.startsWith('--'));
      if (vars.length) out += `${opts.inside}{${vars.join(';')}}`;
    }
    const sels = parts.map((p) => scopeSelector(p, opts)).filter(Boolean);
    if (sels.length) out += `${[...new Set(sels)].join(',')}{${body.trim()}}`;
  }
  return out;
}
