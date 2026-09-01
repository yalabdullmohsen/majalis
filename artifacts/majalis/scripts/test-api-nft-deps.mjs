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
assert.doesNotMatch(
  healthz,
  /platform-health\.mjs/,
  "healthz must not load platform-health — use /api/deep-health",
);
assert.match(healthz, /service:\s*"ssunnah-web"/, "healthz service name is ssunnah-web");
assert.doesNotMatch(healthz, /VERCEL_GIT_COMMIT_SHA|uptimeMs/, "healthz must not expose internal deploy metadata");

// Dedicated light function files are optional Phase-1 stretch; do not require them
// after Production deploy regressions from multi-function vercel.json configs.
assert.equal(existsSync(join(root, "api/index.js")), true, "api/index.js is the serverless entry");

const index = readFileSync(join(root, "api/index.js"), "utf8");
assert.match(index, /isResponseClosed|sendJson/, "api/index bootstrap must guard double-response");
assert.match(index, /_deps\.mjs/, "api/index must load NFT markers");

const vercel = readFileSync(join(root, "vercel.json"), "utf8");
assert.match(vercel, /"api\/index\.js"/, "vercel.json registers api/index function");
assert.match(vercel, /"source":\s*"\/api\/\(\.\*\)"/, "api catch-all rewrite must stay path-to-regexp safe");
assert.doesNotMatch(vercel, /\(\?!/, "vercel.json must not use negative lookahead routes");

const dispatch = readFileSync(join(root, "lib/api-dispatch.mjs"), "utf8");
assert.match(dispatch, /CRON_HANDLER_TIMEOUT_MS\s*=\s*12_000/, "cron HTTP budget stays under 45s");
assert.match(dispatch, /!res\.headersSent/, "dispatch checks headersSent before error response");

const http = readFileSync(join(root, "lib/api/_http.mjs"), "utf8");
assert.match(http, /double_response_blocked/, "sendJson blocks double response");

console.log("test-api-nft-deps: ok");
