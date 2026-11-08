import { existsSync } from "node:fs";
import { join } from "node:path";
import site from "../content/site.json";

export { site };

/**
 * True when a file exists in /public at build time. Used to hide links to files that
 * aren't there yet (resume, OG image) so the site never shows a broken link.
 * Builds run from the project root, so process.cwd() is the project folder.
 */
export function publicFileExists(path: string): boolean {
  return existsSync(join(process.cwd(), "public", path));
}

export const hasResume = publicFileExists(site.resume.path);
