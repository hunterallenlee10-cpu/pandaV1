/* The Media page (/media/), markup from scripts/lib/media-page.mjs:
   - the podcast player: a large play button over the poster, then the browser's own controls;
   - every episode plays in that player (the links lead to Apple Podcasts without this script,
     and still do with a modifier key or a middle click);
   - "Copy link" for the feed address;
   - the sections ease in as they scroll into view (not for people who prefer reduced motion).
   Without this script the player shows its own controls and the feed link can be selected. */
(function () {
  'use strict';
  var root = document.querySelector('.pmedia');
  if (!root) return;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var each = function (list, fn) {
    Array.prototype.forEach.call(list, fn);
  };

  // ------------------------------------------------------------------ player
  var box = root.querySelector('[data-pmedia-player]');
  var video = box && box.querySelector('video');
  var source = video && video.querySelector('source');
  var start = box && box.querySelector('.pmedia-player__start');
  var problem = box && box.querySelector('.pmedia-player__error');
  var episodes = root.querySelectorAll('.pmedia-ep');
  var current = root.querySelector('.pmedia-ep.is-current') || episodes[0];

  function setField(name, value) {
    each(root.querySelectorAll('[data-pmedia-field="' + name + '"]'), function (el) {
      if (el.tagName === 'A') el.href = value;
      else el.textContent = value;
    });
  }
  function showProblem() {
    if (!problem) return;
    problem.hidden = false;
    if (start) start.hidden = true;
    if (video) video.controls = false;
  }
  function play() {
    if (!video) return;
    if (start) start.hidden = true;
    video.controls = true;
    var p = video.play();
    if (p && p.catch) {
      p.catch(function (err) {
        // Stopped by the browser (no gesture, power saving): show the play button again.
        if (err && err.name === 'NotAllowedError') {
          if (start) start.hidden = false;
        } else if (err && err.name === 'NotSupportedError') {
          showProblem();
        }
      });
    }
  }
  // Fully on screen, below the site's fixed header (smooth-scroll.js keeps its height in
  // the page's scroll-padding-top).
  function inView(el) {
    var r = el.getBoundingClientRect();
    var top = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    return r.top >= top && r.bottom <= (window.innerHeight || document.documentElement.clientHeight);
  }
  function load(ep) {
    if (!video || !source) return;
    if (ep !== current) {
      var d = ep.dataset;
      video.pause();
      source.src = d.video;
      source.type = d.type || 'video/mp4';
      if (d.poster) video.poster = d.poster;
      else video.removeAttribute('poster');
      box.classList.remove('is-playing');
      if (problem) problem.hidden = true;
      video.load();
      video.setAttribute('aria-label', d.label + ': ' + d.title);
      setField('label', d.label);
      setField('title', d.title);
      setField('meta', d.meta);
      setField('summary', d.summary || '');
      setField('apple', d.apple);
      each(episodes, function (x) {
        x.classList.toggle('is-current', x === ep);
        if (x === ep) x.setAttribute('aria-current', 'true');
        else x.removeAttribute('aria-current');
      });
      current = ep;
    }
    if (!inView(box)) box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    play();
  }

  if (video && start) {
    // The large play button stands in for the controls until the video first plays.
    video.controls = false;
    start.hidden = false;
    start.addEventListener('click', play);
    video.addEventListener('play', function () {
      if (start) start.hidden = true;
      video.controls = true;
      box.classList.add('is-playing');
    });
    if (source) source.addEventListener('error', showProblem);
    video.addEventListener('error', showProblem);
  }
  each(episodes, function (ep) {
    ep.addEventListener('click', function (e) {
      if (!video || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      load(ep);
    });
  });

  // -------------------------------------------------------------- feed link
  each(root.querySelectorAll('[data-pmedia-copy]'), function (copy) {
    var field = copy.querySelector('input');
    var button = copy.querySelector('button');
    var label = copy.querySelector('.pmedia-copy__label');
    var status = copy.querySelector('[role="status"]');
    if (!field || !button) return;
    var timer;
    button.hidden = false;
    field.addEventListener('focus', function () {
      field.select();
    });
    function copied() {
      copy.classList.add('is-copied');
      label.textContent = 'Copied';
      status.textContent = 'Feed link copied';
      clearTimeout(timer);
      timer = setTimeout(function () {
        copy.classList.remove('is-copied');
        label.textContent = 'Copy link';
        status.textContent = '';
      }, 2200);
    }
    function fallback() {
      field.focus();
      field.select();
      try {
        if (document.execCommand('copy')) copied();
      } catch (e) {
        /* the address stays selected, ready to copy by hand */
      }
    }
    button.addEventListener('click', function () {
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(field.value).then(copied, fallback);
      else fallback();
    });
  });

  // ------------------------------------------------------------------ motion
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var items = root.querySelectorAll('.pmedia-hero__inner, .pmedia-panel__head, .pmedia-post, .pmedia-player, .pmedia-now, .pmedia-block, .pmedia-link');
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -6% 0px' }
    );
    each(items, function (el) {
      el.classList.add('pmedia-reveal');
      io.observe(el);
    });
    root.classList.add('pmedia-animate');
  }
})();
