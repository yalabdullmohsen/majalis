/**
 * Gate: Production API entry must not import blind url.parse patches,
 * and loading the API graph must not emit DEP0169 from majalis sources.
 *
 * CI note (Node 24): pnpm/action-setup self-installer emits DEP0169 unless
 * `standalone: true` (@pnpm/exe). Workflows must keep that flag.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(root, "..", "..");
const apiIndex = readFileSync(join(root, "api/index.js"), "utf8");
const serverIndex = readFileSync(join(root, "server/index.mjs"), "utf8");

assert.doesNotMatch(apiIndex, /patch-url-parse/, "api/index must not import url.parse patch");
assert.doesNotMatch(serverIndex, /patch-url-parse/, "server/index must not import url.parse patch");
assert.equal(existsSync(join(root, "server/patch-url-parse.mjs")), false, "blind patch file must be removed");

/** Every pnpm/action-setup step must set standalone: true (avoids DEP0169 self-installer). */
const workflowsDir = join(repoRoot, ".github", "workflows");
const workflowFiles = readdirSync(workflowsDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
const badWorkflows = [];
for (const file of workflowFiles) {
  const text = readFileSync(join(workflowsDir, file), "utf8");
  if (!text.includes("pnpm/action-setup@")) continue;
  // Each action-setup occurrence should be followed (within a few lines) by standalone: true
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes("pnpm/action-setup@")) continue;
    const window = lines.slice(i, i + 6).join("\n");
    if (!/standalone:\s*true/.test(window)) {
      badWorkflows.push(`${file}:${i + 1}`);
    }
  }
}
assert.equal(
  badWorkflows.length,
  0,
  `pnpm/action-setup missing standalone: true (DEP0169):\n${badWorkflows.join("\n")}`,
);

// No local url.parse in majalis app/lib/api/server (except comments)
const { execSync } = await import("node:child_process");
let grepOut = "";
try {
  grepOut = execSync(
    `rg -n "url\\.parse\\s*\\(" --glob '!**/node_modules/**' --glob '!**/*.md' api lib server src scripts || true`,
    { cwd: root, encoding: "utf8" },
  );
} catch {
  grepOut = "";
}
const localHits = grepOut
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.includes("test-dep0169") && !l.includes("DEP0169") && !l.includes("url.parse()"));
assert.equal(localHits.length, 0, `local url.parse call sites forbidden:\n${localHits.join("\n")}`);

const probe = `
process.on('warning', (w) => {
  const msg = String(w.message || '');
  const stack = String(w.stack || '');
  if (w.name === 'DeprecationWarning' && (msg.includes('DEP0169') || msg.includes('url.parse'))) {
    // Only fail if the stack points at majalis sources (not node_modules).
    if (/artifacts\\/majalis\\/(api|lib|server|src)\\//.test(stack) && !/node_modules/.test(stack.split('\\n')[1] || '')) {
      console.error('DEP0169_FROM_MAJALIS');
      console.error(stack);
      process.exit(2);
    }
  }
});
await import(${JSON.stringify(join(root, "api/index.js"))});
console.log('api-entry-ok');
`;

const result = spawnSync(process.execPath, ["--trace-deprecation", "--input-type=module", "-e", probe], {
  cwd: root,
  encoding: "utf8",
  timeout: 30_000,
  env: { ...process.env, NODE_ENV: "test" },
});

assert.notEqual(result.status, 2, result.stderr || result.stdout);
assert.match(result.stdout || "", /api-entry-ok/, "api entry must load");
console.log("test-dep0169-api: ok");
