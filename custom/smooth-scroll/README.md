# Smooth scrolling (Lenis)

Every page of the copy scrolls smoothly: mouse-wheel and trackpad scrolling glide to a stop instead of moving in
steps. It uses [Lenis](https://github.com/darkroomengineering/lenis) 1.3.26 (MIT licence), which animates the page's
own scroll position, so the page still scrolls the normal way underneath: sticky and fixed bars, lazy-loaded images,
the animated map, the carousels and every other script on the site work exactly as before.

The stylesheet and scripts are linked from every page by `scripts/lib/customize.mjs` during `scripts/03-build.mjs`.
`SMOOTH_SCROLL=0` builds the pages without them.

## What it does

- Wheel and trackpad scrolling glide (Lenis's default easing). Touch scrolling on phones and tablets, the keyboard and
  the scrollbar stay the browser's own; Lenis keeps up with them.
- Areas that scroll by themselves (a pop-up's content, a long menu, a wide table) keep scrolling themselves instead of
  the page. While a pop-up (Bootstrap modal) is open, the page behind it does not move. The photo viewer (lightGallery,
  in the project galleries) never locked the page, so the wheel scrolled the page behind the photo; now it does not.
- Links to a spot on the same page (such as "Why Panda?" on `/careers/`) glide there and stop just below the fixed top
  bar and menu instead of underneath them. The site's own "scroll to" calls and keyboard focus stop there too.
- Sideways trackpad swipes over a review carousel move the carousel, not the page.
- People who prefer reduced motion get plain, instant scrolling (Lenis's own setting).

## Files

| File | |
| --- | --- |
| `lenis.min.js` | Lenis 1.3.26 (`dist/lenis.min.js` from the npm package, with its licence line added). |
| `smooth-scroll.css` | Lenis's stylesheet (`dist/lenis.css`). |
| `smooth-scroll.js` | The site's setup: starts Lenis and adds the behaviour above. |

All three are copied to `site/_custom/smooth-scroll/` by the build (or by `scripts/tools/update-built-site.mjs`).

## Updating Lenis

Download the package (`npm pack lenis@<version>`), copy its `dist/lenis.min.js` here with the licence line at the top
(and without the `sourceMappingURL` comment) and its `dist/lenis.css` into `smooth-scroll.css`, then rebuild.
