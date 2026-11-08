import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/** Filter categories shown on the projects grid. A project can have several. */
export const PROJECT_TYPES = ["LLM/GenAI", "ML", "Data Analysis", "MLOps"] as const;

const url = z.url();

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "*.mdx" }),
  schema: ({ image }) =>
    z
      .object({
        /** Outcome-first title (what the work achieved), used on cards and the case study page. */
        title: z.string().max(110),
        /** The product's own name, e.g. "TabulaView.ai". */
        name: z.string(),
        /** One or two sentences: what it is. */
        summary: z.string().max(240),
        /** One-line result. Every number must trace to a source listed in `sources`. */
        result: z.string().max(200),
        types: z.array(z.enum(PROJECT_TYPES)).min(1),
        tech: z.array(z.string()).min(1).max(12),
        /** Only public, cleaned repos. Leave out rather than link something private. */
        links: z
          .object({
            demo: url.optional(),
            demoNote: z.string().optional(),
            github: url.optional(),
            writeup: url.optional(),
          })
          .default({}),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        /** Lower numbers show first on the grid. */
        order: z.number().int().default(100),
        /** Hidden from the site (grid, pages, sitemap) while true. */
        draft: z.boolean().default(false),
        related: z.array(reference("projects")).default([]),
        /** Credits for other people's contributions. */
        credits: z.string().optional(),
        /** Where each number in the page comes from (shown at the end of the case study). */
        sources: z.array(z.string()).min(1),
        updated: z.coerce.date(),
      })
      .refine((p) => !p.cover || p.coverAlt, { message: "coverAlt is required when cover is set", path: ["coverAlt"] }),
});

export const collections = { projects };
