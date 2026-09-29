# pandav1 — offline copy of pandaexteriors.com

A static, fully offline copy of the **public** website at <https://pandaexteriors.com> (main site only), plus the
scripts that captured and verified it, so the copy can be refreshed at any time.

It was captured as an anonymous visitor using only GET requests to public URLs. The crawler never touched the CMS,
`/wp-admin`, `/wp-login.php`, the REST API or any account area, sent no form data, and followed `robots.txt`. It was
polite: at most 2 requests in flight, with a pause after each. The headline numbers (pages, assets, sizes, visual-diff
pass rate) are in [`docs/capture-summary.md`](docs/capture-summary.md).

## What's in the repo

```
site/                    the website — deploy this folder
  index.html, roofing/index.html, …   every page, at the same path as on the live site
  wp-content/, wp-includes/, …        CSS, JS, fonts, images (every srcset size), video, icons
  _external/<host>/…                  third-party static files made local (e.g. Google Fonts)
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
| 3 | `03-build.mjs` | Assembles `site/` from the cache. Main-site URLs become root-relative and tracking snippets are commented out behind `<!-- TRACKING DISABLED -->` markers. Everything else is left byte-for-byte intact, including titles, meta descriptions, canonicals, OG/Twitter tags and JSON-LD. Also writes the redirect files and the docs. |
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

## What doesn't work in a static copy

- **Forms** (quote requests, contact, newsletter): there is no server to receive them. The markup is kept.
  Submissions made on the copy go to the static host and fail harmlessly; they never reach the live site. Forms that
  post to a third-party service were left pointing at it, so submitting one of those *would* reach that service.
  Details in [`docs/forms.md`](docs/forms.md).
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
