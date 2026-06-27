#!/usr/bin/env node
/**
 * Verify content import pipeline is Vercel-safe (no filesystem writes on API path).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const importDir = join(root, "lib/content-import");

const FORBIDDEN = [
  /writeFileSync/,
  /writeFile\(/,
  /mkdirSync/,
  /mkdir\(/,
  /data\/imports\/staged/,
  /importToStaged/,
  /from "\.\/staged\.mjs"/,
];

const ALLOW_FS_READ = new Set(["parsers.mjs", "ensure-schema.mjs", "phase2-trial.mjs"]);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".mjs") || name.endsWith(".js")) out.push(p);
  }
  return out;
}

let violations = 0;

for (const file of walk(importDir)) {
  const rel = file.slice(root.length + 1);
  const base = rel.split("/").pop();
  const src = readFileSync(file, "utf8");

  for (const pattern of FORBIDDEN) {
    if (pattern.test(src)) {
      console.error(`✗ ${rel}: forbidden pattern ${pattern}`);
      violations++;
    }
  }

  if (!ALLOW_FS_READ.has(base) && /from "node:fs"/.test(src)) {
    console.error(`✗ ${rel}: must not import node:fs (use in-memory parsers)`);
    violations++;
  }
}

const apiHandler = readFileSync(join(root, "lib/api-handlers/admin/content-import.js"), "utf8");
if (/from "node:fs"/.test(apiHandler)) {
  console.error("✗ content-import API handler must not import node:fs");
  violations++;
}

try {
  statSync(join(importDir, "staged.mjs"));
  console.error("✗ staged.mjs still exists — remove filesystem staging module");
  violations++;
} catch {
  /* good — file removed */
}

if (violations) {
  console.error(`\nverify-content-import-vercel: ${violations} violation(s)`);
  process.exit(1);
}

console.log("✓ Content import pipeline is Vercel-safe (no filesystem writes on import path)");
process.exit(0);
