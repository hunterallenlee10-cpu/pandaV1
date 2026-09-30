// Helpers for surgical edits of page HTML: parse with parse5 (source locations on),
// collect edits as source ranges, then apply them all at once. Everything outside
// the edited ranges stays byte-for-byte as it was.
import { Parser as TagScanner } from 'htmlparser2';

export const attr = (n, k) => n.attrs?.find((a) => a.name === k)?.value;
export const classes = (n) => (attr(n, 'class') || '').split(/\s+/).filter(Boolean);
export const hasClass = (n, c) => classes(n).includes(c);
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const clean = (s) => s.replace(/\s+/g, ' ').trim();

// Visible text of a node (script, style and noscript contents skipped).
export function textOf(n) {
  if (n.nodeName === '#text') return n.value;
  if (n.tagName === 'noscript' || n.tagName === 'script' || n.tagName === 'style') return '';
  return (n.childNodes || []).map(textOf).join('');
}
// Raw text of a script/style element.
export const rawText = (n) => (n.childNodes || []).map((c) => c.value || '').join('');
export const textNodes = (n) => (n.nodeName === '#text' ? [n] : (n.childNodes || []).flatMap(textNodes));

export function findAll(root, pred, out = []) {
  for (const c of root.childNodes || []) {
    if (c.tagName && pred(c)) out.push(c);
    findAll(c, pred, out);
    if (c.content) findAll(c.content, pred, out);
  }
  return out;
}
export const find = (root, pred) => findAll(root, pred)[0];

export function isInside(node, ancestor) {
  const a = ancestor.sourceCodeLocation;
  const l = node.sourceCodeLocation;
  return l.startOffset >= a.startOffset && l.endOffset <= a.endOffset;
}

// A start tag rebuilt from (possibly modified) attributes.
export function startTag(node, attrs, tagName = node.tagName) {
  return `<${tagName}${attrs.map((a) => (a.value === '' ? ` ${a.name}` : ` ${a.name}="${esc(a.value)}"`)).join('')}>`;
}

export function makeEditor(html) {
  const edits = [];
  return {
    replace(start, end, text) {
      edits.push({ start, end, text });
    },
    outer(node, text) {
      const l = node.sourceCodeLocation;
      edits.push({ start: l.startOffset, end: l.endOffset, text });
    },
    inner(node, text) {
      const l = node.sourceCodeLocation;
      edits.push({ start: l.startTag.endOffset, end: l.endTag.startOffset, text });
    },
    append(node, text) {
      const l = node.sourceCodeLocation;
      edits.push({ start: l.endTag.startOffset, end: l.endTag.startOffset, text });
    },
    // Replace an element's start tag (and optionally rename the element).
    retag(node, attrs, tagName = node.tagName) {
      const l = node.sourceCodeLocation;
      edits.push({ start: l.startTag.startOffset, end: l.startTag.endOffset, text: startTag(node, attrs, tagName) });
      if (tagName !== node.tagName && l.endTag) edits.push({ start: l.endTag.startOffset, end: l.endTag.endOffset, text: `</${tagName}>` });
    },
    apply() {
      edits.sort((a, b) => b.start - a.start || b.end - a.end);
      let out = html;
      let floor = Infinity;
      for (const e of edits) {
        if (e.end > floor) throw new Error('html-edit: overlapping edits');
        out = out.slice(0, e.start) + e.text + out.slice(e.end);
        floor = e.start;
      }
      return out;
    },
    get count() {
      return edits.length;
    },
    // True if [start, end) touches a range already being edited.
    overlaps(start, end) {
      return edits.some((e) => start < Math.max(e.end, e.start + 1) && end > e.start);
    },
    // Where the first edit starts.
    get firstStart() {
      return Math.min(...edits.map((e) => e.start));
    },
  };
}

// Replace text inside a text node's source, keeping the rest of the page untouched.
export function editText(ed, html, textNode, fn) {
  const l = textNode.sourceCodeLocation;
  if (!l) return false;
  const before = html.slice(l.startOffset, l.endOffset);
  const after = fn(before);
  if (after === before) return false;
  ed.replace(l.startOffset, l.endOffset, after);
  return true;
}

// Offset of the page's literal </head> end tag. parse5 builds the tree the way a
// browser does, which can close <head> early (it does on the raw WP Rocket HTML of
// / and /solar/) and then records no end tag; htmlparser2 reports the tag where it
// actually is in the source (script and style contents are skipped correctly).
export function headEndOffset(html) {
  let pos = -1;
  const p = new TagScanner(
    {
      onclosetag(name, implied) {
        if (pos < 0 && name === 'head' && !implied) pos = p.startIndex;
      },
    },
    { decodeEntities: false, lowerCaseTags: true }
  );
  p.write(html);
  p.end();
  return pos;
}
