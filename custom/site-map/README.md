# Site Map

The Site Map (`/site-map/`) lists **every page in `site/`** and how a visitor gets to each one. Use it to check that
no page gets missed when pages need editing or deleting.

The captured page was a hand-kept list. It had fallen behind the site: it listed city sub-sites and a removed page,
and it left out the blog. The list is now generated from the built site by `scripts/lib/site-map-page.mjs`, during the
build (`03-build.mjs`) and by `npm run update:site`, so it changes whenever a page or a link changes. The page keeps
its header, footer and "Site Map" heading. Only the list under the heading is replaced.

## What each row shows

| Column | What it says |
| --- | --- |
| Page | The page's title (a link to it), its address, and the file in the repository it is built from |
| How to get there | Where it sits in the **top menu** (for example *Services › Roofing › Roof Replacement*) or the **footer** (*Help › Warranty*). For a blog article, the **blog listing page** that shows it. Otherwise, the shortest chain of **clicks from the home page**. If no chain exists, a warning that it can only be opened by typing its address. Under that, the pages whose content links to it (menu and footer links aside, since every page has them) |
| Status | How it is reached (home page, top menu, footer, linked from pages, not reachable by clicking), the publish date where the page has one, and whether it is missing from the XML sitemaps or hidden from search engines |

The pages are grouped into main pages, blog listing pages, blog articles (newest first), offer pages, project pages
and other pages (the 404 page). Below them:

- **Old addresses that redirect**: every address in `site/_redirects`, where it leads, and why (a page removed on
  request, or the old misspelled `/commerical-roofing/` addresses).
- **Addresses in the XML sitemaps with no page**: what the sitemaps list that has no page in the copy, grouped and
  counted (the 5,309 `/blog/project/` posts left out on purpose: see `SITEMAP_ONLY_EXCLUDE` in `scripts/lib/config.mjs`).

A search box (title, address, file or menu path) and filters (top menu, footer, linked from pages, not reachable by
clicking, not in the XML sitemap) narrow the list (`site-map.js`). Without JavaScript every row shows.

## How it is worked out

- **Pages**: every `.html` file in `site/` except `_raw/`, `_custom/`, `_external/`, `wp-content/` and `wp-includes/`.
- **Links**: every `<a href>` that leads to a page of the site, sorted into links in the header (top menu), in the
  footer, and in the page's content. Links hidden on every screen (`d-none`, `hidden`, `display: none`) are not counted
  as a way in. The Site Map's own links are not counted either, since it links to everything.
- **Top menu and footer paths**: read from the home page. A menu path is the labels of the dropdowns a link sits in.
  "Phone menu only" marks an entry shown only in the phone menu.
- **Clicks from home**: a breadth-first search over every visible link, starting at the home page, so the chain shown
  is the shortest one.
- **XML sitemaps**: every `<loc>` in the `site/*.xml` sitemaps (sitemap index files aside).

`SITE_MAP_PAGE=0` leaves the captured list as it is.
