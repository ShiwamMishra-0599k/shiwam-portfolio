// Renders the 1200×630 social-preview images (Open Graph / Twitter) with the site's fonts and colours.
// Output: public/og/default.png and public/og/<project>.png. Run after changing titles: `npm run og`.
// Uses the locally installed Chrome through Playwright, so it runs on this PC, not on Vercel; commit the PNGs.
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const site = JSON.parse(readFileSync(join(root, "src/content/site.json"), "utf8"));
const font = (p) => readFileSync(join(root, "node_modules", p)).toString("base64");
const fraunces = font("@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2");
const inter = font("@fontsource-variable/inter/files/inter-latin-wght-normal.woff2");

// Brand tokens (same values as src/styles/global.css).
const C = { cream: "#f4ead5", forest: "#1e3b2f", pink: "#ff3ea5", creamMuted: "#bfbeac", lineDark: "#495e50" };

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function frontmatter(file) {
  const text = readFileSync(file, "utf8");
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  const get = (k) => fm.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, "m"))?.[1] ?? "";
  return { title: get("title"), name: get("name"), draft: /^draft:\s*true/m.test(fm) };
}

function html({ eyebrow, title, footer, big }) {
  return `<!doctype html><html><head><style>
  @font-face { font-family: Fraunces; src: url(data:font/woff2;base64,${fraunces}) format("woff2"); font-weight: 100 900; }
  @font-face { font-family: Inter; src: url(data:font/woff2;base64,${inter}) format("woff2"); font-weight: 100 900; }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: ${C.forest}; color: ${C.cream}; font-family: Inter, sans-serif;
         padding: 72px 80px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
  .mark { position: absolute; right: -40px; top: -120px; font-family: Fraunces; font-weight: 700; font-size: 640px; line-height: 1; color: ${C.lineDark}; }
  .eyebrow { position: relative; font-size: 26px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: ${C.creamMuted}; }
  h1 { position: relative; font-family: Fraunces; font-weight: 600; font-size: ${big ? 92 : 64}px; line-height: 1.04; letter-spacing: -.015em; max-width: 960px; }
  .rule { width: 120px; height: 8px; border-radius: 8px; background: ${C.pink}; margin-top: 36px; }
  .foot { position: relative; display: flex; justify-content: space-between; align-items: center; font-size: 28px; }
  .foot b { font-family: Fraunces; font-size: 34px; } .foot b i { color: ${C.pink}; font-style: normal; }
  </style></head><body>
  <div class="mark">S</div>
  <div class="eyebrow">${esc(eyebrow)}</div>
  <div><h1>${esc(title)}</h1><div class="rule"></div></div>
  <div class="foot"><b>Shiwam<i>.</i></b><span>${esc(footer)}</span></div>
  </body></html>`;
}

const pages = [
  {
    out: "default.png",
    eyebrow: site.status,
    title: site.tagline,
    footer: "AI Engineer · Data Scientist",
    big: true,
  },
];
const dir = join(root, "src/content/projects");
for (const f of readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
  const p = frontmatter(join(dir, f));
  if (p.draft) continue;
  pages.push({
    out: f.replace(/\.mdx$/, ".png"),
    eyebrow: `Case study · ${p.name}`,
    title: p.title,
    footer: site.name,
  });
}

mkdirSync(join(root, "public/og"), { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const p of pages) {
  await page.setContent(html(p), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(root, "public/og", p.out), type: "png" });
  console.log(`public/og/${p.out}`);
}
await browser.close();
