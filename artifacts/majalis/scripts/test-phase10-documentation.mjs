/**
 * Phase 10 — required enterprise documentation set must exist and stay non-empty.
 */
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const docsRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../docs");

const required = [
  "Architecture.md",
  "Security.md",
  "Deployment.md",
  "Database.md",
  "CI-CD.md",
  "Performance.md",
  "Reliability.md",
  "Testing.md",
  "Disaster-Recovery.md",
  "Developer-Guide.md",
  "README.md",
];

for (const name of required) {
  const path = join(docsRoot, name);
  const st = statSync(path);
  assert.ok(st.isFile(), `${name} missing`);
  assert.ok(st.size > 200, `${name} too short`);
  const text = readFileSync(path, "utf8");
  assert.match(text, /سُنّة|المجلس|Majalis|majalis/i, `${name} should reference the product`);
}

console.log("phase10-documentation: ok");
