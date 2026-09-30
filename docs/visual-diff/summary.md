# Visual diff: local copy vs live site

Every page was screenshotted (full page) at desktop 1440px and mobile 390px on the live site during capture and
again from the local copy served with `serve`, using the identical procedure (slow scroll to the bottom, wait for
the network to go quiet, back to top, carousels stopped on their first slide, animations disabled). Screenshots were
compared with pixelmatch (threshold 0.1, anti-aliasing ignored). Where page heights differ, the extra area counts as
different. Pages differing by more than 1% are flagged.

**Result: 290 of 290 screenshots pass (100.0%).** Flagged: 0. Not counted: 56 screenshot(s) of pages edited on purpose (listed below).

Diff images (`<page>--<viewport>.jpg`, changed pixels in red) are saved next to this file for every screenshot
that differs by 0.5% or more. Live screenshots are in `docs/screenshots/live/`.

"Page HTML" says which version the copy serves: `rendered` = the DOM captured after the page finished rendering
in Chromium; `as-delivered` = the server's original HTML (used where the rendered snapshot did not match live,
typically because carousels or other scripts initialise a second time on already-rendered markup).


## Pages edited on purpose

These pages differ from live by design: links to the city sub-sites were removed from the copy, the old map sections were replaced with the animated US map (`custom/us-map/`), some site-audit fixes change a whole section or message (`scripts/lib/site-fixes.mjs`), and the homepage hero plays a different background video (`HERO_VIDEO_ID`). Pages with only small fixes (top bar text, review link, typos) are compared with live as usual.

| Page | Viewport | Diff % | Change |
| --- | --- | --- | --- |
| / | desktop | 17.49 | edited on purpose: old map section replaced with the animated US map; hero background video swapped |
| / | mobile | 16.66 | edited on purpose: old map section replaced with the animated US map; hero background video swapped |
| /about/ | desktop | 20.50 | edited on purpose: old map section replaced with the animated US map; testimonials: all 2 reviews shown side by side |
| /about/ | mobile | 40.99 | edited on purpose: old map section replaced with the animated US map; testimonials: all 2 reviews shown side by side |
| /blog/how-long-does-a-roof-really-last/ | desktop | 0.04 | edited on purpose: 2 link(s) to city sub-sites removed |
| /blog/how-long-does-a-roof-really-last/ | mobile | 0.07 | edited on purpose: 2 link(s) to city sub-sites removed |
| /commercial-capabilities/ | desktop | 40.94 | edited on purpose: testimonials: all 2 reviews shown side by side; case-study picture: 8 links placed over its QR codes and listed below it |
| /commercial-capabilities/ | mobile | 77.61 | edited on purpose: testimonials: all 2 reviews shown side by side; case-study picture: 8 links placed over its QR codes and listed below it |
| /commerical-roofing/ | desktop | 13.95 | edited on purpose: old map section replaced with the animated US map; testimonials: all 2 reviews shown side by side |
| /commerical-roofing/ | mobile | 29.09 | edited on purpose: old map section replaced with the animated US map; testimonials: all 2 reviews shown side by side |
| /commerical-roofing/roof-replacement/ | desktop | 2.96 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /commerical-roofing/roof-replacement/ | mobile | 29.63 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /commerical-roofing/roof-types/ | desktop | 3.27 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /commerical-roofing/roof-types/ | mobile | 29.30 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /faqs/ | desktop | 15.99 | edited on purpose: old map section replaced with the animated US map |
| /faqs/ | mobile | 21.99 | edited on purpose: old map section replaced with the animated US map |
| /gutters/ | desktop | 31.31 | edited on purpose: old map section replaced with the animated US map |
| /gutters/ | mobile | 35.04 | edited on purpose: old map section replaced with the animated US map |
| /gutters/gutter-guards/ | desktop | 2.97 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /gutters/gutter-guards/ | mobile | 29.40 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /past-projects/ | desktop | 65.10 | edited on purpose: old map section replaced with the animated US map |
| /past-projects/ | mobile | 82.14 | edited on purpose: old map section replaced with the animated US map |
| /podcast/ | desktop | 22.00 | edited on purpose: old map section replaced with the animated US map; testimonials: all 2 reviews shown side by side |
| /podcast/ | mobile | 45.47 | edited on purpose: old map section replaced with the animated US map; testimonials: all 2 reviews shown side by side |
| /position-details/ | desktop | 0.46 | edited on purpose: job details page: "Failed to load job details." -> pointer to the open positions on /careers/ |
| /position-details/ | mobile | 5.85 | edited on purpose: job details page: "Failed to load job details." -> pointer to the open positions on /careers/ |
| /reviews/ | desktop | 19.99 | edited on purpose: old map section replaced with the animated US map |
| /reviews/ | mobile | 24.75 | edited on purpose: old map section replaced with the animated US map |
| /roofing-costs/ | desktop | 3.25 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /roofing-costs/ | mobile | 30.39 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /roofing/ | desktop | 21.65 | edited on purpose: old map section replaced with the animated US map; testimonials: all 2 reviews shown side by side |
| /roofing/ | mobile | 41.06 | edited on purpose: old map section replaced with the animated US map; testimonials: all 2 reviews shown side by side |
| /roofing/attic-insulation/ | desktop | 3.00 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /roofing/attic-insulation/ | mobile | 29.07 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /roofing/repairs/ | desktop | 1.54 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /roofing/repairs/ | mobile | 21.99 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /roofing/replacement/ | desktop | 2.98 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /roofing/replacement/ | mobile | 29.70 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /roofing/residential/ | desktop | 0.57 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /roofing/residential/ | mobile | 17.19 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /roofing/types/ | desktop | 1.37 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /roofing/types/ | mobile | 26.84 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /service-areas/ | desktop | 31.56 | edited on purpose: 17 link(s) to city sub-sites removed; old map section replaced with the animated US map; testimonials section removed |
| /service-areas/ | mobile | 29.69 | edited on purpose: 17 link(s) to city sub-sites removed; old map section replaced with the animated US map; testimonials section removed |
| /siding/ | desktop | 13.04 | edited on purpose: old map section replaced with the animated US map |
| /siding/ | mobile | 13.92 | edited on purpose: old map section replaced with the animated US map |
| /site-map/ | desktop | 37.54 | edited on purpose: 16 link(s) to city sub-sites removed |
| /site-map/ | mobile | 51.70 | edited on purpose: 16 link(s) to city sub-sites removed |
| /solar/ | desktop | 19.70 | edited on purpose: old map section replaced with the animated US map; testimonials: all 2 reviews shown side by side |
| /solar/ | mobile | 27.97 | edited on purpose: old map section replaced with the animated US map; testimonials: all 2 reviews shown side by side |
| /solar/gaf-solar-roof/ | desktop | 1.98 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /solar/gaf-solar-roof/ | mobile | 18.58 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /solar/solar-panel-installations/ | desktop | 1.97 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /solar/solar-panel-installations/ | mobile | 18.90 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /thank-you/ | desktop | 46.12 | edited on purpose: testimonials: all 2 reviews shown side by side |
| /thank-you/ | mobile | 44.78 | edited on purpose: testimonials: all 2 reviews shown side by side |

## All pages

