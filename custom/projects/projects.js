/* "Browse all of our projects" on /past-projects/ (scripts/lib/project-pages.mjs): the type
   buttons show the projects of one type. Without this script the buttons stay hidden and
   every project shows. The project pages' photos open in the project gallery's viewer
   (custom/project-gallery/project-gallery.js). */
(function () {
  'use strict';

  function initArchive(root) {
    var bar = root.querySelector('.ppj-filters');
    var grid = root.querySelector('[data-ppj-archive]');
    if (!bar || !grid) return;
    var buttons = Array.prototype.slice.call(bar.querySelectorAll('button[data-filter]'));
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.ppj-card'));
    var status = root.querySelector('.ppj-archive__status');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function show(key, button) {
      var n = 0;
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === button));
      });
      cards.forEach(function (c) {
        var on = key === 'all' || c.getAttribute('data-group') === key;
        var was = !c.hidden;
        c.hidden = !on;
        c.classList.remove('is-entering');
        if (on) {
          n++;
          if (!was && !reduce) {
            void c.offsetWidth;
            c.classList.add('is-entering');
          }
        }
      });
      if (status) status.textContent = 'Showing ' + n + ' project' + (n === 1 ? '' : 's') + (key === 'all' ? '' : ': ' + button.firstChild.textContent.trim());
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        show(b.getAttribute('data-filter'), b);
      });
    });
    bar.hidden = false;
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.ppj-archive'), initArchive);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
