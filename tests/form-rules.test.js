const test = require('node:test');
const assert = require('node:assert/strict');
const { validateContact, normalize } = require('../assets/js/form-rules.js');

const valid = {
  firstName: 'Livia',
  lastName: 'Drusilla',
  email: 'livia@example.com',
  message: 'I would like to read Virgil.'
};

test('a complete request has no errors', () => {
  assert.deepEqual(validateContact(valid), {});
});

test('every empty field gets its own message', () => {
  assert.deepEqual(validateContact({}), {
    firstName: 'Enter your first name.',
    lastName: 'Enter your last name.',
    email: 'Enter your email address.',
    message: 'Tell us what you would like to learn.'
  });
});

test('whitespace-only values count as empty', () => {
  const errors = validateContact({ ...valid, firstName: '   ', message: '\n\t' });
  assert.equal(errors.firstName, 'Enter your first name.');
  assert.equal(errors.message, 'Tell us what you would like to learn.');
});

test('malformed email addresses are rejected', () => {
  for (const email of ['livia', 'livia@', 'livia@example', 'li via@example.com']) {
    assert.equal(validateContact({ ...valid, email }).email, 'Enter an email address like name@example.com.', email);
  }
});

test('over-long values are rejected', () => {
  assert.match(validateContact({ ...valid, firstName: 'x'.repeat(81) }).firstName, /under 80/);
  assert.match(validateContact({ ...valid, message: 'x'.repeat(2001) }).message, /under 2,000/);
});

test('normalize trims values and does not modify its input', () => {
  const input = Object.freeze({ firstName: '  Livia ', email: ' a@b.co ' });
  assert.deepEqual(normalize(input), { firstName: 'Livia', lastName: '', email: 'a@b.co', message: '' });
});
