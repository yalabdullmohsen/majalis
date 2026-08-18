/**
 * Post-build bundle budgets + shell must not embed mega-seeds.
 * Run after `pnpm run build` (expects dist/assets).
 *
 * Budgets (post PR #633؛ محدّث 2026-08 مع إعادة مركز القرآن):
 * - Entry JS gzip ≤ 164 KiB (كان 162؛ هامش لتهيئة التشغيل الأول الكسولة + وضع كبار السن)
 * - Icons chunk gzip ≤ 30 KiB
 * - Main CSS gzip ≤ 100 KiB
 */
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = join(root, "dist", "assets");

assert.ok(existsSync(assetsDir), "dist/assets missing — run build first");

const files = readdirSync(assetsDir).filter((f) => f.endsWith(".js") || f.endsWith(".css"));
const rows = files.map((f) => {
  const buf = readFileSync(join(assetsDir, f));
  return { f, raw: buf.length, gz: gzipSync(buf, { level: 9 }).length };
});

const entry = rows
  .filter((r) => /^index-.*\.js$/.test(r.f))
  .sort((a, b) => b.raw - a.raw)[0];
assert.ok(entry, "entry index-*.js not found");

const css = rows
  .filter((r) => /^index-.*\.css$/.test(r.f))
  .sort((a, b) => b.raw - a.raw)[0];

const icons = rows
  .filter((r) => /^icons-.*\.js$/.test(r.f))
  .sort((a, b) => b.gz - a.gz)[0];

const INITIAL_JS_GZIP_BUDGET = 164 * 1024;
const ICONS_JS_GZIP_BUDGET = 30 * 1024;
const CSS_GZIP_BUDGET = 100 * 1024;
const CHUNK_GZIP_SOFT = 150 * 1024;

console.log("=== bundle-budget-gates ===\n");
console.log(`  entry ${entry.f}: gzip=${(entry.gz / 1024).toFixed(1)} KiB`);
assert.ok(
  entry.gz <= INITIAL_JS_GZIP_BUDGET,
  `Initial JS gzip ${(entry.gz / 1024).toFixed(1)} KiB exceeds ${INITIAL_JS_GZIP_BUDGET / 1024} KiB`,
);
console.log(`  ✓ Initial JS gzip ≤ ${INITIAL_JS_GZIP_BUDGET / 1024} KiB`);

if (icons) {
  console.log(`  icons ${icons.f}: gzip=${(icons.gz / 1024).toFixed(1)} KiB`);
  assert.ok(
    icons.gz <= ICONS_JS_GZIP_BUDGET,
    `Icons gzip ${(icons.gz / 1024).toFixed(1)} KiB exceeds ${ICONS_JS_GZIP_BUDGET / 1024} KiB`,
  );
  console.log("  ✓ Icons gzip ≤ 30 KiB");
} else {
  console.log("  ✓ no icons-*.js chunk (tree-shaken into routes)");
}

if (css) {
  console.log(`  css ${css.f}: gzip=${(css.gz / 1024).toFixed(1)} KiB`);
  assert.ok(css.gz <= CSS_GZIP_BUDGET, `CSS gzip exceeds 100 KiB`);
  console.log("  ✓ Main CSS gzip ≤ 100 KiB");
}

const entryBuf = readFileSync(join(assetsDir, entry.f), "utf8");
assert.doesNotMatch(
  entryBuf,
  /from\s*["']\.\/supabase-/,
  "entry must not statically import the supabase chunk (TBT)",
);
console.log("  ✓ entry does not statically import supabase-*");

const reactDomChunk = rows.find((r) => /^react-dom-.*\.js$/.test(r.f));
const reactChunk = rows.find((r) => /^react-.*\.js$/.test(r.f) && !r.f.startsWith("react-dom"));
assert.ok(reactDomChunk, "react-dom-*.js chunk missing after vendor split");
assert.ok(reactChunk, "react-*.js chunk missing after vendor split");
console.log(
  `  ✓ vendor split: ${reactChunk.f} gzip=${(reactChunk.gz / 1024).toFixed(1)} KiB · ${reactDomChunk.f} gzip=${(reactDomChunk.gz / 1024).toFixed(1)} KiB`,
);
const legacyVendor = rows.filter((r) => /^vendor-.*\.js$/.test(r.f));
assert.equal(
  legacyVendor.length,
  0,
  `legacy vendor-*.js must be split: ${legacyVendor.map((r) => r.f).join(", ")}`,
);

for (const banned of [
  "SEED_FAWAID",
  "ADHKAR_ITEMS",
  "FAWAID_CURATED_SEED",
  "islamicQuizData",
  "node:fs/promises",
  "node:path",
  "json-seed-disk.node",
]) {
  assert.ok(!entryBuf.includes(banned), `entry must not embed ${banned}`);
}
console.log("  ✓ entry does not embed mega-seed identifiers or node builtins");

const oversized = rows
  .filter((r) => r.f.endsWith(".js") && r.gz > CHUNK_GZIP_SOFT)
  .filter((r) => !/fawaid-curated|DurusMutanawwia|DurusImaniyya|PropheticMedicine|FiqhTopic|icons-/.test(r.f));
for (const r of oversized) {
  console.warn(`  ⚠ chunk gzip>${CHUNK_GZIP_SOFT / 1024}KiB (content/vendor): ${r.f} ${(r.gz / 1024).toFixed(1)}KiB`);
}

console.log("\nBundle budget gates passed.\n");
