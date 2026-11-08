// Lighthouse (mobile, default throttling) on every page type of the production build.
// Usage: npm run lighthouse   (builds first, then serves dist with `astro preview`)
// Gate (PLAN.md, Phase 6): 90+ in all four categories, CLS < 0.05. Reports go to lighthouse-reports/ (gitignored).
// Each page runs RUNS times and the median run (by performance score) is scored, as Lighthouse recommends for
// noisy machines: blocking time on this 8 GB PC swings by ~10 points between identical runs.
// The 404 page is noindex on purpose, so its "is-crawlable" SEO audit is excluded there (and only there).
import { spawn, execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const PORT = 4330;
const BASE = `http://127.0.0.1:${PORT}`;
const PAGES = process.env.LH_PAGES
  ? process.env.LH_PAGES.split(",")
  : ["/", "/work-with-me/", "/projects/lumen/", "/projects/tabulaview/", "/projects/email-assistant/", "/404"];
const RUNS = Number(process.env.LH_RUNS ?? 3);
const EXPECTED = { "/404": ["is-crawlable"] };
const CATS = ["performance", "accessibility", "best-practices", "seo"];

execSync("npx astro build", { stdio: "inherit", env: { ...process.env, PUBLIC_FORMSPREE_ID: "e2etest01" } });
const server = spawn(`npx astro preview --port ${PORT} --host 127.0.0.1 --force`, { shell: true, stdio: "ignore" });

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("preview server did not start");
}

let failed = false;
const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new"] });
try {
  await waitForServer();
  mkdirSync("lighthouse-reports", { recursive: true });
  for (const path of PAGES) {
    const runs = [];
    for (let i = 0; i < RUNS; i++)
      runs.push(
        await lighthouse(
          BASE + path,
          { port: chrome.port, output: "html", logLevel: "error", onlyCategories: CATS },
          undefined, // default config = mobile emulation + simulated slow 4G
        ),
      );
    runs.sort((a, b) => a.lhr.categories.performance.score - b.lhr.categories.performance.score);
    const { lhr, report } = runs[Math.floor(runs.length / 2)];
    // Re-score a category without the audits that are expected to fail on this page.
    const skip = EXPECTED[path] ?? [];
    const score = (c) => {
      const refs = lhr.categories[c].auditRefs.filter((r) => r.weight > 0 && !skip.includes(r.id));
      const total = refs.reduce((n, r) => n + r.weight, 0);
      return Math.round((refs.reduce((n, r) => n + r.weight * (lhr.audits[r.id].score ?? 1), 0) / total) * 100);
    };
    const name = path === "/" ? "home" : path.replace(/\//g, "-").replace(/^-|-$/g, "");
    writeFileSync(`lighthouse-reports/${name}.html`, report);
    const scores = CATS.map((c) => (skip.length ? score(c) : Math.round(lhr.categories[c].score * 100)));
    const cls = lhr.audits["cumulative-layout-shift"].numericValue;
    const lcp = lhr.audits["largest-contentful-paint"].numericValue;
    const ok = scores.every((s) => s >= 90) && cls < 0.05;
    if (!ok) failed = true;
    console.log(
      `${ok ? "PASS" : "FAIL"} ${path.padEnd(28)} perf ${scores[0]}  a11y ${scores[1]}  bp ${scores[2]}  seo ${scores[3]}  CLS ${cls.toFixed(3)}  LCP ${(lcp / 1000).toFixed(2)}s  (median of ${RUNS}; perf runs: ${runs.map((r) => Math.round(r.lhr.categories.performance.score * 100)).join("/")})`,
    );
    for (const c of CATS)
      for (const ref of lhr.categories[c].auditRefs) {
        const a = lhr.audits[ref.id];
        if (ref.weight > 0 && a.score !== null && a.score < 0.9)
          console.log(`     - [${c}] ${a.id}: ${a.title}${skip.includes(a.id) ? " (expected here, excluded)" : ""}`);
      }
  }
} finally {
  await chrome.kill();
  server.kill();
  try {
    execSync("npx astro preview stop", { stdio: "ignore" });
  } catch {}
}
process.exit(failed ? 1 : 0);
