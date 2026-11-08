// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// Change `site` when the real Vercel URL (or a custom domain) is known. Used for canonical URLs and the sitemap.
export default defineConfig({
  site: "https://shiwam-portfolio-nine.vercel.app",
  trailingSlash: "ignore", // canonical URLs and the sitemap both use a trailing slash
  prefetch: { prefetchAll: false, defaultStrategy: "hover" },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [mdx(), sitemap({ filter: (page) => !page.includes("/404") })],
});
