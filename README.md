# pandav1 — offline copy of pandaexteriors.com

A static, fully offline copy of the **public** website at <https://pandaexteriors.com> (main site only), plus the
scripts that captured and verified it, so the copy can be refreshed at any time.

It was captured as an anonymous visitor using only GET requests to public URLs. The crawler never touched the CMS,
`/wp-admin`, `/wp-login.php`, the REST API or any account area, sent no form data, and followed `robots.txt`. It was
polite: at most 2 requests in flight, with a pause after each. The headline numbers (pages, assets, sizes, visual-diff
pass rate) are in [`docs/capture-summary.md`](docs/capture-summary.md).

## What's in scope

The copy contains what a visitor can reach by clicking through the site: **172 pages** (39 main pages,
114 blog posts and listing pages, and the 19 project pages the site links to), plus the 404 page, feed,
sitemaps, icons and every file those pages use. Deliberately left out (listed in `docs/url-exclusions.csv`):

- **17 city sections** (`/baltimore-md/`, `/charlotte-nc/`, … `/wilmington-de/`). Each is a separate WordPress
  site in a multisite network, so per the capture rules they count as sub-sites. The build contains the main
  website only: every link to a city site is removed (the Site Map's 16 city entries, the Service Areas city
  carousel, and two in-text links in one blog post, which keep their words), and the lead form's post-submit
  redirect points at the main site's `/thank-you/` page instead of a city site's. Controlled by
  `REMOVE_SUBSITE_LINKS` in `scripts/lib/config.mjs`; pages changed this way are listed as "edited on purpose"
  in `docs/visual-diff/summary.md`.
- **Panda Interiors / Panda Bath**, removed on request. `/interiors/` was the only page about them (nothing linked
  to it; it was listed in the sitemap). The page, its sitemap entry and the 25 files only it used (its bathroom
  photos and styles) are left out, and the old address redirects to the home page. It was captured, so it is
  counted in `docs/capture-summary.md` rather than in the exclusions list. Controlled by `REMOVE_PAGES` in
  `scripts/lib/config.mjs`.
- **5,309 auto-generated `/blog/project/` posts** that appear only in the sitemaps and are not linked from any
  page (`SITEMAP_ONLY_EXCLUDE` in `scripts/lib/config.mjs`; set it to `''` to capture them too).
- Admin, login and API URLs, which are never requested.

## Deliberate changes

Besides removing the city links (above), the copy differs from the live site on purpose in four ways.

**The old map sections are replaced by an animated US map** (`custom/us-map/`, applied by `scripts/lib/customize.mjs`
during the build, `CUSTOM_US_MAP=0` to turn off). That covers the "Local East Coast Exterior Remodelers" band on 10
pages (it showed a screenshot of a Google Map) and the Google Maps "Projects | Map" widget on `/past-projects/` (it
needs the live WordPress API, so it could never work in a static copy); `/service-areas/` also gets the map where its
city list used to be. The map shows the 20 states (counting Washington, D.C.) where Panda has completed jobs, each
shaded by its number of jobs (9,900 in all), and its local offices — see
[`custom/us-map/README.md`](custom/us-map/README.md) to edit the areas or update the numbers. Pages changed this way are
listed as "edited on purpose" in `docs/visual-diff/summary.md`.

**The homepage hero plays a different background video.** The hero's muted, looping YouTube background shows
[`EJPeFkhznTY`](https://www.youtube.com/watch?v=EJPeFkhznTY) instead of the live site's video (applied by
`applyHeroVideo` in `scripts/lib/customize.mjs` during the build). The video also fills the whole hero at every
screen size, centred and cropped like a background image, with YouTube's title bar cropped off; on the live site
it only fits the hero's width, leaving most of the tablet hero black and showing just the top half of the video on
wide screens. Set `HERO_VIDEO_ID` in `scripts/lib/config.mjs` (or as an environment variable) to another YouTube
video ID to change it, or to `''` to keep the live site's video and sizing. It stays muted with no controls, and
like on the live site it is hidden on phones (under 768 px wide).

