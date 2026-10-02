/* "Our Project Gallery" (.ppg, rendered by scripts/lib/project-gallery.mjs; see README.md
   in this folder). No dependencies.
   - Tabs: one category at a time (arrow keys, Home and End move between the tabs).
   - The row of photos scrolls sideways and snaps to whole photos (swipe, trackpad, or drag
     with the mouse). The arrows move a whole view at a time, the dots jump to a view;
     with more views than dots fit, a "4 / 22" count shows instead.
   - A photo opens in a viewer (a modal <dialog>): arrows, arrow keys and swiping step
     through the category, Esc or a click beside the photo closes it, and the row follows
     to the last photo seen. Without <dialog> support the link opens the photo itself.
   - Photo walls ([data-ppg-wall], outside .ppg) open their photos in the same viewer.
   People who prefer reduced motion get instant scrolling. */
(function () {
  'use strict';
  var MAX_DOTS = 10;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var canDialog = typeof window.HTMLDialogElement === 'function' && 'showModal' in document.createElement('dialog');

  function toArray(list) {
    return Array.prototype.slice.call(list);
  }
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function svg(d) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + d + '</svg>';
  }
  var ICON_PREV = svg('<path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>');
  var ICON_NEXT = svg('<path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>');
  var ICON_CLOSE = svg('<path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>');

  /* ------------------------------------------------------------ photo viewer */
  var viewer = null;
  function getViewer() {
    if (viewer) return viewer;
    var dialog = document.createElement('dialog');
    dialog.className = 'ppg-lightbox';
    dialog.setAttribute('aria-label', 'Project photo viewer');
    dialog.innerHTML =
      '<div class="ppg-lightbox__stage"><img class="ppg-lightbox__img" alt="" decoding="async" draggable="false"></div>' +
      '<p class="ppg-lightbox__caption" aria-live="polite"></p>' +
      '<button class="ppg-lightbox__btn ppg-lightbox__btn--prev" type="button" aria-label="Previous photo">' + ICON_PREV + '</button>' +
      '<button class="ppg-lightbox__btn ppg-lightbox__btn--next" type="button" aria-label="Next photo">' + ICON_NEXT + '</button>' +
      '<button class="ppg-lightbox__btn ppg-lightbox__btn--close" type="button" aria-label="Close" autofocus>' + ICON_CLOSE + '</button>';
    document.body.appendChild(dialog);
    var stage = dialog.querySelector('.ppg-lightbox__stage');
    var img = dialog.querySelector('.ppg-lightbox__img');
    var caption = dialog.querySelector('.ppg-lightbox__caption');
    var state = { items: [], index: 0, name: '', onClose: null };

    function show(i) {
      var n = state.items.length;
      state.index = ((i % n) + n) % n;
      var tile = state.items[state.index];
      var size = (tile.getAttribute('data-size') || '').split('x');
      img.classList.remove('is-loaded');
      img.removeAttribute('src');
      if (size[0] && size[1]) {
        img.width = +size[0];
        img.height = +size[1];
      } else {
        img.removeAttribute('width');
        img.removeAttribute('height');
      }
      // A photo with its own description (data-caption, the photo walls) shows it.
      var own = tile.getAttribute('data-caption');
      img.alt = own || state.name + ' project photo ' + (state.index + 1) + ' of ' + n;
      img.src = tile.getAttribute('href');
      if (img.complete && img.naturalWidth) img.classList.add('is-loaded');
      caption.textContent = (own || state.name) + ' · ' + (state.index + 1) + ' of ' + n;
      dialog.classList.toggle('is-single', n < 2);
      // The next and previous photos load in the background.
      [state.index + 1, state.index - 1].forEach(function (j) {
        var t = state.items[((j % n) + n) % n];
        if (t && t !== tile) new Image().src = t.getAttribute('href');
      });
    }
    img.addEventListener('load', function () {
      img.classList.add('is-loaded');
    });
    dialog.querySelector('.ppg-lightbox__btn--prev').addEventListener('click', function () {
      show(state.index - 1);
    });
    dialog.querySelector('.ppg-lightbox__btn--next').addEventListener('click', function () {
      show(state.index + 1);
    });
    dialog.querySelector('.ppg-lightbox__btn--close').addEventListener('click', function () {
      dialog.close();
    });
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        show(state.index + (e.key === 'ArrowLeft' ? -1 : 1));
      }
    });
    // A click beside the photo (not on it or a button) closes the viewer.
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target === stage || e.target === caption) dialog.close();
    });
    // Swipe sideways to step through the photos.
    var swipe = null;
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      swipe = { id: e.pointerId, x: e.clientX, y: e.clientY };
    });
    stage.addEventListener('pointerup', function (e) {
      if (!swipe || swipe.id !== e.pointerId) return;
      var dx = e.clientX - swipe.x;
      var dy = e.clientY - swipe.y;
      swipe = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) show(state.index + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('pointercancel', function () {
      swipe = null;
    });
    dialog.addEventListener('close', function () {
      document.documentElement.classList.remove('ppg-locked');
      img.removeAttribute('src');
      if (state.onClose) state.onClose(state.index);
    });

    viewer = {
      open: function (items, index, name, onClose) {
        state.items = items;
        state.name = name;
        state.onClose = onClose;
        show(index);
        // The page behind stays put (smooth-scroll.js leaves a locked page alone).
        document.documentElement.classList.add('ppg-locked');
        dialog.showModal();
      },
    };
    return viewer;
  }

  /* ---------------------------------------------------------------- gallery */
  function initGallery(root) {
    var tabs = toArray(root.querySelectorAll('.ppg__tab'));
    var panel = root.querySelector('.ppg__panel');
    var viewport = root.querySelector('.ppg__viewport');
    var slides = toArray(root.querySelectorAll('.ppg__slide'));
    var prev = root.querySelector('.ppg__btn--prev');
    var next = root.querySelector('.ppg__btn--next');
    var pager = root.querySelector('.ppg__pager');
    if (!tabs.length || !viewport || !slides.length) return;
    var current = null; // the selected tab
    var shown = []; // its slides
    var dots = [];
    var count = null;
    var layoutKey = '';
    var aim = null; // the photo the row is gliding to (quick clicks add up)
    var aimTimer = 0;

    // Distance from one photo to the next, and how many fit in the row.
    function step() {
      if (shown.length > 1) return shown[1].offsetLeft - shown[0].offsetLeft;
      return shown.length ? shown[0].offsetWidth : viewport.clientWidth;
    }
    function perView() {
      var s = step();
      return s > 0 ? Math.max(1, Math.round((viewport.clientWidth + (s - (shown[0] ? shown[0].offsetWidth : 0))) / s)) : 1;
    }
    function maxScroll() {
      return Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    }
    function pages() {
      return Math.max(1, Math.ceil(shown.length / perView()));
    }
    // Where the row is: the first photo in view, and which view (dot) that is.
    function position() {
      var s = step();
      var first = s > 0 ? Math.round(viewport.scrollLeft / s) : 0;
      var pv = perView();
      var last = pages() - 1;
      var page = viewport.scrollLeft >= maxScroll() - 2 ? last : clamp(Math.round(first / pv), 0, last);
      return { first: clamp(first, 0, Math.max(0, shown.length - 1)), page: page, perView: pv };
    }
    function scrollToPhoto(i, instant) {
      if (!shown.length) return;
      i = clamp(i, 0, shown.length - 1);
      var target = shown[i];
      var left = clamp(target.offsetLeft - shown[0].offsetLeft, 0, maxScroll());
      aim = instant || reduceMotion ? null : i;
      clearTimeout(aimTimer);
      aimTimer = setTimeout(function () {
        aim = null;
      }, 900);
      if (viewport.scrollTo) viewport.scrollTo({ left: left, behavior: instant || reduceMotion ? 'auto' : 'smooth' });
      else viewport.scrollLeft = left;
    }
    function goToPage(p) {
      var pv = perView();
      scrollToPhoto(Math.min(p * pv, Math.max(0, shown.length - pv)));
    }

    // The dots are made with the current one already marked: no width transition on a
    // section that is still off screen (the site renders those lazily, which can leave a
    // transition stuck there).
    function buildPager(page) {
      var n = pages();
      var key = (current ? current.getAttribute('data-cat') : '') + ':' + n;
      if (key === layoutKey) return;
      layoutKey = key;
      pager.innerHTML = '';
      dots = [];
      count = null;
      if (n > MAX_DOTS) {
        count = document.createElement('span');
        count.className = 'ppg__count';
        pager.appendChild(count);
        return;
      }
      for (var i = 0; i < n; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'ppg__dot';
        dot.tabIndex = -1;
        dot.setAttribute('data-page', String(i));
        if (i === page) dot.classList.add('is-active');
        pager.appendChild(dot);
        dots.push(dot);
      }
    }
    function update() {
      var pos = position();
      buildPager(pos.page);
      var max = maxScroll();
      root.classList.toggle('is-static', max <= 1);
      // aria-disabled, not disabled: a button that stops working keeps the keyboard focus.
      prev.setAttribute('aria-disabled', viewport.scrollLeft <= 1 ? 'true' : 'false');
      next.setAttribute('aria-disabled', viewport.scrollLeft >= max - 1 ? 'true' : 'false');
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === pos.page);
      });
      if (count) count.textContent = Math.min(pos.page + 1, pages()) + ' / ' + pages();
    }

    function select(tab, focus) {
      if (tab === current) {
        if (focus) tab.focus();
        return;
      }
      current = tab;
      var cat = tab.getAttribute('data-cat');
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      if (panel) panel.setAttribute('aria-labelledby', tab.id);
      shown = [];
      slides.forEach(function (s) {
        var on = s.getAttribute('data-cat') === cat;
        s.hidden = !on;
        if (on) shown.push(s);
      });
      aim = null;
      viewport.scrollLeft = 0;
      update();
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        select(tab, false);
      });
    });
    tabs[0].parentNode.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var to = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (to == null) return;
      e.preventDefault();
      select(tabs[(to + tabs.length) % tabs.length], true);
    });
    // A whole view at a time, lined up on views (after a swipe too, without skipping a photo).
    function from() {
      var pos = position();
      if (aim != null) pos.first = aim;
      return pos;
    }
    prev.addEventListener('click', function () {
      if (prev.getAttribute('aria-disabled') === 'true') return;
      var pos = from();
      scrollToPhoto(Math.max(0, (Math.ceil(pos.first / pos.perView) - 1) * pos.perView));
    });
    next.addEventListener('click', function () {
      if (next.getAttribute('aria-disabled') === 'true') return;
      var pos = from();
      scrollToPhoto(Math.min((Math.floor(pos.first / pos.perView) + 1) * pos.perView, Math.max(0, shown.length - pos.perView)));
    });
    pager.addEventListener('click', function (e) {
      var dot = e.target.closest ? e.target.closest('.ppg__dot') : null;
      if (dot) goToPage(+dot.getAttribute('data-page'));
    });
    var frame = 0;
    viewport.addEventListener(
      'scroll',
      function () {
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = 0;
          update();
        });
      },
      { passive: true }
    );
    // Moved by hand: the arrows count from where it is.
    ['touchstart', 'wheel'].forEach(function (type) {
      viewport.addEventListener(
        type,
        function () {
          aim = null;
        },
        { passive: true }
      );
    });
    if (window.ResizeObserver) new ResizeObserver(update).observe(viewport);
    else window.addEventListener('resize', update);

    // Drag the row with the mouse (touch screens swipe it natively).
    var drag = null;
    var dragged = false;
    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || maxScroll() <= 1) return;
      aim = null;
      drag = { id: e.pointerId, x: e.clientX, left: viewport.scrollLeft, moved: false };
      dragged = false;
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      var dx = e.clientX - drag.x;
      if (!drag.moved) {
        if (Math.abs(dx) < 6) return;
        drag.moved = true;
        root.classList.add('is-dragging');
        try {
          viewport.setPointerCapture(e.pointerId);
        } catch (err) {}
      }
      viewport.scrollLeft = drag.left - dx;
    });
    function endDrag(e) {
      if (!drag || drag.id !== e.pointerId) return;
      var d = drag;
      drag = null;
      if (!d.moved) return;
      // The click that may follow this mouse-up is not a click on a photo.
      dragged = true;
      setTimeout(function () {
        dragged = false;
      }, 0);
      var s = step();
      var at = s > 0 ? viewport.scrollLeft / s : 0;
      // Settle on the next photo in the direction of the drag.
      var dir = e.clientX - d.x < 0 ? 1 : -1;
      var to = dir > 0 ? Math.ceil(at - 0.15) : Math.floor(at + 0.15);
      scrollToPhoto(clamp(to, 0, shown.length - 1));
      // Snapping comes back once the row has settled.
      var done = false;
      function settle() {
        if (done) return;
        done = true;
        root.classList.remove('is-dragging');
        viewport.removeEventListener('scrollend', settle);
      }
      viewport.addEventListener('scrollend', settle);
      setTimeout(settle, reduceMotion ? 50 : 700);
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener(
      'click',
      function (e) {
        if (!dragged) return;
        dragged = false;
        e.preventDefault();
        e.stopPropagation();
      },
      true
    );

    // A photo opens in the viewer.
    if (canDialog) {
      viewport.addEventListener('click', function (e) {
        var tile = e.target.closest ? e.target.closest('.ppg__tile') : null;
        if (!tile || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        var tiles = shown.map(function (s) {
          return s.querySelector('.ppg__tile');
        });
        var name = current.querySelector('.ppg__tab-name');
        getViewer().open(tiles, Math.max(0, tiles.indexOf(tile)), name ? name.textContent : '', function (i) {
          // Back on the page: the row shows the last photo seen, which gets the focus.
          var pos = position();
          if (i < pos.first || i >= pos.first + pos.perView) scrollToPhoto(i - Math.floor((pos.perView - 1) / 2), true);
          if (tiles[i]) tiles[i].focus({ preventScroll: true });
        });
      });
    }

    select(tabs.filter(function (t) {
      return t.getAttribute('aria-selected') === 'true';
    })[0] || tabs[0]);
    root.classList.add('is-ready');
  }

  /* ------------------------------------------------------------ photo walls */
  // A grid of photo links ([data-ppg-wall], e.g. /charity-and-community/): each opens the
  // viewer, which steps through the whole wall. Photos marked .is-extra wait behind a
  // "Show all" button ([data-ppg-wall-more], hidden until this runs).
  function initWall(wall) {
    var items = toArray(wall.querySelectorAll('a[href]'));
    var name = wall.getAttribute('data-ppg-wall') || 'Photo';
    var more = wall.parentNode.querySelector('[data-ppg-wall-more]');
    if (more && wall.querySelector('.is-extra')) {
      wall.classList.add('is-collapsed');
      more.hidden = false;
      more.addEventListener('click', function () {
        wall.classList.remove('is-collapsed');
        more.parentNode.removeChild(more);
        var first = wall.querySelector('.is-extra');
        if (first) first.focus({ preventScroll: true });
      });
    }
    if (!canDialog) return;
    items.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
        e.preventDefault();
        getViewer().open(items, i, name, function (last) {
          if (items[last] && !items[last].closest('.is-collapsed .is-extra')) items[last].focus({ preventScroll: true });
        });
      });
    });
  }

  function init() {
    toArray(document.querySelectorAll('.ppg')).forEach(initGallery);
    toArray(document.querySelectorAll('[data-ppg-wall]')).forEach(initWall);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
