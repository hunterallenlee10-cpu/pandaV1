# pandav1 — offline copy of pandaexteriors.com

A static, fully offline copy of the **public** website at <https://pandaexteriors.com> (main site only), plus the
scripts that captured and verified it, so the copy can be refreshed at any time.

It was captured as an anonymous visitor using only GET requests to public URLs. The crawler never touched the CMS,
`/wp-admin`, `/wp-login.php`, the REST API or any account area, sent no form data, and followed `robots.txt`. It was
polite: at most 2 requests in flight, with a pause after each. The headline numbers (pages, assets, sizes, visual-diff
pass rate) are in [`docs/capture-summary.md`](docs/capture-summary.md).

## What's in scope

The copy contains what a visitor can reach by clicking through the site. As captured that was **172 pages** (39 main
pages, 114 blog posts and listing pages, and the 19 project pages the site links to); after the
[site restructure](#site-restructure) it is **125 pages** (40 main pages, among them 11 new ones and the site check;
64 blog posts with their 11 listing pages; and 10 project pages), plus the 404 page, feed,
sitemaps, icons and every file those pages use. Deliberately left out (listed in `docs/url-exclusions.csv`):

- **17 city sections** (`/baltimore-md/`, `/charlotte-nc/`, … `/wilmington-de/`). Each is a separate WordPress
  site in a multisite network, so per the capture rules they count as sub-sites. The build contains the main
  website only: every link to a city site is removed (the Site Map's 16 city entries, the Service Areas city
  carousel, and two in-text links in one blog post, which keep their words), and the lead form's post-submit
  redirect points at the main site's `/thank-you/` page instead of a city site's (with the site fixes on, that form
  script is removed and `/thank-you/` is left out on request: see below). Controlled by
  `REMOVE_SUBSITE_LINKS` in `scripts/lib/config.mjs`; pages changed this way are listed as "edited on purpose"
  in `docs/visual-diff/summary.md`.
- **Panda Interiors / Panda Bath**, removed on request. `/interiors/` was the only page about them (nothing linked
  to it; it was listed in the sitemap). The page, its sitemap entry and the 25 files only it used (its bathroom
  photos and styles) are left out, and the old address redirects to the home page. It was captured, so it is
  counted in `docs/capture-summary.md` rather than in the exclusions list. Controlled by `REMOVE_PAGES` in
  `scripts/lib/config.mjs`.
- **Roof repairs**, removed on request (Panda does not do small repairs). `/roofing/repairs/` is left out the same
  way (its sitemap entry and the 7 files only it used go too), and its old address redirects to `/roofing/replacement/`
  (`REMOVED_PAGE_TARGETS` in `scripts/lib/config.mjs`). Everything else about repairs is handled by the site fixes
  (`scripts/lib/site-fixes.mjs`): the "Roof Repairs" entry in the Services menu and on the Site Map, the "Roof
  Repairs" card in the roofing cards (`/roofing/`, `/about/`, `/podcast/`) and on Service Areas, the "Trustworthy East
  Coast Roof Repairs" section and list entry on `/roofing/residential/`, and the one review that praises a repair
  (also out of `custom/reviews/reviews.json`). Wording that offered repairs (the "About Our Team" paragraph, the home
  page, the commercial pages, Roofing Types, Roofing Costs, Gutter Guards, About and the company description in every
  page's structured data) now says what Panda does (`REPAIR_COPY`). The FAQ answer that recommends a full replacement
  over repairs is kept. Blog posts keep their wording (on request); links in them to the removed page
  became plain words.
- **Affirm Payment**, removed on request. `/affirm-payment/` was an empty page (only the header and footer; nothing
  linked to it; it was listed in the sitemap). It is left out the same way (its sitemap entry and the one file only it
  used go too), and its old address redirects to the home page.
- **Thank You page**, removed on request. `/thank-you/` was where the live site's lead forms sent visitors after
  they submitted. The copy's forms are not connected and send nobody there, and nothing linked to it (it was listed in
  the sitemap). It is left out the same way (its sitemap entry and the 5 files only it used go too), and its old
  address redirects to the home page.
- **Position Details**, removed on request. `/position-details/` showed one job listing loaded from WordPress, so in
  the copy it could only say the listing wasn't available; nothing linked to it (it was listed in the sitemap). It is
  left out the same way (its sitemap entry and the 5 files only it used go too), and its old address redirects to
  `/careers/`. Its fix (a pointer to `/careers/` in place of "Failed to load job details.") went with it, so a build
  that keeps it shows the page as the live site does.
- **Four project pages**, removed on request: `/blog/project/bylt-restoration/`, `/blog/project/enterprise-rent-a-car/`,
  `/blog/project/roof-replacement-3/` and `/blog/project/sbs-siding/`. They are left out the same way (their entries in
  `project-sitemap1.xml` and the 19 files only they used, mostly the photos of the third, go too), and their old
  addresses redirect to `/past-projects/`.
- **Commercial Capabilities**, removed on request. `/commercial-capabilities/` (titled "Commercial Roofing Services",
  like `/commercial-roofing/`) showed the case-study map picture; nothing linked to it (it was listed in the sitemap).
  It is left out the same way (its sitemap entry and the 19 files only it used, mostly sizes of that picture, go too),
  and its old address redirects to `/commercial-roofing/`. Its fix (links over the picture's QR codes, listed under
  it) went with it, so a build that keeps it shows the page as the live site does.
- **Refer a Future Panda**, removed on request. `/referral/` was the employee referral form (a bonus for referring
  someone Panda hires). The careers page's "Refer & Earn" menu link and "Refer a Friend" footer link led there; they
  now lead to the Refer & Earn page about the Panda Exteriors app (`/referrals/`), like the menu on every other page
  (`RELINKED_PAGES` in `scripts/lib/config.mjs` keeps those links instead of removing them). No file was used only by
  it, and its old address redirects to `/referrals/`. Its fix (the form no longer opened an email to the careers
  address) went with it.
