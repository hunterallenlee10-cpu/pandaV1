#!/usr/bin/env node
// Makes the photos for the project pages, their rows on the service pages and the list on
// /past-projects/ (scripts/lib/project-pages.mjs) from the originals on the site, in
// custom/projects/photos/: every project photo in custom/projects/projects.json resized to
// fit 720 px (webp: the photo grids and the cards), and each project's cover 1,280 px wide
// (webp and jpg: the heroes). Never enlarged. The originals are up to 2,560 px and 900 KB
// each.
//
// Run it after changing a project's photos or cover, then `npm run update:site` (or the
// full build).
//
//   node scripts/tools/project-photos.mjs [--force]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { PATHS, ROOT } from '../lib/config.mjs';
import { photoJobs, PROJECTS_DIR } from '../lib/project-pages.mjs';
import { args, ensureDir } from '../lib/util.mjs';

const opts = args();
const OUT = path.join(PROJECTS_DIR, 'photos');
ensureDir(OUT);

const keep = new Set();
for (const job of photoJobs()) {
  const src = path.join(PATHS.site, decodeURIComponent(job.src));
  if (!fs.existsSync(src)) throw new Error(`${job.src} is not on the site`);
  for (const [name, w, ext, fit] of job.out) {
    const file = path.join(OUT, name);
    keep.add(file);
    if (!opts.force && fs.existsSync(file) && fs.statSync(file).mtimeMs >= fs.statSync(src).mtimeMs) continue;
    // Grid photos: within a w x w box, so a tall photo is no larger than a wide one. Covers: w wide.
    const img = sharp(src).rotate().resize(fit === 'width' ? { width: w, withoutEnlargement: true } : { width: w, height: w, fit: 'inside', withoutEnlargement: true });
    await (ext === 'webp' ? img.webp({ quality: 76 }) : img.jpeg({ quality: 80, mozjpeg: true })).toFile(file);
    console.log(`wrote ${path.relative(ROOT, file)} (${Math.round(fs.statSync(file).size / 1024)} KB)`);
  }
}
// Photos no longer used.
for (const f of fs.readdirSync(OUT).map((n) => path.join(OUT, n))) {
  if (keep.has(f)) continue;
  fs.rmSync(f);
  console.log(`removed ${path.relative(ROOT, f)}`);
}