**Every page scrolls smoothly.** Mouse-wheel and trackpad scrolling glide instead of moving in steps, with
[Lenis](https://github.com/darkroomengineering/lenis) (`custom/smooth-scroll/`, linked from every page by
`scripts/lib/customize.mjs` during the build, `SMOOTH_SCROLL=0` to turn off). The page still scrolls the normal way
underneath, so sticky bars, lazy-loaded images and the site's other scripts work as before. Touch scrolling stays the
device's own, links to a spot on the same page glide there and stop below the fixed header, and people who prefer
reduced motion get instant scrolling — see [`custom/smooth-scroll/README.md`](custom/smooth-scroll/README.md).

**Problems found in a site audit are fixed** (`scripts/lib/site-fixes.mjs` with `custom/site-fixes/`, applied during
the build, `SITE_FIXES=0` to turn off). Each fix is a small, targeted edit and the rest of the page stays as captured.
Most of these problems are on the live site too.

- **Top bar** (every page): it asked each visitor for their location, then showed "Local Weather: N/A°F | Weather
  Alerts: N/A". The same bar now reads "Free Estimates · Call (877) 213-8536".
- **Lead forms** (138 pages): "Unable to load review count" (the count needs the WordPress API) is now a link to the
  Reviews page.
- **Review carousels** (20 pages): the "Testimonials" carousel (17 pages) never started (its script ran before the
  carousel library loaded), so only the first of its two reviews showed and the arrows did nothing. Beside the video
  on `/`, `/services/` and `/thank-you/`, every review was pushed down to the height of the longest one, leaving a
  large empty band above the shorter ones. All of them are now the same looping carousel of the site's reviews: it
  glides, plays by itself (holding still under the mouse, with keyboard focus and off screen, with a pause button),
  can be dragged or swiped, and keeps every card the same size with "Read more" on long reviews. The reviews are in
  `custom/reviews/reviews.json` — see [`custom/reviews/README.md`](custom/reviews/README.md). On `/service-areas/` the
  section is removed: it isn't about service areas.
- **"Our Project Gallery"** (8 pages: `/`, `/solar/`, `/roofing/`, `/roofing/types/`, `/gutters/`, `/siding/`,
  `/commercial-capabilities/`, `/commerical-roofing/`): three sliders were started on the same photos at once, so they
  came out at different widths with the first one cut off, the row sat off centre under the heading and tabs, and there
  was a dot for every photo of every category. It is now one tidy gallery: centred category tabs with photo counts, a
  row of same-size photos with arrows and dots centred below it, and a full-size photo viewer — see
  [`custom/project-gallery/README.md`](custom/project-gallery/README.md). `/gallery/` (a full grid, which works) is
  unchanged.
- **"Experts You Can Trust"** (home page): the certification logos jumped a step every 2.5 seconds, and the copies
  the carousel made to loop never loaded their logos. They now glide past in one continuous row, easing to a stop
  under the mouse (and stay still for people who prefer reduced motion).
- **Award badges** ("About Our Team" and "Request an Appointment", 123 pages): the picture of the GAF President's Club
  and Inc. 5000 badges sat in a lot of empty space. The site's other GAF certifications, Diamond Pledge and Metal
  Certified, are added beside President's Club, with the two Inc. 5000 badges nested below.
- **Pages wider than the screen** (checked on every page at widths from 320 to 1920 px; none is left):
  - **Home page hero**: the award badges picture kept a fixed 562 px width in the 260 px column between its two white
    lines, so it ran off the screen on tablets (768–1008 px, cutting off the "No. 1" badge) and slid under the form on
    small laptops. Above phone size the lines and the picture now share one width, no wider than the column, as they
    already did on phones.
  - **Every page at 1120–1199 px** (an iPad held sideways, among others): the page builder switches to its desktop
    widths at 1120 px, but the page's column stays 960 px wide until 1200 px. The header's phone button wrapped under
    the logo, and the taller header covered the top of the page; on the 98 blog posts and offers the article ran off
    the screen and its text was cut off; on 10 pages a row (the home page's "What Makes Panda the Best?" cards among
    them) did the same. The header now uses the whole width there, and those blocks stop at the column's edge.
  - **Smaller cases**: the badges picture on `/roofing/residential/` (480–529 px), and on the smallest phones a long
    email address in a blog post and the topic tags at the top of blog posts.
