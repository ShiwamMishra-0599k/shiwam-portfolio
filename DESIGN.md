# DESIGN.md

## Palette (60 / 30 / 10, strict)

All colours live in `src/styles/global.css` under `@theme static`. They are emitted as CSS variables and Tailwind utilities. `npm test` fails on any other hex in `src/`.

| Token          | Hex       | Role                                                        | Measured contrast                                                                                                     |
| -------------- | --------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `cream`        | `#F4EAD5` | **60%** page and card background                            | Forest text on it: **10.21:1**                                                                                        |
| `cream-soft`   | `#F8F2E6` | Raised cards and chips on cream                             |                                                                                                                       |
| `cream-deep`   | `#E3DCC8` | "Soft" band before the forest footer                        | Forest on it: 8.91:1. `forest-muted` on it is **4.43:1 (fails)**, so soft sections use full forest for secondary text |
| `forest`       | `#1E3B2F` | **30%** text, headings, nav, footer, dark sections          | Cream on it: 10.21:1                                                                                                  |
| `forest-ink`   | `#12231C` | Labels on pink (forest + 40% black)                         | On pink: **5.05:1**                                                                                                   |
| `forest-muted` | `#546759` | Secondary text on cream                                     | 5.08:1                                                                                                                |
| `cream-muted`  | `#BFBEAC` | Secondary text on forest                                    | 6.49:1                                                                                                                |
| `line`         | `#C9C7B4` | Hairlines on cream (decorative)                             |                                                                                                                       |
| `line-dark`    | `#495E50` | Hairlines on forest (decorative)                            |                                                                                                                       |
| `pink`         | `#FF3EA5` | **10%** buttons, underlines, badges, focus halo, highlights | On cream: **2.71:1**. On forest: **3.77:1**                                                                           |

**Pink rules**

- Never use pink for text on cream, at any size. On cream, use pink only for fills, underlines, dots and icons.
- On forest, pink text is allowed only at ≥24px (WCAG large text, which needs 3:1). Example: the section numbers 01–05.
- Button labels on pink are `forest-ink`. Plain forest is only 3.77:1 on pink, so it isn't used for labels.
- Budget: pink appears in small amounts (the CTA, underlines, numbers, the status dot). It never fills a whole section.

## Typography

- **Display / headings:** Fraunces Variable (optical sizing on), weight 600, tracking −0.015em, `text-wrap: balance`.
- **Body / UI:** Inter Variable, 17px base, line-height 1.65.
- Both are self-hosted (`@fontsource-variable/*`) with `font-display: swap`. Only the subsets a page uses get downloaded (`unicode-range`).

| Token          | Size (320px → 1440px) | Line height | Use                                         |
| -------------- | --------------------- | ----------- | ------------------------------------------- |
| `text-display` | 40 → 80px             | 0.98        | Hero headline                               |
| `text-h1`      | 36 → 64px             | 1.04        | Page titles (case studies, 404)             |
| `text-h2`      | 28 → 44px             | 1.1         | Section titles                              |
| `text-h3`      | 20 → 24px             | 1.25        | Card titles, sub-heads                      |
| `text-lead`    | 18 → 21px             | 1.55        | Intros, hero support line                   |
| base           | 17px                  | 1.65        | Body                                        |
| `text-sm`      | 14px                  |             | Eyebrows (uppercase, tracking 0.14em), meta |

## Layout and spacing

- 8px rhythm (Tailwind spacing). The content container is `max-w-(--container-content)` = 72rem, and prose is 42rem.
- Side gutters: 16px under 640px, then 24px, then 32px from 1024px.
- Sections: 80px vertical padding on mobile, 112px from 768px.
- **Editorial grid:** each section header uses a 10rem left rail (number + eyebrow) and a title column. The section body aligns to the title column from 768px.
- **Rhythm:** hero (cream) → Projects (forest) → Skills (cream) → Education (forest) → About (cream) → Contact (cream-deep) → footer (forest).

## Components

| Component | File                           | Notes                                                                                                                                                                                                                                                                       |
| --------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nav       | `src/components/Nav.astro`     | Sticky forest bar, 72px. Desktop links get a pink underline on hover/focus. Pink Contact button. Under 768px: a 44px menu button with `aria-expanded` and `aria-controls`. Focus moves into the menu on open. Escape closes it and returns focus. Choosing a link closes it |
| Footer    | `src/components/Footer.astro`  | Forest. Repeats the contact CTA, then email / LinkedIn / GitHub links                                                                                                                                                                                                       |
| Section   | `src/components/Section.astro` | `tone`: `light` / `soft` / `dark`, plus `index` (01…), `eyebrow`, `title`, `intro`. Sets the muted text colour per tone                                                                                                                                                     |
| Buttons   | `global.css`                   | `.btn-primary` (pink fill, forest-ink label, 44px min height). `.btn-secondary` (2px outline in the current colour)                                                                                                                                                         |
| Links     | `global.css`                   | `.link-underline`: a 2px pink underline that grows on hover and focus, and stays on `aria-current="page"`                                                                                                                                                                   |
| Badge     | hero                           | Cream-soft pill, hairline border, pink dot, forest text                                                                                                                                                                                                                     |

**Focus:** on cream, a 3px forest outline plus a 6px pink halo; forest carries the contrast. On forest (`.tone-dark`), a 3px pink outline (3.77:1).
**Skip link:** the first tab stop. It shows as a pink pill and jumps to `<main id="main">`.

## Motion

- Allowed:
  - Fade-up on scroll (Phase 6, IntersectionObserver, 12px / 400ms, once)
  - Pink underline growth (220ms)
  - Button hover ring (160ms)
  - Astro View Transitions between pages
- Not allowed: parallax, autoplay, looping animation, or scroll-jacking.
- `prefers-reduced-motion: reduce` turns off smooth scroll, transitions and animations globally (`global.css`).
