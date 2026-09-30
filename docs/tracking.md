# Tracking & analytics

All analytics, advertising-pixel and call-tracking code found on the live pages. In the copy each snippet is
commented out in place, behind a `<!-- TRACKING DISABLED (name: IDs) -->` marker, so viewing or testing the copy
never reports visits. Where a `<script>` was disabled, a one-line no-op stub (`window.gtag = function(){}` etc.)
is added once per page so other site code that calls these functions does not throw errors. It sends nothing.

During the capture itself every request to these services was also blocked at the network level, so the crawl
did not register visits either (and tools normally injected by Tag Manager were never loaded).

| Service | IDs found | Pages | Disabled elements |
| --- | --- | --- | --- |
| Google Tag Manager | GTM-ND5VBQCV | 173 | <link> <script> <noscript> |
| Google Analytics (gtag.js) | G-28J2ZDP9B0 | 171 | <script> |

## Requests blocked during capture

| Reason | Requests | Examples |
| --- | --- | --- |
| tracking: Google Analytics (gtag.js) | 690 | https://www.googletagmanager.com/gtag/js?id=GT-KF856BRJ · https://www.googletagmanager.com/gtag/js?id=G-28J2ZDP9B0 · https://www.googletagmanager.com/gtag/js?id=G-29BCBN9Z47 |
| forbidden | 536 | https://pandaexteriors.com/wp-json/custom/v1/review-total · https://pandaexteriors.com/wp-json/contact-form-7/v1/contact-forms/15583/feedback/schema · https://pandaexteriors.com/wp-json/contact-form-7/v1/contact-forms/15583/refill |
| non-GET | 497 | https://m.stripe.com/6 · https://jnn-pa.googleapis.com/$rpc/google.internal.waa.v1.Waa/GenerateIT · https://www.youtube.com/youtubei/v1/log_event?alt=json |
| tracking: Google Tag Manager | 346 | https://www.googletagmanager.com/gtm.js?id=GTM-ND5VBQCV · https://www.googletagmanager.com/gtm.js?id=GTM-NV2Z652H |
| tracking: Google Ads | 34 | https://googleads.g.doubleclick.net/pagead/id · https://static.doubleclick.net/instream/ad_status.js |

To re-enable tracking in a deployed copy, restore the commented-out blocks (search for `TRACKING DISABLED`).
