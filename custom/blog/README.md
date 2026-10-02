# Blog

This folder holds the blog's design: the listing pages (`/blog/` and `/blog/page/2/` … `/blog/page/16/`) and all 93
posts (`/blog/<post>/`). The offer pages (`/blog/offer/…/`) and the project pages (`/blog/project/…/`) live under
`/blog/` too but are not part of it.

As delivered, `/blog/` was a heading over a lime "Featured" card that cut its title off ("…What H...") beside a cover
picture with that title baked into it, then six cards and numbered pages. Each post put its cover picture (which already
carries the title, the panda and "READ THE BLOG") behind the heading, so the two titles ran over each other; the lead form
filled the rest of the hero (and the whole first screen on phones); the article ran the full width of the page; a
hidden second hero repeated the heading (a second `h1`) and the form; 61 posts ended with a "Call Now - Get a Free
Estimate" picture; and "Related Posts" showed the same three 2023 posts on every post.

The pages are edited by `scripts/lib/blog.mjs` (called first from `scripts/lib/site-fixes.mjs`) during
`scripts/03-build.mjs`, so re-running the capture and build reproduces them. `SITE_FIXES=0` builds the original pages.
**The posts keep their wording**: only what is around the article changes, plus ids on its section headings (for "On this
page") and the "Call Now" picture, which becomes a real call-and-estimate band.

## What it does

- **`/blog/`.** A charcoal-green hero with a search box, the newest post as a large featured card over the hero's lower
  edge, then every post as a card (cover, topic, title, summary, date, read time) under "All articles" with a chip per
  topic and its count. The search and the chips narrow the cards as you type or tap; 12 cards show at a time with
  "Load more"; the address keeps the search (`/blog/?q=ice+dams&topic=seasonal`), so a search can be shared or reloaded.
  Without JavaScript every card shows (and the search box, which needs it, is hidden).
- **`/blog/page/N/`.** The same design with that page's six posts (the same ones WordPress listed there), Newer / Older
  and page links, and a link to every article on one page. Its search box opens `/blog/` with the words typed; its
  chips open `/blog/` on that topic.
- **Posts.**
  - A title header: breadcrumb (Home / Blog / topic), the title, the post's own summary (left out where the article
    opens with the same words), the author's initials and name, the date and the read time.
  - The cover, shown whole below the header (the two covers too small for the column are left out; square and tall
    photos are cropped to 16:9).
  - The article in a readable column (about 70 characters a line), with the site's colours made readable: links in a
    darker orange, and words the editor coloured lime in a darker green (lime on white was about 1.9:1).
  - Beside it on computers, a sidebar that follows you down the page: "On this page" (the article's sections, the one
    you're reading highlighted, with a progress line) and a free-estimate card with the Google rating, an estimate
    button and the phone number. On phones and tablets "On this page" is a box above the article that opens, and a thin
    line at the top of the screen shows how far through you are.
  - A call-and-estimate band partway down (posts with four sections or more) and a larger one at the end (in place of
    the "Call Now" picture), worded for the post's topic.
  - The estimate buttons open the estimate form in a dialog (a sheet from the bottom on phones). It is the site's
    general estimate form (`custom/site-fixes/service-forms.json`), not connected to anything yet, like every form on
    the copy. Without JavaScript the buttons lead to the "About Our Team" form below the article.
  - After the article: its topic, and share links (Facebook, X, LinkedIn, email, copy link).
  - "Keep reading": three posts on the same topic (a row to swipe through on phones), with a link to the topic.
- **Accessible:** one `h1` per page, labelled search, buttons and share links, the chips report whether they are on,
  the result count is announced, the dialog keeps the focus and gives it back, and people who prefer reduced motion
  get no movement.

## Topics

WordPress files 55 of the posts under "Residential Roofing" and others under "Uncategorized", "Press" or one-off
categories, so the blog groups them into six topics of its own, in `blog.json`:

| Key | Topic |
| --- | --- |
| `insurance` | Insurance & Storms |
| `roofing` | Roof Replacement (posts that fit no other topic) |
| `seasonal` | Seasonal Care |
| `solar` | Solar |
| `siding-gutters` | Siding & Gutters |
| `hiring` | Hiring & Costs |

A post goes in the first topic in `matchOrder` whose `match` words (a regular expression) appear in its address or
title; `overrides` places a post by its address (the part after `/blog/`) where the words get it wrong. Each topic also
has the line shown with it, its icon and the wording of its call-and-estimate bands (`cta`). `index` holds the words of
the listing pages' hero and how many cards show at a time (`perLoad`).

## Files

| File | |
| --- | --- |
| `blog.json` | The topics, the listing pages' words. |
| `blog.css`, `blog.js` | Styles and the script (no dependencies). Copied to `site/_custom/blog/` by the build. |

The posts' details (title, summary, date, author, cover, read time) are read from the pages themselves: from
`site/_raw/` when the site is updated, and from the capture cache during a full build (`primeBlogPosts`). After editing
anything here, or `scripts/lib/blog.mjs`, `npm run update:site` updates `site/` without the capture cache.
