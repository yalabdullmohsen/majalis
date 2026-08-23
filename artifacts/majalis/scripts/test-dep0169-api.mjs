/**
 * Gate: Production API entry must not import blind url.parse patches,
 * and loading the API graph must not emit DEP0169 from majalis sources.
 *
 * CI note (Node 24): `pnpm/action-setup` (self-installer / npm install of
 * pnpm or @pnpm/exe) emits DEP0169 via `url.parse()`. Workflows must use
 * Corepack (`corepack enable` + `corepack prepare --activate`) instead.
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

/** CI workflows that install with pnpm must use Corepack — not pnpm/action-setup. */
/** Workflows allowed to use pnpm/action-setup (isolated job; Corepack elsewhere). */
const ACTION_SETUP_ALLOWED = new Set(["harvest-sources.yml"]);
const workflowsDir = join(repoRoot, ".github", "workflows");
const workflowFiles = readdirSync(workflowsDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
const actionSetupHits = [];
const missingCorepack = [];
for (const file of workflowFiles) {
  const text = readFileSync(join(workflowsDir, file), "utf8");
  if (text.includes("pnpm/action-setup@") && !ACTION_SETUP_ALLOWED.has(file)) actionSetupHits.push(file);
  const installsPnpm =
    /pnpm\s+install/.test(text) || /cache:\s*['"]?pnpm['"]?/.test(text);
  const usesActionSetup = text.includes("pnpm/action-setup@");
  if (installsPnpm && !/corepack\s+enable/.test(text) && !usesActionSetup) missingCorepack.push(file);
}
assert.equal(
  actionSetupHits.length,
  0,
  `pnpm/action-setup forbidden (DEP0169 on Node 24):\n${actionSetupHits.join("\n")}`,
);
assert.equal(
  missingCorepack.length,
  0,
  `workflows install pnpm without corepack enable:\n${missingCorepack.join("\n")}`,
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
