/**
 * بوابة PR-5: بقية السجلات — منع العبارات المحظورة + لا PUBLISHED.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const inventoryPath = resolve(
  repoRoot,
  "docs/content-quality/islamic-sects-inventory.json",
);
const batchReportPath = resolve(
  repoRoot,
  "docs/content-quality/ISLAMIC_SECTS_BATCH2_SOURCE_REVIEW.md",
);
const dataPath = resolve(majalisRoot, "src/data/islamic-sects.ts");
const buildScript = resolve(
  majalisRoot,
  "scripts/build-islamic-sects-inventory.mjs",
);

const BATCH1 = new Set([
  "ahl-al-sunna",
  "ashariyya",
  "maturidiyya",
  "khawarij",
  "ibadiyya",
  "mutazila",
]);

assert.ok(existsSync(batchReportPath), "ISLAMIC_SECTS_BATCH2_SOURCE_REVIEW.md");
assert.ok(existsSync(dataPath), "islamic-sects.ts");

const build = spawnSync(process.execPath, [buildScript], {
  cwd: majalisRoot,
  encoding: "utf8",
});
assert.equal(build.status, 0, `فشل بناء الجرد: ${build.stderr || build.stdout}`);

const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
const dataSrc = readFileSync(dataPath, "utf8");
const report = readFileSync(batchReportPath, "utf8");

assert.match(report, /PR-5/);
assert.match(report, /لا `PUBLISHED`|لا PUBLISHED/);
assert.equal(inventory.publishedCount, 0);

const remaining = inventory.records.filter(
  (r: { id: string }) => !BATCH1.has(r.id),
);
assert.equal(remaining.length, 29, "متوقع 29 سجلًا خارج الدفعة 1");

for (const r of remaining) {
  assert.notEqual(r.publicationStatus, "PUBLISHED", r.id);
  assert.ok(
    r.inventoryFlags?.includes("pr5_batch2_claim_audit"),
    `وسم pr5 مفقود: ${r.id}`,
  );
  assert.equal((r.primarySources ?? []).length, 0, r.id);
}

const forbidden = [
  "icon: \"🚫\"",
  "خارج ملة الإسلام، وردَّ عليهم ابن تيمية تفصيلاً",
  "يُجمع علماء السنة على أنهم خرجوا من دائرة الإسلام",
  "أجمع العلماء والمجامع الفقهية الدولية على كفرهم وخروجهم من الملة",
  "الأكبر في العالم — تعمل في أكثر من 150 دولة",
  "لبنان (8%) وسوريا (3%)",
  "رجب طيب أردوغان (سياسياً)",
  '"حامد رضا خان", "حامد رضا خان"',
  "انقرضت كفرقة مستقلة، وبعض مقولاتها",
  "سائدة في السعودية ودول الخليج",
];

for (const phrase of forbidden) {
  assert.equal(
    dataSrc.includes(phrase),
    false,
    `عبارة محظورة عادت: ${phrase}`,
  );
}

console.log(
  `islamic-sects-batch2-review-gate.test.ts: ok (remaining=${remaining.length} published=${inventory.publishedCount})`,
);
