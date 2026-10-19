// Sync shared markup into every page: node tools/partials.mjs
// A page marks a slot with <!-- NAME --> once; after the first run the slot is
// kept as <!-- NAME:start --> ... <!-- NAME:end --> so it can be refreshed.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PAGES = ['index.html', 'capitulum-1.html', 'contact.html', 'team.html'];
const SLOTS = { SPRITE: 'sprite.html', FOOTER: 'footer.html' };

for (const page of PAGES) {
  const path = join(ROOT, page);
  let html = await readFile(path, 'utf8');
  for (const [name, file] of Object.entries(SLOTS)) {
    const partial = (await readFile(join(ROOT, 'tools/partials', file), 'utf8')).trim();
    const block = `<!-- ${name}:start -->\n${partial}\n<!-- ${name}:end -->`;
    const kept = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`);
    if (kept.test(html)) html = html.replace(kept, block);
    else if (html.includes(`<!-- ${name} -->`)) html = html.replace(`<!-- ${name} -->`, block);
    else throw new Error(`${page} has no ${name} slot`);
  }
  await writeFile(path, html);
  process.stdout.write(`synced ${page}\n`);
}
