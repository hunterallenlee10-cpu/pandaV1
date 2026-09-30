// The animated "areas we serve" US map that replaces the site's old map sections.
// Renders static SVG + HTML at build time from custom/us-map/ (geometry + areas.json);
// custom/us-map/us-map.js animates it in the browser and us-map.css styles it.
// Without JavaScript, or with reduced motion, the map shows its final state.
import fs from 'node:fs';
import path from 'node:path';
import { geoAlbersUsa } from 'd3-geo';
import { ROOT } from './config.mjs';

export const US_MAP_DIR = path.join(ROOT, 'custom', 'us-map');
// Where the stylesheet and script are published in site/ (and linked from pages).
export const US_MAP_FILES = { 'us-map.css': '/_custom/us-map/us-map.css', 'us-map.js': '/_custom/us-map/us-map.js' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;
const fmt = (b) => b.map(r1).join(' ');
const listJoin = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const fmtJobs = (n) => Number(n).toLocaleString('en-US');

// Pad a box [x0, y0, x1, y1] and enforce a minimum size; returns [x, y, w, h].
function padBox([x0, y0, x1, y1], pad, min) {
  const w = Math.max(x1 - x0 + 2 * pad, min);
  const h = Math.max(y1 - y0 + 2 * pad, min);
  return [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h];
}
const union = (boxes) => [
  Math.min(...boxes.map((b) => b[0])),
  Math.min(...boxes.map((b) => b[1])),
  Math.max(...boxes.map((b) => b[2])),
  Math.max(...boxes.map((b) => b[3])),
];

let cached = null;
export function loadUsMap() {
  if (cached) return cached;
  const geo = JSON.parse(fs.readFileSync(path.join(US_MAP_DIR, 'us-states.json'), 'utf8'));
  const data = JSON.parse(fs.readFileSync(path.join(US_MAP_DIR, 'areas.json'), 'utf8'));
  const project = geoAlbersUsa().scale(geo.projection.scale).translate(geo.projection.translate);

  const states = data.states.map((s) => {
    const g = geo.states[s.code];
    if (!g) throw new Error(`custom/us-map/areas.json: unknown state code "${s.code}"`);
    return { ...s, name: s.name || g.name, d: g.d, bbox: g.bbox, centroid: g.centroid, inset: !!s.inset };
  });
  const stateByCode = new Map(states.map((s) => [s.code, s]));
  const areas = data.areas
    .filter((a) => !a.hidden)
    .map((a) => {
      const p = project([a.lon, a.lat]);
      if (!p) throw new Error(`custom/us-map/areas.json: ${a.id} is outside the map`);
      if (!stateByCode.has(a.state)) throw new Error(`custom/us-map/areas.json: ${a.id} is in ${a.state}, which is not in "states"`);
      return { ...a, x: r1(p[0]), y: r1(p[1]), inset: stateByCode.get(a.state).inset };
    });

  // The light-up wave and the marker pop-in run outward from the origin state.
  const origin = stateByCode.get(data.origin)?.centroid || states[0].centroid;
  const dist = ([x, y]) => Math.hypot(x - origin[0], y - origin[1]);
  [...states].sort((a, b) => dist(a.centroid) - dist(b.centroid)).forEach((s, i) => (s.order = i));
  [...areas].sort((a, b) => dist([a.x, a.y]) - dist([b.x, b.y])).forEach((a, i) => (a.order = i));

  // Camera boxes: the whole served region, and each state (with its markers). A state
  // marked "inset" (far from the others, e.g. Florida) is left out of the region and
  // shown in its own small box in the corner, so the map doesn't have to zoom out for it.
  const point = (a) => [a.x, a.y, a.x, a.y];
  const main = states.filter((s) => !s.inset);
  if (!main.length) throw new Error('custom/us-map/areas.json: every state is an inset');
  const regionBounds = union([...main.map((s) => s.bbox), ...areas.filter((a) => !a.inset).map(point)]);
  const region = padBox(regionBounds, 26, 60);
  for (const s of main) {
    const own = areas.filter((a) => a.state === s.code).map(point);
    s.box = padBox(union([s.bbox, ...own]), 18, 80);
  }
  const insetStates = states.filter((s) => s.inset);
  const inset = insetStates.length
    ? { states: insetStates, areas: areas.filter((a) => a.inset), box: padBox(union([...insetStates.map((s) => s.bbox), ...areas.filter((a) => a.inset).map(point)]), 10, 40) }
    : null;
  // The inset sits in the bottom-right corner: widen the region to the right, up to a
  // square, so it lands on open water. Every map box is at least as wide as it is tall,
  // so this doesn't zoom the map out.
  if (inset && region[2] < region[3]) region[2] = region[3];
  cached = { geo, states, stateByCode, areas, region, inset, full: geo.viewBox };
  return cached;
}

// Words used in the map's text alternatives and the explorer panel.
function describe(map) {
  const stateNames = map.states.map((s) => s.name);
  const offices = map.areas.map((a) => `${a.name}, ${a.state}`);
  return { stateNames, offices, statesText: listJoin(stateNames), officesText: offices.join(' · ') };
}

// One office marker. k0 is the marker scale for the static (no-JS) render; the script
// recomputes it for the real size.
function renderPin(map, a, k0) {
  const maxJobs = Math.max(0, ...map.areas.map((x) => Number(x.jobs) || 0));
  const jobs = Number(a.jobs) || 0;
  const stateName = map.stateByCode.get(a.state).name;
  const label = `${a.name}, ${stateName}: ${a.kind}${jobs ? `, ${fmtJobs(jobs)} jobs` : ''}`;
  // With job numbers the marker becomes a bubble whose area is proportional to the count.
  const r = jobs ? r1(10 + 18 * Math.sqrt(jobs / maxJobs)) : 6;
  const count = jobs ? `<text class="pmap__count" dy="0.35em">${esc(fmtJobs(jobs))}</text>` : '';
  return (
    `<g class="pmap__area${jobs ? ' pmap__area--jobs' : ''}" data-area="${esc(a.id)}" data-state="${esc(a.state)}" ` +
    `data-name="${esc(`${a.name}, ${a.state}`)}" data-kind="${esc(a.kind)}"${jobs ? ` data-jobs="${jobs}"` : ''} ` +
    `data-x="${a.x}" data-y="${a.y}" transform="translate(${a.x} ${a.y}) scale(${k0})" style="--i:${a.order}" ` +
    `tabindex="0" role="img" aria-label="${esc(label)}">` +
    `<g class="pmap__pin"><circle class="pmap__hit" r="${Math.max(16, r + 6)}"/>` +
    `<circle class="pmap__pulse" r="${r}"/><circle class="pmap__dot" r="${r}"/>${count}</g></g>`
  );
}
const statePath = (s) =>
  `<path class="pmap__state" data-state="${s.code}" data-name="${esc(s.name)}"` +
  `${Number(s.jobs) ? ` data-jobs="${Number(s.jobs)}"` : ''} style="--i:${s.order}" d="${s.d}"/>`;
// Biggest bubbles first, so smaller ones are drawn on top of them.
const bySize = (areas) => [...areas].sort((a, b) => (Number(b.jobs) || 0) - (Number(a.jobs) || 0));

function renderSvg(map, { uid, variant }) {
  const { statesText } = describe(map);
  const officesSpoken = listJoin(map.areas.map((a) => `${a.name}, ${map.stateByCode.get(a.state).name}`));
  const k0 = r1((map.region[2] / (variant === 'explorer' ? 720 : 560)) * 1000) / 1000;
  return (
    `<svg class="pmap__svg" viewBox="${fmt(map.region)}" preserveAspectRatio="xMidYMid meet" ` +
    `role="group" aria-labelledby="${uid}-t" aria-describedby="${uid}-d" focusable="false">` +
    `<title id="${uid}-t">Map of the areas Panda Exteriors serves</title>` +
    `<desc id="${uid}-d">A map of the United States with ${esc(statesText)} highlighted, and local offices in ${esc(officesSpoken)}.</desc>` +
    `<path class="pmap__land" id="${uid}-land" d="${map.geo.nation}"/>` +
    `<path class="pmap__borders" id="${uid}-borders" d="${map.geo.borders}"/>` +
    `<g class="pmap__states">${map.states.filter((s) => !s.inset).map(statePath).join('')}</g>` +
    `<g class="pmap__areas">${bySize(map.areas.filter((a) => !a.inset)).map((a) => renderPin(map, a, k0)).join('')}</g>` +
    `</svg>` +
    renderInset(map, { uid })
  );
}

// The inset box for far-away states: the same map (same units, the land and borders
// reused from the main map), framed on those states.
function renderInset(map, { uid }) {
  const inset = map.inset;
  if (!inset) return '';
  const names = listJoin(inset.states.map((s) => s.name));
  const k0 = r1((inset.box[2] / 150) * 1000) / 1000;
  return (
    `<div class="pmap__inset" data-states="${inset.states.map((s) => s.code).join(' ')}" style="--pmap-inset-aspect:${r1(inset.box[2] / inset.box[3])}">` +
    `<svg class="pmap__inset-svg" viewBox="${fmt(inset.box)}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="${esc(`Inset map: ${names}`)}" focusable="false">` +
    `<use class="pmap__land" href="#${uid}-land"/><use class="pmap__borders" href="#${uid}-borders"/>` +
    `<g class="pmap__states">${inset.states.map(statePath).join('')}</g>` +
    `<g class="pmap__areas">${bySize(inset.areas).map((a) => renderPin(map, a, k0)).join('')}</g>` +
    `</svg>` +
    `<span class="pmap__inset-name" aria-hidden="true">${esc(names)}</span>` +
    `</div>`
  );
}

const legend = () =>
  // divs with list roles: the site's stylesheet forces bullets and colours on every ul/li.
  `<div class="pmap__legend" role="list">` +
  `<div class="pmap__legend-item" role="listitem"><span class="pmap__key pmap__key--state" aria-hidden="true"></span>Areas we serve</div>` +
  `<div class="pmap__legend-item" role="listitem"><span class="pmap__key pmap__key--office" aria-hidden="true"></span>Local office</div>` +
  `</div>`;

const dataAttrs = (map, extra = '') =>
  `data-pmap data-full="${fmt(map.full)}" data-region="${fmt(map.region)}"${extra}`;

/** Small map for the "Local East Coast Exterior Remodelers" band. theme: 'orange' | 'light'. */
export function renderCompactMap({ theme = 'orange', uid = 'pmap' } = {}) {
  const map = loadUsMap();
  return (
    `<div class="pmap pmap--compact pmap--on-${theme}" ${dataAttrs(map)}>` +
    `<div class="pmap__stage">${renderSvg(map, { uid, variant: 'compact' })}<div class="pmap__tip" hidden></div></div>` +
    legend() +
    `</div>`
  );
}

/** Large interactive map: state buttons zoom the map and update the panel next to it. */
export function renderExplorerMap({ uid = 'pmapx', ctaHref = '/contact-us/', ctaText = 'Get a free estimate' } = {}) {
  const map = loadUsMap();
  const { statesText, officesText } = describe(map);
  // Zoom boxes for the state buttons; an inset state is shown in its box instead.
  const boxes = Object.fromEntries(map.states.filter((s) => !s.inset).map((s) => [s.code, s.box.map(r1)]));
  const chips = [
    `<button type="button" class="pmap__chip" data-state="" aria-pressed="true">All areas</button>`,
    ...map.states.map((s) => `<button type="button" class="pmap__chip" data-state="${s.code}" aria-pressed="false">${esc(s.name)}</button>`),
  ].join('');
  // Job numbers are optional (left out for now): per state if given, else summed from the areas.
  const stateJobs = map.states.reduce((n, s) => n + (Number(s.jobs) || 0), 0);
  const jobsTotal = stateJobs || map.areas.reduce((n, a) => n + (Number(a.jobs) || 0), 0);
  return (
    `<div class="pmap pmap--explorer pmap--on-light" ${dataAttrs(map, ` data-boxes="${esc(JSON.stringify(boxes))}"`)}>` +
    `<div class="pmap__chips" role="group" aria-label="Choose an area to zoom in">${chips}</div>` +
    `<div class="pmap__body">` +
    `<div class="pmap__stage">${renderSvg(map, { uid, variant: 'explorer' })}<div class="pmap__tip" hidden></div></div>` +
    `<div class="pmap__info" aria-live="polite">` +
    `<p class="pmap__info-title" data-default="All areas">All areas</p>` +
    `<p class="pmap__info-text" data-default="${esc(statesText)}">${esc(statesText)}</p>` +
    `<p class="pmap__info-offices" data-default="${esc(officesText)}"><span class="pmap__info-label">Local offices</span>` +
    `<span class="pmap__info-list">${esc(officesText)}</span></p>` +
    (jobsTotal ? `<p class="pmap__info-jobs" data-default="${jobsTotal}">${esc(fmtJobs(jobsTotal))} jobs completed</p>` : '') +
    `<a class="pmap__cta" href="${esc(ctaHref)}">${esc(ctaText)}</a>` +
    `</div></div>` +
    legend() +
    `</div>`
  );
}
