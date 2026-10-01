#!/usr/bin/env node
// Refreshes the Panda Vision podcast data shown on the Media page (/media/) from the
// show's own RSS feed and Apple Podcasts, so new episodes appear after a rebuild:
//
//  - custom/media/podcast.json      the show and its episodes (title, date, length, summary,
//                                   the video file, the episode's Apple Podcasts page)
//  - custom/media/podcast/cover.*   the show's cover art (600 px)
//  - custom/media/podcast/ep-N.*    a still from each episode's video, used as its poster
//                                   (needs ffmpeg; it reads only the bytes it needs), and
//                                   ep-N-sm.* the same still small, for the episode list
//
// The build never touches the network; this tool is the only part that does. Run it, then
// `npm run update:site` (or the full build) to regenerate /media/.
//
//   node scripts/tools/media-podcast.mjs [--feed=URL] [--apple-id=N] [--force]
//
// --force re-takes every poster still. An episode's still is taken `posterAt` seconds in
// (default 120); set "posterAt" on an episode in podcast.json to pick another moment.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseFragment } from 'parse5';
import sharp from 'sharp';
import { ROOT, UA_DESKTOP } from '../lib/config.mjs';
import { textOf, clean } from '../lib/html-edit.mjs';
import { args, writeJson, ensureDir } from '../lib/util.mjs';

const opts = args();
const DIR = path.join(ROOT, 'custom', 'media');
const IMG_DIR = path.join(DIR, 'podcast');
const DATA = path.join(DIR, 'podcast.json');
const previous = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, 'utf8')) : { show: {}, episodes: [] };
const FEED = opts.feed || previous.show.feed || 'https://rss.mypodops.com/panda-vision.xml';
const APPLE_ID = String(opts['apple-id'] || previous.show.appleId || '1863717313');
const DEFAULT_POSTER_AT = 120;

async function get(url, type = 'text') {
  const res = await fetch(url, { headers: { 'user-agent': UA_DESKTOP } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return type === 'json' ? res.json() : type === 'buffer' ? Buffer.from(await res.arrayBuffer()) : res.text();
}

// --------------------------------------------------------------- the feed
const cdata = (s) => (s || '').replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1');
const tag = (xml, name) => cdata(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(xml)?.[1] || '').trim();
const tagAttr = (xml, name, a) => new RegExp(`<${name}\\b[^>]*\\s${a}="([^"]*)"`).exec(xml)?.[1] || '';
// Plain-text paragraphs of an HTML description (the feed escapes it, or wraps it in CDATA).
function paragraphs(html) {
  const raw = /&lt;/.test(html) ? clean(textOf(parseFragment(`<p>${html}</p>`))) : html;
  const frag = parseFragment(raw);
  const blocks = (frag.childNodes || []).filter((n) => n.tagName === 'p' || n.nodeName === '#text').map((n) => clean(textOf(n)));
  return blocks.filter(Boolean);
}
const TRANSCRIPT = /\[\d{2}:\d{2}:\d{2}\]/;
const seconds = (d) => String(d || '').split(':').reduce((s, part) => s * 60 + Number(part || 0), 0);

const xml = await get(FEED);
const channel = xml.split(/<item>/)[0];
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
if (!items.length) throw new Error(`${FEED}: no episodes in the feed`);

// --------------------------------------------------- Apple Podcasts pages
const apple = await get(`https://itunes.apple.com/lookup?id=${APPLE_ID}&entity=podcastEpisode&limit=200`, 'json');
const appleShow = apple.results.find((r) => r.kind === 'podcast');
if (!appleShow) throw new Error(`Apple Podcasts has no show with id ${APPLE_ID}`);
const appleByGuid = new Map(apple.results.filter((r) => r.kind === 'podcast-episode').map((r) => [r.episodeGuid, r]));
const appleUrl = (u) => (u ? u.replace(/[?&]uo=\d+/, '').replace(/\?$/, '') : '');

// ----------------------------------------------------------------- images
ensureDir(IMG_DIR);
async function saveImage(input, base, width, height) {
  const img = sharp(input).resize(width, height, { fit: 'cover' });
  await img.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(IMG_DIR, `${base}.jpg`));
  await img.clone().webp({ quality: 78 }).toFile(path.join(IMG_DIR, `${base}.webp`));
  return `podcast/${base}.jpg`;
}
// The small copy of a poster shown in the episode list (scripts/lib/media-page.mjs: -sm).
async function saveSmall(poster) {
  const base = path.basename(poster, '.jpg') + '-sm';
  if (!opts.force && fs.existsSync(path.join(IMG_DIR, `${base}.jpg`))) return;
  await saveImage(path.join(DIR, poster), base, 480, 270);
}
let ffmpeg = true;
try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
} catch {
  ffmpeg = false;
  console.warn('ffmpeg not found: episode posters are not (re)taken; episodes without one show the cover art');
}
function grabStill(video, at) {
  // -ss before -i seeks by byte ranges, so only a few MB of the (multi-GB) file are read.
  return execFileSync('ffmpeg', ['-nostdin', '-loglevel', 'error', '-ss', String(at), '-i', video, '-frames:v', '1', '-vf', 'scale=1280:-2', '-f', 'image2pipe', '-c:v', 'png', '-'], {
    maxBuffer: 64 * 1024 * 1024,
    timeout: 180_000,
  });
}

