/**
 * بوابة وجود Baseline إطلاق واجهة سُنّة (PR-0).
 * Run: node --import tsx src/lib/__tests__/sunnah-release-ui-baseline-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const baseline = readRepo("docs/release/SUNNAH_RELEASE_UI_BASELINE.md");
assert.match(baseline, /SUNNAH RELEASE UI BASELINE/);
assert.match(baseline, /\*\*Status:\*\*\s*`PARTIAL`/);
assert.doesNotMatch(baseline, /SUNNAH_RELEASE_UI_READY` is declared|Status:\s*`COMPLETE`/);
assert.match(baseline, /Do not start PR-1/);
assert.match(baseline, /quran-hub\/numbers/);
assert.match(baseline, /discover-islam\/contact/);
assert.match(baseline, /LazySectionAccordionPage/);
assert.match(baseline, /mushaf/);
assert.match(baseline, /430px/);

const routes = JSON.parse(
  readRepo("docs/release/sunnah-release-ui-route-inventory.json"),
) as { counts: Record<string, number>; routes: unknown[] };
assert.ok(routes.counts.publicPages >= 200, "public pages inventory too small");
assert.ok(routes.counts.publicRedirects >= 50, "redirect inventory too small");
assert.ok(routes.routes.length >= 300, "route list incomplete");

const filters = JSON.parse(
  readRepo("docs/release/sunnah-release-filter-inventory.json"),
) as { filters: unknown[]; status: string };
assert.equal(filters.status, "INVENTORY_ONLY_PR0");
assert.ok(filters.filters.length >= 5);

const shotsDir = resolve(repoRoot, "docs/release/baseline-screenshots");
assert.ok(existsSync(resolve(shotsDir, "manifest.json")));
assert.ok(existsSync(resolve(shotsDir, "quran-hub-numbers__ipad-portrait__light.png")));
assert.ok(existsSync(resolve(shotsDir, "mushaf__ipad-portrait__light.png")));
assert.ok(existsSync(resolve(shotsDir, "discover-islam-contact__iphone-14__light.png")));
assert.ok(existsSync(resolve(shotsDir, "arabic-language__ipad-portrait__light.png")));

console.log("sunnah-release-ui-baseline-gate.test.ts: ok");