| Page | Viewport | Page HTML | Live size | Local size | Diff % | Result |
| --- | --- | --- | --- | --- | --- | --- |
| / | desktop | as-delivered | 1440×7954 | 1440×8161 | 17.495 | EDITED |
| / | mobile | as-delivered | 390×14621 | 390×15087 | 16.663 | EDITED |
| /about/ | desktop | rendered | 1440×4672 | 1440×4869 | 20.504 | EDITED |
| /about/ | mobile | rendered | 390×7396 | 390×8405 | 40.992 | EDITED |
| /affirm-payment/ | desktop | rendered | 1440×900 | 1440×900 | 0.099 | PASS |
| /affirm-payment/ | mobile | rendered | 390×844 | 390×844 | 0.391 | PASS |
| /blog/ | desktop | rendered | 1440×3303 | 1440×3303 | 0.049 | PASS |
| /blog/ | mobile | rendered | 390×7720 | 390×7720 | 0.077 | PASS |
| /blog/10-questions-to-ask-before-signing-a-roof-replacement-contract/ | desktop | rendered | 1440×6632 | 1440×6632 | 0.024 | PASS |
| /blog/10-questions-to-ask-before-signing-a-roof-replacement-contract/ | mobile | rendered | 390×11643 | 390×11643 | 0.051 | PASS |
| /blog/15-questions-to-ask-before-you-hire-a-roofer/ | desktop | rendered | 1440×5700 | 1440×5700 | 0.028 | PASS |
| /blog/15-questions-to-ask-before-you-hire-a-roofer/ | mobile | rendered | 390×11471 | 390×11471 | 0.052 | PASS |
| /blog/5-benefits-of-hiring-a-professional-for-roof-replacement/ | desktop | rendered | 1440×3538 | 1440×3538 | 0.045 | PASS |
| /blog/5-benefits-of-hiring-a-professional-for-roof-replacement/ | mobile | rendered | 390×6733 | 390×6733 | 0.088 | PASS |
| /blog/5-benefits-of-replacing-your-roof-before-the-holidays/ | desktop | rendered | 1440×5351 | 1440×5351 | 0.030 | PASS |
| /blog/5-benefits-of-replacing-your-roof-before-the-holidays/ | mobile | rendered | 390×10138 | 390×10138 | 0.058 | PASS |
| /blog/5-signs-its-time-to-replace-your-roof-before-it-costs-you-more/ | desktop | rendered | 1440×5221 | 1440×5221 | 0.031 | PASS |
| /blog/5-signs-its-time-to-replace-your-roof-before-it-costs-you-more/ | mobile | rendered | 390×10203 | 390×10203 | 0.058 | PASS |
| /blog/actual-cash-value-vs-replacement-cost-how-your-roof-insurance-payout-is-calculated/ | desktop | rendered | 1440×5789 | 1440×5789 | 0.028 | PASS |
| /blog/actual-cash-value-vs-replacement-cost-how-your-roof-insurance-payout-is-calculated/ | mobile | rendered | 390×10845 | 390×10845 | 0.055 | PASS |
| /blog/adding-solar-to-your-mid-atlantic-home-what-to-know/ | desktop | rendered | 1440×3721 | 1440×3721 | 0.043 | PASS |
| /blog/adding-solar-to-your-mid-atlantic-home-what-to-know/ | mobile | rendered | 390×7425 | 390×7425 | 0.080 | PASS |
| /blog/are-skylights-for-you-and-your-roof/ | desktop | rendered | 1440×3378 | 1440×3378 | 0.048 | PASS |
| /blog/are-skylights-for-you-and-your-roof/ | mobile | rendered | 390×6302 | 390×6302 | 0.094 | PASS |
| /blog/beat-summer-energy-bills-cut-your-costs-by-90/ | desktop | rendered | 1440×4535 | 1440×4535 | 0.035 | PASS |
| /blog/beat-summer-energy-bills-cut-your-costs-by-90/ | mobile | rendered | 390×8312 | 390×8312 | 0.071 | PASS |
| /blog/beat-the-next-noreaster-why-scheduling-your-roof-replacement-before-deep-winter-saves-you-money/ | desktop | rendered | 1440×6011 | 1440×6011 | 0.027 | PASS |
| /blog/beat-the-next-noreaster-why-scheduling-your-roof-replacement-before-deep-winter-saves-you-money/ | mobile | rendered | 390×11119 | 390×11119 | 0.053 | PASS |
| /blog/before-school-starts-august-is-the-perfect-time-for-solar-roof-installation/ | desktop | rendered | 1440×6324 | 1440×6324 | 0.025 | PASS |
| /blog/before-school-starts-august-is-the-perfect-time-for-solar-roof-installation/ | mobile | rendered | 390×11847 | 390×11847 | 0.050 | PASS |
| /blog/best-exterior-upgrades-before-peak-summer-heat-roofing-and-siding-improvements-that-help-protect-your-home/ | desktop | rendered | 1440×11731 | 1440×11731 | 0.014 | PASS |
| /blog/best-exterior-upgrades-before-peak-summer-heat-roofing-and-siding-improvements-that-help-protect-your-home/ | mobile | rendered | 390×18328 | 390×18328 | 0.032 | PASS |
| /blog/best-time-to-go-solar-why-spring-is-a-smart-season-to-pair-roofing-and-solar-upgrades/ | desktop | rendered | 1440×4860 | 1440×4860 | 0.033 | PASS |
| /blog/best-time-to-go-solar-why-spring-is-a-smart-season-to-pair-roofing-and-solar-upgrades/ | mobile | rendered | 390×9777 | 390×9777 | 0.061 | PASS |
| /blog/can-you-repair-a-roof-in-freezing-weather-what-homeowners-need-to-know/ | desktop | rendered | 1440×6088 | 1440×6088 | 0.026 | PASS |
| /blog/can-you-repair-a-roof-in-freezing-weather-what-homeowners-need-to-know/ | mobile | rendered | 390×11716 | 390×11716 | 0.051 | PASS |
| /blog/can-you-replace-a-roof-in-the-winter-yes-but-heres-the-catch/ | desktop | rendered | 1440×5768 | 1440×5768 | 0.028 | PASS |
| /blog/can-you-replace-a-roof-in-the-winter-yes-but-heres-the-catch/ | mobile | rendered | 390×10496 | 390×10496 | 0.056 | PASS |
| /blog/commercial-roofing-industry-and-the-future/ | desktop | rendered | 1440×4996 | 1440×4996 | 0.032 | PASS |
| /blog/commercial-roofing-industry-and-the-future/ | mobile | rendered | 390×10673 | 390×10673 | 0.055 | PASS |
| /blog/denied-or-lowballed-how-panda-exteriors-helps-you-re-open-your-winter-roof-insurance-claim/ | desktop | rendered | 1440×5789 | 1440×5789 | 0.028 | PASS |
| /blog/denied-or-lowballed-how-panda-exteriors-helps-you-re-open-your-winter-roof-insurance-claim/ | mobile | rendered | 390×11161 | 390×11161 | 0.053 | PASS |
| /blog/do-you-need-a-new-roof/ | desktop | rendered | 1440×3334 | 1440×3334 | 0.048 | PASS |
| /blog/do-you-need-a-new-roof/ | mobile | rendered | 390×6083 | 390×6083 | 0.097 | PASS |
| /blog/does-homeowners-insurance-cover-roof-leaks-what-homeowners-need-to-know/ | desktop | rendered | 1440×6089 | 1440×6089 | 0.026 | PASS |
| /blog/does-homeowners-insurance-cover-roof-leaks-what-homeowners-need-to-know/ | mobile | rendered | 390×12103 | 390×12103 | 0.049 | PASS |
| /blog/does-your-roof-help-or-hurt-your-curb-appeal/ | desktop | rendered | 1440×3481 | 1440×3481 | 0.046 | PASS |
| /blog/does-your-roof-help-or-hurt-your-curb-appeal/ | mobile | rendered | 390×6687 | 390×6687 | 0.088 | PASS |
| /blog/freeze-thaw-damage-the-hidden-problem-after-cold-snaps/ | desktop | rendered | 1440×5627 | 1440×5627 | 0.029 | PASS |
| /blog/freeze-thaw-damage-the-hidden-problem-after-cold-snaps/ | mobile | rendered | 390×12270 | 390×12270 | 0.048 | PASS |
| /blog/from-emergency-tarp-to-full-replacement-turning-winter-roof-damage-into-a-long-term-upgrade/ | desktop | rendered | 1440×6784 | 1440×6784 | 0.024 | PASS |
| /blog/from-emergency-tarp-to-full-replacement-turning-winter-roof-damage-into-a-long-term-upgrade/ | mobile | rendered | 390×12627 | 390×12627 | 0.047 | PASS |
| /blog/gaf-solar-shingles-maintenance/ | desktop | rendered | 1440×7669 | 1440×7669 | 0.021 | PASS |
| /blog/gaf-solar-shingles-maintenance/ | mobile | rendered | 390×13227 | 390×13227 | 0.045 | PASS |
| /blog/gaf-timberline-solar-shingles-installation/ | desktop | rendered | 1440×5608 | 1440×5608 | 0.029 | PASS |
| /blog/gaf-timberline-solar-shingles-installation/ | mobile | rendered | 390×11014 | 390×11014 | 0.054 | PASS |
| /blog/gutters-after-winter-cleaning-realignment-and-downspout-flow-tests/ | desktop | rendered | 1440×5768 | 1440×5768 | 0.028 | PASS |
| /blog/gutters-after-winter-cleaning-realignment-and-downspout-flow-tests/ | mobile | rendered | 390×12001 | 390×12001 | 0.049 | PASS |
| /blog/gutters-after-winter-signs-its-time-for-repair-or-replacement/ | desktop | rendered | 1440×4852 | 1440×4852 | 0.033 | PASS |
| /blog/gutters-after-winter-signs-its-time-for-repair-or-replacement/ | mobile | rendered | 390×9994 | 390×9994 | 0.059 | PASS |
| /blog/home-exteriors-replacement-tips/ | desktop | rendered | 1440×3458 | 1440×3458 | 0.046 | PASS |
| /blog/home-exteriors-replacement-tips/ | mobile | rendered | 390×7061 | 390×7061 | 0.084 | PASS |
| /blog/how-a-new-roof-can-lower-your-heating-bills-this-winter/ | desktop | rendered | 1440×6026 | 1440×6026 | 0.027 | PASS |
| /blog/how-a-new-roof-can-lower-your-heating-bills-this-winter/ | mobile | rendered | 390×10838 | 390×10838 | 0.055 | PASS |
| /blog/how-did-solar-energy-become-so-cheap/ | desktop | rendered | 1440×3986 | 1440×3986 | 0.040 | PASS |
| /blog/how-did-solar-energy-become-so-cheap/ | mobile | rendered | 390×7972 | 390×7972 | 0.074 | PASS |
| /blog/how-hot-weather-affects-solar-roof-output/ | desktop | rendered | 1440×5452 | 1440×5452 | 0.029 | PASS |
| /blog/how-hot-weather-affects-solar-roof-output/ | mobile | rendered | 390×10865 | 390×10865 | 0.054 | PASS |
| /blog/how-long-do-you-have-to-file-a-roof-insurance-claim-after-a-storm/ | desktop | rendered | 1440×6552 | 1440×6552 | 0.025 | PASS |
| /blog/how-long-do-you-have-to-file-a-roof-insurance-claim-after-a-storm/ | mobile | rendered | 390×12552 | 390×12552 | 0.047 | PASS |
| /blog/how-long-does-a-roof-really-last/ | desktop | rendered | 1440×5754 | 1440×5754 | 0.036 | EDITED |
| /blog/how-long-does-a-roof-really-last/ | mobile | rendered | 390×10954 | 390×10954 | 0.069 | EDITED |
| /blog/how-summer-heat-damages-your-roof-shingle-curling-granule-loss-and-ventilation-warning-signs/ | desktop | rendered | 1440×8691 | 1440×8691 | 0.018 | PASS |
| /blog/how-summer-heat-damages-your-roof-shingle-curling-granule-loss-and-ventilation-warning-signs/ | mobile | rendered | 390×14996 | 390×14996 | 0.039 | PASS |
| /blog/how-to-budget-for-a-new-roof-without-the-sticker-shock/ | desktop | rendered | 1440×5816 | 1440×5816 | 0.028 | PASS |
| /blog/how-to-budget-for-a-new-roof-without-the-sticker-shock/ | mobile | rendered | 390×10974 | 390×10974 | 0.054 | PASS |
| /blog/how-to-choose-the-right-roofing-contractor/ | desktop | rendered | 1440×5205 | 1440×5205 | 0.031 | PASS |
| /blog/how-to-choose-the-right-roofing-contractor/ | mobile | rendered | 390×9285 | 390×9285 | 0.064 | PASS |
| /blog/how-to-clean-solar-panels-and-shingles/ | desktop | rendered | 1440×6106 | 1440×6106 | 0.026 | PASS |
| /blog/how-to-clean-solar-panels-and-shingles/ | mobile | rendered | 390×10203 | 390×10203 | 0.058 | PASS |
| /blog/how-we-were-able-to-rank-50-nationwide-as-the-fastest-growing-company-by-inc-5000/ | desktop | rendered | 1440×3691 | 1440×3691 | 0.043 | PASS |
| /blog/how-we-were-able-to-rank-50-nationwide-as-the-fastest-growing-company-by-inc-5000/ | mobile | rendered | 390×7347 | 390×7347 | 0.081 | PASS |
| /blog/ice-dams-101-what-they-are-and-how-to-stop-them/ | desktop | rendered | 1440×5084 | 1440×5084 | 0.075 | PASS |
| /blog/ice-dams-101-what-they-are-and-how-to-stop-them/ | mobile | rendered | 390×10551 | 390×10551 | 0.056 | PASS |
| /blog/insurance-paid-roof-replacements-a-simple-guide-for-wind-hail-and-ice-damage-claims/ | desktop | rendered | 1440×6508 | 1440×6508 | 0.025 | PASS |
| /blog/insurance-paid-roof-replacements-a-simple-guide-for-wind-hail-and-ice-damage-claims/ | mobile | rendered | 390×12219 | 390×12219 | 0.048 | PASS |
| /blog/insurance-roofing-in-spring-the-homeowners-field-guide-to-wind-and-hail-claims/ | desktop | rendered | 1440×4775 | 1440×4775 | 0.034 | PASS |
| /blog/insurance-roofing-in-spring-the-homeowners-field-guide-to-wind-and-hail-claims/ | mobile | rendered | 390×9968 | 390×9968 | 0.059 | PASS |
| /blog/is-it-safe-to-install-a-new-roof-in-the-winter-myths-vs-facts/ | desktop | rendered | 1440×3937 | 1440×3937 | 0.041 | PASS |
| /blog/is-it-safe-to-install-a-new-roof-in-the-winter-myths-vs-facts/ | mobile | rendered | 390×7971 | 390×7971 | 0.074 | PASS |
| /blog/is-your-attic-costing-you-money-this-spring-how-insulation-affects-roof-health-and-energy-bills/ | desktop | rendered | 1440×4715 | 1440×4715 | 0.034 | PASS |
| /blog/is-your-attic-costing-you-money-this-spring-how-insulation-affects-roof-health-and-energy-bills/ | mobile | rendered | 390×9570 | 390×9570 | 0.062 | PASS |
| /blog/is-your-roof-ready-for-snow-how-to-prepare-before-the-first-flake-falls/ | desktop | rendered | 1440×5313 | 1440×5313 | 0.030 | PASS |
| /blog/is-your-roof-ready-for-snow-how-to-prepare-before-the-first-flake-falls/ | mobile | rendered | 390×9931 | 390×9931 | 0.060 | PASS |
| /blog/is-your-siding-fading-from-sun-exposure-when-summer-uv-damage-means-its-time-to-replace/ | desktop | rendered | 1440×10969 | 1440×10969 | 0.015 | PASS |
| /blog/is-your-siding-fading-from-sun-exposure-when-summer-uv-damage-means-its-time-to-replace/ | mobile | rendered | 390×17921 | 390×17921 | 0.033 | PASS |
| /blog/offer/10-off-roof-replacement/ | desktop | rendered | 1440×2467 | 1440×2467 | 0.065 | PASS |
| /blog/offer/10-off-roof-replacement/ | mobile | rendered | 390×4302 | 390×4302 | 0.138 | PASS |
| /blog/offer/1500-off-solar-project/ | desktop | rendered | 1440×2346 | 1440×2346 | 0.068 | PASS |
| /blog/offer/1500-off-solar-project/ | mobile | rendered | 390×4050 | 390×4050 | 0.146 | PASS |
| /blog/offer/find-out-about-our-no-interest-financial-options/ | desktop | rendered | 1440×2909 | 1440×2909 | 0.055 | PASS |
| /blog/offer/find-out-about-our-no-interest-financial-options/ | mobile | rendered | 390×5302 | 390×5302 | 0.112 | PASS |
| /blog/offer/our-installation-work-is-completed-by-certified-professionals/ | desktop | rendered | 1440×2497 | 1440×2497 | 0.064 | PASS |
| /blog/offer/our-installation-work-is-completed-by-certified-professionals/ | mobile | rendered | 390×4639 | 390×4639 | 0.128 | PASS |
| /blog/offer/professional-remodels-backed-by-a-100-satisfaction-guarantee/ | desktop | rendered | 1440×2895 | 1440×2895 | 0.055 | PASS |
| /blog/offer/professional-remodels-backed-by-a-100-satisfaction-guarantee/ | mobile | rendered | 390×5579 | 390×5579 | 0.106 | PASS |
| /blog/often-overlooked-roofing-issues-and-items/ | desktop | rendered | 1440×3626 | 1440×3626 | 0.044 | PASS |
| /blog/often-overlooked-roofing-issues-and-items/ | mobile | rendered | 390×7161 | 390×7161 | 0.083 | PASS |
| /blog/page/10/ | desktop | rendered | 1440×3247 | 1440×3247 | 0.049 | PASS |
| /blog/page/10/ | mobile | rendered | 390×7536 | 390×7536 | 0.079 | PASS |
| /blog/page/11/ | desktop | rendered | 1440×3239 | 1440×3239 | 0.050 | PASS |
| /blog/page/11/ | mobile | rendered | 390×7280 | 390×7280 | 0.081 | PASS |
| /blog/page/12/ | desktop | rendered | 1440×3159 | 1440×3159 | 0.051 | PASS |
| /blog/page/12/ | mobile | rendered | 390×7120 | 390×7120 | 0.083 | PASS |
| /blog/page/13/ | desktop | rendered | 1440×3111 | 1440×3111 | 0.052 | PASS |
| /blog/page/13/ | mobile | rendered | 390×7120 | 390×7120 | 0.083 | PASS |
| /blog/page/14/ | desktop | rendered | 1440×3063 | 1440×3063 | 0.052 | PASS |
| /blog/page/14/ | mobile | rendered | 390×6904 | 390×6904 | 0.086 | PASS |
| /blog/page/15/ | desktop | rendered | 1440×3199 | 1440×3199 | 0.050 | PASS |
| /blog/page/15/ | mobile | rendered | 390×7104 | 390×7104 | 0.083 | PASS |
| /blog/page/16/ | desktop | rendered | 1440×2507 | 1440×2507 | 0.064 | PASS |
| /blog/page/16/ | mobile | rendered | 390×4664 | 390×4664 | 0.127 | PASS |
| /blog/page/2/ | desktop | rendered | 1440×3311 | 1440×3311 | 0.048 | PASS |
| /blog/page/2/ | mobile | rendered | 390×7624 | 390×7624 | 0.078 | PASS |
| /blog/page/3/ | desktop | rendered | 1440×3271 | 1440×3271 | 0.049 | PASS |
| /blog/page/3/ | mobile | rendered | 390×7592 | 390×7592 | 0.078 | PASS |
| /blog/page/4/ | desktop | rendered | 1440×3303 | 1440×3303 | 0.049 | PASS |
| /blog/page/4/ | mobile | rendered | 390×7712 | 390×7712 | 0.077 | PASS |
| /blog/page/5/ | desktop | rendered | 1440×3279 | 1440×3279 | 0.049 | PASS |
| /blog/page/5/ | mobile | rendered | 390×7624 | 390×7624 | 0.078 | PASS |
| /blog/page/6/ | desktop | rendered | 1440×3255 | 1440×3255 | 0.049 | PASS |
| /blog/page/6/ | mobile | rendered | 390×7624 | 390×7624 | 0.078 | PASS |
| /blog/page/7/ | desktop | rendered | 1440×3263 | 1440×3263 | 0.049 | PASS |
| /blog/page/7/ | mobile | rendered | 390×7600 | 390×7600 | 0.078 | PASS |
| /blog/page/8/ | desktop | rendered | 1440×3295 | 1440×3295 | 0.049 | PASS |
| /blog/page/8/ | mobile | rendered | 390×7544 | 390×7544 | 0.078 | PASS |
| /blog/page/9/ | desktop | rendered | 1440×3295 | 1440×3295 | 0.049 | PASS |
| /blog/page/9/ | mobile | rendered | 390×7776 | 390×7776 | 0.076 | PASS |
| /blog/project/brookfield-properties/ | desktop | rendered | 1440×3052 | 1440×3052 | 0.029 | PASS |
| /blog/project/brookfield-properties/ | mobile | rendered | 390×3815 | 390×3815 | 0.087 | PASS |
| /blog/project/bylt-restoration/ | desktop | rendered | 1440×1062 | 1440×1062 | 0.084 | PASS |
| /blog/project/bylt-restoration/ | mobile | rendered | 390×1612 | 390×1612 | 0.205 | PASS |
| /blog/project/chapel-branch-apartments/ | desktop | rendered | 1440×3930 | 1440×3930 | 0.023 | PASS |
| /blog/project/chapel-branch-apartments/ | mobile | rendered | 390×4624 | 390×4624 | 0.071 | PASS |
| /blog/project/enterprise-rent-a-car/ | desktop | rendered | 1440×1062 | 1440×1062 | 0.084 | PASS |
| /blog/project/enterprise-rent-a-car/ | mobile | rendered | 390×1612 | 390×1612 | 0.205 | PASS |
| /blog/project/expert-tpo-roofing/ | desktop | rendered | 1440×3504 | 1440×3504 | 0.026 | PASS |
| /blog/project/expert-tpo-roofing/ | mobile | rendered | 390×4318 | 390×4318 | 0.076 | PASS |
| /blog/project/linear-accelerator-roof-replacement/ | desktop | rendered | 1440×3930 | 1440×3930 | 0.023 | PASS |
| /blog/project/linear-accelerator-roof-replacement/ | mobile | rendered | 390×4624 | 390×4624 | 0.071 | PASS |
| /blog/project/panda-ext-11425/ | desktop | rendered | 1440×2420 | 1440×2420 | 0.037 | PASS |
| /blog/project/panda-ext-11425/ | mobile | rendered | 390×2970 | 390×2970 | 0.111 | PASS |
| /blog/project/panda-ext-11531/ | desktop | rendered | 1440×2420 | 1440×2420 | 0.037 | PASS |
| /blog/project/panda-ext-11531/ | mobile | rendered | 390×2970 | 390×2970 | 0.111 | PASS |
| /blog/project/panda-ext-14098/ | desktop | rendered | 1440×2420 | 1440×2420 | 0.037 | PASS |
| /blog/project/panda-ext-14098/ | mobile | rendered | 390×2970 | 390×2970 | 0.111 | PASS |
| /blog/project/panda-ext-14513/ | desktop | rendered | 1440×2420 | 1440×2420 | 0.037 | PASS |
| /blog/project/panda-ext-14513/ | mobile | rendered | 390×2970 | 390×2970 | 0.111 | PASS |
| /blog/project/panda-ext-14532/ | desktop | rendered | 1440×2420 | 1440×2420 | 0.037 | PASS |
| /blog/project/panda-ext-14532/ | mobile | rendered | 390×2970 | 390×2970 | 0.121 | PASS |
| /blog/project/panda-ext-15321/ | desktop | rendered | 1440×3919 | 1440×3919 | 0.469 | PASS |
| /blog/project/panda-ext-15321/ | mobile | rendered | 390×4426 | 390×4426 | 0.075 | PASS |
| /blog/project/panda-exteriors-hq/ | desktop | rendered | 1440×2795 | 1440×2795 | 0.032 | PASS |
| /blog/project/panda-exteriors-hq/ | mobile | rendered | 390×2942 | 390×2942 | 0.159 | PASS |
| /blog/project/roof-replacement-2/ | desktop | rendered | 1440×2894 | 1440×2894 | 0.031 | PASS |
| /blog/project/roof-replacement-2/ | mobile | rendered | 390×3444 | 390×3444 | 0.096 | PASS |
| /blog/project/roof-replacement-3/ | desktop | rendered | 1440×4316 | 1440×4316 | 0.021 | PASS |
| /blog/project/roof-replacement-3/ | mobile | rendered | 390×4866 | 390×4866 | 0.068 | PASS |
| /blog/project/roof-replacement-gutter-guards/ | desktop | rendered | 1440×3368 | 1440×3368 | 0.027 | PASS |
| /blog/project/roof-replacement-gutter-guards/ | mobile | rendered | 390×3918 | 390×3918 | 0.084 | PASS |
| /blog/project/roof-replacement/ | desktop | rendered | 1440×4316 | 1440×4316 | 0.021 | PASS |
| /blog/project/roof-replacement/ | mobile | rendered | 390×4866 | 390×4866 | 0.068 | PASS |
| /blog/project/sbs-siding/ | desktop | rendered | 1440×1062 | 1440×1062 | 0.084 | PASS |
| /blog/project/sbs-siding/ | mobile | rendered | 390×1612 | 390×1612 | 0.205 | PASS |
| /blog/project/spanish-tile/ | desktop | rendered | 1440×3368 | 1440×3368 | 0.027 | PASS |
| /blog/project/spanish-tile/ | mobile | rendered | 390×3918 | 390×3918 | 0.084 | PASS |
| /blog/quarterly-inspection/ | desktop | rendered | 1440×3487 | 1440×3487 | 0.046 | PASS |
| /blog/quarterly-inspection/ | mobile | rendered | 390×6553 | 390×6553 | 0.090 | PASS |
| /blog/repair-or-replace-how-to-decide-after-a-winter-storm-beats-up-your-roof/ | desktop | rendered | 1440×6338 | 1440×6338 | 0.025 | PASS |
| /blog/repair-or-replace-how-to-decide-after-a-winter-storm-beats-up-your-roof/ | mobile | rendered | 390×12685 | 390×12685 | 0.047 | PASS |
| /blog/repair-vs-replace-after-a-storm-the-spring-decision-matrix-insurers-use-and-how-to-tell-what-your-roof-actually-needs/ | desktop | rendered | 1440×5146 | 1440×5146 | 0.031 | PASS |
| /blog/repair-vs-replace-after-a-storm-the-spring-decision-matrix-insurers-use-and-how-to-tell-what-your-roof-actually-needs/ | mobile | rendered | 390×10926 | 390×10926 | 0.054 | PASS |
| /blog/replacing-a-roof-in-2024/ | desktop | rendered | 1440×4025 | 1440×4025 | 0.040 | PASS |
| /blog/replacing-a-roof-in-2024/ | mobile | rendered | 390×7462 | 390×7462 | 0.079 | PASS |
| /blog/replacing-your-roof-with-gaf-timberline-solar-shingles/ | desktop | rendered | 1440×6125 | 1440×6125 | 0.026 | PASS |
| /blog/replacing-your-roof-with-gaf-timberline-solar-shingles/ | mobile | rendered | 390×10273 | 390×10273 | 0.058 | PASS |
| /blog/roof-flashing-repair/ | desktop | rendered | 1440×3651 | 1440×3651 | 0.044 | PASS |
| /blog/roof-flashing-repair/ | mobile | rendered | 390×6924 | 390×6924 | 0.085 | PASS |
| /blog/roof-insurance-deductibles-explained-what-will-you-pay-after-storm-damage/ | desktop | rendered | 1440×6488 | 1440×6488 | 0.025 | PASS |
| /blog/roof-insurance-deductibles-explained-what-will-you-pay-after-storm-damage/ | mobile | rendered | 390×12319 | 390×12319 | 0.048 | PASS |
| /blog/roof-leak-season-is-here-why-spring-rain-exposes-hidden-winter-damage/ | desktop | rendered | 1440×4876 | 1440×4876 | 0.033 | PASS |
| /blog/roof-leak-season-is-here-why-spring-rain-exposes-hidden-winter-damage/ | mobile | rendered | 390×9407 | 390×9407 | 0.063 | PASS |
| /blog/roof-repair-or-replace/ | desktop | as-delivered | 1440×5508 | 1440×5508 | 0.029 | PASS |
| /blog/roof-repair-or-replace/ | mobile | as-delivered | 390×10788 | 390×10788 | 0.055 | PASS |
| /blog/roof-replacement-timeline/ | desktop | rendered | 1440×6169 | 1440×6169 | 0.026 | PASS |
| /blog/roof-replacement-timeline/ | mobile | rendered | 390×11519 | 390×11519 | 0.051 | PASS |
| /blog/seasonal-roof-maintenance-tips-for-every-time-of-year/ | desktop | rendered | 1440×3260 | 1440×3260 | 0.049 | PASS |
| /blog/seasonal-roof-maintenance-tips-for-every-time-of-year/ | mobile | rendered | 390×6292 | 390×6292 | 0.094 | PASS |
| /blog/shielding-new-jersey-homes-the-essential-role-of-quality-roof-replacement-in-extreme-weather-preparedness/ | desktop | rendered | 1440×3640 | 1440×3640 | 0.044 | PASS |
| /blog/shielding-new-jersey-homes-the-essential-role-of-quality-roof-replacement-in-extreme-weather-preparedness/ | mobile | rendered | 390×6857 | 390×6857 | 0.086 | PASS |
| /blog/should-you-repair-or-replace-your-roof-after-a-spring-storm/ | desktop | rendered | 1440×4731 | 1440×4731 | 0.034 | PASS |
| /blog/should-you-repair-or-replace-your-roof-after-a-spring-storm/ | mobile | rendered | 390×9505 | 390×9505 | 0.062 | PASS |
| /blog/siding-and-exterior-cleaning-the-safe-way-to-remove-algae-mildew-and-pollen/ | desktop | rendered | 1440×6164 | 1440×6164 | 0.026 | PASS |
| /blog/siding-and-exterior-cleaning-the-safe-way-to-remove-algae-mildew-and-pollen/ | mobile | rendered | 390×12382 | 390×12382 | 0.048 | PASS |
| /blog/signs-you-need-attic-insulation/ | desktop | rendered | 1440×3669 | 1440×3669 | 0.044 | PASS |
| /blog/signs-you-need-attic-insulation/ | mobile | rendered | 390×6864 | 390×6864 | 0.086 | PASS |
| /blog/solar-financing-gaf-solar-shingles/ | desktop | rendered | 1440×5708 | 1440×5708 | 0.028 | PASS |
| /blog/solar-financing-gaf-solar-shingles/ | mobile | rendered | 390×10711 | 390×10711 | 0.055 | PASS |
| /blog/solar-roof-inspection-summer-maintenance-for-maximum-performance/ | desktop | rendered | 1440×6241 | 1440×6241 | 0.026 | PASS |
| /blog/solar-roof-inspection-summer-maintenance-for-maximum-performance/ | mobile | rendered | 390×11656 | 390×11656 | 0.051 | PASS |
| /blog/solar-shingles-vs-traditional-solar-panels/ | desktop | rendered | 1440×6702 | 1440×6702 | 0.024 | PASS |
| /blog/solar-shingles-vs-traditional-solar-panels/ | mobile | rendered | 390×12173 | 390×12173 | 0.049 | PASS |
| /blog/spring-exterior-refresh-when-to-replace-siding-roofing-and-gutters-together/ | desktop | rendered | 1440×4796 | 1440×4796 | 0.033 | PASS |
| /blog/spring-exterior-refresh-when-to-replace-siding-roofing-and-gutters-together/ | mobile | rendered | 390×9597 | 390×9597 | 0.062 | PASS |
| /blog/spring-is-a-great-season-for-roof-inspections/ | desktop | rendered | 1440×3432 | 1440×3432 | 0.047 | PASS |
| /blog/spring-is-a-great-season-for-roof-inspections/ | mobile | rendered | 390×6437 | 390×6437 | 0.092 | PASS |
| /blog/spring-leak-map-how-to-spot-the-failure-points-before-they-become-interior-damage/ | desktop | rendered | 1440×6918 | 1440×6918 | 0.023 | PASS |
| /blog/spring-leak-map-how-to-spot-the-failure-points-before-they-become-interior-damage/ | mobile | rendered | 390×13084 | 390×13084 | 0.045 | PASS |
| /blog/spring-rain-leak-season-why-roof-leaks-show-up-in-march-and-april/ | desktop | rendered | 1440×6809 | 1440×6809 | 0.024 | PASS |
| /blog/spring-rain-leak-season-why-roof-leaks-show-up-in-march-and-april/ | mobile | rendered | 390×12321 | 390×12321 | 0.048 | PASS |
| /blog/spring-roof-inspection-checklist-9-problems-homeowners-miss-after-winter/ | desktop | rendered | 1440×4772 | 1440×4772 | 0.034 | PASS |
| /blog/spring-roof-inspection-checklist-9-problems-homeowners-miss-after-winter/ | mobile | rendered | 390×9653 | 390×9653 | 0.061 | PASS |
| /blog/storm-just-hit-what-to-do-in-the-first-24-hours-if-you-suspect-roof-damage/ | desktop | rendered | 1440×6278 | 1440×6278 | 0.026 | PASS |
| /blog/storm-just-hit-what-to-do-in-the-first-24-hours-if-you-suspect-roof-damage/ | mobile | rendered | 390×11109 | 390×11109 | 0.053 | PASS |
| /blog/storm-proofing-how-gaf-solar-shingles-handle-severe-weather/ | desktop | rendered | 1440×5023 | 1440×5023 | 0.032 | PASS |
| /blog/storm-proofing-how-gaf-solar-shingles-handle-severe-weather/ | mobile | rendered | 390×9807 | 390×9807 | 0.060 | PASS |
| /blog/summer-siding-problems-homeowners-ignore-warping-fading-cracking-and-loose-panels/ | desktop | rendered | 1440×10464 | 1440×10464 | 0.015 | PASS |
| /blog/summer-siding-problems-homeowners-ignore-warping-fading-cracking-and-loose-panels/ | mobile | rendered | 390×17024 | 390×17024 | 0.035 | PASS |
| /blog/the-components-of-a-roof-replacement/ | desktop | rendered | 1440×3756 | 1440×3756 | 0.043 | PASS |
| /blog/the-components-of-a-roof-replacement/ | mobile | rendered | 390×7096 | 390×7096 | 0.083 | PASS |
| /blog/the-end-of-winter-roof-survival-checklist/ | desktop | rendered | 1440×5358 | 1440×5358 | 0.030 | PASS |
| /blog/the-end-of-winter-roof-survival-checklist/ | mobile | rendered | 390×11123 | 390×11123 | 0.053 | PASS |
| /blog/the-greatness-of-gutters/ | desktop | rendered | 1440×3486 | 1440×3486 | 0.046 | PASS |
| /blog/the-greatness-of-gutters/ | mobile | rendered | 390×6630 | 390×6630 | 0.089 | PASS |
| /blog/the-role-of-solar-panels-in-reducing-peak-electricity-demand/ | desktop | rendered | 1440×3742 | 1440×3742 | 0.043 | PASS |
| /blog/the-role-of-solar-panels-in-reducing-peak-electricity-demand/ | mobile | rendered | 390×7211 | 390×7211 | 0.082 | PASS |
| /blog/the-top-5-benefits-of-solar-panels-for-homeowners/ | desktop | rendered | 1440×4185 | 1440×4185 | 0.038 | PASS |
| /blog/the-top-5-benefits-of-solar-panels-for-homeowners/ | mobile | rendered | 390×8755 | 390×8755 | 0.068 | PASS |
| /blog/understanding-roof-warranties-whats-covered-and-whats-not/ | desktop | rendered | 1440×6304 | 1440×6304 | 0.025 | PASS |
| /blog/understanding-roof-warranties-whats-covered-and-whats-not/ | mobile | rendered | 390×11858 | 390×11858 | 0.050 | PASS |
| /blog/what-are-ice-dams-and-how-can-they-damage-my-roof-this-february/ | desktop | rendered | 1440×4094 | 1440×4094 | 0.039 | PASS |
| /blog/what-are-ice-dams-and-how-can-they-damage-my-roof-this-february/ | mobile | rendered | 390×7500 | 390×7500 | 0.079 | PASS |
| /blog/what-cold-weather-does-to-a-failing-roof-and-how-to-avoid-it/ | desktop | rendered | 1440×5521 | 1440×5521 | 0.029 | PASS |
| /blog/what-cold-weather-does-to-a-failing-roof-and-how-to-avoid-it/ | mobile | rendered | 390×10655 | 390×10655 | 0.056 | PASS |
| /blog/what-is-a-roofing-insurance-supplement-and-why-might-your-claim-need-one/ | desktop | rendered | 1440×5489 | 1440×5489 | 0.029 | PASS |
| /blog/what-is-a-roofing-insurance-supplement-and-why-might-your-claim-need-one/ | mobile | rendered | 390×11003 | 390×11003 | 0.054 | PASS |
| /blog/what-questions-should-i-ask-a-roofing-contractor/ | desktop | rendered | 1440×3928 | 1440×3928 | 0.041 | PASS |
| /blog/what-questions-should-i-ask-a-roofing-contractor/ | mobile | rendered | 390×7338 | 390×7338 | 0.081 | PASS |
| /blog/when-the-sun-shines-we-shine-together-your-reasons-to-go-solar-part-1-3/ | desktop | rendered | 1440×3594 | 1440×3594 | 0.045 | PASS |
| /blog/when-the-sun-shines-we-shine-together-your-reasons-to-go-solar-part-1-3/ | mobile | rendered | 390×7169 | 390×7169 | 0.083 | PASS |
| /blog/when-the-sun-shines-we-shine-together-your-reasons-to-go-solar-part-2-3/ | desktop | rendered | 1440×3492 | 1440×3492 | 0.046 | PASS |
| /blog/when-the-sun-shines-we-shine-together-your-reasons-to-go-solar-part-2-3/ | mobile | rendered | 390×6959 | 390×6959 | 0.085 | PASS |
| /blog/when-the-sun-shines-we-shine-together-your-reasons-to-go-solar-part-3-3/ | desktop | rendered | 1440×3746 | 1440×3746 | 0.043 | PASS |
| /blog/when-the-sun-shines-we-shine-together-your-reasons-to-go-solar-part-3-3/ | mobile | rendered | 390×7912 | 390×7912 | 0.075 | PASS |
| /blog/why-fall-2024-is-the-best-time-to-combine-roof-upgrades-with-solar-installation-in-the-mid-atlantic/ | desktop | rendered | 1440×3945 | 1440×3945 | 0.041 | PASS |
| /blog/why-fall-2024-is-the-best-time-to-combine-roof-upgrades-with-solar-installation-in-the-mid-atlantic/ | mobile | rendered | 390×8213 | 390×8213 | 0.072 | PASS |
| /blog/why-fall-is-the-best-season-to-replace-your-roof/ | desktop | rendered | 1440×4964 | 1440×4964 | 0.032 | PASS |
| /blog/why-fall-is-the-best-season-to-replace-your-roof/ | mobile | rendered | 390×10002 | 390×10002 | 0.059 | PASS |
| /blog/why-your-upstairs-gets-so-hot-in-summer-the-connection-between-roofing-ventilation-and-exterior-materials/ | desktop | rendered | 1440×9272 | 1440×9272 | 0.017 | PASS |
| /blog/why-your-upstairs-gets-so-hot-in-summer-the-connection-between-roofing-ventilation-and-exterior-materials/ | mobile | rendered | 390×16098 | 390×16098 | 0.037 | PASS |
| /blog/wind-and-hail-prep-what-to-fix-now-before-the-next-storm/ | desktop | rendered | 1440×6387 | 1440×6387 | 0.025 | PASS |
| /blog/wind-and-hail-prep-what-to-fix-now-before-the-next-storm/ | mobile | rendered | 390×13263 | 390×13263 | 0.045 | PASS |
| /blog/winter-proof-your-home-roof-gutters-and-attic-upgrades-that-stop-ice-dams-and-heat-loss/ | desktop | rendered | 1440×6163 | 1440×6163 | 0.026 | PASS |
| /blog/winter-proof-your-home-roof-gutters-and-attic-upgrades-that-stop-ice-dams-and-heat-loss/ | mobile | rendered | 390×11919 | 390×11919 | 0.050 | PASS |
| /blog/winter-ready-roofs-why-every-roof-needs-a-tune-up-before-first-freeze/ | desktop | rendered | 1440×5228 | 1440×5228 | 0.031 | PASS |
| /blog/winter-ready-roofs-why-every-roof-needs-a-tune-up-before-first-freeze/ | mobile | rendered | 390×10231 | 390×10231 | 0.058 | PASS |
| /blog/winter-roof-repair-checklist-9-small-issues-to-fix-before-they-turn-into-big-leaks/ | desktop | rendered | 1440×5107 | 1440×5107 | 0.031 | PASS |
| /blog/winter-roof-repair-checklist-9-small-issues-to-fix-before-they-turn-into-big-leaks/ | mobile | rendered | 390×9833 | 390×9833 | 0.060 | PASS |
| /blog/winter-roof-replacement/ | desktop | rendered | 1440×3115 | 1440×3115 | 0.052 | PASS |
| /blog/winter-roof-replacement/ | mobile | rendered | 390×6040 | 390×6040 | 0.098 | PASS |
| /blog/yes-you-can-replace-your-roof-in-winter-pros-cons-and-how-panda-exteriors-makes-it-work/ | desktop | rendered | 1440×6329 | 1440×6329 | 0.025 | PASS |
| /blog/yes-you-can-replace-your-roof-in-winter-pros-cons-and-how-panda-exteriors-makes-it-work/ | mobile | rendered | 390×12616 | 390×12616 | 0.047 | PASS |
| /careers/ | desktop | rendered | 1440×9283 | 1440×9283 | 0.010 | PASS |
| /careers/ | mobile | rendered | 390×15178 | 390×15178 | 0.027 | PASS |
| /charity-and-community/ | desktop | rendered | 1440×3633 | 1440×3633 | 0.025 | PASS |
| /charity-and-community/ | mobile | rendered | 390×6930 | 390×6930 | 0.048 | PASS |
| /commercial-capabilities/ | desktop | rendered | 1934×4788 | 1440×4915 | 40.938 | EDITED |
| /commercial-capabilities/ | mobile | rendered | 1934×4843 | 390×5788 | 77.615 | EDITED |
| /commerical-roofing/ | desktop | rendered | 1440×6847 | 1440×7045 | 13.948 | EDITED |
| /commerical-roofing/ | mobile | rendered | 390×11065 | 390×12074 | 29.086 | EDITED |
| /commerical-roofing/roof-replacement/ | desktop | rendered | 1440×3756 | 1440×3746 | 2.958 | EDITED |
| /commerical-roofing/roof-replacement/ | mobile | rendered | 390×6685 | 390×7228 | 29.633 | EDITED |
| /commerical-roofing/roof-types/ | desktop | rendered | 1440×3788 | 1440×3778 | 3.273 | EDITED |
| /commerical-roofing/roof-types/ | mobile | rendered | 390×6768 | 390×7311 | 29.301 | EDITED |
| /contact-us/ | desktop | rendered | 1440×2275 | 1440×2275 | 0.042 | PASS |
| /contact-us/ | mobile | rendered | 390×4723 | 390×4723 | 0.073 | PASS |
| /customer-service/ | desktop | rendered | 1440×1395 | 1440×1395 | 0.064 | PASS |
| /customer-service/ | mobile | rendered | 390×2875 | 390×2875 | 0.115 | PASS |
| /faqs/ | desktop | rendered | 1440×4831 | 1440×5039 | 15.989 | EDITED |
| /faqs/ | mobile | rendered | 390×6163 | 390×6628 | 21.995 | EDITED |
| /gallery/ | desktop | rendered | 1440×3267 | 1440×3267 | 0.501 | PASS |
| /gallery/ | mobile | rendered | 390×1943 | 390×1943 | 0.170 | PASS |
| /gutters/ | desktop | rendered | 1440×5231 | 1440×5439 | 31.313 | EDITED |
| /gutters/ | mobile | rendered | 390×8639 | 390×9105 | 35.035 | EDITED |
| /gutters/gutter-guards/ | desktop | rendered | 1440×3733 | 1440×3723 | 2.972 | EDITED |
| /gutters/gutter-guards/ | mobile | rendered | 390×6743 | 390×7286 | 29.401 | EDITED |
| /offers/ | desktop | rendered | 1440×3944 | 1440×3944 | 0.041 | PASS |
| /offers/ | mobile | rendered | 390×6145 | 390×6145 | 0.096 | PASS |
| /pandav1-capture-404-check/ | desktop | rendered | 1440×900 | 1440×900 | 0.099 | PASS |
| /pandav1-capture-404-check/ | mobile | rendered | 390×844 | 390×844 | 0.391 | PASS |
| /past-projects/ | desktop | rendered | 1440×2768 | 1440×4213 | 65.104 | EDITED |
| /past-projects/ | mobile | rendered | 390×4259 | 390×10160 | 82.136 | EDITED |
| /podcast/ | desktop | rendered | 1440×4336 | 1440×4534 | 22.005 | EDITED |
| /podcast/ | mobile | rendered | 390×6562 | 390×7571 | 45.472 | EDITED |
| /position-details/ | desktop | rendered | 1440×919 | 1440×919 | 0.460 | EDITED |
| /position-details/ | mobile | rendered | 390×844 | 390×844 | 5.845 | EDITED |
| /privacy-policy/ | desktop | rendered | 1440×2690 | 1440×2690 | 0.033 | PASS |
| /privacy-policy/ | mobile | rendered | 390×5529 | 390×5529 | 0.060 | PASS |
| /referral/ | desktop | rendered | 1440×2062 | 1440×2062 | 0.047 | PASS |
| /referral/ | mobile | rendered | 390×2860 | 390×2860 | 0.124 | PASS |
| /referrals/ | desktop | rendered | 1440×900 | 1440×900 | 0.099 | PASS |
| /referrals/ | mobile | rendered | 390×1149 | 390×1149 | 0.287 | PASS |
| /reviews/ | desktop | rendered | 1440×3965 | 1440×4172 | 19.988 | EDITED |
| /reviews/ | mobile | rendered | 390×6009 | 390×6475 | 24.745 | EDITED |
| /roofing-costs/ | desktop | rendered | 1440×3817 | 1440×3807 | 3.248 | EDITED |
| /roofing-costs/ | mobile | rendered | 390×6505 | 390×7048 | 30.394 | EDITED |
| /roofing/ | desktop | rendered | 1440×7189 | 1440×7386 | 21.651 | EDITED |
| /roofing/ | mobile | rendered | 390×11215 | 390×12266 | 41.056 | EDITED |
| /roofing/attic-insulation/ | desktop | rendered | 1440×3701 | 1440×3691 | 2.999 | EDITED |
| /roofing/attic-insulation/ | mobile | rendered | 390×6821 | 390×7364 | 29.071 | EDITED |
| /roofing/repairs/ | desktop | rendered | 1440×3778 | 1440×3768 | 1.545 | EDITED |
| /roofing/repairs/ | mobile | rendered | 390×6891 | 390×7434 | 21.992 | EDITED |
| /roofing/replacement/ | desktop | rendered | 1440×3718 | 1440×3708 | 2.984 | EDITED |
| /roofing/replacement/ | mobile | rendered | 390×6665 | 390×7208 | 29.700 | EDITED |
| /roofing/residential/ | desktop | rendered | 1440×5562 | 1440×5552 | 0.568 | EDITED |
| /roofing/residential/ | mobile | rendered | 390×8966 | 390×9509 | 17.193 | EDITED |
| /roofing/types/ | desktop | rendered | 1440×4986 | 1440×4976 | 1.372 | EDITED |
| /roofing/types/ | mobile | rendered | 390×7691 | 390×8234 | 26.837 | EDITED |
| /service-areas/ | desktop | rendered | 1440×4579 | 1440×4671 | 31.561 | EDITED |
| /service-areas/ | mobile | rendered | 390×7608 | 390×7407 | 29.694 | EDITED |
| /services/ | desktop | rendered | 1440×3798 | 1440×3798 | 0.072 | PASS |
| /services/ | mobile | rendered | 390×7418 | 390×7418 | 0.136 | PASS |
| /siding/ | desktop | rendered | 1440×5245 | 1440×5383 | 13.038 | EDITED |
| /siding/ | mobile | rendered | 390×9229 | 390×9364 | 13.916 | EDITED |
| /site-map/ | desktop | rendered | 1440×2943 | 1440×2175 | 37.542 | EDITED |
| /site-map/ | mobile | rendered | 390×3727 | 390×2735 | 51.703 | EDITED |
| /solar/ | desktop | as-delivered | 1440×6810 | 1440×7007 | 19.699 | EDITED |
| /solar/ | mobile | as-delivered | 390×11188 | 390×12197 | 27.969 | EDITED |
| /solar/gaf-solar-roof/ | desktop | rendered | 1440×3074 | 1440×3064 | 1.983 | EDITED |
| /solar/gaf-solar-roof/ | mobile | rendered | 390×5527 | 390×6070 | 18.576 | EDITED |
| /solar/solar-panel-installations/ | desktop | rendered | 1440×3110 | 1440×3100 | 1.974 | EDITED |
| /solar/solar-panel-installations/ | mobile | rendered | 390×5420 | 390×5963 | 18.905 | EDITED |
| /terms-and-conditions/ | desktop | rendered | 1440×1993 | 1440×1993 | 0.045 | PASS |
| /terms-and-conditions/ | mobile | rendered | 390×3501 | 390×3501 | 0.094 | PASS |
| /thank-you/ | desktop | rendered | 1440×2426 | 1440×2773 | 46.119 | EDITED |
| /thank-you/ | mobile | rendered | 390×4596 | 390×5167 | 44.777 | EDITED |
