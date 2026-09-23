/**
 * بوابة PR-5: صفحة تفاصيل البحث + رابط المصدر الأصلي الآمن.
 * تشغيل: node --import tsx src/lib/__tests__/memorization-research-pr5-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const page = readPkg("src/views/ResearchDetailPage.tsx");
assert.match(page, /SCHOLARLY_RESEARCH_DISCLAIMER/);
assert.match(page, /SCHOLARLY_OPEN_ORIGINAL_CTA|فتح المصدر الأصلي/);
assert.match(page, /safeOriginalSourceHref/);
assert.match(page, /حالة التحقق/);
assert.doesNotMatch(page, />\s*تحميل من سُنّة\s*</);
assert.doesNotMatch(page, /موافق لأهل السنة والجماعة/);
assert.doesNotMatch(page, /emailPrivate|authorEmail/);

const {
  safeOriginalSourceHref,
  isSafeExternalHttpUrl,
  SCHOLARLY_OPEN_ORIGINAL_CTA,
  SCHOLARLY_FORBIDDEN_HOSTED_DOWNLOAD_CTA,
  SCHOLARLY_RESEARCH_DISCLAIMER,
} = await import("../scholarly-research/index.ts");

assert.equal(SCHOLARLY_OPEN_ORIGINAL_CTA, "فتح المصدر الأصلي");
assert.equal(SCHOLARLY_FORBIDDEN_HOSTED_DOWNLOAD_CTA, "تحميل من سُنّة");
assert.match(SCHOLARLY_RESEARCH_DISCLAIMER, /لا يعني اعتماد جميع نتائجه/);

assert.equal(isSafeExternalHttpUrl("javascript:alert(1)"), false);
assert.equal(isSafeExternalHttpUrl("https://example.edu/thesis"), true);
assert.equal(safeOriginalSourceHref("javascript:void(0)"), null);
assert.equal(safeOriginalSourceHref("https://repository.example.edu/item/1"), "https://repository.example.edu/item/1");
assert.equal(safeOriginalSourceHref("http://localhost/x"), null);

const pkg = readPkg("package.json");
assert.match(pkg, /"test:memorization-research-pr5"/);

assert.match(
  readRepo("docs/REPO_INDEX.md"),
  /PR-5|memorization-research-pr5|تفاصيل/,
);

console.log("memorization-research-pr5-gate.test.ts: ok");
