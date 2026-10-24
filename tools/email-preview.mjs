// Preview the consultation email: node tools/email-preview.mjs [--out dir]
// Writes email-preview.html with sample content, exactly as sent from the live site;
// set PREVIEW_SITE=http://127.0.0.1:4190 (with npm run serve) to try unreleased images.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { renderConsultationEmail, SITE_URL } = require('../lib/consultation-email.js');

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const OUT = outIndex === -1 ? '.shots' : args[outIndex + 1];
const SITE = process.env.PREVIEW_SITE || SITE_URL;

const sample = {
  firstName: 'Livia',
  lastName: 'Drusilla',
  email: 'livia@example.com',
  message: 'Salve! I studied a little Latin at school and would like to read Virgil in the original.\n\nCould we talk about which program would suit me?'
};

const email = renderConsultationEmail(sample, { siteUrl: SITE });
await mkdir(OUT, { recursive: true });
const file = join(OUT, 'email-preview.html');
await writeFile(file, email.html);
process.stdout.write(`Subject: ${email.subject}\nWrote ${file}\n`);
