#!/usr/bin/env bash
# Re-run the whole capture: inventory -> capture -> build -> verify -> LFS rules.
#
#   bash scripts/capture-all.sh            # reuse cached responses where present
#   REFRESH=1 bash scripts/capture-all.sh  # start from scratch (fresh copy of the live site)
#
# Politeness settings (defaults: 2 concurrent requests, ~500 ms pause) can be
# changed with MAX_CONCURRENT / DELAY_MS. SITE_ORIGIN overrides the target.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "${REFRESH:-0}" == "1" ]]; then
  echo "REFRESH=1: clearing .cache/ and .work/"
  rm -rf .cache .work
fi

node scripts/01-inventory.mjs            # Phase 1: robots.txt, sitemaps, crawl -> docs/url-inventory.csv
node scripts/02-capture.mjs              # Phase 2: Playwright capture (desktop+mobile) + all assets
node scripts/03-build.mjs                # Phase 2: assemble site/ (rendered HTML), rewrite links, docs
node scripts/04-visual-diff.mjs          # Phase 3: local copy vs live screenshots
node scripts/04b-choose-page-source.mjs  # Phase 3: flagged pages -> try as-delivered HTML, keep the better one
node scripts/03-build.mjs                # rebuild with the per-page choices
node scripts/04-visual-diff.mjs          # final visual-diff numbers
node scripts/05-check-links.mjs          # Phase 3: link check + inventory coverage
node scripts/06-lfs-attributes.mjs       # Phase 4: Git LFS rules (video + images > 1 MB)
node scripts/07-summary.mjs              # final numbers -> docs/capture-summary.md
echo "Done. Preview with: npx serve site"
