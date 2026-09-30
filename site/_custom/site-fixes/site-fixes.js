/* Script for the fixes in scripts/lib/site-fixes.mjs (no dependencies).
   The phone-only "Share" button on blog posts opens the device's share sheet where
   the browser supports it; otherwise the link falls back to an email draft. */
(function () {
  'use strict';
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('.pfix-share-native');
    if (!link || !navigator.share) return;
    event.preventDefault();
    navigator
      .share({ title: link.getAttribute('data-share-title') || document.title, url: link.getAttribute('data-share-url') || location.href })
      .catch(function () {});
  });
})();
