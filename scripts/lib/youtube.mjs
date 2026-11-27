// YouTube videos as click-to-play stills: the still YouTube publishes for the video (a copy in
// custom/site-fixes/yt/, 1,280 and 640 px webp) with a play button, which site-fixes.js turns
// into the player, playing, when it is clicked. Until then nothing of YouTube's loads (its
// player is several hundred KB of scripts per video). Used by site-fixes.mjs (the videos in
// the pages) and project-pages.mjs (a project's video).
import { esc } from './html-edit.mjs';

// The videos there is a still for (the home page's background video has its own, in the page).
export const YT_STILLS = ['EJPeFkhznTY', 'qEv-IcDpYq0', 'vnYnJAHZRp8', 'o-CRKEta9Vw'];
export const YT_FILES = Object.fromEntries(YT_STILLS.flatMap((id) => [`yt/${id}.webp`, `yt/${id}-640.webp`].map((f) => [f, `/_custom/site-fixes/${f}`])));
const PLAY =
  '<svg viewBox="0 0 68 48" aria-hidden="true" focusable="false"><path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#f03"/><path d="M45 24 27 14v20z" fill="#fff"/></svg>';

/** The still and play button for a video (null when there is no still for it). */
export function youtubeFacade(id, title = '') {
  if (!YT_STILLS.includes(id)) return null;
  const name = title && !/^YouTube video player$/i.test(title) ? title : 'Panda Exteriors video';
  const still = `/_custom/site-fixes/yt/${id}`;
  return (
    `<button class="pfix-yt" type="button" data-yt="${esc(id)}" data-title="${esc(name)}" aria-label="Play video: ${esc(name)}">` +
    `<img src="${still}.webp" srcset="${still}-640.webp 640w, ${still}.webp 1280w" sizes="(min-width: 1024px) 640px, 100vw" width="1280" height="720" alt="" loading="lazy" decoding="async">` +
    `<span class="pfix-yt__play">${PLAY}</span></button>`
  );
}

/** The video's id, if `src` is a YouTube player's address. */
export const youtubeId = (src = '') => /youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/.exec(src)?.[1] || null;
