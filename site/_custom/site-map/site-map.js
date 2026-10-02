// The Site Map page (/site-map/): search and filters for the list of pages.
// Markup: scripts/lib/site-map-page.mjs. Without this script every row shows.
(function () {
  var root = document.querySelector('.psm');
  if (!root) return;
  var tools = root.querySelector('[data-psm-tools]');
  var input = root.querySelector('[data-psm-search]');
  var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-psm-filter]'));
  var count = root.querySelector('[data-psm-count]');
  var empty = root.querySelector('[data-psm-empty]');
  var rows = Array.prototype.slice.call(root.querySelectorAll('.psm-row'));
  var groups = Array.prototype.slice.call(root.querySelectorAll('[data-psm-group]'));
  var filter = 'all';
  if (!tools || !input) return;
  tools.hidden = false;

  function update() {
    var words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    var shown = 0;
    rows.forEach(function (row) {
      var flags = ' ' + row.getAttribute('data-flags') + ' ';
      var text = row.getAttribute('data-search') || '';
      var ok =
        (filter === 'all' || flags.indexOf(' ' + filter + ' ') !== -1) &&
        words.every(function (w) {
          return text.indexOf(w) !== -1;
        });
      row.hidden = !ok;
      if (ok) shown++;
    });
    groups.forEach(function (g) {
      g.hidden = !g.querySelector('.psm-row:not([hidden])');
    });
    empty.hidden = shown !== 0;
    count.textContent = shown === rows.length ? 'Showing all ' + rows.length + ' pages.' : 'Showing ' + shown + ' of ' + rows.length + ' pages.';
  }

  function choose(f) {
    filter = f;
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-psm-filter') === f));
    });
    update();
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      choose(b.getAttribute('data-psm-filter'));
    });
  });
  input.addEventListener('input', update);
  update();
})();
