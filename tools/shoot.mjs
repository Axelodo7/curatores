// Visual check: node tools/shoot.mjs <pages|hero|quiz|contact|all> [--out dir] [--url base]
// Needs the dev server (npm run serve) and puppeteer-core with the system Chrome.
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const MODE = args[0] && !args[0].startsWith('--') ? args[0] : 'all';
const OUT = flag('--out', '.shots');
const BASE = flag('--url', 'http://127.0.0.1:4190/');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  small: { width: 320, height: 640, isMobile: true, hasTouch: true }
};
const PAGES = ['index.html', 'capitulum-1.html', 'contact.html'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];

async function open(browser, path, viewport, { reducedMotion = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  if (reducedMotion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') problems.push(`${path} console ${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`${path} pageerror: ${err.message}`));
  await page.goto(BASE + path, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await sleep(1500);
}

async function checkOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    if (doc.scrollWidth <= doc.clientWidth) return null;
    const wide = [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1)
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, wide };
  });
  if (overflow) problems.push(`${label} horizontal overflow: ${JSON.stringify(overflow)}`);
}

async function shootPages(browser) {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    for (const path of PAGES) {
      const page = await open(browser, path, viewport);
      await scrollThrough(page);
      await checkOverflow(page, `${path}@${name}`);
      await page.screenshot({ path: join(OUT, `${path.replace('.html', '')}-${name}.png`), fullPage: true });
      await page.close();
    }
  }
}

async function shootHero(browser) {
  const page = await open(browser, 'index.html', VIEWPORTS.desktop);
  for (const t of [350, 800, 1300, 2600]) {
    await sleep(t - (shootHero.last || 0));
    shootHero.last = t;
    await page.screenshot({ path: join(OUT, `hero-${t}ms.png`) });
  }
  await page.close();
  const mobile = await open(browser, 'index.html', VIEWPORTS.mobile);
  await sleep(4200);
  await mobile.screenshot({ path: join(OUT, 'hero-mobile.png') });
  await mobile.close();
  const reduced = await open(browser, 'index.html', VIEWPORTS.desktop, { reducedMotion: true });
  await sleep(800);
  await reduced.screenshot({ path: join(OUT, 'hero-reduced.png') });
  await reduced.close();
}

async function shootExplore(browser) {
  for (const [name, viewport] of [['desktop', VIEWPORTS.desktop], ['mobile', VIEWPORTS.mobile]]) {
    const page = await open(browser, 'index.html', viewport);
    await page.evaluate(() => document.querySelector('#explore').scrollIntoView({ behavior: 'instant' }));
    await sleep(3400);
    const section = await page.$('#explore');
    await section.screenshot({ path: join(OUT, `explore-${name}.png`) });
    if (name === 'desktop') {
      await page.click('#explore-tab-8');
      await sleep(2600);
      await section.screenshot({ path: join(OUT, 'explore-picked.png') });
    }
    await page.close();
  }
}

async function shootLesson(browser) {
  const page = await open(browser, 'capitulum-1.html', VIEWPORTS.desktop);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await page.evaluate(() => document.querySelector('#vocabulary').scrollIntoView({ behavior: 'instant' }));
  await sleep(1200);
  const cards = await page.$$('.flashcard');
  await cards[4].click();
  await cards[9].click();
  await sleep(900);
  await (await page.$('#vocabulary')).screenshot({ path: join(OUT, 'lesson-vocab.png') });
  await page.click('[data-flip-all]');
  await sleep(1500);
  await page.evaluate(() => document.querySelector('#cases').scrollIntoView({ behavior: 'instant' }));
  await sleep(1000);
  for (let i = 1; i < 7; i++) {
    await page.click(`#cases [role="tab"]:nth-of-type(${i + 1})`);
    await sleep(120);
  }
  await page.click('#case-tab-acc');
  await sleep(1100);
  await (await page.$('#cases')).screenshot({ path: join(OUT, 'lesson-cases.png') });
  await page.evaluate(() => document.querySelector('#etymology').scrollIntoView({ behavior: 'instant' }));
  await sleep(1000);
  await page.click('#tab-law');
  await sleep(300);
  await page.click('#tab-paleontology');
  await sleep(1200);
  await (await page.$('#etymology')).screenshot({ path: join(OUT, 'lesson-etymology.png') });
  const progress = await page.evaluate(() => JSON.stringify(window.CuratoresProgress.get()));
  process.stdout.write(`progress after vocab/cases/etymology: ${progress}\n`);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(1400);
  await page.screenshot({ path: join(OUT, 'lesson-hero.png') });
  await page.close();
}

