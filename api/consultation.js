/*
  POST /api/consultation (Vercel serverless function)
  Validates a consultation request and emails it to Curatores through Resend.

  Needs the RESEND_API_KEY environment variable, from a Resend account registered
  with ivcuratores@gmail.com. Until it is set, the function answers 503
  "not-configured" and the browser falls back to FormSubmit.
*/
'use strict';

const { normalize, validateContact } = require('../assets/js/form-rules.js');
const { renderConsultationEmail } = require('../lib/consultation-email.js');

const TO = 'ivcuratores@gmail.com';
// Needs ivcuratores.org verified in the Resend account that owns RESEND_API_KEY; the address needs no mailbox.
const FROM = 'Curatores website <consultations@ivcuratores.org>';
const RESEND_URL = 'https://api.resend.com/emails';
const ALLOWED_ORIGIN = /^(https:\/\/(www\.)?ivcuratores\.org|https:\/\/curatores(-[a-z0-9-]+)?\.vercel\.app|http:\/\/(127\.0\.0\.1|localhost)(:\d+)?)$/;
const RATE_LIMIT = Object.freeze({ max: 5, windowMs: 10 * 60 * 1000, trackedIps: 1000 });

function parseBody(body) {
  if (body && typeof body === 'object') return body;
  if (typeof body !== 'string') return {};
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
}

/**
 * Builds the handler with its outside dependencies, so tests can supply fakes.
 * @param {{fetchImpl: Function, env: Object, now: () => number, log: Function}} deps
 */
function createHandler(deps) {
  const { fetchImpl, env, now, log } = deps;
  // Per-instance limit: a serverless instance is short-lived, so this only slows bursts.
  const hits = new Map();

  function isRateLimited(ip) {
    const cutoff = now() - RATE_LIMIT.windowMs;
    const recent = (hits.get(ip) || []).filter((time) => time > cutoff);
    if (hits.size > RATE_LIMIT.trackedIps) hits.clear();
    if (recent.length >= RATE_LIMIT.max) {
      hits.set(ip, recent);
      return true;
    }
    hits.set(ip, recent.concat(now()));
    return false;
  }

  function reply(res, status, body) {
    res.status(status).json(body);
  }

  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return reply(res, 405, { success: false, error: 'method-not-allowed' });
    }
    const origin = req.headers.origin;
    if (origin && !ALLOWED_ORIGIN.test(origin)) {
      return reply(res, 403, { success: false, error: 'forbidden-origin' });
    }
    if (isRateLimited(clientIp(req))) {
      return reply(res, 429, { success: false, error: 'rate-limited' });
    }

    const body = parseBody(req.body);
    // Bots fill the hidden field: accept quietly and send nothing.
    if (body._honey) return reply(res, 200, { success: true });

    const values = normalize(body);
    const errors = validateContact(values);
    if (Object.keys(errors).length > 0) {
      return reply(res, 400, { success: false, error: 'invalid', errors });
    }

    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) return reply(res, 503, { success: false, error: 'not-configured' });

    const email = renderConsultationEmail(values);
    try {
      const response = await fetchImpl(RESEND_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: [TO],
          reply_to: values.email,
          subject: email.subject,
          html: email.html,
          text: email.text
        })
      });
      if (!response.ok) {
        log('Resend rejected the consultation email', response.status, await response.text());
        return reply(res, 502, { success: false, error: 'send-failed' });
      }
    } catch (error) {
      log('Could not reach Resend', error instanceof Error ? error.message : error);
      return reply(res, 502, { success: false, error: 'send-failed' });
    }
    return reply(res, 200, { success: true });
  };
}

module.exports = createHandler({
  fetchImpl: (...args) => fetch(...args),
  env: process.env,
  now: () => Date.now(),
  log: (...args) => console.error(...args)
});
module.exports.createHandler = createHandler;
