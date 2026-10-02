/* Script for the fixes in scripts/lib/site-fixes.mjs (no dependencies).
   - The phone-only "Share" button on blog posts opens the device's share sheet where the
     browser supports it; otherwise the link falls back to an email draft.
   - "Experts You Can Trust" (home page): the logos glide past in one continuous row.
   - /service-areas/, /about/, /podcast/, /roofing/: the service cards glide past the same
     way (.pfix-marquee--cards).
   - /service-areas/ hero: the state chips zoom the map to their state.
   - Service estimate forms: checked on submit, then a "not switched on yet" message.
   - /offers/: a "Claim" button chooses its offer's project in the estimate form it leads to.
   - /faqs/: the hero's search narrows the questions as you type, and the topic menu beside
     the questions shows which topic you are reading.
   - /gallery/: the hero's category chips and photos open their category's tab. */
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
  var SPEED = 42; // px per second (a row's data-speed overrides it)
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
    var speed = parseFloat(box.getAttribute('data-speed')) || SPEED;
    var hovered = false;

    function copyRow() {
      items.forEach(function (item) {
        var c = item.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        // the copies' links stay out of the keyboard order
        toArray(c.querySelectorAll('a, button')).forEach(function (el) {
          el.setAttribute('tabindex', '-1');
        });
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
      var progress = anim && width ? (anim.currentTime % ((width / speed) * 1000)) / ((width / speed) * 1000) : 0;
      if (anim) anim.cancel();
      width = w;
      var duration = (w / speed) * 1000;
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
      if (e.pointerType !== 'mouse') return;
      hovered = true;
      easeTo(0);
    });
    box.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      hovered = false;
      if (!box.contains(document.activeElement)) easeTo(1);
    });
    // Still while a link in the row has keyboard focus, so it stays where it is.
    box.addEventListener('focusin', function () {
      easeTo(0);
    });
    box.addEventListener('focusout', function (e) {
      if (!hovered && !box.contains(e.relatedTarget)) easeTo(1);
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

/* Service estimate forms (service-forms.mjs): not connected to anything yet. On submit the
   fields are checked; then, instead of pretending the request was sent, the card says
   online requests aren't switched on and offers the phone number. */
(function () {
  'use strict';
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function label(el) {
    return (el.getAttribute('placeholder') || (el.closest('label') ? el.closest('label').textContent : '') || 'This field').replace(/\s*\(optional\)$/, '').trim();
  }
  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || !form.hasAttribute || !form.hasAttribute('data-pfix-lead-form')) return;
    event.preventDefault();
    var error = form.querySelector('.pfix-lead__error');
    var bad = null;
    var message = '';
    Array.prototype.forEach.call(form.querySelectorAll('input, select'), function (el) {
      var value = (el.value || '').trim();
      var wrong = (el.required && !value) || (el.type === 'email' && value && !EMAIL.test(value)) || (el.type === 'tel' && value && value.replace(/\D/g, '').length < 10);
      if (wrong) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
      if (wrong && !bad) {
        bad = el;
        message = !value ? label(el) + ' is needed.' : el.type === 'email' ? 'Please check your email address.' : 'Please check your phone number.';
      }
    });
    if (bad) {
      if (error) {
        error.textContent = message;
        error.hidden = false;
      }
      bad.focus();
      return;
    }
    if (error) error.hidden = true;
    var box = form.closest('.pfix-lead');
    var done = box && box.querySelector('.pfix-lead__done');
    if (!done) return;
    var first = form.querySelector('[name="first_name"]');
    var name = done.querySelector('[data-pfix-lead-name]');
    if (name && first && first.value.trim()) name.textContent = ', ' + first.value.trim().split(/\s+/)[0];
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });
  // Clear a field's error mark as soon as it is edited.
  document.addEventListener('input', function (event) {
    var el = event.target;
    if (el && el.closest && el.closest('[data-pfix-lead-form]') && el.getAttribute('aria-invalid')) el.removeAttribute('aria-invalid');
  });
})();

/* /offers/: a "Claim" button leads to the hero's estimate form (smooth-scroll.js glides
   there) with its offer's project already chosen, unless the visitor chose one themselves. */
(function () {
  'use strict';
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[data-pfix-project]');
    if (!link) return;
    var id = (link.getAttribute('href') || '').replace(/^#/, '');
    var form = id && document.getElementById(id);
    var select = form && form.querySelector('select[name="project"]');
    // a project the visitor chose stays; one a "Claim" button chose follows the next button
    if (!select || (select.value && select.getAttribute('data-pfix-auto') !== select.value)) return;
    var want = link.getAttribute('data-pfix-project');
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].text === want && !select.options[i].disabled) {
        select.selectedIndex = i;
        select.setAttribute('data-pfix-auto', select.value);
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
  });
})();

