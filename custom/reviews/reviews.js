/* Panda Exteriors — review carousel ("prc", see README.md in this folder). No dependencies.
   The reviews are already in the page (scripts/lib/reviews.mjs renders them). This script
   turns each .prc into a carousel that:
   - loops endlessly (copies of the reviews sit on both sides) and glides on a spring, so
     quick clicks, drags and flicks all blend into one smooth movement;
   - follows mouse and touch drags and sideways trackpad swipes (up/down scrolling is left
     to the page);
   - moves on by itself every few seconds, holding still while the pointer is over it,
     while it has keyboard focus, while a review is expanded, while it is off screen and
     while the tab is hidden; the pause button stops it for good;
   - shortens long reviews to a few lines with a "Read more" button.
   People who prefer reduced motion get no autoplay and no gliding. */
(function () {
  'use strict';

  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var hasInert = typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;
  // Spring stiffness (critically damped, per second): a one-review glide takes ~0.6 s.
  var OMEGA = 10.5;

  function reducedMotion() {
    return !!(motionQuery && motionQuery.matches);
  }
  function toArray(list) {
    return Array.prototype.slice.call(list);
  }
  function mod(a, n) {
    return ((a % n) + n) % n;
  }
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function now() {
    return window.performance && performance.now ? performance.now() : Date.now();
  }
  function isKeyboardFocus(el) {
    try {
      return !!el && el.matches(':focus-visible');
    } catch (e) {
      return !!el;
    }
  }

  function initCarousel(root) {
    var viewport = root.querySelector('.prc__viewport');
    var track = root.querySelector('.prc__track');
    if (!viewport || !track || root.classList.contains('is-ready')) return;
    var originals = toArray(track.children);
    var n = originals.length;
    if (!n) return;
    var dots = toArray(root.querySelectorAll('.prc__dot'));
    var prevBtn = root.querySelector('.prc__btn--prev');
    var nextBtn = root.querySelector('.prc__btn--next');
    var playBtn = root.querySelector('.prc__btn--play');
    var interval = Number(root.getAttribute('data-interval')) || 6500;
    root.style.setProperty('--prc-interval', interval + 'ms');

    // ------------------------------------------------------------ the loop
    // A copy of every review before and after the real ones: the track can then always
    // show a full row, and jumping one lap (n reviews) looks exactly the same.
    originals.forEach(function (s, i) {
      s.setAttribute('data-index', String(i));
    });
    function copy(slide) {
      var c = slide.cloneNode(true);
      c.classList.add('is-clone');
      toArray(c.querySelectorAll('[id]')).forEach(function (el) {
        el.removeAttribute('id');
      });
      toArray(c.querySelectorAll('[aria-controls]')).forEach(function (el) {
        el.removeAttribute('aria-controls');
      });
      return c;
    }
    var before = document.createDocumentFragment();
    var after = document.createDocumentFragment();
    originals.forEach(function (s) {
      before.appendChild(copy(s));
      after.appendChild(copy(s));
    });
    track.insertBefore(before, track.firstChild);
    track.appendChild(after);
    var slides = toArray(track.children); // copies, real reviews, copies

    // Position, in reviews: 0 = the first real review at the left edge.
    var pos = 0;
    var vel = 0; // reviews per second
    var target = 0;
    var perView = 1;
    var step = 0; // px from one review to the next
    var loop = true;
    var frame = 0;
    var lastTime = 0;
    var drag = null;
    var wheel = null;
    var wheelTimer = 0;
    var suppressClick = false;

    function readPerView() {
      var v = parseFloat(getComputedStyle(root).getPropertyValue('--prc-per-view'));
      return v > 0 ? Math.round(v) : 1;
    }
    function measure() {
      perView = readPerView();
      loop = n > perView;
      root.classList.toggle('is-static', !loop);
      var a = slides[n].getBoundingClientRect();
      var b = slides[n + 1] ? slides[n + 1].getBoundingClientRect() : null;
      step = b ? b.left - a.left : a.width;
      if (!loop) pos = target = vel = 0;
      render();
    }
    function render() {
      if (!loop || !step) {
        track.style.transform = '';
        return;
      }
      var dpr = window.devicePixelRatio || 1;
      var x = Math.round(-(pos + n) * step * dpr) / dpr;
      track.style.transform = 'translate3d(' + x + 'px, 0, 0)';
    }
    // Keep the position within the real reviews (a whole lap looks the same).
    function wrap() {
      if (pos >= 0 && pos < n) return;
      var shift = Math.floor(pos / n) * n;
      pos -= shift;
      target -= shift;
      if (drag) drag.startPos -= shift;
      if (wheel) wheel.origin -= shift;
    }

    // ------------------------------------------------------------ motion
    function tick(time) {
      frame = 0;
      var dt = clamp((time - lastTime) / 1000, 0.001, 0.064);
      lastTime = time;
      // Critically damped spring toward the target (exact step, stable at any frame rate).
      var x = pos - target;
      var k = vel + OMEGA * x;
      var e = Math.exp(-OMEGA * dt);
      pos = target + (x + k * dt) * e;
      vel = (vel - OMEGA * k * dt) * e;
      if (Math.abs(pos - target) < 0.0004 && Math.abs(vel) < 0.004) {
        pos = target;
        vel = 0;
      }
      wrap();
      render();
      if (pos !== target || vel !== 0) frame = requestAnimationFrame(tick);
      else settle();
    }
    function glide() {
      if (reducedMotion()) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        pos = target;
        vel = 0;
        wrap();
        render();
        settle();
        return;
      }
      if (frame) return;
      lastTime = now();
      frame = requestAnimationFrame(tick);
    }
    function stopGlide() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      vel = 0;
      target = pos;
    }
    // Go to review t (any whole number: one lap further is the same review).
    function goTo(t) {
      if (!loop) return;
      var reach = Math.max(perView, Math.ceil(n / 2));
      var here = Math.round(pos);
      target = clamp(Math.round(t), here - reach, here + reach);
      showRange(Math.min(pos, target), Math.max(pos, target));
      updateDots();
      restartTimer();
      glide();
    }
    function next() {
      goTo(Math.round(target) + 1);
    }
    function prev() {
      goTo(Math.round(target) - 1);
    }

    // Only the reviews in view can be reached with the keyboard or a screen reader.
    function showRange(from, to) {
      var first = Math.floor(from + 0.001) + n;
      var last = Math.ceil(to - 0.001) + n + perView - 1;
      var lostFocus = false;
      slides.forEach(function (s, i) {
        var visible = !loop ? !s.classList.contains('is-clone') : i >= first && i <= last;
        if (!visible && s.contains(document.activeElement)) lostFocus = true;
        if (hasInert) s.inert = !visible;
        if (visible) s.removeAttribute('aria-hidden');
        else s.setAttribute('aria-hidden', 'true');
      });
      // Keyboard focus was on a review that just left the view: keep it in the carousel.
      if (lostFocus && nextBtn) nextBtn.focus({ preventScroll: true });
    }
    function settle() {
      showRange(pos, pos);
      // A review expanded with "Read more" folds back once it is out of view.
      var inView = {};
      slides.forEach(function (s) {
        if (!s.hasAttribute('aria-hidden')) inView[s.getAttribute('data-index')] = true;
      });
      toArray(track.querySelectorAll('.prc-card.is-expanded')).forEach(function (card) {
        var i = card.parentNode.getAttribute('data-index');
        if (!inView[i]) setExpanded(i, false);
      });
    }

    // ------------------------------------------------------------ dots
    function updateDots() {
      var active = mod(Math.round(target), n);
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === active);
      });
    }
    // The active dot fills up over the autoplay interval: start it again from empty.
    function restartProgress() {
      var d = dots[mod(Math.round(target), n)];
      if (!d) return;
      d.classList.remove('is-active');
      void d.offsetWidth;
      d.classList.add('is-active');
    }

    // ------------------------------------------------------------ read more
    function setExpanded(index, on) {
      slides.forEach(function (s) {
        if (s.getAttribute('data-index') !== String(index)) return;
        var card = s.querySelector('.prc-card');
        var btn = s.querySelector('.prc-card__more');
        if (card) card.classList.toggle('is-expanded', on);
        if (btn) {
          btn.setAttribute('aria-expanded', on ? 'true' : 'false');
          btn.textContent = on ? 'Show less' : 'Read more';
        }
      });
      held.expanded = !!track.querySelector('.prc-card.is-expanded');
      updateAutoplay();
    }
    // "Read more" only on reviews longer than the lines shown.
    function updateMore() {
      originals.forEach(function (s) {
        var card = s.querySelector('.prc-card');
        var text = s.querySelector('.prc-card__text');
        if (!card || !text || card.classList.contains('is-expanded')) return;
        var over = text.scrollHeight > text.clientHeight + 2;
        var i = s.getAttribute('data-index');
        slides.forEach(function (c) {
          if (c.getAttribute('data-index') !== i) return;
          var btn = c.querySelector('.prc-card__more');
          if (btn) btn.classList.toggle('is-hidden', !over);
        });
      });
    }
    track.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.prc-card__more');
      if (!btn || suppressClick) return;
      var slide = btn.closest('.prc__slide');
      setExpanded(slide.getAttribute('data-index'), btn.getAttribute('aria-expanded') !== 'true');
    });

    // ------------------------------------------------------------ autoplay
    var stopped = reducedMotion(); // the pause button (or reduced motion)
    var held = { hover: false, focus: false, drag: false, wheel: false, expanded: false, offscreen: true, hidden: !!document.hidden };
    var timer = 0;
    var running = false;
    var remaining = interval;
    var startedAt = 0;
    function isHeld() {
      for (var k in held) if (held[k]) return true;
      return false;
    }
    function updateAutoplay() {
      var playing = loop && !stopped;
      var hold = isHeld();
      root.classList.toggle('is-playing', playing);
      root.classList.toggle('is-stopped', stopped);
      root.classList.toggle('is-held', hold);
      track.setAttribute('aria-live', playing ? 'off' : 'polite');
      if (playBtn) playBtn.setAttribute('aria-label', stopped ? 'Start automatic slide show' : 'Stop automatic slide show');
      if (playing && !hold && !running) {
        running = true;
        startedAt = now();
        timer = setTimeout(function () {
          running = false;
          next();
        }, remaining);
      } else if ((!playing || hold) && running) {
        running = false;
        clearTimeout(timer);
        remaining = Math.max(0, remaining - (now() - startedAt));
      }
    }
    // A new review is in view: it gets the whole interval.
    function restartTimer() {
      if (running) clearTimeout(timer);
      running = false;
      remaining = interval;
      restartProgress();
      updateAutoplay();
    }

    // ------------------------------------------------------------ input
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () {
        var base = Math.round(target);
        var delta = mod(i - base, n);
        if (delta > n / 2) delta -= n;
        goTo(base + delta);
      });
    });
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        stopped = !stopped;
        held.focus = false; // pressing "start" means start, even with focus on the button
        if (!stopped) restartTimer();
        else updateAutoplay();
      });
    }
    root.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight' || e.key === 'Right') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        e.preventDefault();
        prev();
      }
    });

    // Drag with a mouse, pen or finger. Mostly-vertical moves are left to the page.
    viewport.addEventListener('pointerdown', function (e) {
      if (!loop || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, startPos: pos, active: false, samples: [] };
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;
      if (!drag.active) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
          drag = null;
          return;
        }
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
        // Take over from wherever the track is, even mid-glide.
        stopGlide();
        drag.active = true;
        drag.x = e.clientX;
        drag.startPos = pos;
        dx = 0;
        root.classList.add('is-dragging');
        try {
          viewport.setPointerCapture(e.pointerId);
        } catch (err) {
          /* the pointer may already be gone */
        }
        if (window.getSelection) window.getSelection().removeAllRanges();
        showRange(pos - perView, pos + perView);
        held.drag = true;
        updateAutoplay();
      }
      pos = drag.startPos - dx / step;
      target = pos;
      wrap();
      render();
      var t = now();
      drag.samples.push({ t: t, x: e.clientX });
      while (drag.samples.length > 2 && t - drag.samples[0].t > 90) drag.samples.shift();
    });
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag;
      drag = null;
      if (!d.active) return;
      root.classList.remove('is-dragging');
      held.drag = false;
      suppressClick = true;
      setTimeout(function () {
        suppressClick = false;
      }, 0);
      var s0 = d.samples[0];
      var s1 = d.samples[d.samples.length - 1];
      var v = s0 && s1 && s1.t - s0.t > 8 ? (-(s1.x - s0.x) / (s1.t - s0.t)) * (1000 / step) : 0;
      var start = Math.round(d.startPos);
      var t = Math.round(pos + v * 0.18);
      // A quick flick moves on one review even when it was short.
      if (t === start && Math.abs(v) > 0.9) t = start + (v > 0 ? 1 : -1);
      vel = clamp(v, -12, 12);
      goTo(clamp(t, start - perView, start + perView));
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('dragstart', function (e) {
      e.preventDefault();
    });
    // No click on "Read more" at the end of a drag.
    root.addEventListener(
      'click',
      function (e) {
        if (!suppressClick) return;
        e.preventDefault();
        e.stopPropagation();
      },
      true
    );

    // Sideways trackpad swipes (and Shift + mouse wheel). Up/down goes on to the page.
    function endWheel() {
      var w = wheel;
      wheel = null;
      held.wheel = false;
      if (!w) return;
      var t = Math.round(pos);
      if (t === w.origin && Math.abs(pos - w.origin) > 0.12) t = w.origin + (pos > w.origin ? 1 : -1);
      goTo(t);
    }
    viewport.addEventListener(
      'wheel',
      function (e) {
        if (!loop || drag) return;
        var dx = e.deltaX;
        var dy = e.deltaY;
        if (e.deltaMode === 1) {
          dx *= 20;
          dy *= 20;
        } else if (e.deltaMode === 2) {
          dx *= viewport.clientWidth;
          dy *= viewport.clientHeight;
        }
        if (e.shiftKey && !dx) {
          dx = dy;
          dy = 0;
        }
        if (Math.abs(dx) <= Math.abs(dy)) return;
        e.preventDefault();
        e.stopPropagation(); // not for the page's smooth scrolling
        if (!wheel) {
          stopGlide();
          wheel = { origin: Math.round(pos) };
          showRange(pos - perView, pos + perView);
          held.wheel = true;
          updateAutoplay();
        }
        pos = clamp(pos + dx / step, wheel.origin - perView, wheel.origin + perView);
        target = pos;
        wrap();
        render();
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(endWheel, 140);
      },
      { passive: false }
    );

    // Hold still under the mouse, with keyboard focus, off screen and in a hidden tab.
    root.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse') return;
      held.hover = true;
      updateAutoplay();
    });
    root.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      held.hover = false;
      updateAutoplay();
    });
    root.addEventListener('focusin', function (e) {
      held.focus = isKeyboardFocus(e.target);
      updateAutoplay();
    });
    root.addEventListener('focusout', function (e) {
      held.focus = !!e.relatedTarget && root.contains(e.relatedTarget) && isKeyboardFocus(e.relatedTarget);
      updateAutoplay();
    });
    document.addEventListener('visibilitychange', function () {
      held.hidden = !!document.hidden;
      updateAutoplay();
    });
    if (window.IntersectionObserver) {
      new IntersectionObserver(
        function (entries) {
          var entry = entries[entries.length - 1];
          held.offscreen = !entry.isIntersecting || entry.intersectionRatio < 0.3;
          updateAutoplay();
        },
        { threshold: [0, 0.3, 0.6] }
      ).observe(root);
    } else {
      held.offscreen = false;
    }

    // ------------------------------------------------------------ size
    var resizeFrame = 0;
    function onResize() {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(function () {
        resizeFrame = 0;
        measure();
        updateMore();
        if (!frame && !drag && !wheel) settle();
      });
    }
    if (window.ResizeObserver) new ResizeObserver(onResize).observe(viewport);
    else window.addEventListener('resize', onResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);

    viewport.scrollLeft = 0; // it scrolled natively before this script ran
    root.classList.add('is-ready');
    measure();
    updateMore();
    updateDots();
    settle();
    restartProgress();
    updateAutoplay();
  }

  function init() {
    toArray(document.querySelectorAll('.prc')).forEach(initCarousel);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
