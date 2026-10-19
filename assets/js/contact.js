/* Consultation form: inline validation, optional delivery to a form endpoint, confirmation. */
(function () {
  'use strict';

  var form = document.querySelector('[data-contact-form]');
  var rules = window.FormRules;
  if (!form || !rules) return;

  var FIELDS = ['firstName', 'lastName', 'email', 'message'];
  var SIMULATED_SEND_MS = 600;
  var submit = form.querySelector('[data-submit]');
  var status = form.querySelector('[data-status]');
  var done = document.querySelector('[data-done]');
  var attempted = false;

  function values() {
    var data = new FormData(form);
    return rules.normalize({
      firstName: data.get('firstName'),
      lastName: data.get('lastName'),
      email: data.get('email'),
      message: data.get('message')
    });
  }

  function showErrors(errors) {
    FIELDS.forEach(function (name) {
      var input = form.elements[name];
      var message = errors[name] || '';
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      document.getElementById(input.id + '-error').textContent = message;
    });
  }

  function send(payload) {
    var endpoint = form.getAttribute('data-endpoint');
    if (!endpoint) {
      return new Promise(function (resolve) { setTimeout(resolve, SIMULATED_SEND_MS); });
    }
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(rules.toSubmission(payload))
    }).then(function (response) {
      return response.json().catch(function () { return null; }).then(function (reply) {
        if (!response.ok || !rules.isDelivered(reply)) {
          throw new Error('Form endpoint did not accept the message (' + response.status + ')');
        }
      });
    });
  }

  // Bots fill the hidden field; skip sending for them but behave as if it worked.
  function isBot() {
    var trap = form.elements._honey;
    return Boolean(trap && trap.value);
  }

  function setBusy(busy) {
    submit.disabled = busy;
    submit.setAttribute('aria-busy', String(busy));
    submit.firstChild.textContent = busy ? 'Sending… ' : 'Send request ';
  }

  function showDone(payload) {
    done.querySelector('[data-done-name]').textContent = payload.firstName;
    done.querySelector('[data-done-email]').textContent = payload.email;
    form.hidden = true;
    done.hidden = false;
    done.querySelector('[data-done-title]').focus();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    attempted = true;
    status.textContent = '';
    var payload = values();
    var errors = rules.validateContact(payload);
    showErrors(errors);

    var firstInvalid = FIELDS.filter(function (name) { return errors[name]; })[0];
    if (firstInvalid) {
      form.elements[firstInvalid].focus();
      return;
    }

    setBusy(true);
    (isBot() ? Promise.resolve() : send(payload))
      .then(function () { showDone(payload); })
      .catch(function () {
        status.textContent = 'Your request didn’t send. Check your connection and try again.';
      })
      .finally(function () { setBusy(false); });
  });

  // After the first submit, re-check each field as it is edited.
  form.addEventListener('input', function () {
    if (attempted) showErrors(rules.validateContact(values()));
  });
})();
