import { test, expect } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { bannedNames } from "../../scripts/banned-terms.mjs";
import home from "../../src/content/home.json" with { type: "json" };
import fde from "../../src/content/fde.json" with { type: "json" };
import site from "../../src/content/site.json" with { type: "json" };

const hasResume = existsSync("public/resume.pdf");
const hasPortrait =
  existsSync("src/assets") && readdirSync("src/assets").some((f) => /^portrait\.(jpe?g|png|webp)$/.test(f));

test("hero: one h1 with the FDE headline, identity, status and three CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(fde.hero.headline);
  const hero = page.locator('section[aria-labelledby="hero-title"]');
  await expect(hero).toContainText(fde.hero.identity);
  await expect(hero).toContainText(site.status);
  for (const cta of [fde.hero.ctaBusiness, fde.hero.ctaCases, fde.hero.ctaProfile])
    await expect(hero.getByRole("link", { name: cta.label })).toHaveAttribute("href", cta.href);
  await hero.getByRole("link", { name: fde.hero.ctaCases.label }).click();
  await expect(page).toHaveURL(/#case-studies$/);
});

test("hero: business CTA opens the project inquiry form", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: fde.hero.ctaBusiness.label }).click();
  await expect(page).toHaveURL(/\/work-with-me\/#inquiry$/);
  await expect(page.getByRole("heading", { name: "Tell me about your workflow" })).toBeVisible();
});

test("credibility strip: every capability names the project that shows it", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator('section[aria-labelledby="hero-title"]');
  for (const item of fde.credibility.items) {
    await expect(hero).toContainText(item.title);
    await expect(hero).toContainText(item.evidence);
  }
});

test("what I do: four pillars, each with problem, solution, value and a working evidence link", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#what-i-do");
  const cards = section.locator("li");
  await expect(cards).toHaveCount(fde.pillars.items.length);
  for (const [i, p] of fde.pillars.items.entries()) {
    const card = cards.nth(i);
    await expect(card.getByRole("heading", { name: p.title })).toBeVisible();
    for (const label of ["The problem", "What I build", "The value"]) await expect(card).toContainText(label);
    await expect(card.getByRole("link", { name: p.shownIn.label })).toHaveAttribute("href", p.shownIn.href);
  }
});

test("how I work: five steps in order, each with a real example", async ({ page }) => {
  await page.goto("/");
  const steps = page.locator("#how-i-work ol > li");
  await expect(steps).toHaveCount(5);
  for (const [i, s] of fde.process.steps.entries()) {
    await expect(steps.nth(i).getByRole("heading")).toContainText(s.title);
    await expect(steps.nth(i)).toContainText("In practice:");
  }
});

test("more projects: supporting cards; the private Flu repo is not linked", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#more-projects");
  await expect(section.locator("li h3")).toHaveCount(fde.supporting.items.length);
  const flu = section.locator("li").filter({ hasText: "flu vaccine" });
  await expect(flu.getByRole("link")).toHaveCount(0);
  await expect(section.getByRole("link", { name: /View the notebook on GitHub/ })).toHaveAttribute(
    "href",
    "https://github.com/ShiwamMishra-0599k/Walking-Running-Classification-Motion-Sensor-ML-Model",
  );
});

test("profile: summary, both internships from the resume, link to the Lumen case study", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#profile");
  await expect(section).toContainText(fde.profile.summary);
  for (const job of fde.profile.experience) {
    await expect(section.getByRole("heading", { name: `${job.role}, ${job.org}` })).toBeVisible();
    await expect(section).toContainText(job.dates);
  }
  await expect(section.getByRole("link", { name: "Lumen case study" })).toHaveAttribute("href", "/projects/lumen/");
});

test("resume: downloads in the profile, the hiring CTA and contact; none without the file", async ({ page }) => {
  await page.goto("/");
  const links = page.getByRole("link", { name: /Download resume/ });
  await expect(links).toHaveCount(hasResume ? 3 : 0);
  if (hasResume) await expect(page.locator("#profile").getByRole("link", { name: /Download resume/ })).toBeVisible();
});

test("resume link serves the PDF", async ({ page, request }) => {
  test.skip(!hasResume, "no public/resume.pdf");
  await page.goto("/");
  const link = page.getByRole("link", { name: /Download resume/ }).first();
  await expect(link).toHaveAttribute("download", "Shiwam_Mishra_Resume.pdf");
  const res = await request.get((await link.getAttribute("href"))!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
});

test("dual CTA: separate paths for hiring teams and for businesses", async ({ page }) => {
  await page.goto("/");
  const next = page.getByRole("region", { name: "Next steps" });
  await expect(next.getByRole("heading", { name: fde.dualCta.hiring.title })).toBeVisible();
  await expect(next.getByRole("heading", { name: fde.dualCta.business.title })).toBeVisible();
  await expect(next.getByRole("link", { name: fde.dualCta.hiring.primary.label })).toHaveAttribute("href", "/#contact");
  await expect(next.getByRole("link", { name: fde.dualCta.business.primary.label })).toHaveAttribute(
    "href",
    "/work-with-me/#inquiry",
  );
});

test("about: portrait only when the file exists; never a stand-in image", async ({ page }) => {
  await page.goto("/");
  const about = page.locator("#about");
  await expect(about.getByRole("img")).toHaveCount(hasPortrait ? 1 : 0);
  if (hasPortrait) await expect(about.getByRole("img")).toHaveAttribute("alt", home.about.portraitAlt);
});

test("about: placeholders are visibly marked, not passed off as content", async ({ page }) => {
  await page.goto("/");
  const todos = page.locator("#about [data-todo]");
  const expected = JSON.stringify(home.about).match(/"TODO:/g)?.length ?? 0;
  await expect(todos).toHaveCount(expected);
  for (const t of await todos.all()) await expect(t).toContainText("Placeholder:");
});

test("no private names, no unverified speed-up figures, no invented clients", async ({ page }) => {
  await page.goto("/");
  const text = (await page.locator("body").innerText()).toLowerCase();
  for (const banned of [...bannedNames(), "43%", "1.75×", "2× faster", "testimonial", "our clients", "trusted by"])
    expect(text).not.toContain(banned);
});
