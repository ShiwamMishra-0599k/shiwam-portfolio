import { test, expect } from "@playwright/test";
import { readdirSync } from "node:fs";
import { bannedNames } from "../../scripts/banned-terms.mjs";

const caseStudies = readdirSync("src/content/projects")
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => `/projects/${f.replace(/\.mdx$/, "")}/`);
const pages = ["/", ...caseStudies];

test("robots.txt allows crawling and points to the sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.ok()).toBe(true);
  const text = await res.text();
  expect(text).toContain("User-agent: *");
  expect(text).toMatch(/Sitemap: https:\/\/.+\/sitemap-index\.xml/);
});

test("sitemap lists every page except 404", async ({ request }) => {
  const index = await (await request.get("/sitemap-index.xml")).text();
  const child = index.match(/<loc>[^<]*\/(sitemap-\d+\.xml)<\/loc>/)?.[1];
  expect(child).toBeTruthy();
  const xml = await (await request.get(`/${child}`)).text();
  for (const p of caseStudies) expect(xml).toContain(`${p}</loc>`);
  expect(xml).toMatch(/<loc>https:\/\/[^<]+\/<\/loc>/);
  expect(xml).not.toContain("404");
});

for (const path of pages) {
  test(`${path}: title, description, canonical, Open Graph and Twitter tags`, async ({ page, request }) => {
    await page.goto(path);
    const meta = (sel: string) => page.locator(sel).getAttribute("content");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThanOrEqual(70);
    const desc = (await meta('meta[name="description"]')) ?? "";
    expect(desc.length).toBeGreaterThan(50);
    expect(desc.length).toBeLessThanOrEqual(240);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(/^https:\/\//);
    expect(await meta('meta[property="og:title"]')).toBe(title);
    const img = (await meta('meta[property="og:image"]')) ?? "";
    expect(img).toMatch(/^https:\/\/.+\/og\/.+\.png$/);
    expect((await request.get(new URL(img).pathname)).ok()).toBe(true);
    expect(await meta('meta[property="og:image:alt"]')).toBeTruthy();
    expect(await meta('meta[name="twitter:card"]')).toBe("summary_large_image");
  });
}

test("titles are unique across pages", async ({ page }) => {
  const titles = new Set<string>();
  for (const p of pages) {
    await page.goto(p);
    titles.add(await page.title());
  }
  expect(titles.size).toBe(pages.length);
});

test("home: valid Person JSON-LD with confirmed facts and no employer", async ({ page }) => {
  await page.goto("/");
  const data = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((b) => JSON.parse(b));
  const person = data.find((d) => d["@type"] === "Person");
  expect(person).toBeTruthy();
  expect(person.name).toBe("Shiwam Mishra");
  expect(person.sameAs).toEqual([
    "https://github.com/ShiwamMishra-0599k",
    "https://www.linkedin.com/in/shiwammishra01/",
  ]);
  expect(person.alumniOf[0].name).toBe("Birla Institute of Technology, Mesra");
  expect(person).not.toHaveProperty("worksFor");
  const json = JSON.stringify(data).toLowerCase();
  for (const t of [...bannedNames(), "rubixe"]) expect(json).not.toContain(t);
});

test("case studies carry CreativeWork JSON-LD; 404 is noindex", async ({ page }) => {
  await page.goto(caseStudies[0]);
  const data = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((b) => JSON.parse(b));
  expect(data.some((d) => d["@type"] === "CreativeWork" && d.author?.name === "Shiwam Mishra")).toBe(true);
  await page.goto("/404");
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toBe("noindex");
});
