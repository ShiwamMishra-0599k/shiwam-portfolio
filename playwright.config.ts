import { defineConfig, devices } from "@playwright/test";

// Runs against the production build (`astro preview`). Uses the locally installed Chrome
// (channel "chrome"), so no browser download is needed. Serial runs: this PC has 8 GB RAM.
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4329", channel: "chrome", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    {
      name: "phone-320",
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 320, height: 640 }, hasTouch: true },
    },
  ],
  webServer: {
    // Builds with a fake Formspree ID so the form renders; tests intercept the request (nothing is sent).
    command: "npx astro build && npx astro preview --port 4329 --host 127.0.0.1 --force",
    env: { PUBLIC_FORMSPREE_ID: "e2etest01" },
    url: "http://127.0.0.1:4329",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