- **`/reviews/`**: the "Read More Reviews!" button is removed (on request).
- **Missing photos** (missing on the live site too): reviewers without a photo get their initials in the round photo
  spot (the review carousels do the same).
- **`/commercial-capabilities/`**: the case-study picture's clickable areas missed its QR codes, and its pin markers
  made the page twice as wide as a phone screen. The links now sit on the QR codes and are also listed under the
  picture.
- **Blog share buttons** (93 posts) did nothing (their script is missing). They are now plain Facebook, Twitter,
  LinkedIn and email share links.
- **`/position-details/`** can only say "Failed to load job details." without WordPress. It now points to the open
  positions on `/careers/`.
- **`/service-areas/` hero** said only "Our Service Areas" and a tagline, over a 2000×450 strip of roof pinned to
  the screen (`background-attachment: fixed`), so the photo was blown up about 2× and showed only shingles on phones.
  The hero now says where Panda works: a headline and line naming the office states, the jobs, states and offices
  (read from `custom/us-map/areas.json`, so they always match the map) and the Google rating. Chips for the six
  states with the most jobs glide down to the map and zoom it to that state. It also has call and "See the map"
  buttons, and a sharp drone photo of the Laurel office (`DJI_20250722134520_0995_D.jpg`), preloaded so it shows
  straight away. The lead form beside it is unchanged.
- **Small fixes**: a link whose address had slipped into its `style` attribute ("roofing team" on `/roofing/types/`)
  and typos ("Experts Your Can Trust", "Exterior Modeling", "Commerical", "Our Services Areas").

Pages where a fix replaces a whole section or message are listed as "edited on purpose" in
`docs/visual-diff/summary.md`; pages with only the small fixes are compared with live as usual. (`docs/visual-diff/`
was last regenerated before the review carousels, project gallery, logo row, award badges and smooth scrolling were
added; the next capture and build regenerates it.)

## What's in the repo

```
site/                    the website — deploy this folder
  index.html, roofing/index.html, …   every page, at the same path as on the live site
  wp-content/, wp-includes/, …        CSS, JS, fonts, images (every srcset size), video, icons
  _external/<host>/…                  third-party static files made local (e.g. Google Fonts)
  _custom/us-map/                     the animated map's stylesheet and script (copied from custom/us-map/)
  _custom/site-fixes/                 styles and script for the site-audit fixes (copied from custom/site-fixes/)
  _custom/reviews/                    the review carousel's stylesheet and script (copied from custom/reviews/)
  _custom/project-gallery/            the project gallery's stylesheet and script (copied from custom/project-gallery/)
  _custom/smooth-scroll/              Lenis and its setup, for smooth scrolling (copied from custom/smooth-scroll/)
  _raw/<path>/index.html              the HTML exactly as the server delivered it (reference only)
  404.html                            the site's 404 page
  robots.txt, sitemap*.xml, feed/     kept verbatim
  _redirects, _headers                Netlify / Cloudflare Pages rules (redirects seen on the live site)
  (../vercel.json)                    the same rules for Vercel, next to site/
  serve.json                          the same rules for `npx serve`
docs/
  url-inventory.csv        every URL found (url, source, HTTP status, redirect target, type, …)
  url-exclusions.csv       URLs deliberately not captured, with the reason
  capture-summary.md       final numbers
  screenshots/live/        full-page screenshots of every live page (desktop 1440 px + mobile 390 px)
  visual-diff/             copy-vs-live pixel diffs + summary table (summary.md / summary.csv)
  missing-assets.md        link check results and anything that could not be copied
  inventory-coverage.csv   every inventory URL -> its file in site/
  external-dependencies.md third-party embeds left live, and third-party files made local
  tracking.md              analytics / pixels / call tracking found (IDs) and how they were disabled
  forms.md                 every form: fields, method and original action URL
  redirects.csv            every redirect hit during the capture
  asset-manifest.csv       every asset URL -> local file, status, type, size
scripts/                   the capture / build / verification pipeline (Node.js + Playwright)
custom/us-map/             the animated "areas we serve" map: areas.json (what it shows), styles, script, outlines
custom/site-fixes/         styles, script and data for the site-audit fixes (the fixes are in scripts/lib/site-fixes.mjs)
custom/reviews/            the review carousel: reviews.json (the reviews it shows), styles, script
custom/project-gallery/    the "Our Project Gallery" section: styles, script
custom/smooth-scroll/      smooth scrolling: Lenis (MIT licence), its stylesheet and the site's setup
```

