# Shiwam Mishra · portfolio

Personal site for AI Engineer and Data Scientist roles. Built with Astro, Tailwind CSS and MDX, and deployed as a static site on Vercel.

## Setup

Requires Node 22.23.4 or newer (see `engines` in package.json; tested on Node 24.15).

```bash
npm install
npm run dev          # http://localhost:4321
```

## Commands

| Command            | What it does                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`      | Dev server with hot reload                                                                                                                 |
| `npm run build`    | Production build to `dist/`                                                                                                                |
| `npm run preview`  | Serve the production build                                                                                                                 |
| `npm run check`    | Astro + TypeScript type check                                                                                                              |
| `npm run lint`     | ESLint, including accessibility rules                                                                                                      |
| `npm run format`   | Prettier (`format:check` only checks)                                                                                                      |
| `npm test`         | Design-rule check (brand colours only, no employer names, placeholder list), then Vitest unit tests                                        |
| `npm run test:e2e` | Playwright + axe browser tests. It builds the site with a test form ID and fakes Formspree, so nothing is sent. Uses your installed Chrome |
| `npm run og`       | Re-render the social preview images in `public/og/`                                                                                        |
| `npm run verify`   | check + lint + format check + test + build                                                                                                 |

**Deploy gate:** `STRICT_TODO=1 npm test` fails if any content placeholder is left or `PUBLIC_FORMSPREE_ID` isn't set.

## Editing content (no component changes needed)

- **Name, tagline, links, SEO defaults:** `src/content/site.json`.
- **Hero and About text:** `src/content/home.json`.
- **Skills and education:** `src/content/skills.json`, `src/content/education.json`.
- **Resume:** put the PDF at `public/resume.pdf`. The "Download resume" links appear on the next build. Remove the file and they disappear.
- **Portrait:** put it at `src/assets/portrait.jpg` (or .png/.webp). About shows it on the next build.
- **Projects:** one MDX file per project in `src/content/projects/`. The fields are documented in that folder's README.
- **Colours and fonts:** `src/styles/global.css` only. See `DESIGN.md`.

## Environment variables

Copy `.env.example` to `.env`. Only `PUBLIC_*` variables reach the browser, so never put secrets in them.

## Contact form (Formspree)

1. Create a free account at formspree.io, add a form, and set it to deliver to your Gmail.
2. Copy the form ID: the part after `/f/` in `https://formspree.io/f/xyzabcd`.
3. Add it as `PUBLIC_FORMSPREE_ID=xyzabcd` in `.env` locally, and in Vercel under Settings → Environment Variables.

Without an ID, the site shows an email link instead of the form, so a visitor never sees a broken form.

How the form behaves:

- It validates in the browser, with an error summary plus a message for each field.
- A hidden spam trap (`_gotcha`) catches bots.
- After sending, it shows a success message. If sending fails, it shows an error with your email address as a fallback.
- It also works without JavaScript: Formspree shows its own thank-you page.

## Social preview images

`npm run og` renders `public/og/default.png` plus one 1200×630 image per case study, using the site's fonts.

Re-run it after changing the tagline or a project title, then commit the PNGs. It uses your local Chrome, so it doesn't run on Vercel.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, choose **Add New → Project** and import the repo. Vercel detects the Astro preset (build `npm run build`, output `dist`).
3. Add `PUBLIC_FORMSPREE_ID` under Project → Settings → Environment Variables.
4. After the first deploy, put the real URL in `site` in `astro.config.mjs` and in `url` in `src/content/site.json`.
5. Run `npm run og`, then redeploy.

A custom domain is optional. Steps will be added in Phase 7.

## Project docs

- `DESIGN.md`: design system

Working notes (plan, decisions, checklist) and the private banned-names list (`private/banned-terms.json`) are kept locally and are not in this repo. Without that list, the name checks in `npm test` and the browser tests are skipped; every other check runs.