const coverUrl = tagAttr(channel, 'itunes:image', 'href');
const cover = coverUrl ? await saveImage(await get(coverUrl, 'buffer'), 'cover', 600, 600) : previous.show.cover || '';

const prevByGuid = new Map((previous.episodes || []).map((e) => [e.guid, e]));
const episodes = [];
for (const item of items) {
  const guid = tag(item, 'guid');
  const prev = prevByGuid.get(guid) || {};
  const a = appleByGuid.get(guid);
  const number = Number(tag(item, 'itunes:episode')) || null;
  const video = tagAttr(item, 'enclosure', 'url');
  const ep = {
    guid,
    number,
    season: Number(tag(item, 'itunes:season')) || null,
    title: clean(textOf(parseFragment(tag(item, 'title')))),
    date: new Date(tag(item, 'pubDate')).toISOString(),
    duration: seconds(tag(item, 'itunes:duration')),
    // content:encoded holds the transcript on most episodes; their summary is the description.
    summary: ['description', 'itunes:summary', 'content:encoded'].map((t) => paragraphs(tag(item, t)).find((p) => !TRANSCRIPT.test(p))).find(Boolean) || '',
    video,
    videoType: tagAttr(item, 'enclosure', 'type') || 'video/mp4',
    apple: appleUrl(a?.trackViewUrl) || prev.apple || '',
    poster: prev.poster || '',
    ...(prev.posterAt != null ? { posterAt: prev.posterAt } : {}),
  };
  const base = `ep-${number || guid.replace(/\W+/g, '-')}`;
  const have = ep.poster && fs.existsSync(path.join(DIR, ep.poster));
  if (ffmpeg && video && /^video\//.test(ep.videoType) && (!have || opts.force)) {
    try {
      const at = Math.min(ep.posterAt ?? DEFAULT_POSTER_AT, Math.max(0, ep.duration - 5));
      ep.poster = await saveImage(grabStill(video, at), base, 1280, 720);
      console.log(`poster: ${ep.title} (${at}s in) -> custom/media/${ep.poster}`);
    } catch (e) {
      console.warn(`poster: ${ep.title}: ${e.message.split('\n')[0]}`);
    }
  }
  if (ep.poster && fs.existsSync(path.join(DIR, ep.poster))) await saveSmall(ep.poster);
  episodes.push(ep);
}
episodes.sort((x, y) => y.date.localeCompare(x.date));

const data = {
  show: {
    title: tag(channel, 'title') || 'Panda Vision',
    description: paragraphs(tag(channel, 'description')),
    cover,
    feed: FEED,
    appleId: APPLE_ID,
    apple: appleUrl(appleShow.collectionViewUrl),
    updated: new Date().toISOString().slice(0, 10),
  },
  episodes,
};
writeJson(DATA, data);
// Stills of episodes no longer in the feed.
const used = new Set(
  [cover, ...episodes.flatMap((e) => (e.poster ? [e.poster, e.poster.replace(/\.jpg$/, '-sm.jpg')] : []))].filter(Boolean).flatMap((p) => [p, p.replace(/\.jpg$/, '.webp')])
);
for (const f of fs.readdirSync(IMG_DIR)) if (!used.has(`podcast/${f}`)) fs.rmSync(path.join(IMG_DIR, f));
console.log(`Wrote custom/media/podcast.json: ${data.show.title}, ${episodes.length} episode(s), latest "${episodes[0].title}" (${episodes[0].date.slice(0, 10)})`);
