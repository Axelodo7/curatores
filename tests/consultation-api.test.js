const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../api/consultation.js');

const valid = {
  firstName: 'Livia',
  lastName: 'Drusilla',
  email: 'livia@example.com',
  message: 'I would like to read Virgil.'
};

function setup(options = {}) {
  const calls = [];
  const logs = [];
  let clock = 0;
  const handler = createHandler({
    fetchImpl: async (url, init) => {
      calls.push({ url, init, body: JSON.parse(init.body) });
      if (options.fetchThrows) throw new Error('network down');
      return options.resendResponse || { ok: true, status: 200, text: async () => '{}' };
    },
    env: 'env' in options ? options.env : { RESEND_API_KEY: 're_test_key' },
    now: () => clock,
    log: (...args) => logs.push(args)
  });
  const advance = (ms) => { clock += ms; };
  return { handler, calls, logs, advance };
}

function request(overrides = {}) {
  return {
    method: 'POST',
    headers: { origin: 'https://curatores.vercel.app', 'x-forwarded-for': '203.0.113.7', ...overrides.headers },
    body: 'body' in overrides ? overrides.body : { ...valid }
  };
}

function response() {
  const res = { statusCode: 200, headers: {}, payload: undefined };
  res.setHeader = (key, value) => { res.headers[key] = value; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.payload = data; return res; };
  return res;
}

async function call(handler, req) {
  const res = response();
  await handler(req, res);
  return res;
}

test('a valid request is emailed through Resend to the Curatores inbox', async () => {
  const { handler, calls } = setup();
  const res = await call(handler, request());
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, { success: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer re_test_key');
  assert.equal(calls[0].body.from, 'Curatores website <consultations@ivcuratores.org>');
  assert.deepEqual(calls[0].body.to, ['ivcuratores@gmail.com']);
  assert.equal(calls[0].body.reply_to, 'livia@example.com');
  assert.equal(calls[0].body.subject, 'Consultation request from Livia Drusilla');
  assert.match(calls[0].body.html, /Livia Drusilla/);
  assert.match(calls[0].body.text, /I would like to read Virgil/);
});

test('a JSON string body is parsed too', async () => {
  const { handler, calls } = setup();
  const res = await call(handler, request({ body: JSON.stringify(valid) }));
  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 1);
});

test('only POST is accepted', async () => {
  const { handler, calls } = setup();
  const res = await call(handler, { ...request(), method: 'GET' });
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, 'POST');
  assert.equal(calls.length, 0);
});

test('requests from other websites are refused; the domain, previews and local dev are allowed', async () => {
  const { handler } = setup();
  assert.equal((await call(handler, request({ headers: { origin: 'https://evil.example' } }))).statusCode, 403);
  assert.equal((await call(handler, request({ headers: { origin: 'https://ivcuratores.org.evil.example' } }))).statusCode, 403);
  assert.equal((await call(handler, request({ headers: { origin: 'https://ivcuratores.org' } }))).statusCode, 200);
  assert.equal((await call(handler, request({ headers: { origin: 'https://www.ivcuratores.org' } }))).statusCode, 200);
  assert.equal((await call(handler, request({ headers: { origin: 'https://curatores-abc123-team.vercel.app' } }))).statusCode, 200);
  assert.equal((await call(handler, request({ headers: { origin: 'http://127.0.0.1:4190' } }))).statusCode, 200);
});

test('invalid input is rejected with the same messages the form shows', async () => {
  const { handler, calls } = setup();
  const res = await call(handler, request({ body: { ...valid, email: 'not-an-email' } }));
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.errors.email, 'Enter an email address like name@example.com.');
  assert.equal(calls.length, 0);
});

test('the honeypot is accepted quietly and nothing is sent', async () => {
  const { handler, calls } = setup();
  const res = await call(handler, request({ body: { ...valid, _honey: 'spam' } }));
  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 0);
});

test('without an API key the function says it is not configured', async () => {
  const { handler, calls } = setup({ env: {} });
  const res = await call(handler, request());
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.payload, { success: false, error: 'not-configured' });
  assert.equal(calls.length, 0);
});

test('a Resend error or network failure is reported as send-failed and logged', async () => {
  const rejected = setup({ resendResponse: { ok: false, status: 422, text: async () => '{"message":"bad"}' } });
  const res = await call(rejected.handler, request());
  assert.equal(res.statusCode, 502);
  assert.equal(res.payload.error, 'send-failed');
  assert.equal(rejected.logs.length, 1);

  const offline = setup({ fetchThrows: true });
  assert.equal((await call(offline.handler, request())).statusCode, 502);
  assert.equal(offline.logs.length, 1);
});

test('more than five requests from one address in ten minutes are refused', async () => {
  const { handler, calls, advance } = setup();
  for (let i = 0; i < 5; i++) assert.equal((await call(handler, request())).statusCode, 200);
  assert.equal((await call(handler, request())).statusCode, 429);
  assert.equal((await call(handler, request({ headers: { 'x-forwarded-for': '198.51.100.2' } }))).statusCode, 200);
  advance(10 * 60 * 1000 + 1);
  assert.equal((await call(handler, request())).statusCode, 200);
  assert.equal(calls.length, 7);
});
