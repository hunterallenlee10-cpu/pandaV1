/* The home page's estimate forms in two steps (scripts/lib/service-forms.mjs): ZIP code and
   what the visitor needs, then their contact details. The request that is sent is the
   one-step form's: the same field names, with "address" made of the street address and the
   ZIP code. Sending, the honeypot and the messages stay with site-fixes.js; this only moves
   between the steps. Without JavaScript the form shows both steps at once. */
(function () {
  'use strict';
  var ZIP = /^\d{5}(-\d{4})?$/;
  function all(root, selector) {
    return Array.prototype.slice.call(root.querySelectorAll(selector));
  }
  function setUp(form) {
    var steps = all(form, '[data-pfix-lead-step]');
    var progress = form.querySelector('[data-pfix-lead-progress]');
    var label = form.querySelector('[data-pfix-lead-progress-label]');
    var error = form.querySelector('.pfix-lead__error');
    var zip = form.querySelector('[data-pfix-lead-zip]');
    var street = form.querySelector('[data-pfix-lead-street]');
    var address = form.querySelector('[data-pfix-lead-address]');
    if (steps.length !== 2 || !zip || !street || !address) return;
    var names = ['your project', 'your contact details'];
    var current = 1;

    function show(n, focus) {
      current = n;
      steps.forEach(function (step, i) {
        step.hidden = i !== n - 1;
      });
      if (progress) {
        progress.setAttribute('aria-valuenow', String(n));
        progress.setAttribute('aria-valuetext', 'Step ' + n + ' of 2: ' + names[n - 1]);
      }
      if (label) label.textContent = 'Step ' + n + ' of 2';
      if (focus) {
        var field = typeof focus === 'object' ? focus : steps[n - 1].querySelector('input:not([type="hidden"]):not([tabindex="-1"]), select');
        if (field) field.focus();
      }
    }
    function fail(field, message) {
      field.setAttribute('aria-invalid', 'true');
      if (error) {
        error.textContent = message;
        error.hidden = false;
      }
      field.focus();
    }
    // Step 1's own check: a ZIP code and an answer to each question.
    function stepOneOk() {
      var value = (zip.value || '').trim();
      if (!ZIP.test(value)) {
        fail(zip, value ? 'Please check your ZIP code.' : 'ZIP code is needed.');
        return false;
      }
      var missing = all(steps[0], 'select').filter(function (el) {
        return el.required && !el.value;
      })[0];
      if (missing) {
        var name = (missing.closest('label') ? missing.closest('label').firstChild.textContent : '') || 'This field';
        fail(missing, name.trim() + ' Please choose one.');
        return false;
      }
      if (error) error.hidden = true;
      return true;
    }
    function compose() {
      var parts = [(street.value || '').trim(), (zip.value || '').trim()].filter(Boolean);
      address.value = parts.join(', ');
    }
    function next() {
      if (!stepOneOk()) return;
      compose();
      show(2, true);
    }

    form.classList.add('is-stepped');
    show(1, false);
    var nextBtn = form.querySelector('[data-pfix-lead-next]');
    var backBtn = form.querySelector('[data-pfix-lead-back]');
    if (nextBtn) nextBtn.addEventListener('click', next);
    if (backBtn)
      backBtn.addEventListener('click', function () {
        if (error) error.hidden = true;
        show(1, true);
      });
    // An error message goes as soon as the visitor edits a field.
    form.addEventListener('input', function () {
      if (error) error.hidden = true;
    });
    zip.addEventListener('input', compose);
    street.addEventListener('input', compose);

    // Before site-fixes.js checks and sends the form: Enter on step 1 goes to step 2, and the
    // address is put together.
    form.addEventListener(
      'submit',
      function (event) {
        if (current === 1 || !stepOneOk()) {
          event.preventDefault();
          event.stopPropagation();
          if (current === 1) next();
          else show(1, form.querySelector('[aria-invalid="true"]') || true);
          return;
        }
        compose();
      },
      true
    );
    // After it: a field it marked wrong on the other step is brought into view.
    document.addEventListener('submit', function (event) {
      if (event.target !== form) return;
      var bad = form.querySelector('[aria-invalid="true"]');
      if (!bad) return;
      var step = steps.indexOf(bad.closest('[data-pfix-lead-step]')) + 1;
      if (step && step !== current) show(step, bad);
    });
    // A "Claim" or "Book" link elsewhere on the page chooses the project and leads here.
    form.addEventListener('change', function (event) {
      if (event.target && event.target.tagName === 'SELECT' && event.target.value) event.target.removeAttribute('aria-invalid');
    });
  }
  function start() {
    all(document, 'form[data-pfix-lead-steps]').forEach(setUp);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
