/**
 * Content quality Wave 1 — P0 public exposure integrity.
 * Run: node --import tsx src/lib/__tests__/content-quality-wave1-p0-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repo = resolve(root, "../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== Wave1 docs present ===");
{
  assert.ok(existsSync(resolve(repo, "reports/content-completeness-master.json")));
  assert.ok(existsSync(resolve(repo, "docs/content-quality/CONTENT_COMPLETENESS_REPORT.md")));
  assert.ok(existsSync(resolve(repo, "docs/content-quality/SHARIA_SOURCE_REVIEW.md")));
  const master = JSON.parse(
    readFileSync(resolve(repo, "reports/content-completeness-master.json"), "utf8"),
  );
  assert.equal(master.totals.appRoutesPathEntries, 364);
  assert.equal(master.totals.routesWithFinalRecord, 364);
  assert.ok(Array.isArray(master.routeInventory));
  assert.equal(master.routeInventory.length, 364);
  assert.ok(master.totals.libraryBooksWithoutUrl >= 100);
  assert.equal(master.totals.libraryBooksWithoutUrl, 172);
}

console.log("=== fiqh-council is redirect-only ===");
{
  const routes = read("src/AppRoutes.tsx");
  assert.match(routes, /path="\/fiqh-council"/);
  assert.match(routes, /fiqh-council[\s\S]{0,200}?Redirect|Redirect[\s\S]{0,80}?fiqh/);
  assert.doesNotMatch(routes, /path="\/fiqh-council"[\s\S]{0,120}?component=\{FiqhCouncil/);
}

console.log("=== Search hides draft/pending + council hrefs ===");
{
  const cards = read("src/components/search/SearchResultCards.tsx");
  assert.match(cards, /pending_review/);
  assert.match(cards, /needs_review/);
  assert.match(cards, /draft/);
  assert.match(cards, /fiqh-council/);
  assert.match(cards, /return null/);
}

console.log("=== RelatedRail / Home filters ===");
{
  assert.match(read("src/widgets/RelatedRail.tsx"), /fiqh-council/);
  assert.match(read("src/components/home/HomeLatestUpdates.tsx"), /fiqh-council/);
}

console.log("=== ComingSoon has no قريبًا stub ===");
{
  const dialog = read("src/components/ComingSoonDialog.tsx");
  assert.doesNotMatch(dialog, /قريبًا/);
  assert.match(dialog, /قسم غير متاح/);
}

console.log("=== Ayah normalize gate still present ===");
{
  assert.ok(existsSync(resolve(root, "src/lib/ayah-ref-normalize.ts")));
  assert.ok(existsSync(resolve(root, "src/lib/__tests__/ayah-ref-normalize-gate.test.ts")));
}

console.log("=== updates-seed has no council product branding ===");
{
  assert.doesNotMatch(read("src/lib/updates-seed.ts"), /\/fiqh-council|المجمع الفقهي/);
}

console.log("=== Library detail is search redirect (no orphan detail surface) ===");
{
  const detail = read("src/pages/library/ui/LibraryDetailView.tsx");
  assert.match(detail, /Redirect/);
  assert.match(detail, /\/search/);
}

console.log("content-quality-wave1-p0-gate: ok");