/* /faqs/ (faq-page.mjs): the search in the hero narrows the questions below as you type
   (every word has to appear in the question or its answer); matching questions open, with
   the words marked in the question, and each topic's count in the menu shows its matches.
   Enter goes down to the questions. The topic menu marks the topic you are reading, and a
   link to one question (#faq-solar-2) opens it. Without JavaScript the search stays hidden
   and the questions are plain accordions. */
(function () {
  'use strict';
  var root = document.querySelector('[data-pfix-faq]');
  if (!root) return;
  var toArray = function (list) {
    return Array.prototype.slice.call(list);
  };
  var groups = toArray(root.querySelectorAll('[data-pfix-faq-group]'));
  var items = toArray(root.querySelectorAll('.pfix-fq__item'));
  var status = root.querySelector('[data-pfix-faq-status]');
  var empty = root.querySelector('[data-pfix-faq-empty]');
  var form = document.querySelector('[data-pfix-faq-search]');
  var input = form && form.querySelector('input');
  var norm = function (s) {
    return s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
  };
  var esc = function (s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  var entries = items.map(function (item) {
    var q = item.querySelector('.pfix-fq__q');
    return { item: item, q: q, question: q.textContent, text: norm(item.textContent), open: item.open };
  });

  function mark(text, words) {
    if (!words.length) return esc(text);
    var re = new RegExp('(' + words.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'gi');
    return text
      .split(re)
      .map(function (part, i) {
        return i % 2 ? '<mark>' + esc(part) + '</mark>' : esc(part);
      })
      .join('');
  }

  var searching = false;
  function search(value) {
    var query = norm(value);
    var words = query ? query.split(' ') : [];
    if (words.length && !searching) {
      entries.forEach(function (e) {
        e.open = e.item.open;
      });
    }
    var total = 0;
    entries.forEach(function (e) {
      var hit = words.every(function (w) {
        return e.text.indexOf(w) >= 0;
      });
      e.item.hidden = !hit;
      e.q.innerHTML = mark(e.question, words);
      if (words.length) e.item.open = hit;
      else if (searching) e.item.open = e.open;
      if (hit) total++;
    });
    searching = words.length > 0;
    groups.forEach(function (g) {
      var n = g.querySelectorAll('.pfix-fq__item:not([hidden])').length;
      g.hidden = n === 0;
      var count = root.querySelector('[data-pfix-faq-count="' + g.id + '"]');
      if (count) {
        count.textContent = n;
        count.parentNode.classList.toggle('is-empty', n === 0);
      }
    });
    root.classList.toggle('is-searching', searching);
    if (empty) empty.hidden = !searching || total > 0;
    if (status) {
      status.textContent = searching ? (total === 1 ? '1 question matches' : total + ' questions match') + ' “' + value.trim() + '”' : '';
    }
  }

  if (form && input) {
    form.hidden = false;
    input.addEventListener('input', function () {
      search(input.value);
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      search(input.value);
      // the result count and the first results, below the fixed header
      var target = root.querySelector('.pfix-fq__main') || root;
      var top = target.getBoundingClientRect().top + window.pageYOffset - 190;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
    if (input.value) search(input.value);
  }

  // The topic menu: the topic whose heading last passed the top third of the screen.
  var links = toArray(root.querySelectorAll('[data-pfix-faq-nav]'));
  function current() {
    var line = window.innerHeight * 0.35;
    var active = null;
    groups.forEach(function (g) {
      if (!g.hidden && g.getBoundingClientRect().top <= line) active = g.id;
    });
    if (!active) {
      var first = groups.filter(function (g) { return !g.hidden; })[0];
      active = first && first.id;
    }
    links.forEach(function (a) {
      var on = a.getAttribute('data-pfix-faq-nav') === active;
      a.classList.toggle('is-current', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  var ticking = false;
  window.addEventListener(
    'scroll',
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        current();
      });
    },
    { passive: true }
  );
  current();

  // A link to one question opens it.
  function openTarget() {
    var id = decodeURIComponent(location.hash.slice(1));
    var el = id && document.getElementById(id);
    if (el && el.classList.contains('pfix-fq__item')) el.open = true;
  }
  window.addEventListener('hashchange', openTarget);
  openTarget();
})();

/* /gallery/: a hero chip or photo (data-pfix-gallery-tab) opens its category's tab before
   the link takes the page down to the gallery: the tab button where the tabs show, the
   dropdown that stands in for them on phones otherwise. */
(function () {
  'use strict';
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('[data-pfix-gallery-tab]');
    if (!link) return;
    var value = link.getAttribute('data-pfix-gallery-tab');
    var tab = document.querySelector('.bde-tabs__tab[data-value="' + value + '"]');
    var select = document.querySelector('.bde-tabs__select');
    if (tab && tab.offsetParent) {
      tab.click();
    } else if (select) {
      var option = select.querySelector('option[data-value="' + value + '"]');
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
})();
