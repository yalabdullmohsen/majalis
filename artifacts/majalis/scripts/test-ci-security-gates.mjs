/**
 * Ensures DB bootstrap/migration workflows cannot run on push to main.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "../../.github/workflows");
const bootstraps = [
  "production-bootstrap.yml",
  "platform-bootstrap.yml",
  "owner-bootstrap.yml",
];

for (const name of bootstraps) {
  const text = readFileSync(join(root, name), "utf8");
  assert.match(text, /workflow_dispatch:/, `${name} must support workflow_dispatch`);
  assert.doesNotMatch(
    text,
    /\non:\s*[\s\S]*?\n\s+push:\s*\n/,
    `${name} must not trigger on push`,
  );
  assert.match(text, /permissions:\s*\n\s+contents:\s*read/, `${name} least-privilege permissions`);
  assert.match(text, /node-version:\s*"24"/, `${name} must use Node 24`);
  assert.match(text, /frozen-lockfile/, `${name} must use frozen lockfile`);
}

const ci = readFileSync(join(root, "ci.yml"), "utf8");
assert.doesNotMatch(ci, /production-bootstrap:/, "ci.yml must not include production-bootstrap job");
assert.match(ci, /permissions:\s*\n\s+contents:\s*read/, "ci.yml least-privilege permissions");

console.log("ci-security-gates: ok");
