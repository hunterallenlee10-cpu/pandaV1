/* Script for the fixes in scripts/lib/site-fixes.mjs (no dependencies).
   - The phone-only "Share" button on blog posts opens the device's share sheet where the
     browser supports it; otherwise the link falls back to an email draft.
   - "Experts You Can Trust" (home page): the logos glide past in one continuous row.
   - /service-areas/ hero: the state chips zoom the map to their state. */
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

/* The logo row (.pfix-marquee): the logos are repeated after themselves (the copies are
   hidden from screen readers) and the row slides left at a steady speed, looping without
   a seam. It runs on the browser's animation engine, so it stays smooth while the page is
   busy; it eases to a stop under the mouse and rests while off screen. People who prefer
   reduced motion, and browsers without the Web Animations API, get the still row. */
(function () {
  'use strict';
  var SPEED = 42; // px per second
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (reduceMotion || !Element.prototype.animate) return;

  function toArray(list) {
    return Array.prototype.slice.call(list);
  }
  // The site's lazy loader only handles the pictures that were in the page when it
  // started: load these now, so the copies have them too.
  function loadPictures(root) {
    toArray(root.querySelectorAll('[data-lazy-srcset], [data-lazy-src]')).forEach(function (el) {
      var srcset = el.getAttribute('data-lazy-srcset');
      var sizes = el.getAttribute('data-lazy-sizes');
      var src = el.getAttribute('data-lazy-src');
      if (sizes && el.getAttribute('sizes') !== sizes) el.setAttribute('sizes', sizes);
      if (srcset && el.getAttribute('srcset') !== srcset) el.setAttribute('srcset', srcset);
      if (src && el.getAttribute('src') !== src) el.setAttribute('src', src);
    });
  }

  function initMarquee(box) {
    var track = box.querySelector('.pfix-marquee__track');
    if (!track || !track.children.length) return;
    var items = toArray(track.children);
    var sets = 0; // copies of the whole row after the real one
    var anim = null;
    var width = 0;
    var rate = 1;
    var rateTarget = 1;
    var rateFrame = 0;
    var visible = true;

    function copyRow() {
      items.forEach(function (item) {
        var c = item.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.classList.add('is-copy');
        toArray(c.querySelectorAll('[data-lazy-src], [data-lazy-srcset], [data-ll-status]')).forEach(function (el) {
          el.removeAttribute('data-lazy-src');
          el.removeAttribute('data-lazy-srcset');
          el.removeAttribute('data-lazy-sizes');
          el.removeAttribute('data-ll-status');
        });
        toArray(c.querySelectorAll('img')).forEach(function (img) {
          img.alt = '';
        });
        track.appendChild(c);
      });
      sets++;
    }
    // Width of one row of logos: from the first logo to the first logo of the copy.
    function rowWidth() {
      return track.children[items.length].offsetLeft - items[0].offsetLeft;
    }
    function layout() {
      if (!sets) copyRow();
      var w = rowWidth();
      if (!(w > 0)) return;
      while (sets < Math.ceil(box.clientWidth / w) + 1) copyRow();
      if (anim && Math.abs(w - width) < 0.5) return;
      // Same point in the loop after a change of width (the logos finished loading, the
      // window was resized), so the row never jumps back to the start.
      var progress = anim && width ? (anim.currentTime % ((width / SPEED) * 1000)) / ((width / SPEED) * 1000) : 0;
      if (anim) anim.cancel();
      width = w;
      var duration = (w / SPEED) * 1000;
      anim = track.animate([{ transform: 'translate3d(0, 0, 0)' }, { transform: 'translate3d(' + -w + 'px, 0, 0)' }], {
        duration: duration,
        iterations: Infinity,
        easing: 'linear',
      });
      anim.currentTime = progress * duration;
      anim.playbackRate = rate;
      if (!visible) anim.pause();
    }
    // Ease the speed up or down instead of stopping dead.
    function easeTo(to) {
      rateTarget = to;
      if (rateFrame) return;
      var last = performance.now();
      rateFrame = requestAnimationFrame(function step(t) {
        var dt = Math.min(0.05, (t - last) / 1000);
        last = t;
        rate += (rateTarget - rate) * (1 - Math.exp(-dt * 7));
        if (Math.abs(rateTarget - rate) < 0.01) rate = rateTarget;
        if (anim) {
          if (anim.updatePlaybackRate) anim.updatePlaybackRate(rate);
          else anim.playbackRate = rate;
        }
        rateFrame = rate === rateTarget ? 0 : requestAnimationFrame(step);
      });
    }

    loadPictures(track);
    box.classList.add('is-running');
    layout();
    box.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'mouse') easeTo(0);
    });
    box.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse') easeTo(1);
    });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        visible = entries[entries.length - 1].isIntersecting;
        if (!anim) return;
        if (visible) anim.play();
        else anim.pause();
      }).observe(box);
    }
    var pending = 0;
    function relayout() {
      if (pending) return;
      pending = requestAnimationFrame(function () {
        pending = 0;
        layout();
      });
    }
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(relayout);
      ro.observe(box);
      items.forEach(function (item) {
        ro.observe(item);
      });
    } else {
      window.addEventListener('resize', relayout);
      track.addEventListener('load', relayout, true);
    }
  }

  function init() {
    toArray(document.querySelectorAll('.pfix-marquee')).forEach(function (box) {
      // Start shortly before the row scrolls into view (its logos load then).
      if (!window.IntersectionObserver) return initMarquee(box);
      var io = new IntersectionObserver(
        function (entries) {
          if (!entries[entries.length - 1].isIntersecting) return;
          io.disconnect();
          initMarquee(box);
        },
        { rootMargin: '600px 0px' }
      );
      io.observe(box);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* /service-areas/ hero: a state chip glides down to the map (smooth-scroll.js handles the
   #service-map link, and without JavaScript the link still jumps there), then zooms the map
   to that state by pressing the map's own button for it once the map is in view. "+N more"
   presses the map's "all states" button. */
(function () {
  'use strict';
  document.addEventListener('click', function (event) {
    var chip = event.target.closest && event.target.closest('.pfix-sa-hero [data-pfix-state]');
    if (!chip) return;
    var section = document.getElementById('service-map');
    var code = chip.getAttribute('data-pfix-state') || '';
    if (!section || !/^[A-Z]{0,2}$/.test(code)) return;
    var target = section.querySelector('.pmap__chip[data-state="' + code + '"]');
    if (!target) return;
    var io = null;
    var timer = 0;
    var done = false;
    function press() {
      if (done) return;
      done = true;
      if (io) io.disconnect();
      clearTimeout(timer);
      target.click();
    }
    // The same share of the map in view that starts the map's own entrance.
    if (window.IntersectionObserver) {
      io = new IntersectionObserver(
        function (entries) {
          if (entries.some(function (e) { return e.isIntersecting; })) press();
        },
        { threshold: 0.35 }
      );
      io.observe(target.closest('.pmap-card') || section);
    }
    timer = setTimeout(press, 1500);
  });
})();
