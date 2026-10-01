#!/usr/bin/env node
// Makes the photos for /past-projects/ (scripts/lib/past-projects.mjs) from the originals
// on the site, in custom/past-projects/photos/: for each project in
// custom/past-projects/favorites.json, its "photo" resized to fit 720 and 1440 px (webp)
// and a 1440 px jpg for browsers without webp; for the hero, its photo at 960 and 1920 px
// wide (webp) and a 1920 px jpg (never enlarged). The originals are up to 2,560 px and
// 900 KB each.
//
// Run it after changing a project's photo, then `npm run update:site` (or the full build).
//
//   node scripts/tools/past-projects-photos.mjs [--force]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { PATHS, ROOT } from '../lib/config.mjs';
import { photoJobs, PAST_PROJECTS_DIR } from '../lib/past-projects.mjs';
import { args, ensureDir } from '../lib/util.mjs';

const opts = args();
const OUT = path.join(PAST_PROJECTS_DIR, 'photos');
ensureDir(OUT);

const keep = new Set();
for (const job of photoJobs()) {
  const src = path.join(PATHS.site, decodeURIComponent(job.photo));
  if (!fs.existsSync(src)) throw new Error(`${job.slug}: ${job.photo} is not on the site`);
  const hero = job.slug === 'hero';
  for (const [w, ext] of job.sizes) {
    const file = path.join(OUT, `${job.slug}-${w}.${ext}`);
    keep.add(file);
    if (!opts.force && fs.existsSync(file) && fs.statSync(file).mtimeMs >= fs.statSync(src).mtimeMs) continue;
    // Cards: within a w x w box, so a tall photo is no larger than a wide one. Hero: w wide.
    const img = sharp(src).rotate().resize(hero ? { width: w, withoutEnlargement: true } : { width: w, height: w, fit: 'inside', withoutEnlargement: true });
    await (ext === 'webp' ? img.webp({ quality: 78 }) : img.jpeg({ quality: 80, mozjpeg: true })).toFile(file);
    console.log(`wrote ${path.relative(ROOT, file)} (${Math.round(fs.statSync(file).size / 1024)} KB)`);
  }
}
// Photos of projects no longer in the list.
for (const f of fs.readdirSync(OUT).map((n) => path.join(OUT, n))) {
  if (keep.has(f)) continue;
  fs.rmSync(f);
  console.log(`removed ${path.relative(ROOT, f)}`);
}
