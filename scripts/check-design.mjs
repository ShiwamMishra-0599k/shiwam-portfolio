// Design-rule gate (run by `npm test`).
// 1. No hex colour in src/ except the brand tokens and their derived tints from global.css.
// 2. No work-experience vocabulary in content/pages, except the single allowed Rubixe internship entry.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { bannedNames } from "./banned-terms.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const ALLOWED_HEX = new Set([
  "#f4ead5",
  "#f8f2e6",
  "#e3dcc8", // cream family
  "#1e3b2f",
  "#12231c",
  "#546759", // forest family
  "#bfbeac",
  "#c9c7b4",
  "#495e50", // muted text and lines
  "#ff3ea5", // pink
]);
// Private names come from the gitignored private/banned-terms.json (see scripts/banned-terms.mjs).
const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BANNED_WORDS = new RegExp(
  `\\b(${[...bannedNames().map(escapeRe), "employment history", "work experience", "job history"].join("|")})\\b`,
  "i",
);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const problems = [];
for (const file of walk(join(root, "src"))) {
  if (!/\.(astro|css|ts|tsx|js|mjs|md|mdx|json)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  const rel = relative(root, file);
  for (const m of text.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/g)) {
    // 3-digit forms are never brand colours; 6-digit must be in the allow-list.
    if (!ALLOWED_HEX.has(m[0].toLowerCase())) problems.push(`${rel}: colour ${m[0]} is not a brand token`);
  }
  const banned = text.match(BANNED_WORDS);
  if (banned) problems.push(`${rel}: banned term "${banned[0]}" (no-work-experience rule)`);
}

// 3. Content placeholders. Listed as a warning during development; `STRICT_TODO=1` (deploy gate) makes them fail.
const todos = [];
for (const file of walk(join(root, "src", "content"))) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    if (/"TODO:|^\s*TODO:/.test(line)) todos.push(`${relative(root, file)}:${i + 1}: ${line.trim().slice(0, 90)}`);
  });
}
// The deploy gate also needs the contact form connected.
if (process.env.STRICT_TODO === "1" && !/^[A-Za-z0-9]{6,12}$/.test(process.env.PUBLIC_FORMSPREE_ID ?? "")) {
  todos.push("PUBLIC_FORMSPREE_ID is not set: the contact form would show only an email link");
}
if (todos.length) {
  const msg = `${todos.length} content placeholder(s) still to fill:\n- ${todos.join("\n- ")}`;
  if (process.env.STRICT_TODO === "1") problems.push(msg);
  else console.warn(`Warning: ${msg}`);
}

if (problems.length) {
  console.error(`Design check failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("Design check passed: brand colours only, no banned work-experience terms.");
