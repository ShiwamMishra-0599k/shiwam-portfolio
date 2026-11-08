import { test, expect } from "@playwright/test";
import skills from "../../src/content/skills.json" with { type: "json" };
import education from "../../src/content/education.json" with { type: "json" };

test("skills: every group and item from skills.json, each with evidence; no progress bars", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#skills");
  for (const g of skills.groups) {
    const list = section.getByRole("list", { name: g.title });
    await expect(list.getByRole("listitem")).toHaveCount(g.items.length);
  }
  await expect(section.getByText("Shown in:")).toHaveCount(skills.groups.length);
  await expect(page.locator("progress, [role=progressbar], [role=meter]")).toHaveCount(0);
  const text = (await section.innerText()).toLowerCase();
  for (const unshown of ["pytorch", "mlflow", "aws", "kafka", "nats", "tableau"]) expect(text).not.toContain(unshown);
});

test("education: exactly the confirmed degree, training and certificates; no CGPA or dates on certificates", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#education");
  for (const d of education.degrees) await expect(section).toContainText(d.title);
  for (const t of education.training) await expect(section).toContainText(t.title);
  for (const c of education.certifications) await expect(section).toContainText(c.title);
  const text = (await section.innerText()).toLowerCase();
  expect(text).not.toContain("cgpa");
});

test("open source / writing section is hidden (none yet)", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#writing")).toHaveCount(0);
});