async function shootQuiz(browser) {
  const page = await open(browser, 'capitulum-1.html', VIEWPORTS.desktop);
  await page.evaluate(() => document.querySelector('#quiz').scrollIntoView());
  await sleep(1400);
  const quiz = await page.$('[data-quiz]');
  await quiz.screenshot({ path: join(OUT, 'quiz-start.png') });
  // Question 1: pick "Mother" (wrong) to see the error state.
  await page.click('.option[data-choice="0"]');
  await sleep(700);
  await quiz.screenshot({ path: join(OUT, 'quiz-wrong.png') });
  const answers = await page.evaluate(() => window.CURATORES_QUIZ.map((q) => q.answer));
  for (let i = 1; i < answers.length; i++) {
    await page.click('.quiz__actions .btn');
    await sleep(750);
    // Miss question 9 too, answer the rest by keyboard.
    const choice = i === 8 ? (answers[i] + 1) % 4 : answers[i];
    await page.keyboard.press(String(choice + 1));
    await sleep(150);
    if (i === 1) await quiz.screenshot({ path: join(OUT, 'quiz-right.png') });
  }
  await page.click('.quiz__actions .btn');
  await sleep(2200);
  await quiz.screenshot({ path: join(OUT, 'quiz-result.png') });
  const result = await page.evaluate(() => document.querySelector('.quiz__honor').textContent + ' / ' + document.querySelector('.quiz__total').textContent);
  process.stdout.write(`quiz result: ${result}\n`);
  await page.close();
}

async function shootContact(browser) {
  const page = await open(browser, 'contact.html', VIEWPORTS.desktop);
  await scrollThrough(page);
  await page.click('[data-submit]');
  await sleep(400);
  await page.screenshot({ path: join(OUT, 'contact-errors.png') });
  await page.type('#first-name', 'Livia');
  await page.type('#last-name', 'Drusilla');
  await page.type('#email', 'livia@example.com');
  await page.type('#message', 'I would like to read Virgil in Latin.');
  await page.click('[data-submit]');
  await sleep(1600);
  await page.screenshot({ path: join(OUT, 'contact-done.png') });
  await page.close();
}

async function shootMenu(browser) {
  const page = await open(browser, 'index.html', VIEWPORTS.mobile);
  await sleep(1200);
  await page.click('[data-menu-button]');
  await sleep(900);
  await page.screenshot({ path: join(OUT, 'menu-mobile.png') });
  await page.close();
}

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
try {
  if (MODE === 'pages' || MODE === 'all') await shootPages(browser);
  if (MODE === 'hero' || MODE === 'all') await shootHero(browser);
  if (MODE === 'explore' || MODE === 'all') await shootExplore(browser);
  if (MODE === 'lesson' || MODE === 'all') await shootLesson(browser);
  if (MODE === 'quiz' || MODE === 'all') await shootQuiz(browser);
  if (MODE === 'contact' || MODE === 'all') await shootContact(browser);
  if (MODE === 'menu' || MODE === 'all') await shootMenu(browser);
} finally {
  await browser.close();
}
process.stdout.write(problems.length ? `PROBLEMS:\n${problems.join('\n')}\n` : 'No console errors or overflow.\n');
