# Favorite past projects

This folder holds "Some of our favorite past projects", the showcase at the top of `/past-projects/`, and that page's
hero background.

The page used to end with a "Featured Projects" grid of every project the live site's (now dead) Google Maps widget
listed: 16 cards, five of them near-identical drone shots of the same houses titled "Panda Ext-14098" and the like,
three titled just "Roof Replacement", some showing bare decking mid-tear-off, and three whose 2,560 px photos often
didn't show. The page now opens with six of the best-looking jobs instead, then the map ("Areas We Serve").

## What it shows

- **The hero**: a photo of Panda's crew installing a GAF Timberline Solar roof, in place of a generic photo of a
  house that other pages also use and that was pinned to the screen (`background-attachment: fixed`), so it was
  blown up and soft. The new photo scrolls with the page, with a dark fade behind the white headline (from the left
  on computers, from the top on phones and tablets), a "Past projects" label above the headline and a "See our
  favorite projects" button that glides down to the showcase. The headline, its line and the estimate form are
  unchanged.

- A heading ("Our work" / "Some of our favorite past projects") and a line under it.
- Six photo cards: each project's type (Residential, Solar, Commercial, Multi-family), its name, a line taken from its
  project page and "View project", which opens the project page. On computers the first project is a large tile with
  the others around it; tablets show two columns and phones one. The photo zooms in a little on hover.
- "Browse all of our projects": every project page as a card, with Homes / Commercial & multi-family / Solar
  filters (written by `scripts/lib/project-pages.mjs` from `custom/projects/projects.json`; see
  [`custom/projects/README.md`](../projects/README.md)).
- A band with "Get a free estimate" (`/contact-us/`) and a link to the full photo gallery (`/gallery/`).
- Accessible: the cards are a labelled list of links, each photo has a description, and people who prefer reduced
  motion get no zoom or lift.

## Files

| File | |
| --- | --- |
| `favorites.json` | The hero (`hero`: its photo, the part of it to keep in view, the label and the button), the heading, the six projects (link, name, type, line, photo, photo description, and the part of the photo to keep in view when it is cropped) and the band under them. The first project gets the large tile. |
| `photos/` | Each project's photo at 720 and 1,440 px (webp) and 1,440 px (jpg), and the hero's at 960 and 1,920 px (webp; at most the original's 1,500 px) and as a jpg, about a tenth of the originals' weight. |
| `past-projects.css` | The styles. |

The markup is written by `scripts/lib/past-projects.mjs`: during `scripts/03-build.mjs` while the map is added
(with `SITE_FIXES` on), and by `npm run update:site` on a page built earlier. All of it is copied to
`site/_custom/past-projects/`.

## Changing the projects

1. Edit `favorites.json`. A project's (or the hero's) `photo` is any photo on the site (`/wp-content/uploads/…`); `position` is the
   CSS `object-position` used when the card crops it (for example `50% 30%` keeps more of the top).
2. If a photo changed, run `npm run past-projects:photos` to make the resized copies (old ones are
   removed).
3. Run `npm run update:site`.
