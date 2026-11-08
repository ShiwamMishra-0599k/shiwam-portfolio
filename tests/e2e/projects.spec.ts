import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { revealAll } from "./helpers";
import { bannedNames } from "../../scripts/banned-terms.mjs";
import { readdirSync } from "node:fs";

const projectFiles = readdirSync("src/content/projects").filter((f) => /\.mdx?$/.test(f) && f !== "README.md");
const CASE = "/projects/tabulaview/";
const TEMPLATE_SECTIONS = [
  "Executive overview",
  "The problem",
  "The solution",
  "System architecture",
  "Engineering deep dive",
  "Production engineering",
  "Business applications and impact",
  "Reflection and next steps",
  "Links",
];
const FEATURED = ["lumen", "tabulaview"];

test("case studies: the two featured projects as editorial cards, each linking to its case study", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator("#case-studies [data-project-card]");
  await expect(cards).toHaveCount(FEATURED.length);
  for (const [i, slug] of FEATURED.entries()) {
    const card = cards.nth(i);
    await expect(card.getByRole("link", { name: /case study/i })).toHaveAttribute("href", `/projects/${slug}/`);
    for (const label of ["The problem", "The solution", "Main engineering challenge"])
      await expect(card).toContainText(label);
    await expect(card).toContainText(/Verified result|Status · no measured outcome yet/);
  }
  // Lumen has no measured outcome, and says so.
  await expect(cards.first()).toContainText("Status · no measured outcome yet");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("case study cards and supporting projects all show", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#case-studies [data-project-card]:visible")).toHaveCount(FEATURED.length);
    await expect(page.locator("#more-projects li:visible")).not.toHaveCount(0);
  });
});

for (const file of projectFiles) {
  const url = `/projects/${file.replace(/\.mdx$/, "")}/`;
  test(`${url}: all template sections in order, contents list, axe clean, no sideways scroll`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator("h1")).toHaveCount(1);
    const h2 = await page.locator(".prose h2").allInnerTexts();
    expect(h2.map((t) => t.trim().replace(/’/g, "'"))).toEqual(TEMPLATE_SECTIONS);
    await expect(page.getByRole("heading", { name: "Related projects" })).toHaveCount(projectFiles.length > 1 ? 1 : 0);
    const toc = page.getByRole("navigation", { name: "On this page" });
    await toc.getByRole("link", { name: "Production engineering" }).click();
    await expect(page).toHaveURL(/#production-engineering$/);
    const overview = page.locator("#overview + dl");
    for (const k of ["The problem", "The solution", "My contribution", "Main engineering challenge"])
      await expect(overview).toContainText(k);
    await revealAll(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const text = (await page.locator("body").innerText()).toLowerCase();
    for (const banned of [...bannedNames(), "43%", "1.75×", "2× faster"]) expect(text).not.toContain(banned);
  });
}

test("case study: diagram and score table are accessible, cover has alt text", async ({ page }) => {
  await page.goto(CASE);
  await expect(page.getByRole("img", { name: "TabulaView.ai architecture" })).toBeVisible();
  const scores = page.getByRole("table", { name: /Live runs on the two synthetic samples/ });
  await expect(scores.getByRole("rowheader", { name: /Rules-based analyst/ })).toBeVisible();
  await expect(scores).toContainText("100");
  await expect(scores).toContainText("69.6");
  await expect(scores).toContainText("75.6");
  const cover = page.locator("figure img").first();
  expect((await cover.getAttribute("alt"))?.length ?? 0).toBeGreaterThan(20);
});

test("Lumen case study: diagram is accessible; contribution and gaps are stated", async ({ page }) => {
  await page.goto("/projects/lumen/");
  await expect(page.getByRole("img", { name: "Lumen architecture" })).toBeVisible();
  await expect(page.locator("#overview + dl")).toContainText(
    "Co-developed during my AI Engineer internship at Tipstat",
  );
  await expect(page.locator(".prose")).toContainText("No automated tests and no evaluation set");
  await expect(page.getByRole("link", { name: /GitHub/ }).first()).toHaveAttribute(
    "href",
    "https://github.com/ShiwamMishra-0599k/deep-research-platform",
  );
});

test("case study: links go to the live demo and the public repo", async ({ page }) => {
  await page.goto(CASE);
  await expect(page.getByRole("link", { name: /Live demo/ }).first()).toHaveAttribute(
    "href",
    "https://tabulavibe-ai.vercel.app",
  );
  await expect(page.getByRole("link", { name: /GitHub/ }).first()).toHaveAttribute(
    "href",
    "https://github.com/ShiwamMishra-0599k/tabulavibe-ai",
  );
});

test("case study: no axe violations and no horizontal scroll", async ({ page }) => {
  await page.goto(CASE);
  await revealAll(page);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("case study: no banned employer names, no speed-up percentage", async ({ page }) => {
  await page.goto(CASE);
  const text = (await page.locator("body").innerText()).toLowerCase();
  for (const banned of [...bannedNames(), "43%", "1.75×", "2× faster"]) expect(text).not.toContain(banned);
});
