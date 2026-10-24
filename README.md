# Curatores

A guided introduction to Latin: its words, its grammar, and the places it still turns up in English.

**Live site:** https://ivcuratores.org (also at https://curatores.vercel.app)

Curatores is a static website built with plain HTML, CSS and JavaScript. There is no framework and no build step, so the pages open straight from disk or from any static host.

## What's on the site

| Page | What it does |
| --- | --- |
| `index.html` | Home. The Curatores scroll logo unrolls in the hero. Visitors can try the English-to-Latin word explorer, read the About section and the "four steps" overview, and see the chapter cards with their saved progress. |
| `capitulum-1.html` | Chapter I, Fundamentals: vocabulary flashcards, a case explorer, etymology for medicine, law and paleontology, and a 15-question quiz. |
| `contact.html` | The "Request a private consultation" form, with inline validation. Requests are emailed to ivcuratores@gmail.com. |
| `team.html` | The Team: the founders, top contributors and contributors. |

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
npm run shoot -- pages --url https://ivcuratores.org/ --out .shots       # check the live site
```

Other modes are `hero`, `explore`, `lesson`, `contact`, `menu` and `all`. If Chrome isn't in the default location, set `CHROME_PATH`.

## Deploying

The site is deployed to Vercel with the CLI:

```bash
vercel deploy --prod --yes
```

`.vercelignore` keeps the dev files out of the deployment (`node_modules`, `tools`, `tests`, `package*.json`, this README). Pushing to GitHub does **not** deploy.

## The contact form

Consultation requests are emailed to **ivcuratores@gmail.com** in an email styled like the site: the scroll logo, the red, parchment and gold colours, the message, and a "Reply" button. Replying to it answers the visitor directly.

How it works:

1. The form posts to `/api/consultation`, a Vercel serverless function in `api/consultation.js`. The function checks the input with the same rules as the form, refuses other websites and repeated bursts, and ignores bots caught by the hidden `_honey` field.
2. It renders the email with `lib/consultation-email.js` and sends it through [Resend](https://resend.com) (free tier).
3. If the site has no Resend key yet, the function answers `not-configured`. The form then falls back to [FormSubmit](https://formsubmit.co) (`data-fallback-endpoint` in `contact.html`), which sends a plain, unthemed email.

### One-time setup for the themed email

The email is sent from `consultations@ivcuratores.org`, so Resend has to be allowed to send for ivcuratores.org. Do the steps in this order: a key added before the domain is verified makes every send fail.

1. Create a free account at [resend.com](https://resend.com). Making it with ivcuratores@gmail.com keeps it with Curatores, but any address works.
2. In Resend, open **Domains** → **Add Domain**, enter `ivcuratores.org`, and keep the suggested region.
3. Resend lists a few DNS records, normally an MX and a TXT named `send` and a TXT named `resend._domainkey`. Add each one in GoDaddy (**My Products → ivcuratores.org → DNS → Add New Record**). Copy the values exactly, and type only the part shown as the Name, because GoDaddy adds `.ivcuratores.org` itself. Leave the existing `_dmarc` record as it is.
4. Back in Resend, click **Verify DNS Records** and wait until the domain shows **Verified**. This usually takes minutes, but can take a few hours.
5. Open **API Keys** → **Create API Key**. Choose **Sending access**, limit it to `ivcuratores.org`, and copy the key (`re_…`).
6. Add the key to Vercel. Either use the dashboard (project **curatores** → **Settings → Environment Variables**, name `RESEND_API_KEY`, environment Production, marked Sensitive), or run this from this folder and paste the key when asked:

   ```bash
   vercel env add RESEND_API_KEY production
   ```

7. Redeploy with `vercel deploy --prod --yes`, so the function picks up the key.

The email arrives at ivcuratores@gmail.com from "Curatores website &lt;consultations@ivcuratores.org&gt;", with the subject "Consultation request from &lt;name&gt;". Nobody needs to read that address: replies go to the visitor. If Gmail puts the first one in Spam, mark it **Not spam**.

### FormSubmit fallback

Until the key is set, FormSubmit carries the requests. The first request makes FormSubmit email ivcuratores@gmail.com an "Activate Form" link, and nothing is delivered until someone clicks it. Until then, the form tells visitors their request didn't send rather than pretending it did.

### Previewing and testing

- `node tools/email-preview.mjs` writes `.shots/email-preview.html`: a sample request exactly as it arrives, with the logo and links pointing at ivcuratores.org. Open it in a browser. To try image changes before deploying, run `npm run serve` and set `PREVIEW_SITE=http://127.0.0.1:4190`.
- `npm test` covers the email template and every response of the function, with Resend faked.
- `npm run shoot -- contact` answers both senders itself, so the check never sends real email.
- To test real sending locally, start the server with the key set: `RESEND_API_KEY=re_… npm run serve`.

## Editing content

| To change | Edit |
| --- | --- |
| Vocabulary cards, cases, etymology entries | `capitulum-1.html` (plain HTML) |
| Quiz questions | `assets/js/quiz-data.js`. Wrap Latin in `*asterisks*` to italicise it; `answer` is the index of the correct option. `npm test` checks every question. |
| Word explorer pairs (home page) | `PAIRS` in `assets/js/explore.js` |
| Footer and icon sprite | `tools/partials/footer.html` and `tools/partials/sprite.html`, then run `node tools/partials.mjs` to copy them into every page |
| Colours, type sizes, spacing | `assets/css/tokens.css` |
| Team members | `team.html`: replace the role, name and introduction in each card, or copy a `<li class="member card">` block to add someone. Add contributors as `<li>Name</li>` in the empty `<ul class="contributors">`; the placeholder note hides itself once names are listed. |
| Team photos | Put the image in `assets/img/team/` (portrait, about 800px wide) and replace the card's `<span class="member__initial">` line with `<img src="assets/img/team/photo.jpg" alt="Portrait of Name" loading="lazy">` |

The header and mobile menu are repeated in each page. Change them in all four files.

Capitula II–IV are shown as "In preparation" until their content is written.

## Project layout

```
index.html, capitulum-1.html, contact.html, team.html
assets/
  css/     tokens, base, components, motion, plus one stylesheet per page and fonts.css
  js/      site.js (header, menu, scroll reveals), explore.js, lesson.js, flashcards.js,
           quiz.js + quiz-core.js + quiz-data.js, progress.js, contact.js + form-rules.js
  fonts/   self-hosted woff2 files
  img/     logo (1x and 2x WebP), favicon, email/logo.png (PNG for email clients)
tests/     node --test unit tests
tools/     serve.mjs (local server + /api), shoot.mjs (screenshots), email-preview.mjs,
           partials.mjs (+ partials/)
api/       consultation.js: Vercel function that emails consultation requests
lib/       consultation-email.js: the themed email template
```

## Credits

- **Logo:** the Curatores hand-drawn scroll.
- **Fonts:** Marcellus (display), EB Garamond (text) and Hanken Grotesk (interface), all under the SIL Open Font License and self-hosted. Licence texts are in `assets/licenses/OFL-*.txt`.
- **Icons:** [Lucide](https://lucide.dev), ISC License. The licence text is in `assets/licenses/LICENSE-lucide.txt`.