- **5,309 auto-generated `/blog/project/` posts** that appear only in the sitemaps and are not linked from any
  page (`SITEMAP_ONLY_EXCLUDE` in `scripts/lib/config.mjs`; set it to `''` to capture them too). The copy's sitemaps no longer list
  them ([sitemaps](#xml-sitemaps)).
- Admin, login and API URLs, which are never requested.

## Deliberate changes

Besides removing the city links (above), the copy differs from the live site on purpose in five ways.

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

With the site fixes on, the hero no longer shows YouTube's own screens (`scripts/lib/site-fixes.mjs`, "hero video"):
a still of a Panda job (`custom/site-fixes/home-hero-poster.webp`, from the drone photo `DJI_20250722134618_0999_D`)
fills the hero, and the video fades in over it only once YouTube reports that it is playing (`site-fixes.js`), so the
spinner, play button, YouTube logo and "Video unavailable" message (where autoplay is blocked: Low Power Mode, data
saver, some ad blockers) never show behind the heading. The 90% black overlay sat under the video, so bright frames
washed out the white heading; it is now above the video, darkest behind the heading and lighter under the form (an even
tint when the columns stack), with a soft shadow on the heading and the line under it. Phones, and people who prefer
reduced motion, see the still.

**Every page scrolls smoothly.** Mouse-wheel and trackpad scrolling glide instead of moving in steps, with
[Lenis](https://github.com/darkroomengineering/lenis) (`custom/smooth-scroll/`, linked from every page by
`scripts/lib/customize.mjs` during the build, `SMOOTH_SCROLL=0` to turn off). The page still scrolls the normal way
underneath, so sticky bars, lazy-loaded images and the site's other scripts work as before. Touch scrolling stays the
device's own, links to a spot on the same page glide there and stop below the fixed header, and people who prefer
reduced motion get instant scrolling — see [`custom/smooth-scroll/README.md`](custom/smooth-scroll/README.md).

**The header's Media menu item leads to a new Media page.** On the live site the item (Blog and Podcast under it)
went nowhere: its link was `#`. On every page it now leads to `/media/` (`custom/media/`, written by
`scripts/lib/media-page.mjs` during the build, `MEDIA_PAGE=0` to turn off), which sets the blog and the podcast side
by side, under a dark hero whose background is a slowly drifting, tilted wall of the page's own blog images and
episode stills behind a dark veil (still with reduced motion): the newest blog post (read from the site's own feed
when the page is built) with the three before it, and
Panda Vision, the company's video podcast, with its newest episode in a player and the ways to watch it (on the page,
on Apple Podcasts, or in any podcast app). Every episode follows in a row across the page. The page keeps the site's
header and footer. On phones, the first entry under Media, which said "Blog" like the entry below it, is now "Media
Hub". The dropdown also lists the Gallery page (`/gallery/`), after Podcast. The Podcast page (`/podcast/`) gets the same player in place of its own, which pointed at an address that
no longer works and showed an empty space, its "Listen on Apple Podcasts" badge now leads to the show's current
listing (the old one is gone), and its intro, which described a show about "technology, innovation, and the future",
is the show's own description from its feed. The episodes are refreshed with `npm run media:podcast` — see
[`custom/media/README.md`](custom/media/README.md).

**The site check lists every page and how to get to it** (at `/site-audit/` since the [site restructure](#site-restructure); `/site-map/` is a plain list for visitors). The captured `/site-map/` was a hand-kept list that had
fallen behind (city sub-sites, a removed page, no blog). Its list is now generated from the built site every time it
is built (`scripts/lib/site-map-page.mjs`, `custom/site-map/`, `SITE_MAP_PAGE=0` to turn off). For each page it shows
where it sits in the top menu or footer, which blog listing page shows it, or the clicks that lead to it from the home
page. Pages that can't be reached by clicking are marked. It also shows the pages whose content links to it, whether
the XML sitemaps list it, and the file it is built from. Below the pages are the old addresses that redirect and the
addresses the XML sitemaps list that have no page. Pages removed on request don't appear on it at all. A search box and filters narrow the list. See
[`custom/site-map/README.md`](custom/site-map/README.md).

**Problems found in a site audit are fixed** (`scripts/lib/site-fixes.mjs` with `custom/site-fixes/`, applied during
the build, `SITE_FIXES=0` to turn off). Each fix is a small, targeted edit and the rest of the page stays as captured.
Most of these problems are on the live site too.

- **Top bar** (every page): it asked each visitor for their location, then showed "Local Weather: N/A°F | Weather
  Alerts: N/A". The same bar now reads "Free Estimates · Call (877) 213-8536".
- **Commercial roofing address**: the live site spells it `/commerical-roofing/`. The three commercial pages are now at
  `/commercial-roofing/`, `/commercial-roofing/roof-types/` and `/commercial-roofing/roof-replacement/`, every
  reference follows (links, canonical and share tags, structured data, the sitemap), and the old addresses redirect
  (301) to the new ones. Controlled by `RENAMED_PATHS` in `scripts/lib/config.mjs` (`RENAME_PAGES=0` keeps the live
  addresses); applied by `scripts/lib/customize.mjs` to every page and by `scripts/03-build.mjs` to the page files,
  sitemaps and redirects.
- **Services menu** (every page): the header's Services dropdown ended with "Other", which held Siding and Gutters
  (with Gutter Guards one level further in). Gutters, Gutter Guards and Siding are now their own entries under Solar.
- **Services ▸ Solar menu** (every page; `scripts/lib/site-fixes.mjs`): the Solar flyout held a phone-only "Solar" link
  and "GAF Solar Roof", so nothing said the Solar page is about panels or that solar panels and GAF solar shingles are
  two different products. It now has **Solar Panels** ("Mounted on your existing roof") and **GAF Solar Shingles**
  ("The roof itself makes power") at every screen size, each with that line in smaller gray type under its label. The
  `/services/` card for the shingles page says "GAF Solar Shingles" too. "Solar" itself (the
  entry you hover to open the flyout) is now **Solar Options** and leads to the Solar Options page (`/solar-options/`,
  one of the [new pages](#site-restructure)) rather than the solar panels page. Where the menu folds behind the menu
  button (up to 1024 px), the site's script made a tap on it open its flyout instead, so it never reached the page:
  now the label opens the page and its arrow (a 44 px tap area) opens the flyout (`custom/site-fixes/site-fixes.js`).
  Two older faults in the folded menu went with it: from 768 to 1024 px no dropdown could be opened (tapping
  "Services" left for `/services/`, and the lists were styled to open on hover inside a menu that hides them), and
  now a tap opens each in place, as on phones; and on phones a second-level list (Roofing's, Solar Options') covered
  the entries under it, and now it opens in place and pushes them down.
- **Lead forms** (138 pages): "Unable to load review count" (the count needs the WordPress API) is now a link to the
  Reviews page. That includes the second form on a page, in "About Our Team", which showed "Unable to load review
  count" or "Based on 0 reviews!".
- **Review carousels** (20 pages): the "Testimonials" carousel (17 pages) never started (its script ran before the
  carousel library loaded), so only the first of its two reviews showed and the arrows did nothing. Beside the video
  on `/`, `/services/` and `/thank-you/`, every review was pushed down to the height of the longest one, leaving a
  large empty band above the shorter ones. All of them are now the same looping carousel of the site's reviews: it
  glides, plays by itself (holding still under the mouse, with keyboard focus and off screen, with a pause button),
  can be dragged or swiped, and keeps every card the same size with "Read more" on long reviews. The reviews are in
  `custom/reviews/reviews.json` — see [`custom/reviews/README.md`](custom/reviews/README.md). On `/service-areas/` the
  section is removed: it isn't about service areas.
- **"Our Project Gallery"** (8 pages: `/`, `/solar/`, `/roofing/`, `/roofing/types/`, `/gutters/`, `/siding/`,
  `/commercial-capabilities/`, `/commercial-roofing/`): three sliders were started on the same photos at once, so they
  came out at different widths with the first one cut off, the row sat off centre under the heading and tabs, and there
  was a dot for every photo of every category. It is now one tidy gallery: centred category tabs with photo counts, a
  row of same-size photos with arrows and dots centred below it, and a full-size photo viewer — see
  [`custom/project-gallery/README.md`](custom/project-gallery/README.md). `/gallery/` (a full grid, which works) keeps
  its grid (see below).
- **`/past-projects/`: "Some of our favorite past projects".** Under the map, a "Featured Projects" grid listed every
  project (16 cards): five near-identical drone shots of the same houses titled "Panda Ext-14098" and the like, three
  cards titled just "Roof Replacement", photos of bare decking mid-tear-off, and three photos that often didn't show.
  The page now opens, right under the hero, with six hand-picked projects (residential, solar, commercial and
  multi-family) in a photo grid, each with its type, a better name where it had only a job number, a line from its
  project page and a link to it, then a "Get a free estimate" band with a link to `/gallery/`; the map follows. The
  hero's background was a generic photo of a house (shared with other pages) pinned to the screen, so it was blown up
  and soft; it is now a photo of Panda's crew installing a GAF solar roof that scrolls with the page, with a dark fade
  behind the headline, a "Past projects" label and a "See our favorite projects" button. The projects, their wording
  and the hero photo are in `custom/past-projects/favorites.json` — see
  [`custom/past-projects/README.md`](custom/past-projects/README.md) to change them.
- **"Experts You Can Trust"** (home page): the certification logos jumped a step every 2.5 seconds, and the copies
  the carousel made to loop never loaded their logos. They now glide past in one continuous row, easing to a stop
  under the mouse (and stay still for people who prefer reduced motion).
- **Award badges** ("About Our Team" and "Request an Appointment", 123 pages): the picture of the GAF President's Club
  and Inc. 5000 badges sat in a lot of empty space. The site's other GAF certifications, Diamond Pledge and Metal
  Certified, are added beside President's Club, with the two Inc. 5000 badges nested below.
- **Inc. 5000 awards section** (`/roofing/`, `/about/`, `/podcast/`): on `/about/` and `/podcast/` it sat on lime with
  white swooshes (hard-to-read white text, a swoosh running through the paragraph, the badges' white circles showing on
  the lime); on `/roofing/` it was plain black on white with a centred heading over left-aligned text. Everywhere it is
  now one light band: the same heading and paragraph on the left with the two rankings the badges show (No. 50 of
  America's fastest-growing private companies and No. 1 in construction, 2024), and the sharper picture of the three
  badges (`Inc-trio.png`) on a white card on the right.
- **"About Our Team" colors** (134 pages, the lead-form block above the footer): white text on Panda lime was hard to
  read (about 1.7:1, with the paragraphs also at 80% opacity). The block now sits on a charcoal green (Panda lime
  darkened, `#1a2418`): paragraphs about 11:1, a lime "Learn More" button with dark text, and it stays distinct from the
  black footer below. The white version of the block (5 pages) is unchanged.
- **"What Makes Panda the Best?"** (home page): three floating cards, each with an orange circle picture (two different
  sizes), an orange heading broken over two lines at different points (so the rules and text under them sat at three
  heights) and light gray text. It is now three rows under a dark rule, each claim (the same heading and text) on the
  left and what backs it up on the right: the crew roofing a four-story building (`about-team.webp`, also on `/about/`),
  the six partner brands' logos in a hairline grid (GAF, CertainTeed, James Hardie, Andersen, ProVia, Freedom Forever;
  they were named in a sentence), and the three GAF badges with their names (President's Club, Diamond Pledge, Metal
  Certified). Below 768 px each claim sits above its proof. Andersen, CertainTeed and James Hardie are the logo files
  already on the site; `custom/site-fixes/brand-gaf.svg` is from Wikimedia Commons (`File:GAF logo.svg`), and
  `brand-provia.svg` and `brand-freedom-forever.svg` are the logos on provia.com and freedomforever.com.
- **Pages wider than the screen** (checked on every page at widths from 320 to 1920 px; none is left):
  - **Home page hero**: the award badges picture kept a fixed 562 px width in the 260 px column between its two white
    lines, so it ran off the screen on tablets (768–1008 px, cutting off the "No. 1" badge) and slid under the form on
    small laptops. Above phone size the lines and the picture now share one width, no wider than the column, as they
    already did on phones.
  - **Every page at 1120–1199 px** (an iPad held sideways, among others): the page builder switches to its desktop
    widths at 1120 px, but the page's column stays 960 px wide until 1200 px. The header's phone button wrapped under
    the logo, and the taller header covered the top of the page; on the 98 blog posts and offers the article ran off
    the screen and its text was cut off; on 10 pages a row (the home page's "What Makes Panda the Best?" cards among
    them, since replaced) did the same. The header now uses the whole width there, and those blocks stop at the column's edge.
  - **Smaller cases**: the badges picture on `/roofing/residential/` (480–529 px), and on the smallest phones a long
    email address in a blog post and the topic tags at the top of blog posts.
- **The header on phones** (every page, up to 768 px; on the live site too): a rule in every page stacked the
  header's row, so the menu button sat under the logo, and the header was placed 46 px down, below a top bar of two
  lines (it is one). It ended at 186 px while the page starts at 150 px, so it covered the top 36 px of every page,
  the top of the heading on blog posts and the offer pages. The logo and the menu button are one row again (the
  opened menu still drops below them), the header sits right under the top bar, as on larger screens, and ends at
  148 px; the menu button has a 44 px tap area. CSS only (`custom/site-fixes/site-fixes.css`).
- **The header on `/careers/`** (`scripts/lib/careers-header.mjs`): Careers is a hand-built page that loads none of
  the page builder's stylesheets and carried its own, older copy of the header (a "Residential Roofing" entry, a
  Commercial submenu, "Customer Service" in place of Financing and Warranty, no Storm Damage, a Gallery entry) with its
  own styles for it (bold Roboto, a narrower and taller row with a shadow, the phone-only menu entries showing in the
  dropdowns, and the whole menu open over the page up to 1024 px), so the header changed when you went to Careers.
  After the pages are built, Careers gets the header of `/about/`: its markup, so the menu stays the same as
  everywhere else; the stylesheets `/about/` styles it with, limited to the header (`scripts/lib/css-scope.mjs`,
  written to `site/_custom/site-fixes/careers-header*.css` and linked where `/about/` has them); and the page's own
  styles no longer reach the header. Its computed styles match `/about/`'s at 1440, 1150, 1024, 820 and 390 px, and
  the rest of the page is unchanged to the pixel.
- **`/reviews/`**: the "Read More Reviews!" button is removed (on request).
- **`/reviews/` review wall**: the section under the hero showed a picture of an old Google rating (4.9), a "Write a
  Review" button and one review. It is now the Google rating as Google shows it (4.8 from 1,067 reviews), a **Write a
  review** button that opens Google's review form for Panda (`g.page/r/CdRhCa0OrTvjEAE/review`), every five-star
  Google review as cards that can be filtered by topic (roofing, siding, gutters, solar, insurance claims, clean-up),
  searched and shown 24 at a time, and a closing "Had a great experience with Panda?" band that asks for a review
  again. The reviews are in `custom/reviews/google-reviews.json`; `npm run reviews:google` fills it from a Google
  Takeout export or from Google Maps — see [`custom/reviews/README.md`](custom/reviews/README.md).
- **`/reviews/` hero**: "Customer Reviews" and one line over a truck photo pinned to the screen and blown up from
  1200 px. It now leads with "Rated 4.8 stars by 1,000+ homeowners on Google", the rating and review count with four
  reviewers' faces, a short quote from a review, **Read the reviews** and **Write a review** buttons and the BBB and GAF
  badges, over a sharp photo of a finished tile roof. The two free-estimate forms on the page show the current Google
  rating instead of the old 4.9 picture. The numbers and the quote come from `custom/reviews/google-reviews.json`.
- **`/about/` hero and "Our Mission"** (`scripts/lib/about-page.mjs`): the hero said "About Us" and "We make sure our
  team is the best available…" over a photo of an office ceiling (ceiling tiles and a projector). It now introduces
  the company: "The team behind 9,900 jobs across the East Coast", a line about what Panda does, the jobs, local
  offices, states (read from `custom/us-map/areas.json`, so they always match the map) and the Google rating (from
  `custom/reviews/google-reviews.json`), **Get a free estimate** and call buttons and the GAF, BBB and Inc. 5000
  credentials, over a photo of a Panda roofer in a Panda hoodie and harness. "Our Mission" was two long paragraphs
  beside a small photo; it is now a headline ("Every job is only as good as the team behind it"), the first
  paragraph, what the second one promised as three points (trained, certified and licensed; no sales pressure; no
  corners cut) and the places it named, beside a photo collage (a Panda truck at a job while the crew roofs the
  building, the section's old photo and a "30+ years of combined experience" badge). The two photos are smaller
  copies of photos already on the site (`custom/site-fixes/about-hero.webp`, `about-team.webp`). The lead form
  beside the hero is unchanged.
- **`/gutters/`**: the hero gets the same treatment as `/services/` (`scripts/lib/services-hero.mjs`): a "Gutters & gutter
  guards" label, the heading and line, two chips (gutter installation, leading to the services below the hero, and
  gutter guards, leading to their page) each with a line from the cards below, and estimate and call buttons, over the
  page's gutter-guard photo darkened behind the text. "Why Work with Our East Coast Exterior Specialists?" was three
  lime cards with white text (about 1.7:1) and promised "stellar cleaning services", which Panda doesn't offer; it is
  now three white cards with an icon each and dark text, without the cleaning line (`scripts/lib/gutters-page.mjs`).
  "East Coast Gutter Installations and Gutter Guards" (the services under the hero) and "Signs It's Time for New
  Gutters" were both white, one after the other; the first is now on Panda orange, like the site's other orange bands,
  with its heading and line in white and its two photo cards in white.
- **`/roofing-costs/`, redesigned** (hero in `scripts/lib/services-hero.mjs`, sections in
  `scripts/lib/roofing-costs-page.mjs`): the hero said only "Roofing Costs" and "Partner with our team for your roofing
  needs."; under the intro, "Quality Roof Replacements" was white text on Panda lime over cards with lime headings, and
  the page said nothing about what drives the price or about insurance. The hero now has a label, "What Goes Into the
  Cost of a New Roof", chips for what affects the cost, insurance claims and financing, and estimate and call buttons
  over a WebP copy of its photo. The intro keeps its words (naming Panda Exteriors, not "Panda Contractors") beside a
  rounded photo. Then: **What Affects the Cost of a New Roof** (six cards, no prices: size and pitch, material,
  decking, building code items, who installs it, insurance and financing); **Quality Roof Replacements** (the page's
  paragraph and three cards, as white icon cards on Panda orange, with links to roofing types and financing); **insurance roofing** on
  charcoal green: what storm-damage insurance usually covers and doesn't, how Panda helps with a claim in four steps
  (free storm-damage inspection, deciding whether to file, meeting the adjuster, the new roof and supplements), a note
  that Panda is the homeowner's roofing advocate and not a public adjuster, four of Panda's insurance guides on the
  blog, and "Get a free storm-damage inspection" and call buttons; six roofing cost questions; and, after the
  testimonials, the offers band. The words come from the page and from Panda's own insurance posts on the blog.
- **`/roofing/`, redesigned** (hero in `scripts/lib/services-hero.mjs`, "Our Process" and "About Our Team" in
  `scripts/lib/roofing-page.mjs`, new sections in `scripts/lib/service-pages.mjs` and
  `custom/site-fixes/service-pages.json`, cards in `scripts/lib/gutters-page.mjs`): the hero was a heading and one
  line on the bare photo; it now has the same treatment as `/services/` and `/gutters/` (a "Roofing" label, the
  heading, the line about GAF Master Elite contractors, chips for the four roofing pages each with a line from its
  card, estimate and call buttons, the photo darkened behind the text). **Our Process** was three blue boxes of
  centred white text over a faded Panda mascot; it is now a charcoal-green band with the heading, paragraph, GAF
  Master Elite / BBB A-rated / financing facts and estimate and call buttons beside the three steps (the section's own
  words) as a numbered timeline. Under the roofing cards come **signs it's time for a new roof** (six, from Panda's
  blog posts, linked), **what goes into every new roof** (tear-off and decking, ice and water barrier, underlayment,
  nailing, flashing, ridge caps and ventilation) beside a photo of a ridge Panda re-roofed
  (`custom/site-fixes/roofing-ridge.webp`, a 120 KB crop of a 540 KB project photo), seven **roofing questions**
  (with FAQPage structured data) and a call and estimate band. **What Makes Our Roofers Stand Out?** (lime headings on
  a lime band) uses the Gutters page's white icon cards with its own words, on Panda orange. **About Our Team** was
  the white version of the block, with its heading in a second, unstyled h2 (the styled one was empty); it gets the
  charcoal green it has on the other pages, with the heading in the styled h2.
- **`/roofing/attic-insulation/`, redesigned** (hero in `scripts/lib/services-hero.mjs`, sections in
  `scripts/lib/attic-insulation-page.mjs`, which uses `scripts/lib/service-pages.mjs`'s signs, steps and questions):
  the page was a hero, the intro and "Best East Coast Attic Insulation Contractors", white text on Panda lime (its
  heading a plain block) over four cards with lime headings, then the testimonials. The hero now has the `/roofing/`
  treatment (an "Attic insulation" label, the heading, its line on environmentally friendly, residential-approved
  products, chips for why it matters, the signs, how it works and roof replacement, estimate and call buttons). The
  intro keeps its words beside a rounded photo, with its facts (30+ years of combined experience, A-rated by the BBB,
  environmentally friendly products). Then: **Why Attic Insulation Matters** on cream (the band's paragraph on warm
  air rising, four benefits from Panda's blog posts, and a drawing of heat leaving an attic without insulation and
  held in with it); six **signs your attic needs insulation** with links to the three blog guides; the band's heading
  (now an h2), paragraph and four cards in their own words as white icon cards on Panda orange; **how it works** in
  three steps on charcoal green; seven **attic insulation questions** (with FAQPage structured data) and a call band;
  and, after the testimonials, the offers band.
- **`/roofing/replacement/`, redesigned** (hero in `scripts/lib/services-hero.mjs`, sections in
  `scripts/lib/roofing-replacement-page.mjs` and, as before, `custom/site-fixes/service-pages.json`): the hero was the
  heading and one line on the bare photo; it now has the `/roofing/` treatment (a "Roof replacement" label, the
  heading, its line with one-day installs and GAF Master Elite crews, chips for the signs, what's included, how it
  works and the roof types, estimate and call buttons, over the WebP copy of its photo). The intro keeps its words
  beside the YouTube video in a rounded frame, with the facts it gives (one-day installations, GAF Master Elite
  Certified, A-rated by the BBB) under the paragraphs. "Signs You May Need a Roof Replacement" was white text on
  Panda lime over three cards with lime headings; it is the `/roofing/` signs' icon cards on cream: its three signs in
  its own words, three more from `/roofing/` (age, granules, sagging) and links to Panda's guides and storm damage. A
  new **Roofing Styles for Your New Roof** section (the band's paragraph on GAF's styles) shows the four roof types
  as cards, each with a photo of that kind of roof (Panda's own jobs for asphalt shingles, a flat TPO roof and GAF solar
  shingles; a standing-seam metal roof from Wikimedia Commons, "Standing seam metal roof 5.jpg" by Wikideas1, CC0, as
  no Panda photo of a metal roof exists; `custom/site-fixes/roof-type-*-480.webp` and `-960.webp`), each leading to its
  card there, and a button to the comparison. "What Comes With
  Your New Roof" and "How Your Roof Replacement Works" get ids the hero's chips lead to, and the offers band follows
  the testimonials.
- **`/roofing/types/`, redesigned** (hero in `scripts/lib/services-hero.mjs`, sections in
  `scripts/lib/roofing-types-page.mjs`): the hero was "High-Quality East Coast Roof Types and Styles" and one line on
  the bare photo; under the intro, "Gorgeous Roofing Options for East Coast Homes" was white text on Panda lime over
  three cards with lime headings, a sentence each, with nothing to compare them by. The hero now has the `/roofing/`
  treatment (its block is the page's own `.types`, not a `.hero-section`; the same look in `site-fixes.css`): a "Roof
  types" label, "Roof Types and Styles for Your East Coast Home", the line about GAF Master Elite installations,
  chips for the four roof types below each with a line, and estimate and call buttons over the shingle photo. The
  intro keeps its words and Inc. 5000 badges beside a rounded photo. Then: **Gorgeous Roofing Options** (its heading
  and paragraph) over four cards, asphalt shingles, metal roofing and flat roofing in the page's own words plus GAF
  solar shingles, each with a photo of that kind of roof (the same four as the Roof Replacement page's roofing styles:
  Panda's own jobs, and the CC0 standing-seam roof from Wikimedia Commons for metal), four points, what it's
  best for and a link, and an id the hero's chips lead to, with a link to the Spanish tile project; **Compare Roof
  Types at a Glance**, a table of look, lifespan, upfront cost, roof shape and best for (it scrolls sideways on
  phones, with the row labels kept in view; lifespans from Panda's "How long does a roof really last?"); **How to
  Choose the Right Roof** on charcoal green (six questions beside facts and estimate and call buttons); **Whatever You
  Choose, It's Installed Right** as white icon cards on Panda orange (GAF Master Elite, upgraded warranties, one-day
  install, financing); eight roof type questions (with FAQPage structured data) and a call band; after the
  testimonials, the offers band; and **About Our Team** on charcoal green, as on `/roofing/`. No prices (every roof is
  different); the words come from the page and from what `/roofing/`, `/roofing-costs/`, `/commercial-roofing/`,
  `/solar-options/`, `/warranty/` and the blog already say.
- **`/commercial-roofing/`, redesigned** (hero in `scripts/lib/services-hero.mjs`, sections in
  `custom/site-fixes/service-pages.json` and `scripts/lib/service-pages.mjs`, "Our Process" in
  `scripts/lib/roofing-page.mjs`, cards in `scripts/lib/gutters-page.mjs`): the hero was the heading and "No matter
  what type of business you have…" over a stock photo of an apartment building. It now has the same treatment as
  `/roofing/` and `/solar/`: a "Commercial roofing" label, the heading, a line on what Panda does for businesses
  (flat roof replacements for offices, medical facilities and apartment communities, most done in one day), chips for
  the roof systems, replacements, buildings and recent projects below, each with a line, and estimate and call
  buttons, over a 161 KB WebP crop (`custom/site-fixes/commercial-hero.webp`) of the white TPO roof from Panda's
  "Expert TPO Roofing" project. The intro paragraph sits in a readable column. A new **Buildings We Roof** section
  follows "Commercial Roof Replacements": medical facilities, apartment communities, rooftop terraces and offices,
  each in the words of the project page it links to. **Our Process** (the same section and words as `/roofing/`'s)
  gets the same numbered timeline on charcoal green. "What Makes Our Roofers Stand Out?" (white on lime, about homes,
  in an h3) is white icon cards under "Why Building Owners Choose Panda" (an h2), with the roofing page's words told
  for a building. The project gallery opens on its Commercial photos. The "Roofing Options" card offered GAF shingles,
  solar panels and solar shingles (residential roofing words); it names the flat roof systems instead
  (`GRID_CARD_TEXTS` in `scripts/lib/site-fixes.mjs`). The "Limited-Time Offers" band (10% off a home roof
  replacement, $1,500 off solar) is removed from the page.
- **"About Our Team" headings** (the block's white version on `/roofing/`, `/roofing/types/`, `/reviews/` and `/faqs/`):
  the styled heading was empty and the words sat in a second, bare h2 in the browser's system font; they now go in the
  styled heading (`site-fixes.mjs`, "about heading").
- **Section headings of "Testimonials" (17 pages) and "Our Project Gallery" (7 pages)**: both were in the browser's
  system font at medium weight, unlike every other section heading, and the gallery's heading and line were white on
  Panda lime (about 1.9:1). Both now use the site's section heading (Roboto, extra bold, dark ink) under a small label
  ("Customer reviews", "Our work"), the testimonials heading centred at every width, and the gallery's line is dark
  without its text shadow (`custom/site-fixes/site-fixes.css`; the lime band, tabs and photos are unchanged).
- **`/siding/`** (hero in `scripts/lib/services-hero.mjs`, cards in `scripts/lib/gutters-page.mjs`): the hero's heading was
  a plain block (the page had no h1) over a 262 KB PNG. It now has the same treatment as `/services/` and `/gutters/`: a
  "Siding" label, the heading as the page's h1, the line, chips for fiber cement and vinyl (leading to the comparison
  below), estimate and call buttons and the James Hardie and CertainTeed logos in white, over a 147 KB WebP copy of the
  photo (`custom/site-fixes/siding-hero.webp`). "What Makes Our Siding Team the Best?" (lime headings on a lime band,
  about 1.9:1) uses the same white icon cards as the Gutters page, with its own words.
- **`/gutters/gutter-guards/`** (`scripts/lib/gutter-guards-page.mjs`, hero in `scripts/lib/services-hero.mjs`): the hero
  gets the same treatment as `/services/` and `/gutters/` (a "Gutter guards" label, the heading and line, chips for the
  benefits and for new gutters, estimate and call buttons) over a 165 KB WebP copy of its 292 KB photo
  (`custom/site-fixes/gutter-guards-hero.webp`). The intro keeps its words, set beside a rounded photo. "Protect Your
  Home With Quality Gutter Guards" was white on lime over cards with lime headings; it is now the same words as white
  icon cards on a light band. New sections follow: how a gutter guard project works (three steps), six questions
  answered from what the site already says (guards go on existing gutters or new ones), a "Need new gutters too?"
  band leading to `/gutters/`, and, after the testimonials, the offers band the other service pages have.
- **`/solar/`** (solar panels; heroes in `scripts/lib/services-hero.mjs`, sections in `custom/site-fixes/service-pages.json`,
  `scripts/lib/roofing-page.mjs`, `scripts/lib/gutters-page.mjs` and `scripts/lib/solar-pages.mjs`): the hero said "Expert
  Solar Roofing Services" over a fixed 280 KB PNG. It now has a "Solar panels" label, the heading "Solar Panel
  Installation for Your East Coast Home", chips for solar panels, GAF solar shingles and Solar Options (each with a
  line saying what it is), and estimate and call buttons, over the WebP copy of its solar panel photo. It is the solar
  panels page, so it is about panels: its title is "Solar Panel Installation" (it was "Solar Roofing Services") with
  its own description, its form picks "Solar panels", and its two cards (one per product: Solar Options shows both)
  are gone. It opens with **Solar Panel Installations** (the panels card's words and a checklist beside a photo of
  panels from its solar gallery), then a short **Solar Panels or GAF Solar Shingles?** (the panels marked as this page,
  the shingles linking to theirs, and a button to the full comparison on Solar Options), the benefits of solar panels
  with three panel guides from the blog, and six solar panel questions. "Our Process" is the charcoal timeline the
  Roofing page has, with the solar steps' own words; "What Makes Our Roofers Stand Out?" (white on lime) is white icon
  cards under "Why Choose Panda for Solar?"; the project gallery opens on its Solar photos. It has no project row: the
  site's one solar project is a GAF solar shingle roof, which the shingles page shows.
- **`/solar/gaf-solar-roof/`** (GAF solar shingles; `scripts/lib/solar-pages.mjs`, with the Gutter Guards page's styles):
  the same hero treatment ("GAF Timberline Solar Shingles for Your East Coast Home", the three chips) over the aerial
  photo of a GAF solar roof Panda installed, and its own title ("GAF Timberline Solar Shingles") and description. The intro keeps its words beside a rounded photo; "Why Use GAF Solar
  Shingles?" (white on lime) is the same words as white icon cards. New sections follow: solar shingles and solar
  panels side by side (linking to `/solar/`, with a button to Solar Options), how a solar roof project works (three
  steps), six questions answered from what the site and its blog already say (with FAQPage structured data), a "Not
  sure which is right for your home?" band (its second button leads to Solar Options), and, after the testimonials, the offers band, whose solar **Claim** picks "GAF solar roof (solar shingles)".
- **"Limited Time Offers"** (the home page, `/roofing/`, `/solar/`, `/siding/`, `/gutters/`,
  `/thank-you/`; `collectOffersStrip` in `scripts/lib/offers-page.mjs`): three flyer pictures with "Spring Savings" and
  a number that isn't the site's (877 213 1240) baked in, and "Panda Exteriors Internal Promotion" in their text. They
  are now the two offers as the `/offers/` page's coupon cards (from `custom/site-fixes/offers-page.json`), with a line
  about no-interest financing and a **See all offers** button. **Claim** picks the offer in the page's estimate form
  when that form lists the project (on `/solar/` the solar offer picks "Solar panels"); otherwise, and on
  `/thank-you/`, it opens the offer's page. On `/commercial-roofing/` the band is removed: both offers are for homes
  (`NO_OFFERS_PATHS`).
- **`/services/` hero** (`scripts/lib/services-hero.mjs`): "Expert Roofing and Exterior Services" and one line that
  offered windows (not a Panda service) over a 678 KB PNG of a Panda roofer installing solar shingles. It now has an
  "Our services" label, the same heading, the line without windows ("From roofing and siding to solar and gutters…"),
  a chip per service (Roofing, Commercial, Solar, Siding, Gutters, Gutter Guards) linking to its page, and **Get a free
  estimate** (to the form beside it) and call buttons, over the same photo as a 184 KB WebP copy
  (`custom/site-fixes/services-hero.webp`) darkened behind the text, like the other redesigned heroes. The estimate
  form is unchanged.
- **`/contact-us/`, redesigned** (`scripts/lib/contact-page.mjs`; offices, addresses, numbers and words in
  `custom/site-fixes/contact-page.json`, applied with `npm run update:site`): the seven office cards showed Google
  static-map pictures that never loaded (they need an API key), their numbers could not be tapped, three had no street
  address, and "Send Message" opened a pop-up form this copy cannot send; under them a lime band showed the email in
  orange. The page now opens with a hero: the main line (877) 213-8536 and info@pandaexteriors.com as large
  tap-to-call and tap-to-email cards, the headquarters' address, and a map of the East Coast with a pulsing pin per
  office and the office names beside it (each leads to its card). Then the seven offices, Laurel, MD first as
  headquarters: each card has a small map of its state with the office pinned, its street address, **Get directions**
  (Google Maps) and its own number as a call button. A closing band repeats the main line and email. The maps are SVG
  drawn from the US map's state outlines (`custom/us-map/us-states.json`), like the site's other maps: no API key and
  nothing loaded from elsewhere. The pop-up form and its spinner script are removed. The numbers for Laurel
  ((240) 574-1048), Marlton ((856) 343-4146) and King of Prussia ((484) 224-7623) are the ones on the live city pages;
  the Charlotte and King of Prussia addresses come from Panda's BBB and Yelp listings and the Tampa address from the
  owner. The page's description lists the offices.
- **`/customer-service/`, redesigned** (`scripts/lib/customer-service-page.mjs`): the page was a thin "Panda
  Exteriors Customer Service" strip over a cropped photo, then "Call Our Team Today to Get Started" and a sales block
  about roof replacements beside the estimate form; nothing on it helped someone who already works with Panda. It now
  opens with a hero: the heading, a line, and the main line (877) 213-8536, info@pandaexteriors.com and "Your local
  office" (the Contact page's office cards) as large tap targets. Then "How can we help?": six white icon cards, each
  in the site's own words, for the installation warranty, the 100% satisfaction guarantee and financing (the three
  offer pages the footer's Warranty and Financing links lead to), leaving a Google review (the review wall's link) or
  reading the reviews, referring a friend (the Refer & Earn page) and the FAQs. The estimate block stays below for new
  customers, headed "Planning a new project?", on the charcoal green of the "About Our Team" blocks (white heading,
  light text, lime "Learn More" button) instead of white.
- **The 404 page, redesigned** (`scripts/lib/not-found-page.mjs`): `404.html` (what the host shows for an address that
  doesn't exist) was the header and nothing under it. It now has a dark hero with "Oops! That page doesn't exist.", a
  line, a lime "Back to the home page" button and a call button for (877) 213-8536, beside a big "4 (house) 4" whose
  roof has lost a shingle. Under it, "Looking for something else?" links to Roofing, Siding, Gutters, Solar, Past
  projects and Contact us as white cards.
- **`/terms-and-conditions/` and `/privacy-policy/`, redesigned** (`scripts/lib/legal-page.mjs`; the words are in
  `custom/site-fixes/legal-pages.json`, by page, applied with `npm run update:site`): both pages used the Site Map's
  layout, so the text ran the full width of the screen over a stray lime glow, and their lists were white on white (a
  site-wide rule makes every list item white): the terms' "To participate, you must:" and "By signing up, you confirm
  that you are:" showed as blank space, and the policy's "uses the Information collected from its Users to:" showed
  only through an inline colour. Each now opens with a dark hero: the heading, a line and three cards for what most
  people come for (the terms: reply STOP, reply HELP, message and data rates may apply; the policy: never sold, texts
  stay private, cookies). The text follows in a white card on a light band, beside a "Questions about …?" card (call,
  email) and an "On this page" menu that stays in view (it scrolls on its own on short screens): the opening paragraph
  as a notice ("Please read carefully" in orange on the terms, which names the arbitration clause and class action
  waiver; "Our commitment" in lime on the policy), the sections numbered, the lists with check marks, STOP and HELP
  shown as keys, and a link to the other legal page at the end. The wording is unchanged; on the policy, "see below",
  "Sale or Acquisition section below" and "contact us" became links.
- **`/charity-and-community/`, redesigned** (`scripts/lib/charity-page.mjs`; the words, gifts, organizations and
  photos are in `custom/site-fixes/charity-page.json`, applied with `npm run update:site`): the page was a blown-up
  truck photo with the heading over the truck's own logo, two short paragraphs beside a list of four gifts, a lime
  band of three text-only cards and a contact block whose card showed a broken Google map, with no photos of the
  events. It now has a hero with the headline, the **$179,691** donated to date, **Donate to So Kids Soar** (the
  charity's site, as before) and **Partner with Panda** (the contact page) buttons beside a collage of four event
  photos with a "Proud partner of So Kids Soar" badge; the four gifts the page listed, largest first, as cards with
  the organizations' logos, labelled as recent gifts (part of the total, not all of it); the three organizations
  Panda works with, each with an icon and its line; a grid of the gallery's 22 Community and Charity photos (12 at
  first, **Show all** for the rest; tall photos take two rows, in an order that fills every row), each opening in
  the project gallery's photo viewer (`custom/project-gallery/project-gallery.js`, with the photo's own
  description); the Community DC episode in its iHeart player; and a closing "Running a charity event?" band with
  partner, donate and call buttons. The "About Our Team" form block below is unchanged. The page's logos were 78 px
  pictures blown up to 124 px, so they were blurry; the gift cards and the badge now use 240 px copies made from each
  organization's own logo (`custom/site-fixes/charity-*.webp`: So Kids Soar's logo, the Panda logo for the Eapen
  Open, the circled 24 from the 24 Foundation's logo and the crown from Zeta Tau Alpha's, in its own teal). The
  collage's tall baseball photo is cropped to its upper part, so the man's head is no longer cut off.
- **`/gallery/` hero and missing photos** (`scripts/lib/gallery-page.mjs`, words and photos in
  `custom/site-fixes/gallery-page.json`): the page opened straight on the category tabs, with no heading. It now opens
  with a hero on a charcoal-green band: "Panda Exteriors Company Gallery", a line about the work, a chip per category
  with its number of photos, the photos, jobs and Google rating as numbers, **Get a free estimate** and call buttons,
  and a collage of five of the gallery's own photos (one per category). The chips and the collage's photos open their
  category's tab (`custom/site-fixes/site-fixes.js`; on phones, the dropdown that stands in for the tabs) and go down
  to the photos. The counts are taken from the page and the numbers from the map's and the reviews' data. Two
  Commercial photos were missing (on the live site and its staging server too) and showed as empty grey tiles; they
  are removed from the grid and its photo viewer, and the grid closes up.
- **`/faqs/` hero and questions** (`scripts/lib/faq-page.mjs`, words in `custom/site-fixes/faq-page.json`): the hero said
  "Frequently Asked Questions" and one line over a photo of bare roof decking mid tear-off. It now says "Questions?
  We've got answers.", with a **search box** that narrows the questions as you type (every word has to appear in the
  question or its answer; matches open, with the words marked, and Enter goes down to them), a chip per topic with its
  number of questions and a call link, over an aerial photo of a Panda solar-shingle roof
  (`custom/site-fixes/faq-hero.webp`, a smaller copy of a photo already on the site). The questions were three blocks
  (About Us, Roofing, Solar), each a list beside a pale green panel showing one answer at a time. They are now one
  section: the 19 questions as accordions grouped by topic (the three commercial roofing questions get their own
  group), each group with an icon, a line about it and a link to its service page, beside a topic menu that follows
  you down the page and marks the topic you are reading, and a "Still have a question?" card with call and estimate
  buttons. A link to one question (`/faqs/#faq-solar-2`) opens it. Without JavaScript the search is hidden and the
  accordions still work. The page also gets FAQPage structured data for search engines. The questions and answers
  are the page's own (one missing full stop added); edit them in the JSON and run `npm run update:site`.
- **The project pages, redesigned and linked where they belong** (the 15 pages under `/blog/project/`;
  `scripts/lib/project-pages.mjs` with `custom/projects/`, see [`custom/projects/README.md`](custom/projects/README.md)).
  Each was a title strip ("Projects - Panda Ext-11425") over a blurred photo, then the project's photos at full size
  one under another (some 2,560 px and half a megabyte each); seven had no words at all, and nine (Brookfield
  Properties, Linear Accelerator Roof Replacement, the five "Panda Ext-…" pages and two of the three titled just "Roof
  Replacement") were linked from nowhere but the Site Map. Each page now has a hero on the site's dark green
  (breadcrumb, the project's type, its name, a line about it, an estimate button and a button down to the photos,
  beside its best photo), the project's story beside an "At a glance" card (what was done, materials, warranty, time on
  site, the related service page, estimate and call buttons), its video where it has one, the photos as a grid (resized
  copies, a tenth of the weight) that opens the project gallery's photo viewer, three more projects and a closing
  estimate band. Pages that had only a job number or "Roof Replacement" get a clearer name (in the tab and share
  previews too: "Roof Replacement (Project 11425)", "Colonial Home Roof Replacement", "Ranch Home Roof Replacement");
  pages with words keep them (Brookfield's proposal wording is now in the past tense, and the solar page no longer
  promises the 30% federal tax credit). Every project is now reachable in context: `/past-projects/` lists all of them
  under the favorites ("Browse all of our projects", with Homes / Commercial & multi-family / Solar filters), and the
  service pages each belongs to show it in a "Recent projects" row above their testimonials (`/roofing/residential/`,
  `/roofing/replacement/`, `/roofing/types/`, the three commercial pages, `/solar/gaf-solar-roof/`,
  `/gutters/gutter-guards/`). The Site Map now finds no page that can't be reached by clicking. The five "Panda Ext-…"
  pages share the same four or five drone photos (as on the live site), so each shows a different one as its cover.
- **The blog, redesigned** (`/blog/`, its 15 numbered pages and all 93 posts; `scripts/lib/blog.mjs` with
  `custom/blog/`, see [`custom/blog/README.md`](custom/blog/README.md)). `/blog/` was a heading over a lime "Featured"
  card that cut its title off ("…What H...") and six cards a page. It now has a hero with a **search box**, the newest
  post as a large featured card, and every post as a card with its topic, summary, date and read time, 12 at a time
  with "Load more" (and a row of links to the numbered pages); the search and a chip per **topic** narrow the cards as
  you type or tap, and the address keeps the search. The numbered pages keep their posts in the same design. Each post put its cover picture (which carries the
  title, the panda and "READ THE BLOG" in it) behind the heading, so the two titles ran over each other, with the lead
  form filling the rest of the hero (the whole first screen on phones), the article the full width of the page, a
  hidden copy of the hero (a second `h1` and form) and "Related Posts" showing the same three 2023 posts everywhere.
  Each post now opens with a title header (breadcrumb, title, the post's summary, author, date, read time) and the
  cover shown whole below it; the article is set in a readable column beside a sidebar that follows you down the page
  ("On this page" with the section you're reading, and a free-estimate card whose button opens the estimate form in a
  dialog); call-and-estimate bands sit partway down and at the end (in place of the "Call Now - Get a Free Estimate"
  picture 61 posts ended with); share links follow the article; and "Keep reading" shows three posts on the same
  topic. The posts keep their wording; links in them are a darker orange and words coloured lime a darker green, so
  they read on white. The six topics (Insurance & Storms, Roof Replacement, Seasonal Care, Solar, Siding & Gutters,
  Hiring & Costs) replace the WordPress categories, which file 55 posts under "Residential Roofing"; they are set in
  `custom/blog/blog.json`.
- **`/service-areas/`**: the "Expert Roofers on the East Coast" section (text and truck photo) and the green
  "Learn More About Our Exterior Remodeling Services" band are removed (on request), so the map follows the hero.
- **`/service-areas/` services section** ("Our Reliable Exterior Remodeling Services") showed four green boxes of text
  (Roofing, Solar Roofing, Commercial Roofing, Gutters). It is now a row of photo cards for all ten service pages
  (roof replacement, roof repairs, residential roofing, attic insulation, solar panels, GAF solar roof, commercial
  roofing, siding, gutters and gutter guards), each linking to its page, plus a "See all our services" button. The
  row glides past like the home page's logo row and eases to a stop under the mouse or while a card has keyboard
  focus; with reduced motion, or without JavaScript, the cards sit still in rows. The cards are listed in
  `SERVICE_CARDS` in `scripts/lib/site-fixes.mjs`, using photos already on the site.
- **Services carousel on `/about/`, `/podcast/` and `/roofing/`** (under "Customer-Oriented Exterior Remodeling
  Services in the Mid-Atlantic" and "Comprehensive Roofing and Exterior Remodeling Services") was a slider of orange
  icon cards, three at a time with pale arrows, with the third card cut off at the edge. It showed only roofing,
  twice over ("Roofing Replacement" and "Replacement" were the same page), and half the descriptions belonged to
  other cards. It is now the same gliding row of photo cards as on `/service-areas/`, in the section's orange: all ten
  services on `/about/` and `/podcast/`, and the six roofing ones (Roof Types included) on `/roofing/`
  (`ROOFING_CARDS`), with a "See all our services" button. On phones, with reduced motion or without JavaScript,
  the still cards are one row to swipe through rather than a long column (on `/service-areas/` too).
- **Service card grids** (`/services/`, `/solar/`, `/siding/`, `/gutters/`, `/commercial-roofing/`) used the same orange
  icon cards, standing still. They are now the same photo cards, in a grid (three across on `/services/`, a centred
  pair elsewhere, one column on phones), with each page's own titles and text (photos in `GRID_PHOTOS`). Three of
  their links were broken on the live site too: "Gutter Installations" led to `/powerwash/` and "Siding
  Replacements" to `/window-replacement/` (neither exists on the main site; they are pages of the Huntersville city
  site, about pressure washing and windows), and "Siding Types" led to the commercial roof types page. Those cards
  sit on the pages that cover their service (`/gutters/` is "Gutter Replacements And Installations", `/siding/` is
  "Siding Replacements And Installations"), so the first two now lead to the contact page ("Get a free estimate") and
  "Siding Types" to the siding types section further down `/siding/` ("Compare siding types"; `GRID_CARD_FIXES`). The
  two `/siding/` cards showed drawn renderings; they now have real photos of siding (no siding job is among Panda's
  photos, so both are from Wikimedia Commons): a volunteer nailing lap siding over house wrap at a Habitat for Humanity
  build (by Capt. Elizabeth Brown, U.S. Army, public domain) and a home in blue fiber cement lap siding ("Fiber cement
  siding.jpg" by Wikideas1, CC0), in `custom/site-fixes/siding-install.webp` and `siding-fiber-cement.webp`. On
  `/services/` the two empty headings around "Our Services" are removed and the heading gets the site's
  section-heading style. The office cards on `/contact-us/` are unchanged.
- **`/siding/` and `/gutters/` (and `/roofing/`, above): one strong page per service.** Under the service cards each
  page now explains the job (`scripts/lib/service-pages.mjs`; the words are in `custom/site-fixes/service-pages.json`,
  written only from what the site and its blog already say, so they can be edited there and applied with
  `npm run update:site`):
  - `/siding/`: **siding types**, James Hardie fiber cement and CertainTeed vinyl side by side (what each is, its
    strengths, what it's best for), which the "Siding Types" card scrolls to;
  - **signs it's time** for new siding or gutters, with links to the blog posts they come from;
  - `/gutters/`: **what we look at on every gutter job** (gutters, fascia, pitch, downspouts, drainage, guards);
  - **how the project works** in three steps (free estimate, choices and financing, installation with a project
    manager);
  - **questions and answers** (an accordion, with FAQPage structured data for search engines), then a band with "Get
    a free estimate" (it leads to the lead form at the top of the page) and the phone number.

  `/gutters/` also opens its project gallery on the Gutters photos instead of Roofing.
- **Lead forms** (every page with one: 131 pages, from the home page to every blog post): the form cards (in the
  hero, beside "About Our Team", on blog posts) all held the same form, "10% OFF Roof Replacement" with a "Get a Free
  Roof Inspection" button, even on the siding, gutter and solar pages, and a project type with no siding option.
  Each card now has a form for its page (`custom/site-fixes/service-forms.json`, `scripts/lib/service-forms.mjs`):
  `/siding/`, `/gutters/` and `/gutters/gutter-guards/`, the three solar pages, the three commercial pages and
  `/roofing/attic-insulation/` get one for their service; the other roofing pages keep the roof replacement offer
  with a roofing form; every other page gets a general "Free Estimate" form that asks what the visitor needs. Each
  has its own heading, line and button, the contact fields and questions about the job, with the page's own service
  already chosen where it has one. The Google rating and reviews link stay. **The forms are not connected to anything
  yet**: on submit the fields are checked, then the card says online requests aren't switched on and offers the
  phone number, so nobody thinks a request went through. The old form's scripts are removed from every page (163,
  including the project pages and the 404 page, which loaded them without a form): they sent leads to Salesforce
  (no longer used), Zapier, AccuLynx and Five9, looked up addresses with Google Maps, and **asked every visitor for
  their location as the page loaded**. That also clears two console errors on most pages. (The careers pages' own
  placeholders, which switch the location prompt off, are left alone.)
- **`/referrals/`, the Refer & Earn page** (`scripts/lib/referrals-page.mjs`; the words, amounts and store links are in
  `custom/site-fixes/referrals-page.json`, so they can be edited there and applied with `npm run update:site`): the
  page was Panda's live GetTheReferral sign-up laid over the whole page, so a referral sent from the copy reached
  Panda. Referrals are sent from the Panda Exteriors app, so the page now explains the program and sends people to
  the app: a hero with **Download on the App Store** and **Get it on Google Play** buttons and, on computers (a wide
  screen and a mouse), a QR code for each store that a phone's camera opens (drawn as SVG when the page is built, with
  `qrcode-generator`), beside a phone showing the Panda logo and reward notifications, the $200 bonus among them
  (drawn in HTML and CSS), what you can earn ($25 for downloading the app, $50
  when a referral is qualified, $150 when they buy and a $200 bonus for every three sold, with a worked example),
  how it works in three steps (with the company code, 23844, the live page shows) and a closing band with the store
  buttons, the QR codes and the phone number. The amounts and store links are the ones on Panda's live GetTheReferral page; the
  $25 for downloading the app was added on request, and bath referrals are left out like Panda Bath. The page's
  description (search results and share cards) says what the program pays.
- **`/offers/`, redesigned.** The hero sat over the same drone photo as `/service-areas/`, pinned to the screen
  (`background-attachment: fixed`) and so blown up, with "We make sure our team is the best available…" as its only
  line. Below it were five identical alternating lime and cream bands, each a flyer picture beside a heading and a
  "Learn More" button; only two were offers (10% off a roof replacement, $1,500 off solar), the flyers had "Spring"
  wording and a phone number that isn't the site's (877 213 1240) baked in, and the descriptions were light grey on
  cream. The page now has (`scripts/lib/offers-page.mjs`; the words are in `custom/site-fixes/offers-page.json`,
  written only from what the offer pages already say, so they can be edited there and applied with
  `npm run update:site`):
  - a **hero** over a photo of a Panda GAF solar roof (dark shingles, white dormers; preloaded, scrolling with the
    page), with a headline about both offers, the two offers as tickets, and "See the offers" and call buttons. The
    lead form beside it is unchanged;
  - the **two offers as coupon cards**: a photo, the amount, what you get, the fine print, a link to the offer's
    own page and a "Claim" button that leads to the hero's form with the offer's project (Roof replacement or
    Solar) already chosen, unless the visitor has chosen one;
  - **what comes with every project**: no-interest financing, the 100% satisfaction guarantee and the installation
    warranty as three cards, each linking to its page;
  - **how to claim an offer** in three steps, and a free estimate and call band.

  Its "Request an Appointment" block printed the same paragraph twice; it now shows it once.
- **The offer pages** (`/blog/offer/…/`, the five pages `/offers/` links to): each hero showed a flyer picture blown
  up behind the heading, with its baked-in text ("Spring Savings", "877 213 1240") showing through, or a 550 px photo
  stretched across the screen, under a 90% black overlay, and the picture stopped short of the right edge. Each now
  has a sharp photo already on the site across the whole hero, under a lighter overlay. The line under the heading had
  slipped out of its styled paragraph (dark grey on the dark hero); it is readable again, and on the two offers, where
  it was an internal note ("… Panda Exteriors Internal Promotion"), it is the offer in a sentence. The photos and lines
  are in the `details` of `custom/site-fixes/offers-page.json`.
- **Header phone button** (the five offer pages and six blog posts): it said (877) 213-1240, with a link phones
  can't dial (`tel:+(877) 213-1240`), where every other page's says (877) 213-8536. It now says (877) 213-8536 too.
  Two blog posts still give (877) 213-1240 in their text (blog posts keep their wording).
- **Lists in blog posts** (11 pages, the offer pages among them): the site's stylesheet sets `ul, ul li` to white
  `!important`, which outranks its own black for `li`, so some lists showed bullets with nothing beside them (white
  on white). Lists in the article now match its black text.
- **Missing photos** (missing on the live site too): reviewers without a photo get their initials in the round photo
  spot (the review carousels do the same).
- **Blog share buttons** (93 posts) did nothing (their script is missing). They are now plain Facebook, Twitter,
  LinkedIn and email share links (with the blog's design on, they are replaced by its share links).
- **`/service-areas/` hero** said only "Our Service Areas" and a tagline, over a 2000×450 strip of roof pinned to
  the screen (`background-attachment: fixed`), so the photo was blown up about 2× and showed only shingles on phones.
  The hero now says where Panda works: a headline and line naming the office states, the jobs, states and offices
  (read from `custom/us-map/areas.json`, so they always match the map) and the Google rating. Chips for the six
  states with the most jobs glide down to the map and zoom it to that state. It also has call and "See the map"
  buttons, and a sharp drone photo of the Laurel office (`DJI_20250722134520_0995_D.jpg`), preloaded so it shows
  straight away. The lead form beside it is unchanged.
- **Share titles**: `/podcast/` and `/referrals/` were shared on social media as "Panda Exteriors | About Us" (copied
  from the About page). They now use their own page titles.
- **Small fixes**: a link whose address had slipped into its `style` attribute ("roofing team" on `/roofing/types/`)
  and typos ("Experts Your Can Trust", "Exterior Modeling", "Commerical", "Our Services Areas", "is a East
  Coast" in the footer, "o matter what part of your exterior…" and "your schedule a budget" in "Our Process").

Pages where a fix replaces a whole section or message are listed as "edited on purpose" in
`docs/visual-diff/summary.md`; pages with only the small fixes are compared with live as usual. (`docs/visual-diff/`
was last regenerated before the review carousels, project gallery, logo row, award badges and smooth scrolling were
added; the next capture and build regenerates it.)

## Site restructure

After an audit of every page, overlapping pages were merged, thin ones folded into the pages that cover the same
ground, and the pages the site was missing added. Old addresses redirect (301) to where their content went, every
link on the site leads straight there, and nothing on the site links to a redirect. Applied by
`npm run update:site` (and by `03-build.mjs`), so editing the files named below and running it again updates the
site.

**Merged** (`MERGED_PAGES` in `scripts/lib/config.mjs`, `MERGE_PAGES=0` keeps them). A merged page is a removed
page (it isn't built, its sitemap entry, feed item and the files only it used go) whose links stay and lead to the
page it went into (`relinkMerged` in `scripts/lib/merged-pages.mjs`); the header menu loses its entry (Commercial,
left with no entries under it, becomes a plain entry); the Site Map's check lists it as an old address.

| Old page | Now part of | What moved there |
| --- | --- | --- |
| `/roofing/residential/` | `/roofing/replacement/` | Panda only replaces roofs, so it was the same page again: "What Comes With Your New Roof", "How Your Roof Replacement Works" and questions (`custom/site-fixes/service-pages.json`) |
| `/commercial-roofing/roof-types/`, `/commercial-roofing/roof-replacement/` | `/commercial-roofing/` | "Commercial Roof Systems We Install" (TPO, EPDM, Mod Bit, PVC), "Commercial Roof Replacements", questions; its two service cards lead to those sections |
| `/solar/solar-panel-installations/` | `/solar/` | "Benefits of Solar Panels for Your Home" and questions |
| `/gallery/` | `/past-projects/` | the work photos, as a photo gallery under the project list (`custom/site-fixes/photo-gallery.json`); the community photos were already on Charity & Community's photo wall |
| `/customer-service/` | `/contact-us/` | its help topics, as "Already a customer?" (`helpTopics` in `scripts/lib/customer-service-page.mjs`) |
| `/blog/offer/10-off-roof-replacement/`, `/blog/offer/1500-off-solar-project/` | `/offers/` | nothing: the offers were there in full |
| `/blog/offer/find-out-about-our-no-interest-financial-options/` | `/financing/` (new) | |
| `/blog/offer/our-installation-work-is-completed-by-certified-professionals/`, `/blog/offer/professional-remodels-backed-by-a-100-satisfaction-guarantee/` | `/warranty/` (new) | the installation warranty's terms and the guarantee (the old guarantee post still offered repairs and named solar brands Panda doesn't install) |
| the five "Roof Replacement (Project N)" pages (`/blog/project/panda-ext-11425/` …) | `/past-projects/` | nothing: they shared one text and five photos, all in the photo gallery |
| 29 blog posts (see `MERGED_PAGES`) | the post on the same topic | the sections the kept post didn't cover, before its closing section (`custom/blog/merged-posts.json`, chosen by hand and copied as written, minus sales lines, dated wording and repair offers) |
| `/blog/page/12/` … `/blog/page/16/` | `/blog/` | 64 posts fill 11 listing pages |

`/podcast/` was merged into `/media/` too, then brought back on request: it is a page again, under Media in the header
menu (after Blog), and its old redirect is gone (`writeRedirectFiles` drops a redirect whose address has a page again).

The merged blog groups: winter roof replacement, repair or replace, signs you need a new roof, hiring a roofer,
spring leaks, spring inspections, seasonal maintenance, ice dams, winter prep, the three-part "Your Reasons to Go
Solar" series, the best season for solar, solar maintenance, gutters after winter, summer siding, insurance claim
guides, and "Replacing a Roof in 2024" (into the replacement timeline). Posts that offer roof repairs keep their
wording (as before).

**New pages** (`scripts/lib/new-pages.mjs`; words in `custom/new-pages/pages.json`, styles in
`custom/new-pages/new-pages.css`; `NEW_PAGES=0` leaves them out). Generated like the Media page, from a built page's
header and footer, each with a hero beside the estimate form and its own title, description, canonical address and
structured data (breadcrumbs, FAQ, and a `RoofingContractor` per office). Written only from what the site and its
blog already say.

- `/financing/`: Service Finance, LLC, delayed payments and no-interest loans, what can be financed, how it works,
  other ways to save, questions.
- `/warranty/`: the satisfaction guarantee, the installation warranty and its terms, and the manufacturers'
  warranties (GAF and the Golden Pledge, siding). Its sections were white and near-white one after another; the
  three kinds of protection now sit on Panda orange (white cards) and the installation warranty on charcoal green, so
  the page runs dark hero, orange, white, green, white, light tint, white and the orange call band (a section's
  `"tone"` in `pages.json`: `"orange"` or `"dark"`, for cards and split sections).
- `/storm-damage/`: what to do in the first 24 hours, what insurance usually covers (shared with Roofing Costs), how
  Panda helps with the claim, questions, and every storm and insurance guide on the blog.
- `/solar-options/`: the two ways to go solar side by side, over a photo of solar homes from the solar gallery (the
  solar panels page, `/solar/`, and the solar shingles page, `/solar/gaf-solar-roof/`, are each about their product
  and link here for the comparison). Solar panels and GAF solar shingles each get a photo
  card (what it is, four points, who it suits and a button to its own page), then a comparison table (installation,
  look, the roof deck, upfront cost, power, warranty, best for; on phones each row stacks), how going solar with
  Panda works, why Panda, questions and the blog's solar guides. Its estimate form is the solar one. The words are
  from the two solar pages and the blog's "Solar Shingles vs. Traditional Solar Panels".
- `/locations/<city-st>/`, one per office (`custom/site-fixes/contact-page.json`): the address, number, a map of the
  state, the jobs completed there (`custom/us-map/areas.json`), the services and the other offices.

The header menu lists Storm Damage (under Roofing) and Financing and Warranty (under About), and Services ▸ Solar
became "Solar Options", leading to that page; the footer's "Customer Service" became "Storm Damage" and its "Solar" became "Solar Options",
leading to that page too, the service cards across the site link Storm Damage where Residential
Roofing was, Contact Us links each office's page, and Service Areas shows the seven offices where it had the
services row every other page has too (`serviceAreaOffices` in `scripts/lib/site-fixes.mjs`).

**The Site Map is a page for visitors.** `/site-map/` is now a plain list of every page in groups; the full list
described above (how to reach each page, redirects, sitemap-only addresses, source files) moved to `/site-audit/`, a
site check linked from nowhere and kept out of search engines (`noindex`) and the XML sitemaps.

**Tidy-ups**: `/services/` is titled "Our Services" (it said "Roofing Services"), and `/roofing/attic-insulation/`,
the one page without an h1, has its hero headline as one.

<a id="xml-sitemaps"></a>**The XML sitemaps list the copy's pages, and only those** (`scripts/lib/sitemaps.mjs`, run by `03-build.mjs`
and `scripts/tools/update-built-site.mjs` with the site fixes, before the site check reads them). As captured, the
28 project sitemaps listed 5,506 project posts, of which the copy has 10, and post-sitemap.xml and page-sitemap.xml
missed the 12 newest blog posts and `/media/`. Now every entry without a page is dropped, every indexable page no
sitemap listed is added (blog posts to post-sitemap.xml, projects to project-sitemap1.xml, the rest to
page-sitemap.xml, dated by the page's own modified date; noindex pages, the 404 page and the blog's numbered listing
pages stay out, as on the live site), and the sitemaps left empty (project-sitemap2.xml to project-sitemap28.xml) are
deleted and taken out of sitemap_index.xml, whose dates follow the newest entry of each sitemap. The sitemaps'
stylesheet link (`//pandaexteriors.com/main-sitemap.xsl`, which a browser won't apply on another host) points at
`/main-sitemap.xsl` on the same host. `locations.kml`, which local-sitemap.xml lists, was an empty sitemap header on
the live site; it is now a KML file with a placemark (address, phone, page, coordinates) for each of the seven
offices. The addresses stay on `https://pandaexteriors.com`, like the canonical URLs.

**Tools**: `scripts/lib/restructure.mjs` deletes removed pages still in a built `site/`, the files only they used,
their sitemap entries and feed items, and writes their redirects with chains flattened (`/commerical-roofing/roof-types/`
leads straight to `/commercial-roofing/`); `03-build.mjs` flattens chains the same way.

## What's in the repo

```
site/                    the website — deploy this folder
  index.html, roofing/index.html, …   every page, at the same path as on the live site
  wp-content/, wp-includes/, …        CSS, JS, fonts, images (every srcset size), video, icons
  _external/<host>/…                  third-party static files made local (e.g. Google Fonts)
  _custom/us-map/                     the animated map's stylesheet and script (copied from custom/us-map/)
  _custom/site-fixes/                 styles and script for the site-audit fixes (copied from custom/site-fixes/)
  _custom/reviews/                    the review carousel's and the review wall's stylesheets and scripts (copied from
                                      custom/reviews/), and review-wall.json, the reviews the wall loads
  _custom/project-gallery/            the project gallery's stylesheet and script (copied from custom/project-gallery/)
  _custom/past-projects/              the favorite projects' stylesheet and photos (copied from custom/past-projects/)
  _custom/projects/                   the project pages' stylesheet, script and photos (copied from custom/projects/)
  _custom/smooth-scroll/              Lenis and its setup, for smooth scrolling (copied from custom/smooth-scroll/)
  _custom/media/                      the Media page's stylesheet, script and podcast pictures (copied from custom/media/)
  _custom/blog/                       the blog's stylesheet and script (copied from custom/blog/)
  media/index.html                    the Media page (generated: scripts/lib/media-page.mjs)
  _custom/site-map/                   the Site Map's stylesheet and script (copied from custom/site-map/)
  site-audit/index.html               the site check: the full list of pages and routes (generated, noindex)
  financing/, warranty/, storm-damage/, locations/…  the pages added in the site restructure (generated:
                                      scripts/lib/new-pages.mjs)
  _custom/new-pages/                  their stylesheet (copied from custom/new-pages/)
  site-map/index.html                 the Site Map; its list of every page is generated (scripts/lib/site-map-page.mjs)
  _raw/<path>/index.html              the HTML exactly as the server delivered it (reference only)
  404.html                            the site's 404 page
  robots.txt, sitemap*.xml, feed/     as captured, apart from the sitemap sync (scripts/lib/sitemaps.mjs)
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
custom/reviews/            the review carousel (reviews.json: the reviews it shows) and the review wall on /reviews/
                           (google-reviews.json: the Google reviews and rating), styles, scripts
custom/project-gallery/    the "Our Project Gallery" section: styles, script
custom/past-projects/      "Some of our favorite past projects" and the hero: favorites.json (projects, hero photo), photos, styles
custom/projects/           the project pages, their rows on service pages and the list of every project: projects.json, photos, styles, script
custom/smooth-scroll/      smooth scrolling: Lenis (MIT licence), its stylesheet and the site's setup
custom/media/              the Media page: podcast.json (the podcast's episodes), pictures, styles, script
custom/blog/               the blog's design: blog.json (its topics and the listing pages' words), styles, script
custom/site-map/           the Site Map's list of every page: styles, script (search and filters)
custom/new-pages/          the pages added in the site restructure: pages.json (their words), styles
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
| 6 | `06-lfs-attributes.mjs` | Writes `.gitattributes`: Git LFS for all video. Images stay regular files so hosts serve them without LFS. |
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
- After a re-capture, run `node scripts/06-lfs-attributes.mjs` before `git add`, so any video goes to LFS.

### Update `site/` without the capture cache

`.cache/` and `.work/` are not in the repository, so a fresh clone cannot run `03-build.mjs`. After changing
`custom/` or the site fixes, `npm run update:site` (`node scripts/tools/update-built-site.mjs`, add `--dry-run` to
preview) applies the site fixes (review carousels and project gallery included), smooth scrolling and the Media menu
link to the pages already in `site/`, rebuilds the Media page and the Site Map's list of pages, and copies the custom
files.
Each fix gives the same result on a built page as on the page as captured, so the pages come out as a full rebuild
would make them. The map sections are the exception: only `03-build.mjs` renders them.

## What doesn't work in a static copy

- **Forms** (contact, newsletter): there is no server to receive them. The markup is kept.
  Submissions made on the copy go to the static host and fail harmlessly; they never reach the live site.
  The captured free-estimate lead forms posted straight to Salesforce (web-to-lead) and Zapier, and `/referrals/`
  showed the live GetTheReferral sign-up; with the site fixes on (the default) none of them is left: the estimate
  forms say online requests aren't switched on yet and give the phone number, and the referral page links to the
  Panda Exteriors app instead, so **no lead
  form on the copy sends anything to Panda or any lead service** (the employee referral form, which opened an email
  to Panda's careers address, went with `/referral/`). [`docs/forms.md`](docs/forms.md) lists the forms as captured,
  before the site fixes.
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

> **Git LFS note:** video files are stored with Git LFS (images are regular files). Hosts that build straight from the git
> repository may receive LFS *pointer files* instead of the real files unless LFS is enabled for the build. Deploying
> from a checkout with the LFS files pulled (`git lfs pull`) via each host's CLI avoids this.

- **Vercel** — import the GitHub repo. The generated `vercel.json` (written by `scripts/03-build.mjs`) makes Vercel
  skip the install and build steps and serve `site/` as static files, with trailing slashes like WordPress and the
  redirects seen on the live site. In the Vercel project, turn on **Git LFS** (Settings → Git) so any
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
