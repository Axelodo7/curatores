const test = require('node:test');
const assert = require('node:assert/strict');
const { renderConsultationEmail, SITE_URL } = require('../lib/consultation-email.js');

const values = {
  firstName: 'Livia',
  lastName: 'Drusilla',
  email: 'livia@example.com',
  message: 'I would like to read Virgil.\nWhere should I start?'
};

test('subject names the sender', () => {
  assert.equal(renderConsultationEmail(values).subject, 'Consultation request from Livia Drusilla');
});

test('html carries the site theme, the logo and a reply link', () => {
  const { html } = renderConsultationEmail(values);
  assert.match(html, /background-color:#9c2e25/);
  assert.match(html, new RegExp(`${SITE_URL}/assets/img/email/logo.png`));
  assert.match(html, /href="mailto:livia%40example\.com\?subject=/);
  assert.match(html, /Reply to Livia/);
});

test('a wide card on a light backdrop, with the red kept to the header band', () => {
  const { html } = renderConsultationEmail(values);
  assert.match(html, /<body style="[^"]*background-color:#f4ede1/);
  assert.match(html, /max-width:720px/);
  assert.doesNotMatch(html, /max-width:600px/);
  // A fixed-size block, so a tall name beside it can't stretch the circle into an oval.
  assert.match(html, /<div style="width:60px;height:60px;[^"]*">L<\/div>/, 'monogram shows the first initial');
});

test('monogram copes with names that start with an accent or emoji', () => {
  assert.match(renderConsultationEmail({ ...values, firstName: 'élodie' }).html, />É<\/div>/);
  assert.match(renderConsultationEmail({ ...values, firstName: '🦉 Owl' }).html, />🦉<\/div>/);
});

test('logo, links and footer point at the ivcuratores.org domain', () => {
  const { html, text } = renderConsultationEmail(values);
  assert.equal(SITE_URL, 'https://ivcuratores.org');
  assert.match(html, /src="https:\/\/ivcuratores\.org\/assets\/img\/email\/logo\.png"/);
  assert.match(html, /consultation form on <a href="https:\/\/ivcuratores\.org"[^>]*>ivcuratores\.org<\/a>/);
  assert.doesNotMatch(html + text, /vercel\.app/);
});

test('message line breaks become <br> and user input is escaped', () => {
  const { html } = renderConsultationEmail({
    ...values,
    firstName: '<b>Livia</b>',
    message: 'Line one\n<script>alert(1)</script> & more'
  });
  assert.match(html, /Line one<br>&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; more/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<b>Livia<\/b>/);
});

test('plain-text version has the essentials', () => {
  const { text } = renderConsultationEmail(values);
  assert.match(text, /Name: Livia Drusilla/);
  assert.match(text, /Email: livia@example\.com/);
  assert.match(text, /I would like to read Virgil\.\nWhere should I start\?/);
});

test('siteUrl option replaces the live address (for local previews)', () => {
  const { html } = renderConsultationEmail(values, { siteUrl: 'http://127.0.0.1:4190' });
  assert.match(html, /http:\/\/127\.0\.0\.1:4190\/assets\/img\/email\/logo\.png/);
  assert.match(html, />127\.0\.0\.1:4190<\/a>/);
  assert.doesNotMatch(html, /ivcuratores\.org\/assets/);
});
