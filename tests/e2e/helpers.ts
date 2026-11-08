import type { Page } from "@playwright/test";

/**
 * Shows every fade-up element in its final state (as a visitor sees it after scrolling), so the
 * accessibility check measures real colours, not a half-faded frame.
 */
export async function revealAll(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      el.style.transition = "none";
      el.classList.add("is-revealed");
    });
  });
}
