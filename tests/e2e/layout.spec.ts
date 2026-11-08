import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { revealAll } from "./helpers";
import { existsSync } from "node:fs";

const pages = ["/", "/404"];

for (const path of pages) {
  test(`${path}: no axe violations (WCAG 2.2 AA)`, async ({ page }) => {
    await page.goto(path);
    await revealAll(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  });

  test(`${path}: no horizontal scroll`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("skip link is the first tab stop and moves focus to main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("every focusable element shows a visible focus style", async ({ page }) => {
  await page.goto("/");
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    const style = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const cs = getComputedStyle(el);
      return {
        outline: cs.outlineStyle,
        width: parseFloat(cs.outlineWidth),
        visible: el.offsetParent !== null || cs.position === "fixed",
      };
    });
    if (!style.visible) continue;
    expect(style.outline).not.toBe("none");
    expect(style.width).toBeGreaterThanOrEqual(2);
  }
});

test("desktop nav links and contact button reach their sections", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "desktop nav only");
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const name of ["Projects", "Skills", "Education", "About"]) {
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await nav.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.getByRole("heading", { name: "Let's talk", level: 2 })).toBeInViewport();
});

test("mobile menu: toggles, announces state, Escape closes and returns focus", async ({ page }, info) => {
  test.skip(info.project.name !== "phone-320", "phone only");
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  const close = page.getByRole("button", { name: "Close menu" });
  await expect(close).toHaveAttribute("aria-expanded", "true");
  const menu = page.locator("#mobile-menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link", { name: "Projects" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  // Selecting a link closes the menu.
  await page.getByRole("button", { name: "Open menu" }).click();
  await menu.getByRole("link", { name: "Skills" }).click();
  await expect(menu).toBeHidden();
  await expect(page).toHaveURL(/#skills$/);
});

test("footer repeats the contact call to action", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Get in touch" })).toHaveAttribute("href", "/#contact");
  await expect(footer.getByRole("link", { name: "Email" })).toHaveAttribute("href", "mailto:shiwammishrayt@gmail.com");
});

test("no resume link while public/resume.pdf is missing", async ({ page }) => {
  test.skip(existsSync("public/resume.pdf"), "resume present; covered by home.spec.ts");
  await page.goto("/");
  await expect(page.getByRole("link", { name: /resume/i })).toHaveCount(0);
});