## View it locally

```bash
npm install          # first time only
npx serve site       # then open http://localhost:3000
```

`serve` reads `site/serve.json`, so the redirects the live site has (e.g. old URLs) work locally too. Links are
root-relative (`/roofing/`), so the copy must be served from the root of a host. Opening the files directly with
`file://` will not work.

## How the capture works

| Step | Script | What it does |
| --- | --- | --- |
| 1 | `01-inventory.mjs` | Reads `robots.txt` and every sitemap (recursively), then crawls links from the homepage and every sitemap URL (nav, footer, pagination, categories, tags, authors). Adds the 404 page, favicons / app icons, the web manifest and the RSS feeds. Detects sub-sites (other subdomains, or subdirectories running a separate install) and leaves them out. Writes `docs/url-inventory.csv`. |
| 2 | `02-capture.mjs` | Opens every page in Chromium at 1440 px and at 390 px, scrolls slowly to the bottom so lazy images, sliders and delayed scripts load, waits for the network to go quiet, and saves the rendered HTML and full-page screenshots. **Every** browser request is intercepted: non-GET requests are dropped, analytics/ads/call-tracking requests are blocked, and requests to the site go through one shared, rate-limited, cached fetcher, so each file is downloaded only once. It then downloads every asset: all `srcset` sizes, `data-src` / `data-lazy-src`, `<picture>` sources, CSS backgrounds, `url()` references inside every stylesheet (recursively), `@font-face` fonts, SVGs, video and posters, icons and OG images. |
| 3 | `03-build.mjs` | Assembles `site/` from the cache. Main-site URLs become root-relative and tracking snippets are commented out behind `<!-- TRACKING DISABLED -->` markers. Everything else is left byte-for-byte intact, including titles, meta descriptions, canonicals, OG/Twitter tags and JSON-LD, apart from the [deliberate changes](#deliberate-changes). Also writes the redirect files and the docs. |
| 4 | `04-visual-diff.mjs` | Serves `site/` with `serve`, screenshots every page exactly like the live capture, and pixel-diffs it against the live screenshots with pixelmatch. Pages that differ by more than 1% are flagged. It also blocks and reports any request the copy makes to the live site. |
| 4b | `04b-choose-page-source.mjs` | For flagged pages, builds the page from the HTML as delivered instead of the rendered DOM and keeps whichever matches live (see below). |
| 5 | `05-check-links.mjs` | Checks that every internal reference in every page, stylesheet and manifest resolves to a file, runs `linkinator` over the served copy, and confirms every inventory URL has its file. |
| 6 | `06-lfs-attributes.mjs` | Writes `.gitattributes`: Git LFS for all video and for every image over 1 MB. |
| 7 | `07-summary.mjs` | Writes `docs/capture-summary.md`. |

**Rendered DOM vs as-delivered HTML.** By default each page in `site/` is the fully rendered DOM that Chromium
produced. That snapshot already contains changes made by the site's own scripts (carousel clones, injected images,
widget markup), and those scripts run again when the copy is opened. On some pages that makes them initialise twice,
for example duplicated carousel slides. Step 4b detects this with the visual diff and serves those pages from the
as-delivered HTML instead, with all assets still local. The `Page HTML` column in `docs/visual-diff/summary.md` shows
which version each page uses. The as-delivered HTML of every page is also kept in `site/_raw/` for reference.

## Re-run the capture

```bash
npm install
bash scripts/capture-all.sh             # reuses cached responses in .cache/ (fast; offline except new URLs)
REFRESH=1 bash scripts/capture-all.sh   # fresh capture of the live site
```

- Needs Node.js 20+. Playwright's Chromium is installed with `npx playwright install chromium` (not needed where a
  browser is pre-installed).
