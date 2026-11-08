import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import services from "../../src/content/services.json" with { type: "json" };
import { revealAll } from "./helpers";

// playwright.config builds with PUBLIC_FORMSPREE_ID=e2etest01; requests are intercepted, nothing is sent.
const FORMSPREE = "https://formspree.io/f/e2etest01";
const URL = "/work-with-me/";

async function fillValid(page: Page) {
  await page.getByLabel("Name").fill("Asha Rao");
  await page.getByLabel("Business email").fill("asha@example.com");
  await page.getByLabel("Company").fill("Example Clinics");
  await page.getByLabel(/^Website/).fill("example.com");
  await page
    .getByLabel("What problem are you trying to solve?")
    .fill("We copy patient enquiries from email into a spreadsheet by hand every morning.");
  await page.getByLabel("Type of solution").selectOption("AI workflow automation");
  await page.getByLabel("Expected timeline").selectOption("Within a month");
}

test("work with me: positioning, honesty note, five services with evidence links", async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator("h1")).toHaveText(services.hero.title);
  await expect(page.locator("main")).toContainText(services.hero.honesty);
  const items = page.locator("#services > div li article");
  await expect(items).toHaveCount(services.services.length);
  for (const [i, s] of services.services.entries()) {
    const item = items.nth(i);
    await expect(item.getByRole("heading", { name: s.title })).toBeVisible();
    for (const label of ["The problem", "What I implement", "Example workflow", "Expected benefit"])
      await expect(item).toContainText(label);
    await expect(item.getByRole("link", { name: s.evidence.label })).toHaveAttribute("href", s.evidence.href);
  }
  // No booking link exists yet, so no booking CTA is shown.
  await expect(page.getByRole("link", { name: /book a (discovery )?call/i })).toHaveCount(0);
});

test("inquiry: empty submit focuses the summary, marks required fields, sends nothing", async ({ page }) => {
  let sent = false;
  await page.route(FORMSPREE, (r) => {
    sent = true;
    return r.fulfill({ status: 200, body: "{}" });
  });
  await page.goto(URL);
  await page.getByRole("button", { name: "Send project inquiry" }).click();
  const summary = page.locator("[data-inquiry-form] [data-error-summary]");
  await expect(summary).toBeFocused();
  for (const f of ["name", "email", "company", "problem", "solutionType", "timeline"])
    await expect(page.locator(`#inq-${f}`)).toHaveAttribute("aria-invalid", "true");
  for (const f of ["website", "tools", "budget"])
    await expect(page.locator(`#inq-${f}`)).toHaveAttribute("aria-invalid", "false");
  expect(sent).toBe(false);
});

test("inquiry: an invalid website is caught; leaving it empty is fine", async ({ page }) => {
  await page.goto(URL);
  await fillValid(page);
  await page.getByLabel(/^Website/).fill("not a website");
  await page.getByRole("button", { name: "Send project inquiry" }).click();
  await expect(page.locator("#inq-website")).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel(/^Website/).fill("");
  await page.getByLabel(/^Website/).blur();
  await expect(page.locator("#inq-website")).toHaveAttribute("aria-invalid", "false");
});

test("inquiry: success only after Formspree confirms; the POST carries every answer", async ({ page }) => {
  let body = "";
  await page.route(FORMSPREE, async (r) => {
    body = r.request().postData() ?? "";
    await r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.goto(URL);
  await fillValid(page);
  await page.getByRole("button", { name: "Send project inquiry" }).click();
  const success = page.locator("[data-inquiry-success]");
  await expect(success).toBeVisible();
  await expect(success).toBeFocused();
  for (const v of ["Asha Rao", "Example Clinics", "AI workflow automation", "Within a month", "project-inquiry"])
    expect(body).toContain(v);
  expect(body).toContain('name="_gotcha"');
});

for (const [label, fail] of [
  ["server error", (p: Page) => p.route(FORMSPREE, (r) => r.fulfill({ status: 500, body: "{}" }))],
  ["network failure", (p: Page) => p.route(FORMSPREE, (r) => r.abort())],
] as const) {
  test(`inquiry ${label}: no fake success; error shown and answers kept`, async ({ page }) => {
    await fail(page);
    await page.goto(URL);
    await fillValid(page);
    await page.getByRole("button", { name: "Send project inquiry" }).click();
    const err = page.locator("[data-inquiry-form] [data-send-error]");
    await expect(err).toBeVisible();
    await expect(err).toBeFocused();
    await expect(err.getByRole("link", { name: "shiwammishrayt@gmail.com" })).toBeVisible();
    await expect(page.locator("[data-inquiry-success]")).toBeHidden();
    await expect(page.getByLabel("Company")).toHaveValue("Example Clinics");
  });
}

test("work with me: no axe violations and no horizontal scroll", async ({ page }) => {
  await page.goto(URL);
  await revealAll(page);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
