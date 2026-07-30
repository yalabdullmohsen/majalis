/**
 * Gate: Vercel NFT markers + healthz must stay light (no static AI/CMS graph).
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const deps = readFileSync(join(root, "api/_deps.mjs"), "utf8");
assert.match(deps, /import\s+["']@anthropic-ai\/sdk["']/, "_deps must NFT-mark @anthropic-ai/sdk");
assert.match(deps, /import\s+["']pg["']/, "_deps must NFT-mark pg");
assert.match(deps, /import\s+["']@supabase\/supabase-js["']/, "_deps must NFT-mark supabase-js");

const healthz = readFileSync(join(root, "lib/api-handlers/healthz.js"), "utf8");
assert.doesNotMatch(
  healthz,
  /import\s+\{[^}]*getPlatformHealth[^}]*\}\s+from/,
  "healthz must not statically import platform-health",
);
assert.match(healthz, /import\(["']\.\.\/platform-health\.mjs["']\)/, "healthz full probe must lazy-import platform-health");
assert.match(healthz, /full\s*===\s*["']1["']|query\?\.full/, "healthz deep probe is opt-in via full=1");

const healthEntry = readFileSync(join(root, "api/healthz.js"), "utf8");
assert.doesNotMatch(healthEntry, /from\s+["'][^"']*_deps\.mjs["']/, "api/healthz must not import _deps");
assert.doesNotMatch(healthEntry, /from\s+["'][^"']*api-dispatch/, "api/healthz must not import api-dispatch");
assert.doesNotMatch(healthEntry, /from\s+["'][^"']*platform-health/, "api/healthz must not import platform-health");
assert.match(healthEntry, /api-handlers\/healthz/, "api/healthz re-exports light handler");

assert.ok(existsSync(join(root, "api/readyz.js")), "dedicated api/readyz.js required");
assert.ok(existsSync(join(root, "api/cron/job-worker.js")), "dedicated api/cron/job-worker.js required");

const readyzEntry = readFileSync(join(root, "api/readyz.js"), "utf8");
assert.match(readyzEntry, /import\s+["']pg["']/, "readyz entry must NFT-mark pg");

const index = readFileSync(join(root, "api/index.js"), "utf8");
assert.match(index, /isResponseClosed|sendJson/, "api/index bootstrap must guard double-response");

const vercel = readFileSync(join(root, "vercel.json"), "utf8");
assert.match(vercel, /"api\/healthz\.js"/, "vercel.json registers healthz function");
assert.match(vercel, /"api\/readyz\.js"/, "vercel.json registers readyz function");
assert.match(vercel, /"api\/cron\/job-worker\.js"/, "vercel.json registers job-worker function");
// Catch-all stays simple — Vercel filesystem routes (api/healthz.js etc.) win before
// afterFiles rewrites. Negative-lookahead sources have broken Production deploys.
assert.match(vercel, /"source":\s*"\/api\/\(\.\*\)"/, "api catch-all rewrite must stay path-to-regexp safe");
assert.doesNotMatch(vercel, /\(\?!/, "vercel.json must not use negative lookahead routes");

const dispatch = readFileSync(join(root, "lib/api-dispatch.mjs"), "utf8");
assert.match(dispatch, /CRON_HANDLER_TIMEOUT_MS\s*=\s*12_000/, "cron HTTP budget stays under 45s");
assert.match(dispatch, /!res\.headersSent/, "dispatch checks headersSent before error response");

const http = readFileSync(join(root, "lib/api/_http.mjs"), "utf8");
assert.match(http, /double_response_blocked/, "sendJson blocks double response");

console.log("test-api-nft-deps: ok");
