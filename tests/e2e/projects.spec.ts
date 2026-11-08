import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { revealAll } from "./helpers";
import { bannedNames } from "../../scripts/banned-terms.mjs";
import { readdirSync } from "node:fs";

const projectFiles = readdirSync("src/content/projects").filter((f) => /\.mdx?$/.test(f) && f !== "README.md");
const CASE = "/projects/tabulaview/";
const TEMPLATE_SECTIONS = [
  "Problem and why it matters",
  "Data",
  "Approach and architecture",
  "Models, tools and key decisions",
  "Evaluation",
  "Results",
  "Deployment",
  "Limitations and what I'd do next",
  "Links",
];

test("grid: one card per published project, each linking to its case study", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator("#projects [data-project-card]");
  await expect(cards).toHaveCount(projectFiles.length);
  await expect(cards.first().getByRole("link", { name: /case study/i })).toHaveAttribute("href", CASE);
});

test("filters: keyboard operable, aria-pressed, announced, All restores", async ({ page }) => {
  await page.goto("/");
  const group = page.getByRole("group", { name: "Filter projects by type" });
  await expect(group).toBeVisible();
  const all = group.getByRole("button", { name: "All" });
  await expect(all).toHaveAttribute("aria-pressed", "true");

  const llm = group.getByRole("button", { name: "LLM/GenAI" });
  await llm.focus();
  await page.keyboard.press("Enter");
  await expect(llm).toHaveAttribute("aria-pressed", "true");
  await expect(all).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("[data-filter-status]")).toContainText("tagged LLM/GenAI");
  for (const item of await page.locator("[data-project-item]").all()) {
    const types = (await item.getAttribute("data-types")) ?? "";
    if (types.split("|").includes("LLM/GenAI")) await expect(item).toBeVisible();
    else await expect(item).toBeHidden();
  }

  await all.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("[data-project-item]:visible")).toHaveCount(projectFiles.length);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("every card shows and the filter bar stays hidden", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#projects [data-project-card]")).toHaveCount(projectFiles.length);
    await expect(page.locator("[data-project-item]:visible")).toHaveCount(projectFiles.length);
    await expect(page.getByRole("group", { name: "Filter projects by type" })).toBeHidden();
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
    await toc.getByRole("link", { name: "Evaluation" }).click();
    await expect(page).toHaveURL(/#evaluation$/);
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