- Politeness knobs: `MAX_CONCURRENT` (default 2), `DELAY_MS` (default 500).
- Each step can also be run on its own, e.g. `node scripts/02-capture.mjs --only=roofing`,
  `node scripts/03-build.mjs --source=raw`, or `node scripts/04-visual-diff.mjs --only=/contact/`.
- `scripts/test/fixture-server.mjs` is a small synthetic stand-in site used to test the pipeline without touching the
  real website:
  `SITE_ORIGIN=http://localhost:8099 SITE_DIR=/tmp/t/site DOCS_DIR=/tmp/t/docs WORK_DIR=/tmp/t/.work CACHE_DIR=/tmp/t/.cache bash scripts/capture-all.sh`.
- After a re-capture, run `node scripts/06-lfs-attributes.mjs` before `git add`, so new large images go to LFS.

### Update `site/` without the capture cache

`.cache/` and `.work/` are not in the repository, so a fresh clone cannot run `03-build.mjs`. After changing
`custom/` or the site fixes, `npm run update:site` (`node scripts/tools/update-built-site.mjs`, add `--dry-run` to
preview) applies the site fixes (review carousels and project gallery included) and smooth scrolling to the pages
already in `site/` and copies the custom files.
Each fix gives the same result on a built page as on the page as captured, so the pages come out as a full rebuild
would make them. The map sections are the exception: only `03-build.mjs` renders them.

## What doesn't work in a static copy

- **Forms** (contact, newsletter): there is no server to receive them. The markup is kept.
  Submissions made on the copy go to the static host and fail harmlessly; they never reach the live site.
  **Exception: the free-estimate lead forms post straight to Salesforce (web-to-lead), so they keep working
  in the copy — a test submission creates a real lead.** Their hidden fields (post-submit redirect, page URL)
  are kept exactly as delivered. Details in [`docs/forms.md`](docs/forms.md).
- **Site search** (`/?s=…`) and anything else that needs WordPress to run: **comments**, AJAX "load more",
  `admin-ajax.php` / REST API calls, logins, previews.
- **Query-string URLs** show the same page as the path without the query, because a static host ignores the query.
- **Analytics, ad pixels and call tracking** are disabled on purpose ([`docs/tracking.md`](docs/tracking.md)).
  Phone numbers are therefore the ones in the HTML, not dynamically swapped tracking numbers.
- **Third-party embeds** (maps, videos, review or chat widgets) still load from their live sources, so they need an
  internet connection ([`docs/external-dependencies.md`](docs/external-dependencies.md)).
- Server-side behaviour that varies per visitor (geo, A/B tests, logged-in state) is frozen as captured.

## Hosting options

The `site/` folder is a plain static site and works on any static host that serves it from the domain root.

> **Git LFS note:** images over 1 MB and all video are stored with Git LFS. Hosts that build straight from the git
> repository may receive LFS *pointer files* instead of the real files unless LFS is enabled for the build. Deploying
> from a checkout with the LFS files pulled (`git lfs pull`) via each host's CLI avoids this.

- **Vercel** — import the GitHub repo. The generated `vercel.json` (written by `scripts/03-build.mjs`) makes Vercel
  skip the install and build steps and serve `site/` as static files, with trailing slashes like WordPress and the
  redirects seen on the live site. In the Vercel project, turn on **Git LFS** (Settings → Git) so large images and
  videos deploy as real files. A deployment only succeeds once the captured `site/` folder is in the repository.
- **Netlify** — drag-and-drop `site/` in the Netlify UI, or `npx netlify-cli deploy --dir site --prod`. `_redirects`
  and `_headers` are applied automatically.
- **Cloudflare Pages** — `npx wrangler pages deploy site`. Also honours `_redirects` and `_headers`.
- **GitHub Pages** — publish `site/` with a Pages workflow (use `actions/checkout` with `lfs: true`). It needs a
  custom domain or a `<user>.github.io` repository, because root-relative links break under a `/repo-name/` sub-path.
  GitHub Pages ignores `_redirects` / `_headers` (old URLs will 404, and `site/_raw/` pages would render as HTML there).
  `.nojekyll` is included so folders starting with `_` are published. GitHub Pages requires a public repository
  unless you're on a paid plan.

Before any public deployment, add a `noindex` or change the canonical URLs so search engines don't treat the copy as
a duplicate of the live site.
