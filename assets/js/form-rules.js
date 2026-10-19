/*
  Consultation form rules with no DOM access, shared by the browser
  (window.FormRules) and the Node tests (module.exports).
*/
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FormRules = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LIMITS = Object.freeze({ name: 80, email: 254, message: 2000 });
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * @param {{firstName?: string, lastName?: string, email?: string, message?: string}} values
   * @returns {{firstName: string, lastName: string, email: string, message: string}}
   */
  function normalize(values) {
    var source = values || {};
    return {
      firstName: String(source.firstName || '').trim(),
      lastName: String(source.lastName || '').trim(),
      email: String(source.email || '').trim(),
      message: String(source.message || '').trim()
    };
  }

  /**
   * @param {{firstName?: string, lastName?: string, email?: string, message?: string}} values
   * @returns {Object<string, string>} field name to error message; empty when valid
   */
  function validateContact(values) {
    var v = normalize(values);
    var errors = {};

    if (!v.firstName) errors.firstName = 'Enter your first name.';
    else if (v.firstName.length > LIMITS.name) errors.firstName = 'Keep your first name under ' + LIMITS.name + ' characters.';

    if (!v.lastName) errors.lastName = 'Enter your last name.';
    else if (v.lastName.length > LIMITS.name) errors.lastName = 'Keep your last name under ' + LIMITS.name + ' characters.';

    if (!v.email) errors.email = 'Enter your email address.';
    else if (v.email.length > LIMITS.email || !EMAIL_PATTERN.test(v.email)) {
      errors.email = 'Enter an email address like name@example.com.';
    }

    if (!v.message) errors.message = 'Tell us what you would like to learn.';
    else if (v.message.length > LIMITS.message) errors.message = 'Keep your message under 2,000 characters.';

    return errors;
  }

  /**
   * The JSON body posted to the form service (FormSubmit field names).
   * @param {{firstName?: string, lastName?: string, email?: string, message?: string}} values
   * @returns {{name: string, email: string, message: string, _subject: string, _template: string}}
   */
  function toSubmission(values) {
    var v = normalize(values);
    var name = (v.firstName + ' ' + v.lastName).trim();
    return {
      name: name,
      email: v.email,
      message: v.message,
      _subject: 'Consultation request from ' + name,
      _template: 'table'
    };
  }

  /**
   * Whether the form service accepted the message. FormSubmit answers 200 with
   * success "false" until the inbox owner activates the form, so status alone is not enough.
   * @param {unknown} reply parsed JSON from the service
   * @returns {boolean}
   */
  function isDelivered(reply) {
    if (!reply || typeof reply !== 'object') return false;
    return reply.success === true || reply.success === 'true' || reply.ok === true;
  }

  return Object.freeze({
    LIMITS: LIMITS,
    normalize: normalize,
    validateContact: validateContact,
    toSubmission: toSubmission,
    isDelivered: isDelivered
  });
});
