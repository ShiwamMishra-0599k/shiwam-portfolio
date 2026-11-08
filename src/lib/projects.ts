import { getCollection, type CollectionEntry } from "astro:content";

export type Project = CollectionEntry<"projects">;

/** Published projects (drafts excluded), in display order. */
export async function getProjects(): Promise<Project[]> {
  const all = await getCollection("projects", ({ data }) => !data.draft);
  return all.sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));
}

/** Explicit `related` first, then the rest by shared type, never the project itself. */
export function relatedTo(project: Project, all: Project[], limit = 3): Project[] {
  const explicit = project.data.related.map((r) => r.id);
  const others = all.filter((p) => p.id !== project.id);
  const score = (p: Project) =>
    (explicit.includes(p.id) ? 100 : 0) + p.data.types.filter((t) => project.data.types.includes(t)).length;
  return others.sort((a, b) => score(b) - score(a)).slice(0, limit);
}

export const projectUrl = (p: Project) => `/projects/${p.id}/`;
