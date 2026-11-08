import { test, expect } from "@playwright/test";

const hiddenRevealCount = (page: import("@playwright/test").Page) =>
  page.evaluate(
    () => [...document.querySelectorAll("[data-reveal]")].filter((el) => getComputedStyle(el).opacity !== "1").length,
  );

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("nothing is hidden or animated; smooth scrolling is off", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    expect(await hiddenRevealCount(page)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.classList.contains("reveal-ready"))).toBe(false);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("all content is visible", async ({ page }) => {
    await page.goto("/");
    expect(await hiddenRevealCount(page)).toBe(0);
  });
});

test("fade-up: content on screen at load is shown at once; content below appears when scrolled to", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => document.documentElement.classList.contains("reveal-ready"));
  // The hero is never animated.
  await expect(page.locator("#hero-title")).toHaveCSS("opacity", "1");
  const contactHeader = page.locator("#contact header[data-reveal]");
  await expect(contactHeader).toHaveCSS("opacity", "0");
  await contactHeader.scrollIntoViewIfNeeded();
  await expect(contactHeader).toHaveCSS("opacity", "1");
  await expect(contactHeader).toHaveClass(/is-revealed/);
});

test("fade-up causes no layout shift", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as PerformanceEntry[] & { value: number; hadRecentInput: boolean }[])
            if (!e.hadRecentInput) total += e.value;
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve(total), 300);
      }),
  );
  expect(cls).toBeLessThan(0.05);
});

test("page transitions: scripts keep working after navigating between pages", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "desktop flow");
  await page.goto("/");
  await page
    .locator("#projects")
    .getByRole("link", { name: /Read the TabulaView\.ai case study/ })
    .click();
  await expect(page).toHaveURL(/\/projects\/tabulaview\/$/);
  await expect(page.locator("h1")).toContainText("Checked dashboards");
  // Related cards revealed on the new page once scrolled to.
  const related = page.locator("[data-reveal]").last();
  await related.scrollIntoViewIfNeeded();
  await expect(related).toHaveCSS("opacity", "1");
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  // Filters were re-initialised after the swap.
  await page.getByRole("button", { name: "Data Analysis" }).click();
  await expect(page.locator("[data-filter-status]")).toContainText("tagged Data Analysis");
});
