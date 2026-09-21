/**
 * Wave 8 — deep links: /learn/series|:lesson يحافظ على المعرّف؛ /library → /search مقصود.
 * Run: node --import tsx src/lib/__tests__/deeplink-learn-series-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildLegacyLearnTarget,
  filterAllowedLearnQuery,
  sanitizeLearnSlug,
} from "../legacy-learn-redirect";

const here = dirname(fileURLToPath(import.meta.url));
const majalisRoot = resolve(here, "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

console.log("=== sanitize + target preserve slug ===");
assert.equal(sanitizeLearnSlug("seerah-series-1"), "seerah-series-1");
assert.equal(sanitizeLearnSlug(""), null);
assert.equal(sanitizeLearnSlug("../x"), null);
assert.equal(sanitizeLearnSlug("a/b"), null);
assert.equal(
  buildLegacyLearnTarget("seerah-series-1"),
  "/lessons/seerah-series-1",
);
assert.equal(
  buildLegacyLearnTarget("kw-abc", "t=12&evil=1&from=share"),
  "/lessons/kw-abc?t=12&from=share",
);
assert.equal(buildLegacyLearnTarget(""), "/lessons");
assert.equal(buildLegacyLearnTarget("bad/path"), "/lessons");
assert.equal(filterAllowedLearnQuery("utm_source=x&t=3"), "t=3");
assert.ok(!buildLegacyLearnTarget("x").startsWith("/learn"));

console.log("=== AppRoutes wiring ===");
{
  const routes = read("src/AppRoutes.tsx");
  assert.match(routes, /LegacyLearnIdRedirect/);
  assert.match(routes, /buildLegacyLearnTarget/);
  assert.match(routes, /path="\/learn\/series\/:slug"/);
  assert.match(routes, /path="\/learn\/lesson\/:id"/);
  assert.doesNotMatch(
    routes,
    /path="\/learn\/series\/:slug"><Redirect to="\/lessons"/,
  );
  assert.match(routes, /PRODUCT_INTENT.*\/library/s);
  assert.match(
    routes,
    /path="\/library"[^>]*>\s*<Redirect\s+to="\/search"/,
  );
}

console.log("=== library route intent doc ===");
{
  const intent = readRepo("docs/content-quality/LIBRARY_ROUTE_INTENT.md");
  assert.match(intent, /PRODUCT_INTENT/);
  assert.match(intent, /\/library/);
  assert.match(intent, /\/search/);
}

console.log("=== package script ===");
{
  const pkg = read("package.json");
  assert.match(pkg, /test:deeplink-learn-series/);
}

console.log("deeplink-learn-series-gate.test.ts: ok");
