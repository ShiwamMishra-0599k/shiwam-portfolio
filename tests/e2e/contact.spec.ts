import { test, expect, type Page } from "@playwright/test";

const FORMSPREE = "https://formspree.io/f/e2etest01";
const VALID = {
  name: "Asha Rao",
  email: "asha@example.com",
  message: "Hello, I'd like to talk about an AI Engineer role.",
};

async function fill(page: Page, v = VALID) {
  await page.getByLabel("Name").fill(v.name);
  await page.getByLabel("Email", { exact: true }).fill(v.email);
  await page.getByLabel("Message").fill(v.message);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/#contact");
});

test("empty submit: error summary gets focus, each field is marked invalid, nothing is sent", async ({ page }) => {
  let sent = false;
  await page.route(FORMSPREE, (r) => {
    sent = true;
    return r.fulfill({ status: 200, body: "{}" });
  });
  await page.getByRole("button", { name: "Send message" }).click();
  const summary = page.locator("[data-error-summary]");
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  await expect(summary.getByRole("link")).toHaveCount(3);
  await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Message")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Name")).toHaveAccessibleDescription(/Error: Please enter your name/);
  await summary.getByRole("link", { name: /email/ }).click();
  await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
  expect(sent).toBe(false);
});

test("invalid email and short message show specific messages; fixing a field clears its error", async ({ page }) => {
  await fill(page, { name: "Asha Rao", email: "asha@", message: "Too short" });
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Error: Please enter a valid email address")).toBeVisible();
  await expect(page.getByText(/Error: Please write a little more/)).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("asha@example.com");
  await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("aria-invalid", "false");
});

test("success: POST accepts JSON, includes the fields and an empty honeypot, then a focused success message", async ({
  page,
}) => {
  let body = "";
  let accept = "";
  await page.route(FORMSPREE, async (r) => {
    body = r.request().postData() ?? "";
    accept = r.request().headers()["accept"] ?? "";
    await new Promise((res) => setTimeout(res, 300));
    await r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await fill(page);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("button", { name: "Sending…" })).toBeDisabled(); // no double submit
  const success = page.getByRole("status").filter({ hasText: "Thanks, your message is on its way." });
  await expect(success).toBeVisible();
  await expect(success).toBeFocused();
  expect(accept).toContain("application/json");
  for (const part of ["Asha Rao", "asha@example.com", "AI Engineer role", 'name="_gotcha"', 'name="_subject"'])
    expect(body).toContain(part);
  expect(body).toMatch(/name="_gotcha"\r\n\r\n\r\n/);
  await page.getByRole("button", { name: "Send another message" }).click();
  await expect(page.getByLabel("Name")).toBeFocused();
  await expect(page.getByLabel("Name")).toHaveValue("");
});

for (const failure of ["server error", "network failure"] as const) {
  test(`${failure}: focused error with the email fallback; what was typed is kept`, async ({ page }) => {
    await page.route(FORMSPREE, (r) =>
      failure === "server error" ? r.fulfill({ status: 500, body: '{"error":"x"}' }) : r.abort("failed"),
    );
    await fill(page);
    await page.getByRole("button", { name: "Send message" }).click();
    const err = page.locator("[data-send-error]");
    await expect(err).toBeVisible();
    await expect(err).toBeFocused();
    await expect(err.getByRole("link", { name: "shiwammishrayt@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:shiwammishrayt@gmail.com",
    );
    await expect(page.getByLabel("Message")).toHaveValue(/AI Engineer role/);
    await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled();
  });
}

test("honeypot is hidden from people and assistive tech", async ({ page }) => {
  await expect(page.locator('input[name="_gotcha"]')).toBeHidden();
  await expect(page.getByRole("textbox", { name: /Leave this field empty/ })).toHaveCount(0);
});

test("keyboard: Tab goes name → email → message → send", async ({ page }) => {
  await page.getByLabel("Name").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Message")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Send message" })).toBeFocused();
});

test("contact links: email, LinkedIn, GitHub", async ({ page }) => {
  const aside = page.getByRole("complementary", { name: "Or find me here" });
  await expect(aside.getByRole("link", { name: "shiwammishrayt@gmail.com" })).toHaveAttribute(
    "href",
    "mailto:shiwammishrayt@gmail.com",
  );
  await expect(aside.getByRole("link", { name: /linkedin/ })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/shiwammishra01/",
  );
  await expect(aside.getByRole("link", { name: /github/i })).toHaveAttribute(
    "href",
    "https://github.com/ShiwamMishra-0599k",
  );
});
