// /careers/ (a hand-built page, careers-header.mjs): its photos showed commercial work, which
// is off the site, and its photo strip half-loaded.
//
//  - Hero: a drone photo of an office complex and its parking lot -> Panda crews shingling new
//    homes with GAF Timberline HDZ, a crane lifting the bundles, houses all around (a webp copy,
//    1920 and 960 px, of /wp-content/uploads/2025/07/1-Jun-24-2025-09_32am-Qg47.jpg).
//  - "Our Three Pillars": crews laying membrane on a flat commercial roof -> a Panda roofer in a
//    Panda hoodie and harness on a roof (a crop of the photo behind the About page's hero).
//  - "Real Work. Real Results.": eight square photos, five of them camera files of up to
//    3024 x 4032 px left to a lazy loader that often never showed them (an empty dark band under
//    the first row), and among them the office complex again, a flat roof beside a church and
//    the hero's photo. They become a mosaic of Panda's own home projects: one large photo of a
//    crew re-roofing a home and eight smaller ones, each linking to its project page with the
//    project's name on it, from the copies the project pages already use (720 px webp).
//  - "The Proof Is in the Numbers": the two stats the rest of the site also shows read as it does:
//    the jobs as JOBS_TOTAL (us-map.mjs; "Successful Projects Completed" -> "Jobs Completed") and
//    "1,500+ Five-Star Customer Reviews" as the Google rating the home and About pages show
//    (custom/reviews/google-reviews.json: 4.8 from 1,067 reviews). The other four (Inc. 5000,
//    BBB, GAF, Glassdoor) are the page's own.
//
// Applied by site-fixes.mjs; the three are rendered again on every run, so `npm run update:site`
// keeps them in step with this file and the project names in custom/projects/projects.json.
import { find, findAll, hasClass, esc, classes, textOf, clean } from './html-edit.mjs';
import { projectsData } from './project-pages.mjs';
import { JOBS_TOTAL } from './us-map.mjs';
import { loadReviewWall } from './review-wall.mjs';

export const CAREERS_PATH = '/careers/';
export const CAREERS_FILES = {
  'careers-hero.webp': '/_custom/site-fixes/careers-hero.webp',
  'careers-hero-960.webp': '/_custom/site-fixes/careers-hero-960.webp',
  'careers-team.webp': '/_custom/site-fixes/careers-team.webp',
};
const HERO = { src: '/_custom/site-fixes/careers-hero.webp', small: '/_custom/site-fixes/careers-hero-960.webp', width: 1920, height: 887,
  alt: 'Panda Exteriors crews shingling new homes with GAF Timberline roofing while a crane lifts the bundles' };
const TEAM = { src: '/_custom/site-fixes/careers-team.webp', width: 800, height: 491,
  alt: 'A Panda Exteriors roofer in a Panda hoodie and safety harness on a roof' };
const P = '/_custom/projects/photos/';
// The mosaic: the first photo is the large one. slug: the project the photo is from.
const GALLERY = [
  { slug: 'panda-ext-15321', src: '/_custom/past-projects/photos/hero-960.webp', w: 960, h: 540, alt: 'A Panda crew re-roofing a two-story home with dormers' },
  { slug: 'spanish-tile', src: `${P}Website-Map-5-May-22-2025-04_21am-NpDB-720.webp`, w: 720, h: 405, alt: 'A Panda roofer laying red tile on a two-story home' },
  { slug: 'roof-replacement-2', src: `${P}Website-Map-6-Jun-04-2025-05_14pm-5SYS-720.webp`, w: 720, h: 405, alt: 'A ranch home with its new roof' },
  { slug: 'roof-replacement-gutter-guards', src: `${P}Website-Map-6-Jul-04-2025-02_20pm-z3oQ-720.webp`, w: 720, h: 405, alt: 'Bundles of new shingles on a roof above a wooded neighborhood' },
  { slug: 'panda-ext-15321', src: `${P}item_19ea236e-ea45-4c67-b09d-85ae2170d35c-720.webp`, w: 720, h: 405, alt: 'A home with three dormers and a GAF Timberline Solar roof' },
  { slug: 'roof-replacement', src: `${P}Website-Map-5-Jun-25-2025-09_20pm-qoLB-720.webp`, w: 720, h: 405, alt: 'New roof decking going down during a roof replacement' },
  { slug: 'spanish-tile', src: `${P}Website-Map-7-May-22-2025-05_46am-iYjP-720.webp`, w: 720, h: 405, alt: 'A two-story brick home with its new red Spanish tile roof' },
  { slug: 'roof-replacement', src: `${P}Website-Map-2-May-27-2025-07_45am-jMJF-720.webp`, w: 720, h: 405, alt: 'The front of a colonial home before its roof replacement' },
  { slug: 'roof-replacement', src: `${P}Website-Map-4-May-27-2025-07_51am-CzYQ-720.webp`, w: 720, h: 405, alt: 'A new roof over a neighborhood of family homes' },
];

