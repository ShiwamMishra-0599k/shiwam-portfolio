// Names that must never appear on the site (former employers, third parties). The list itself is private,
// so it lives in the gitignored private/banned-terms.json; without that file the name checks are skipped.
import { existsSync, readFileSync } from "node:fs";

const file = new URL("../private/banned-terms.json", import.meta.url);

/** @returns {string[]} lower-case terms, or [] when the private list isn't on this machine */
export function bannedNames() {
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, "utf8")).terms.map((t) => String(t).toLowerCase());
}
