# Curatores

A guided introduction to Latin: its words, its grammar, and the places it still turns up in English.

**Live site:** https://curatores.vercel.app

Curatores is a static website built with plain HTML, CSS and JavaScript. There is no framework and no build step, so the pages open straight from disk or from any static host.

## What's on the site

| Page | What it does |
| --- | --- |
| `index.html` | Home. The Curatores scroll logo unrolls in the hero. Visitors can try the English-to-Latin word explorer, read the About section and the "four steps" overview, and see the chapter cards with their saved progress. |
| `capitulum-1.html` | Chapter I, Fundamentals: vocabulary flashcards, a case explorer, etymology for medicine, law and paleontology, and a 15-question quiz. |
| `contact.html` | The "Request a private consultation" form, with inline validation. |

Other details:

- **Progress:** saved in the visitor's browser (`localStorage`, key `curatores:capitulum-1`). A part counts as done when every flashcard has been flipped, every case and field opened, or the quiz finished. The quiz also keeps the best score.
- **Accessibility:**
  - Everything works from the keyboard, and the tab widgets use arrow keys.
  - `prefers-reduced-motion` gets a still version.
  - Lighthouse scores 100 for accessibility.
- **Page transitions:** Chromium browsers fade between pages using cross-document view transitions. Other browsers navigate normally.

## Running it locally

Node 22 or newer is needed for the tools and tests. The site itself needs nothing.

```bash
npm install          # dev tools only (puppeteer-core for screenshots)
npm run serve        # http://127.0.0.1:4190
npm test             # unit tests (quiz logic, form rules, progress store)
```

You can also open `index.html` directly in a browser.

### Visual checks

`tools/shoot.mjs` drives the system Chrome with puppeteer-core. It saves screenshots, and it reports console errors and any horizontal overflow at 1440px, 390px and 320px wide.

```bash
npm run shoot -- pages --out .shots                              # every page, all widths
npm run shoot -- quiz --out .shots                               # plays through the quiz
npm run shoot -- pages --url https://curatores.vercel.app/ --out .shots   # check the live site
```

Other modes are `hero`, `explore`, `lesson`, `contact`, `menu` and `all`. If Chrome isn't in the default location, set `CHROME_PATH`.

## Deploying

The site is deployed to Vercel with the CLI:

```bash
vercel deploy --prod --yes
```

`.vercelignore` keeps the dev files out of the deployment (`node_modules`, `tools`, `tests`, `package*.json`, this README). Pushing to GitHub does **not** deploy.

## Before you rely on the contact form

The form validates input, but it doesn't send anything yet. To deliver requests, create an endpoint with a form service such as Formspree, then put its URL in `contact.html`:

```html
<form ... data-contact-form data-endpoint="https://formspree.io/f/your-id">
```

The form then POSTs JSON (`firstName`, `lastName`, `email`, `message`) to that URL. While `data-endpoint` is empty, the form shows its confirmation without sending.

## Editing content

| To change | Edit |
| --- | --- |
| Vocabulary cards, cases, etymology entries | `capitulum-1.html` (plain HTML) |
| Quiz questions | `assets/js/quiz-data.js`. Wrap Latin in `*asterisks*` to italicise it; `answer` is the index of the correct option. `npm test` checks every question. |
| Word explorer pairs (home page) | `PAIRS` in `assets/js/explore.js` |
| Footer and icon sprite | `tools/partials/footer.html` and `tools/partials/sprite.html`, then run `node tools/partials.mjs` to copy them into every page |
| Colours, type sizes, spacing | `assets/css/tokens.css` |

The header and mobile menu are repeated in each page. Change them in all three files.

Capitula II–IV are shown as "In preparation" until their content is written.

## Project layout

```
index.html, capitulum-1.html, contact.html
assets/
  css/     tokens, base, components, motion, plus one stylesheet per page and fonts.css
  js/      site.js (header, menu, scroll reveals), explore.js, lesson.js, flashcards.js,
           quiz.js + quiz-core.js + quiz-data.js, progress.js, contact.js + form-rules.js
  fonts/   self-hosted woff2 files
  img/     logo (1x and 2x WebP), favicon
tests/     node --test unit tests
tools/     serve.mjs (local server), shoot.mjs (screenshots), partials.mjs (+ partials/)
```

## Credits

- **Logo:** the Curatores hand-drawn scroll.
- **Fonts:** Marcellus (display), EB Garamond (text) and Hanken Grotesk (interface), all under the SIL Open Font License and self-hosted. Licence texts are in `assets/licenses/OFL-*.txt`.
- **Icons:** [Lucide](https://lucide.dev), ISC License. The licence text is in `assets/licenses/LICENSE-lucide.txt`.