function heroMedia() {
  return (
    `<img fetchpriority="high" width="${HERO.width}" height="${HERO.height}" src="${HERO.src}" ` +
    `srcset="${HERO.small} 960w, ${HERO.src} ${HERO.width}w" sizes="100vw" alt="${esc(HERO.alt)}" decoding="async">`
  );
}
const teamPhoto = () => `<img width="${TEAM.width}" height="${TEAM.height}" src="${TEAM.src}" alt="${esc(TEAM.alt)}" loading="lazy" decoding="async">`;
function galleryTiles() {
  const titles = new Map(projectsData().projects.map((p) => [p.slug, p.title]));
  return GALLERY.filter((g) => titles.has(g.slug))
    .map(
      (g, i) =>
        `<a class="pcv2-gallery-card pfix-cw-tile${i === 0 ? ' pfix-cw-tile--big' : ''}" href="/blog/project/${esc(g.slug)}/">` +
        `<img width="${g.w}" height="${g.h}" src="${esc(g.src)}" alt="${esc(g.alt)}" loading="lazy" decoding="async">` +
        `<span class="pfix-cw-tile__label">${esc(titles.get(g.slug))}<span aria-hidden="true"> →</span></span></a>`
    )
    .join('');
}

/** /careers/: the hero photo, the pillars photo and the project mosaic. Returns true if any changed. */
export function collectCareersPage(doc, html, ed, { pathname = '' } = {}, changes = []) {
  if (pathname !== CAREERS_PATH) return false;
  const free = (n) => n && !ed.overlaps(n.sourceCodeLocation.startOffset, n.sourceCodeLocation.endOffset);
  const inner = (n) => html.slice(n.sourceCodeLocation.startTag.endOffset, n.sourceCodeLocation.endTag.startOffset);
  let done = false;

  const media = find(doc, (c) => hasClass(c, 'pcv2-hero-media'));
  if (free(media) && inner(media).trim() !== heroMedia()) {
    ed.inner(media, heroMedia());
    changes.push('careers hero: crews shingling new homes (was a drone photo of an office complex and its parking lot)');
    done = true;
  }
  const pillar = find(doc, (c) => hasClass(c, 'pcv2-pillar-image'));
  if (free(pillar) && inner(pillar).trim() !== teamPhoto()) {
    ed.inner(pillar, teamPhoto());
    changes.push('careers pillars: a Panda roofer in a Panda hoodie (was crews on a flat commercial roof)');
    done = true;
  }
  const grid = find(doc, (c) => hasClass(c, 'pcv2-gallery-grid'));
  if (free(grid)) {
    const tiles = galleryTiles();
    if (!hasClass(grid, 'pfix-cw-gallery') || inner(grid) !== tiles) {
      ed.replace(grid.sourceCodeLocation.startOffset, grid.sourceCodeLocation.endOffset,
        `<div class="${[...new Set([...classes(grid), 'pfix-cw-gallery'])].join(' ')}">${tiles}</div>`);
      changes.push(`careers photos: a mosaic of ${GALLERY.length} home project photos linking to their pages (were 8 photos, 5 that often never loaded, some of commercial work)`);
      done = true;
    }
  }
  // The numbers: [label it had or has, value, label].
  const rating = Number(loadReviewWall()?.place?.rating) || 0;
  const STATS = [
    [/^(Successful Projects Completed|Jobs Completed)$/i, JOBS_TOTAL.short, 'Jobs Completed'],
    ...(rating ? [[/^(Five-Star Customer Reviews|Google Rating)$/i, `${rating.toFixed(1)}★`, 'Google Rating']] : []),
  ];
  for (const card of findAll(doc, (c) => hasClass(c, 'pcv2-stat-card'))) {
    const value = find(card, (c) => hasClass(c, 'pcv2-stat-value'));
    const label = find(card, (c) => hasClass(c, 'pcv2-stat-label'));
    if (!value || !label || !free(card)) continue;
    const stat = STATS.find(([re]) => re.test(clean(textOf(label))));
    if (!stat || (clean(textOf(value)) === stat[1] && clean(textOf(label)) === stat[2])) continue;
    ed.inner(value, esc(stat[1]));
    ed.inner(label, esc(stat[2]));
    changes.push(`careers numbers: ${stat[1]} ${stat[2]}`);
    done = true;
  }
  return done;
}
