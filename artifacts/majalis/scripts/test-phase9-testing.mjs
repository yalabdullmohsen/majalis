/**
 * Phase 9 gate — ensures expanded regression suites stay wired into `pnpm test`.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const required = [
  "test:phase9-coverage",
  "test:inheritance-engine",
  "test:learning-paths-engine",
  "test:category-tree",
  "test:phase8-reliability",
  "test:phase7-performance",
];

for (const name of required) {
  assert.ok(pkg.scripts[name], `missing script ${name}`);
  assert.match(pkg.scripts.test, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

console.log("phase9-testing-gates: ok");
