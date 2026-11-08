# Projects: one MDX file per project

Projects must be `.mdx` files (this README is ignored). The file name becomes the URL: `tabulaview.mdx` → `/projects/tabulaview`. Frontmatter is validated by `src/content.config.ts`, and the build fails if a field is missing or wrong.

| Field                                           | Required | Notes                                                                                  |
| ----------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `title`                                         | yes      | Outcome-first, ≤ 110 characters                                                        |
| `name`                                          | yes      | The product's own name                                                                 |
| `summary`                                       | yes      | What it is, ≤ 240 characters                                                           |
| `result`                                        | yes      | One-line result, ≤ 200 characters. Every number must have a source in `sources`        |
| `types`                                         | yes      | One or more of `LLM/GenAI`, `ML`, `Data Analysis`, `MLOps` (these drive the filters)   |
| `tech`                                          | yes      | 1–12 items. Cards show the first 6                                                     |
| `links.demo` / `links.github` / `links.writeup` | no       | Public, cleaned repos only. Leave a link out rather than point it at something private |
| `links.demoNote`                                | no       | E.g. "free sign-in required"                                                           |
| `cover` + `coverAlt`                            | no       | Image in `src/assets/projects/<name>/`. Alt text is required when there's a cover      |
| `order`                                         | no       | Lower numbers show first                                                               |
| `draft`                                         | no       | `true` hides the project everywhere                                                    |
| `related`                                       | no       | Other project file names (without extension)                                           |
| `credits`                                       | no       | Name anyone else who contributed                                                       |
| `sources`                                       | yes      | Where the numbers come from (shown at the bottom of the case study)                    |
| `updated`                                       | yes      | Date the facts were last checked                                                       |

**Body sections, in this order** (the tests check them):

1. `## Problem and why it matters`
2. `## Data`
3. `## Approach and architecture` (include a diagram)
4. `## Models, tools and key decisions` (include what was rejected and why)
5. `## Evaluation`
6. `## Results`
7. `## Deployment`
8. `## Limitations and what I'd do next`

The **Links** section, the credits, the sources and the **Related projects** strip are added automatically.
