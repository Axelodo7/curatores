// Minimal static server for local preview: node tools/serve.mjs [port]
// Text files are gzipped, as any static host would, so speed checks are realistic.
// /api/consultation runs the real Vercel function; set RESEND_API_KEY to send for real.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.argv[2] || process.env.PORT || 4190);
const FUNCTIONS = { '/api/consultation': require('../api/consultation.js') };
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.svg']);

// Just enough of Vercel's request/response helpers for our handlers.
async function runFunction(handler, req, res) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  let body = raw;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    body = raw;
  }
  const headers = {};
  let status = 200;
  const response = {
    setHeader: (key, value) => { headers[key] = value; },
    status: (code) => { status = code; return response; },
    json: (data) => {
      res.writeHead(status, { ...headers, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    }
  };
  await handler({ method: req.method, headers: req.headers, body }, response);
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (FUNCTIONS[path]) {
    await runFunction(FUNCTIONS[path], req, res);
    return;
  }
  const file = normalize(join(ROOT, path.endsWith('/') ? path + 'index.html' : path));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const ext = extname(file);
    let body = await readFile(file);
    const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' };
    if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      body = gzipSync(body);
      headers['Content-Encoding'] = 'gzip';
      headers.Vary = 'Accept-Encoding';
    }
    res.writeHead(200, headers);
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}).listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`Curatores at http://127.0.0.1:${PORT}/\n`);
});
