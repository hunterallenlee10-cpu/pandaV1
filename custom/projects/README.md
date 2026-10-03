# Project pages

This folder holds the design of the 15 project pages (`/blog/project/…/`), the "Recent projects" rows on the
service pages and "Browse all of our projects" on `/past-projects/`.

As captured, a project page was a title strip ("Projects - Panda Ext-11425") over a blurred photo, then the
project's photos at full size one under another (some 2,560 px and half a megabyte each). Seven of the fifteen had no
words at all, and nine were linked from nowhere but the Site Map.

## What it shows

- **Each project page**:
  - a hero on the site's dark green: a breadcrumb (Home / Past Projects / the project), the project's type (and its
    job number, for the pages that had only that), its name, a line about it, "Get a free estimate" and "See the
    photos" buttons, beside the project's best photo with its photo count;
  - "About this project": the project's story beside an "At a glance" card (what was done, the materials, the
    warranty, time on site, the service page it belongs to, and estimate and call buttons), and its video where it
    has one (the solar roof and the headquarters);
  - "Project photos": the photos as a grid (the first one large, tall photos two rows high) from resized copies; each
    opens full size in the project gallery's photo viewer (`custom/project-gallery/project-gallery.js`);
  - "More projects you might like": three more projects, the same kind first;
  - a closing estimate band.
- **On `/past-projects/`**, under the favorites: every project as a card (type, photo count, name, a line, "View
  project"), with Homes / Commercial & multi-family / Solar buttons that show one kind (all of them show without
  JavaScript).
- **On the service pages**, above the testimonials, a row of the projects that belong there (one project shows as a
  wide card):

  | Page | Projects |
  | --- | --- |
  | `/roofing/residential/` | Roof Replacement (Projects 11425, 14513, 14098, 14532) |
  | `/roofing/replacement/` | Colonial Home, Ranch Home, Roof Replacement & Gutter Guards, Project 11531 |
  | `/roofing/types/` | Spanish Tile Roof, Colonial Home, GAF Timberline Solar Roof |
  | `/commercial-roofing/` | Linear Accelerator, Brookfield Properties, Expert TPO Roofing, Chapel Branch Apartments |
  | `/commercial-roofing/roof-replacement/` | Linear Accelerator, Panda Exteriors HQ, Chapel Branch Apartments |
  | `/commercial-roofing/roof-types/` | Expert TPO Roofing, Brookfield Properties, Linear Accelerator |
  | `/solar/`, `/solar/gaf-solar-roof/` | GAF Timberline Solar Roof |
  | `/gutters/gutter-guards/` | Roof Replacement & Gutter Guards |

- Pages that had only a job number or "Roof Replacement" as a name get a clearer one, in the tab and share previews
  too. Pages with no description get one from their summary line.

The five "Panda Ext-…" pages show the same four or five drone photos (as on the live site), so each uses a different
one as its cover. Real photos of each job would make them stronger.

## Files

| File | |
| --- | --- |
| `projects.json` | Every project (address slug, name, job number, type label and filter group, summary line, story paragraphs, "At a glance" facts, related service page, video, cover photo and the part of it to keep in view, its description, and the photos in order); the list's heading and filters; the "More projects" heading; the closing band; and the rows on the service pages (`strips`, by page). |
| `photos/` | Every project photo resized to fit 720 px (webp), and each cover 1,280 px wide (webp and jpg). |
| `projects.css`, `projects.js` | The styles, and the list's filter buttons (no dependencies). |

The markup is written by `scripts/lib/project-pages.mjs` (called from `scripts/lib/site-fixes.mjs`, and from
`scripts/lib/past-projects.mjs` for the list) during `scripts/03-build.mjs`, and by `npm run update:site` on a page
built earlier. Everything is copied to `site/_custom/projects/`.

## Changing a project

1. Edit `projects.json`. A photo is any photo on the site (`/wp-content/uploads/…`); `position` is the CSS
   `object-position` used when a card or the hero crops the cover (for example `50% 30%` keeps more of the top).
2. If the photos or a cover changed, run `npm run projects:photos` to make the resized copies (unused ones are
   removed).
3. Run `npm run update:site`.
