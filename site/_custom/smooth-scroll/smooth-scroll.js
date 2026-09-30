/* Smooth scrolling for the whole site with Lenis (lenis.min.js, loaded just before this
   file; see README.md in this folder). Mouse-wheel and trackpad scrolling glide instead of
   stepping. Touch scrolling, the keyboard and the scrollbar stay native (Lenis follows
   them), and the page keeps scrolling the normal way, so sticky bars, lazy-loaded images
   and every other script on the site work as before. On top of that:
   - areas that scroll on their own (a pop-up, a long menu, a wide table) keep scrolling
     themselves instead of the page;
   - while a pop-up has locked the page, the wheel is left to the browser; while the photo
     viewer is open, the wheel does not scroll the page behind it;
   - links to a spot on the same page glide there and stop below the fixed header (so do
     the site's own "scroll to" calls and keyboard focus);
   - people who prefer reduced motion get plain, instant scrolling (Lenis's own setting). */
(function () {
  'use strict';
  if (typeof window.Lenis !== 'function') return;
  var root = document.documentElement;

  // A Bootstrap pop-up locks the page by hiding its overflow (its own content still
  // scrolls natively).
  function pageLocked() {
    var body = document.body;
    if (!body) return false;
    if (body.classList.contains('modal-open')) return true;
    var b = getComputedStyle(body).overflowY;
    var h = getComputedStyle(root).overflowY;
    return b === 'hidden' || b === 'clip' || h === 'hidden' || h === 'clip';
  }
  // The photo viewer (lightGallery) does not lock the page: the wheel would scroll the
  // page behind it.
  function viewerOpen() {
    return !!document.body && (document.body.classList.contains('lg-on') || root.classList.contains('lg-on'));
  }

  // How far down the fixed bars at the top of the window reach (top ribbon + menu bar).
  function headerHeight() {
    var bottom = 0;
    var x = Math.round(window.innerWidth / 2);
    for (var i = 0; i < 4; i++) {
      var y = Math.round(bottom) + 1;
      if (y >= window.innerHeight / 2) break;
      var bar = null;
      for (var el = document.elementFromPoint(x, y); el && el !== document.body && el !== root; el = el.parentElement) {
        var p = getComputedStyle(el).position;
        if (p === 'fixed' || p === 'sticky') bar = el;
      }
      if (!bar) break;
      var r = bar.getBoundingClientRect();
      if (r.bottom <= bottom + 1) break;
      bottom = r.bottom;
    }
    return Math.round(bottom);
  }
  // Anchors, scrollIntoView() and keyboard focus stop below the fixed header.
  function updateHeaderOffset() {
    root.style.scrollPaddingTop = headerHeight() + 'px';
  }

  var lenis = new window.Lenis({
    autoRaf: true,
    allowNestedScroll: true,
    stopInertiaOnNavigate: true,
    virtualScroll: function (data) {
      if (viewerOpen()) {
        if (data.event.type === 'wheel' && data.event.cancelable) data.event.preventDefault();
        return false;
      }
      return !pageLocked();
    },
  });

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-bs-toggle') || a.hasAttribute('data-toggle')) return;
    var url;
    var el;
    try {
      url = new URL(a.href, location.href);
      el = url.hash.length > 1 ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
    } catch (err) {
      return;
    }
    if (!el || url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    e.preventDefault();
    updateHeaderOffset();
    lenis.scrollTo(el);
    if (location.hash !== url.hash && window.history && history.pushState) history.pushState(null, '', url.hash);
  });

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateHeaderOffset, 150);
  });
  updateHeaderOffset();
})();
