/* Panda Exteriors — the review wall on /reviews/ (see README.md in this folder).
   The first reviews are in the page; the whole list is loaded from the section's data-src
   when it is needed (a filter, a search or "Show more reviews"). No dependencies. */
(function () {
  'use strict';

  var STAR = 'M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 0 0 .95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 0 0-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 0 0-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 0 0-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 0 0 .95-.69z';
  var STARS = '<span class="prw-stars">' + new Array(6).join('<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="' + STAR + '"/></svg>') + '</span>';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function initials(name) {
    var out = name
      .replace(/[^\p{L}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map(function (w) {
        return w[0];
      })
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return out || '★';
  }
  function plural(n, word) {
    return n.toLocaleString('en-US') + ' ' + word + (n === 1 ? '' : 's');
  }

  function init(root) {
    var grid = root.querySelector('.prw__grid');
    var toolbar = root.querySelector('.prw__toolbar');
    var chips = Array.prototype.slice.call(root.querySelectorAll('.prw__chip'));
    var input = root.querySelector('.prw__search input');
    var status = root.querySelector('.prw__status');
    var more = root.querySelector('.prw__more');
    var empty = root.querySelector('.prw__empty');
    var clear = root.querySelector('.prw__clear');
    var page = parseInt(root.getAttribute('data-page'), 10) || 24;
    var total = parseInt(root.getAttribute('data-total'), 10) || 0;
    var gG = root.querySelector('.prw-card__src');
    var googleMark = gG ? gG.innerHTML : '';
    var state = { topic: '', q: '', shown: page };
    var list = null; // the whole list, once loaded
    var loading = null;
    var uid = 0;

    root.classList.add('is-ready');
    if (toolbar) toolbar.hidden = false;

    function load() {
      if (list) return Promise.resolve(list);
      if (loading) return loading;
      loading = fetch(root.getAttribute('data-src'), { credentials: 'same-origin' })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          return r.json();
        })
        .then(function (d) {
          list = d.reviews || [];
          return list;
        })
        .catch(function () {
          loading = null;
          return null;
        });
      return loading;
    }

    function highlight(text, q) {
      var safe = esc(text);
      if (!q) return safe;
      var re = new RegExp('(' + esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      return safe.replace(re, '<mark>$1</mark>');
    }

    function card(r) {
      var id = 'prw-more-' + ++uid;
      var meta = [r.guide ? 'Local Guide' : '', r.date].filter(Boolean).join(' · ');
      return (
        '<article class="prw-card is-new" data-topics="' + esc(r.topics.join(' ')) + '">' +
        '<div class="prw-card__head">' +
        '<span class="prw-card__avatar" aria-hidden="true"><span>' + esc(initials(r.name)) + '</span>' +
        (r.avatar ? '<img src="' + esc(r.avatar) + '" alt="" width="44" height="44" loading="lazy" decoding="async" referrerpolicy="no-referrer">' : '') +
        '</span>' +
        '<span class="prw-card__who"><span class="prw-card__name">' + esc(r.name) + '</span>' +
        (meta ? '<span class="prw-card__meta">' + esc(meta) + '</span>' : '') +
        '</span>' +
        (r.google && googleMark ? '<span class="prw-card__src" title="Posted on Google">' + googleMark + '</span>' : '') +
        '</div>' +
        '<span class="prw-card__stars" role="img" aria-label="Rated 5 out of 5">' + STARS + '</span>' +
        '<p class="prw-card__text" id="' + id + '">' + highlight(r.text, state.q) + '</p>' +
        '<button class="prw-card__more" type="button" aria-expanded="false" aria-controls="' + id + '" hidden>Read more</button>' +
        '</article>'
      );
    }

    function matches(r) {
      if (state.topic && r.topics.indexOf(state.topic) < 0) return false;
      if (!state.q) return true;
      var q = state.q.toLowerCase();
      return r.text.toLowerCase().indexOf(q) >= 0 || r.name.toLowerCase().indexOf(q) >= 0;
    }

    // "Read more" only on reviews that are cut short.
    function fitMore(scope) {
      var cards = scope.querySelectorAll('.prw-card:not(.is-open)');
      for (var i = 0; i < cards.length; i++) {
        var t = cards[i].querySelector('.prw-card__text');
        var b = cards[i].querySelector('.prw-card__more');
        if (t && b) b.hidden = t.scrollHeight <= t.clientHeight + 2;
      }
    }

    function render(from) {
      var hits = list.filter(matches);
      var shown = hits.slice(0, state.shown);
      if (from > 0 && from <= shown.length) {
        grid.insertAdjacentHTML('beforeend', shown.slice(from).map(card).join(''));
      } else {
        grid.innerHTML = shown.map(card).join('');
      }
      fitMore(grid);
      empty.hidden = hits.length > 0;
      more.hidden = hits.length <= shown.length;
      var what = state.topic || state.q ? plural(hits.length, 'matching review') : plural(hits.length, 'five-star review');
      status.textContent = hits.length > shown.length ? 'Showing ' + shown.length.toLocaleString('en-US') + ' of ' + what : what;
    }

    function update(from) {
      load().then(function (l) {
        if (l) return render(from || 0);
        // The list didn't load: filter the reviews in the page.
        var cards = grid.querySelectorAll('.prw-card');
        var n = 0;
        for (var i = 0; i < cards.length; i++) {
          var c = cards[i];
          var topics = (c.getAttribute('data-topics') || '').split(' ');
          var ok = (!state.topic || topics.indexOf(state.topic) >= 0) && (!state.q || c.textContent.toLowerCase().indexOf(state.q.toLowerCase()) >= 0);
          c.hidden = !ok;
          if (ok) n++;
        }
        empty.hidden = n > 0;
        more.hidden = true;
        status.textContent = plural(n, state.topic || state.q ? 'matching review' : 'five-star review');
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        state.topic = chip.getAttribute('data-topic') || '';
        state.shown = page;
        chips.forEach(function (c) {
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        update();
      });
    });

    var timer;
    if (input) {
      input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          var q = input.value.trim();
          if (q === state.q) return;
          state.q = q;
          state.shown = page;
          update();
        }, 180);
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') e.preventDefault();
      });
    }

    if (clear) {
      clear.addEventListener('click', function () {
        state.topic = '';
        state.q = '';
        state.shown = page;
        if (input) input.value = '';
        chips.forEach(function (c) {
          c.setAttribute('aria-pressed', c.getAttribute('data-topic') ? 'false' : 'true');
        });
        update();
        if (input) input.focus();
      });
    }

    more.addEventListener('click', function () {
      var from = grid.querySelectorAll('.prw-card').length;
      state.shown += page;
      more.disabled = true;
      load().then(function (l) {
        more.disabled = false;
        if (!l) {
          more.hidden = true;
          return;
        }
        render(from);
        // Keyboard users carry on from the first new review.
        var first = grid.querySelectorAll('.prw-card')[from];
        if (first && document.activeElement === more && more.hidden) {
          first.setAttribute('tabindex', '-1');
          first.focus({ preventScroll: true });
        }
      });
    });

    grid.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.prw-card__more');
      if (!b) return;
      var c = b.closest('.prw-card');
      var open = !c.classList.contains('is-open');
      c.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.textContent = open ? 'Show less' : 'Read more';
    });

    // A reviewer photo that doesn't load: the initials behind it show instead.
    grid.addEventListener(
      'error',
      function (e) {
        if (e.target && e.target.tagName === 'IMG') e.target.remove();
      },
      true
    );
    Array.prototype.forEach.call(grid.querySelectorAll('img'), function (img) {
      if (img.complete && img.naturalWidth === 0) img.remove();
    });

    fitMore(grid);
    more.hidden = total <= grid.querySelectorAll('.prw-card').length;
    if (!more.hidden) status.textContent = 'Showing ' + grid.querySelectorAll('.prw-card').length + ' of ' + plural(total, 'five-star review');
    var resized;
    window.addEventListener('resize', function () {
      clearTimeout(resized);
      resized = setTimeout(function () {
        fitMore(grid);
      }, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
      fitMore(grid);
    });
  }

  function start() {
    Array.prototype.forEach.call(document.querySelectorAll('.prw'), init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
