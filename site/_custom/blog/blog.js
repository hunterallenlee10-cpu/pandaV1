/* The blog (see scripts/lib/blog.mjs and README.md in this folder).
   - /blog/: the search box and the topic chips narrow the cards as you type or tap, 12 cards
     show at a time with "Load more", and the address keeps the search (?q=…&topic=…) so it
     can be shared or reloaded. Without this script every card shows.
   - /blog/page/N/: the search box opens /blog/ with the words typed.
   - Posts: the estimate buttons open the form in a dialog (without this script they lead
     to the "About Our Team" form below the article); "On this page" marks the section
     you're reading; a line shows how far through the article you are; "Copy link". */
(function () {
  'use strict';

  var each = function (list, fn) {
    Array.prototype.forEach.call(list, fn);
  };

  // ------------------------------------------------------------- listing
  function listing(root) {
    var form = root.querySelector('[data-pfix-blog-search]');
    if (form) form.hidden = false;
    var grid = root.querySelector('[data-pfix-blog-grid]');
    if (!grid || !form) return;
    var input = form.querySelector('input[type="search"]');
    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-pfix-blog-card]'));
    var chips = Array.prototype.slice.call(root.querySelectorAll('[data-pfix-blog-topic]'));
    var feature = root.querySelector('[data-pfix-blog-feature]');
    var status = root.querySelector('[data-pfix-blog-status]');
    var more = root.querySelector('[data-pfix-blog-more]');
    var empty = root.querySelector('[data-pfix-blog-empty]');
    var reset = root.querySelector('[data-pfix-blog-reset]');
    var per = parseInt(grid.getAttribute('data-per'), 10) || 12;
    var names = {};
    chips.forEach(function (chip) {
      var name = chip.querySelector('.pfix-blog-topic__name');
      names[chip.getAttribute('data-pfix-blog-topic')] = name ? name.textContent : '';
      chip.setAttribute('role', 'button');
    });
    var state = { topic: '', q: '', limit: per };

    var params = new URLSearchParams(location.search);
    var topic = params.get('topic') || '';
    if (topic && Object.prototype.hasOwnProperty.call(names, topic)) state.topic = topic;
    state.q = (params.get('q') || '').trim();
    input.value = state.q;

    function words() {
      return state.q.toLowerCase().split(/\s+/).filter(Boolean);
    }
    function sync() {
      var p = new URLSearchParams();
      if (state.q) p.set('q', state.q);
      if (state.topic) p.set('topic', state.topic);
      var qs = p.toString();
      try {
        history.replaceState(history.state, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
      } catch (e) {}
    }
    function render() {
      var w = words();
      var filtering = !!(state.topic || w.length);
      if (filtering) grid.setAttribute('data-filtered', '');
      else grid.removeAttribute('data-filtered');
      if (feature) feature.hidden = filtering;
      var matches = cards.filter(function (c) {
        if (!filtering && c.hasAttribute('data-featured')) return false;
        if (state.topic && c.getAttribute('data-topic') !== state.topic) return false;
        var text = c.getAttribute('data-search') || '';
        return w.every(function (x) {
          return text.indexOf(x) !== -1;
        });
      });
      cards.forEach(function (c) {
        c.hidden = true;
      });
      matches.forEach(function (c, i) {
        c.hidden = i >= state.limit;
      });
      var left = matches.length - state.limit;
      if (more) {
        more.hidden = left <= 0;
        more.textContent = 'Load more articles (' + Math.max(left, 0) + ' more)';
      }
      if (empty) empty.hidden = matches.length > 0;
      chips.forEach(function (chip) {
        var on = chip.getAttribute('data-pfix-blog-topic') === state.topic;
        chip.classList.toggle('is-active', on);
        chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (status) {
        var n = matches.length;
        status.textContent = n
          ? 'Showing ' + Math.min(state.limit, n) + ' of ' + n + (n === 1 ? ' article' : ' articles') +
            (state.topic ? ' in ' + names[state.topic] : '') +
            (w.length ? ' matching “' + state.q + '”' : '')
          : '';
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        e.preventDefault();
        var t = chip.getAttribute('data-pfix-blog-topic');
        state.topic = state.topic === t ? '' : t;
        state.limit = per;
        render();
        sync();
      });
    });
    var timer = 0;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.q = input.value.trim();
        state.limit = per;
        render();
        sync();
      }, 120);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearTimeout(timer);
      state.q = input.value.trim();
      state.limit = per;
      render();
      sync();
      // On phones the keyboard hides the cards: close it and show them.
      var list = document.getElementById('articles');
      if (list && window.matchMedia('(max-width: 767.98px)').matches) {
        input.blur();
        var bar = root.querySelector('.pfix-blog-toolbar');
        (bar || list).scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    if (more)
      more.addEventListener('click', function () {
        var first = state.limit;
        state.limit += per;
        render();
        var shown = cards.filter(function (c) {
          return !c.hidden;
        });
        var next = shown[first] && shown[first].querySelector('a');
        if (next) next.focus({ preventScroll: true });
      });
    if (reset)
      reset.addEventListener('click', function () {
        state.q = '';
        state.topic = '';
        state.limit = per;
        input.value = '';
        render();
        sync();
        input.focus();
      });
    render();
  }

  // --------------------------------------------------------------- posts
  function post() {
    var article = document.querySelector('.pfix-post__content');
    if (!article) return;
    var root = document.documentElement;

    // The estimate form in a dialog.
    var dialog = document.querySelector('[data-pfix-post-dialog]');
    if (dialog && typeof dialog.showModal === 'function') {
      var opener = null;
      var close = dialog.querySelector('[data-pfix-post-close]');
      each(document.querySelectorAll('[data-pfix-post-open]'), function (a) {
        a.addEventListener('click', function (e) {
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          opener = a;
          root.classList.add('pfix-dialog-open');
          dialog.showModal();
          var first = dialog.querySelector('input:not([type="hidden"])');
          if (first) first.focus();
        });
      });
      if (close)
        close.addEventListener('click', function () {
          dialog.close();
        });
      // A click on the dim area around the card closes it.
      dialog.addEventListener('click', function (e) {
        if (e.target === dialog) dialog.close();
      });
      dialog.addEventListener('close', function () {
        root.classList.remove('pfix-dialog-open');
        if (opener) opener.focus({ preventScroll: true });
      });
    }

    // "On this page": the section being read, and how far through the article you are.
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-pfix-post-toc]'));
    var heads = links
      .map(function (l) {
        return document.getElementById(l.getAttribute('data-pfix-post-toc'));
      })
      .filter(Boolean);
    var list = document.querySelector('.pfix-post-toc__list');
    var bars = document.querySelectorAll('[data-pfix-post-progress]');
    var current = null;
    var queued = false;
    function update() {
      queued = false;
      var r = article.getBoundingClientRect();
      var span = r.height - window.innerHeight * 0.5;
      var done = span > 0 ? Math.min(1, Math.max(0, (window.innerHeight * 0.3 - r.top) / span)) : 1;
      each(bars, function (b) {
        b.style.transform = 'scaleX(' + done.toFixed(3) + ')';
      });
      var line = Math.min(240, window.innerHeight * 0.35);
      var cur = null;
      heads.forEach(function (h) {
        if (h.getBoundingClientRect().top <= line) cur = h;
      });
      if (cur === current) return;
      current = cur;
      links.forEach(function (l) {
        var on = !!cur && l.getAttribute('data-pfix-post-toc') === cur.id;
        l.classList.toggle('is-current', on);
        if (on) {
          l.setAttribute('aria-current', 'location');
          // Keep it in view inside the menu, without moving the page.
          if (list && list.scrollHeight > list.clientHeight) {
            var top = l.offsetTop - list.offsetTop;
            if (top < list.scrollTop || top + l.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top - list.clientHeight / 3;
          }
        } else l.removeAttribute('aria-current');
      });
    }
    function queue() {
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(update);
      }
    }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    update();

    // The phone-size menu closes once a section is chosen.
    var menu = document.querySelector('.pfix-post-toc-m');
    if (menu)
      menu.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('a')) menu.open = false;
      });

    // Copy link.
    var copy = document.querySelector('[data-pfix-post-copy]');
    var said = document.querySelector('[data-pfix-post-copied]');
    if (copy && navigator.clipboard && window.isSecureContext) {
      copy.hidden = false;
      copy.addEventListener('click', function () {
        navigator.clipboard.writeText(copy.getAttribute('data-pfix-post-copy') || location.href).then(
          function () {
            if (!said) return;
            said.textContent = 'Link copied';
            setTimeout(function () {
              said.textContent = '';
            }, 2500);
          },
          function () {}
        );
      });
    }
  }

  function start() {
    each(document.querySelectorAll('[data-pfix-blog]'), listing);
    post();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
