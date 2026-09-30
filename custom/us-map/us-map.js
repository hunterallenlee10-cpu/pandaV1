/* Panda Exteriors — animated "areas we serve" map (see README.md in this folder).
   No dependencies. The markup is rendered at build time and already shows the final
   state, so this script only adds the entrance animation, tooltips and (on the large
   map) the state buttons. People who prefer reduced motion get no animation. */
(function () {
  'use strict';

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function parseBox(s) {
    return String(s || '')
      .trim()
      .split(/[\s,]+/)
      .map(Number);
  }
  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function toArray(list) {
    return Array.prototype.slice.call(list);
  }
  function fmtJobs(n) {
    return Number(n).toLocaleString('en-US') + ' jobs';
  }

  function initMap(root) {
    var svg = root.querySelector('.pmap__svg');
    var stage = root.querySelector('.pmap__stage');
    var tip = root.querySelector('.pmap__tip');
    if (!svg || !stage) return;
    var areas = toArray(root.querySelectorAll('.pmap__area'));
    var states = toArray(root.querySelectorAll('.pmap__state'));
    var chips = toArray(root.querySelectorAll('.pmap__chip'));
    var insets = toArray(root.querySelectorAll('.pmap__inset'));
    var info = root.querySelector('.pmap__info');
    var full = parseBox(root.getAttribute('data-full'));
    var region = parseBox(root.getAttribute('data-region'));
    var boxes = {};
    try {
      boxes = JSON.parse(root.getAttribute('data-boxes') || '{}');
    } catch (e) {
      boxes = {};
    }
    var view = parseBox(svg.getAttribute('viewBox'));
    var frame = 0;
    var explorer = root.classList.contains('pmap--explorer');

    // ------------------------------------------------------------ camera
    // Markers are drawn in pixels: scale them by the map units per pixel of the map they
    // are on (the main map, or the inset box of a far-away state).
    function unitsPerPixel(own) {
      if (own === svg) return Math.max(view[2] / (svg.clientWidth || stage.clientWidth || 1), view[3] / (svg.clientHeight || stage.clientHeight || 1));
      var box = parseBox(own.getAttribute('viewBox'));
      return Math.max(box[2] / (own.clientWidth || 1), box[3] / (own.clientHeight || 1));
    }
    function layout() {
      areas.forEach(function (a) {
        var k = unitsPerPixel(a.ownerSVGElement || svg);
        a.setAttribute('transform', 'translate(' + a.getAttribute('data-x') + ' ' + a.getAttribute('data-y') + ') scale(' + k.toFixed(4) + ')');
      });
    }
    function setView(b) {
      view = b;
      svg.setAttribute(
        'viewBox',
        b
          .map(function (n) {
            return n.toFixed(2);
          })
          .join(' ')
      );
      layout();
    }
    // Glide to a box: the centre moves smoothly while the zoom changes geometrically.
    function fly(to, ms, done) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (reduceMotion || !ms) {
        setView(to);
        if (done) done();
        return;
      }
      var from = view.slice();
      var fx = from[0] + from[2] / 2;
      var fy = from[1] + from[3] / 2;
      var tx = to[0] + to[2] / 2;
      var ty = to[1] + to[3] / 2;
      var start = null;
      function step(now) {
        if (start === null) start = now;
        var p = Math.min(1, (now - start) / ms);
        var e = ease(p);
        var w = from[2] * Math.pow(to[2] / from[2], e);
        var h = from[3] * Math.pow(to[3] / from[3], e);
        var cx = fx + (tx - fx) * e;
        var cy = fy + (ty - fy) * e;
        setView([cx - w / 2, cy - h / 2, w, h]);
        if (p < 1) frame = requestAnimationFrame(step);
        else {
          frame = 0;
          if (done) done();
        }
      }
      frame = requestAnimationFrame(step);
    }

    // ----------------------------------------------------------- tooltip
    function showTip(title, sub, x, y) {
      if (!tip) return;
      tip.textContent = '';
      var strong = document.createElement('strong');
      strong.textContent = title;
      tip.appendChild(strong);
      if (sub) {
        var span = document.createElement('span');
        span.textContent = sub;
        tip.appendChild(span);
      }
      tip.hidden = false;
      // Keep the tooltip inside the map; the arrow still points at the spot.
      var half = tip.offsetWidth / 2;
      var left = Math.max(half + 4, Math.min(stage.clientWidth - half - 4, x));
      tip.style.left = left + 'px';
      tip.style.top = y + 'px';
      tip.style.setProperty('--pmap-tip-arrow', 'calc(50% + ' + (x - left) + 'px)');
    }
    function hideTip() {
      if (tip) tip.hidden = true;
      areas.forEach(function (a) {
        a.classList.remove('is-active');
      });
    }
    function pinPoint(a) {
      var ctm = (a.ownerSVGElement || svg).getScreenCTM();
      if (!ctm) return [0, 0];
      var pt = svg.createSVGPoint();
      pt.x = Number(a.getAttribute('data-x'));
      pt.y = Number(a.getAttribute('data-y'));
      var s = pt.matrixTransform(ctm);
      var r = stage.getBoundingClientRect();
      var dot = a.querySelector('.pmap__dot');
      var radius = dot ? dot.getBoundingClientRect().height / 2 : 6;
      return [s.x - r.left, s.y - r.top - radius];
    }
    function areaTip(a) {
      var jobs = a.getAttribute('data-jobs');
      var sub = a.getAttribute('data-kind') || '';
      if (jobs) sub = (sub ? sub + ' · ' : '') + fmtJobs(jobs);
      var p = pinPoint(a);
      hideTip();
      a.classList.add('is-active');
      showTip(a.getAttribute('data-name'), sub, p[0], p[1]);
    }
    function stateTip(s, evt) {
      var r = stage.getBoundingClientRect();
      var jobs = s.getAttribute('data-jobs');
      showTip(s.getAttribute('data-name'), jobs ? fmtJobs(jobs) : 'Areas we serve', evt.clientX - r.left, evt.clientY - r.top - 6);
    }

    areas.forEach(function (a) {
      a.addEventListener('pointerenter', function () {
        areaTip(a);
      });
      a.addEventListener('pointerleave', hideTip);
      a.addEventListener('focus', function () {
        areaTip(a);
      });
      a.addEventListener('blur', hideTip);
      a.addEventListener('click', function (evt) {
        evt.stopPropagation();
        areaTip(a);
        if (explorer) select(a.getAttribute('data-state'));
      });
      a.addEventListener('keydown', function (evt) {
        if (explorer && (evt.key === 'Enter' || evt.key === ' ')) {
          evt.preventDefault();
          select(a.getAttribute('data-state'));
        }
      });
    });
    states.forEach(function (s) {
      s.addEventListener('pointermove', function (evt) {
        if (evt.pointerType === 'mouse') stateTip(s, evt);
      });
      s.addEventListener('pointerleave', function (evt) {
        if (evt.pointerType === 'mouse') hideTip();
      });
      s.addEventListener('click', function (evt) {
        evt.stopPropagation();
        stateTip(s, evt);
        if (explorer) select(s.getAttribute('data-state'));
      });
    });
    stage.addEventListener('click', hideTip);

    // ---------------------------------------------- explorer: pick a state
    function setInfo(code) {
      if (!info) return;
      var title = info.querySelector('.pmap__info-title');
      var text = info.querySelector('.pmap__info-text');
      var offices = info.querySelector('.pmap__info-offices');
      var list = info.querySelector('.pmap__info-list');
      var jobsEl = info.querySelector('.pmap__info-jobs');
      if (!code) {
        title.textContent = title.getAttribute('data-default');
        text.textContent = text.getAttribute('data-default');
        list.textContent = offices.getAttribute('data-default');
        offices.hidden = !list.textContent;
        if (jobsEl) jobsEl.textContent = fmtJobs(jobsEl.getAttribute('data-default')) + ' completed';
        return;
      }
      var chip = chips.filter(function (c) {
        return c.getAttribute('data-state') === code;
      })[0];
      var name = chip ? chip.textContent : code;
      var own = areas.filter(function (a) {
        return a.getAttribute('data-state') === code;
      });
      title.textContent = name;
      text.textContent = name + ' is part of our service area.';
      list.textContent = own
        .map(function (a) {
          return a.getAttribute('data-name');
        })
        .join(' · ');
      offices.hidden = !own.length;
      if (jobsEl) {
        var stateEl = states.filter(function (s) {
          return s.getAttribute('data-state') === code;
        })[0];
        var n = Number(stateEl && stateEl.getAttribute('data-jobs')) || own.reduce(function (t, a) {
          return t + (Number(a.getAttribute('data-jobs')) || 0);
        }, 0);
        jobsEl.hidden = !n;
        if (n) jobsEl.textContent = fmtJobs(n) + ' completed';
      }
    }
    function select(code) {
      code = code || '';
      finishIntro(); // a click during (or before) the entrance skips straight to the end of it
      chips.forEach(function (c) {
        c.setAttribute('aria-pressed', String(c.getAttribute('data-state') === code));
      });
      root.classList.toggle('pmap--has-selection', !!code);
      states.forEach(function (s) {
        s.classList.toggle('is-selected', s.getAttribute('data-state') === code);
      });
      areas.forEach(function (a) {
        a.classList.toggle('is-selected', !!code && a.getAttribute('data-state') === code);
      });
      insets.forEach(function (i) {
        i.classList.toggle('is-selected', !!code && (i.getAttribute('data-states') || '').split(' ').indexOf(code) >= 0);
      });
      setInfo(code);
      fly(code && boxes[code] ? boxes[code] : region, 900);
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        hideTip();
        select(c.getAttribute('data-state'));
      });
    });
    root.addEventListener('keydown', function (evt) {
      if (evt.key === 'Escape') {
        hideTip();
        if (explorer) select('');
      }
    });

    // --------------------------------------------------------- entrance
    if (window.ResizeObserver) new ResizeObserver(layout).observe(stage);
    else window.addEventListener('resize', layout);

    var played = false;
    var timers = [];
    var io = null;
    function later(fn, ms) {
      timers.push(setTimeout(fn, ms));
    }
    function finishIntro() {
      if (!root.classList.contains('pmap--armed')) return;
      played = true;
      timers.forEach(clearTimeout);
      timers = [];
      if (io) io.disconnect();
      root.classList.add('pmap--play', 'pmap--lit', 'pmap--pins', 'pmap--idle');
    }
    if (reduceMotion || !('IntersectionObserver' in window)) {
      layout();
      return;
    }
    root.classList.add('pmap--armed');
    setView(full);
    function play() {
      if (played) return;
      played = true;
      root.classList.add('pmap--play');
      later(function () {
        root.classList.add('pmap--lit');
      }, 700);
      later(function () {
        fly(region, 1600, function () {
          root.classList.add('pmap--pins');
          later(function () {
            root.classList.add('pmap--idle');
          }, 700 + areas.length * 130);
        });
      }, 250);
    }
    io = new IntersectionObserver(
      function (entries) {
        if (
          entries.some(function (e) {
            return e.isIntersecting;
          })
        ) {
          io.disconnect();
          play();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(stage);
  }

  function start() {
    toArray(document.querySelectorAll('[data-pmap]')).forEach(initMap);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
