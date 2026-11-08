import { test, expect } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { bannedNames } from "../../scripts/banned-terms.mjs";
import home from "../../src/content/home.json" with { type: "json" };

const hasResume = existsSync("public/resume.pdf");
const hasPortrait =
  existsSync("src/assets") && readdirSync("src/assets").some((f) => /^portrait\.(jpe?g|png|webp)$/.test(f));

test("hero: one h1 with the positioning line, status badge, primary CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(home.hero.headline);
  await expect(page.getByText("Open to AI Engineer / Data Scientist roles")).toBeVisible();
  const cta = page.getByRole("link", { name: "View projects" });
  await cta.click();
  await expect(page).toHaveURL(/#projects$/);
});

test("hero: resume button exists only when public/resume.pdf exists", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator('section[aria-labelledby="hero-title"]');
  await expect(hero.getByRole("link", { name: /Download resume/ })).toHaveCount(hasResume ? 1 : 0);
  // Hero + contact section; none at all without the file.
  await expect(page.getByRole("link", { name: /Download resume/ })).toHaveCount(hasResume ? 2 : 0);
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

test("hero: proof card links to the live TabulaVibe demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Open the live demo/ })).toHaveAttribute(
    "href",
    "https://tabulavibe-ai.vercel.app",
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

test("no employer names or job timeline anywhere on the page", async ({ page }) => {
  await page.goto("/");
  const text = (await page.locator("body").innerText()).toLowerCase();
  for (const banned of [...bannedNames(), "work experience", "employment"]) {
    expect(text).not.toContain(banned);
  }
  // Rubixe only appears if showInternship is switched on (off by default).
  expect(text).not.toContain("rubixe");
});
