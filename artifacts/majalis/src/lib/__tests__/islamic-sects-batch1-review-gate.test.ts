/**
 * بوابة PR-4: مراجعة الدفعة الأولى — منع العبارات المحظورة غير الموثقة + لا PUBLISHED.
 * تشغيل: node --import tsx src/lib/__tests__/islamic-sects-batch1-review-gate.test.ts
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
  "docs/content-quality/ISLAMIC_SECTS_BATCH1_SOURCE_REVIEW.md",
);
const queuePath = resolve(
  repoRoot,
  "docs/content-quality/ISLAMIC_SECTS_HUMAN_REVIEW_QUEUE.md",
);
const dataPath = resolve(majalisRoot, "src/data/islamic-sects.ts");
const buildScript = resolve(
  majalisRoot,
  "scripts/build-islamic-sects-inventory.mjs",
);

const BATCH1 = [
  "ahl-al-sunna",
  "ashariyya",
  "maturidiyya",
  "khawarij",
  "ibadiyya",
  "mutazila",
] as const;

assert.ok(existsSync(batchReportPath), "ISLAMIC_SECTS_BATCH1_SOURCE_REVIEW.md");
assert.ok(existsSync(queuePath), "ISLAMIC_SECTS_HUMAN_REVIEW_QUEUE.md");
assert.ok(existsSync(dataPath), "islamic-sects.ts");

const build = spawnSync(process.execPath, [buildScript], {
  cwd: majalisRoot,
  encoding: "utf8",
});
assert.equal(build.status, 0, `فشل بناء الجرد: ${build.stderr || build.stdout}`);

const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
const dataSrc = readFileSync(dataPath, "utf8");
const report = readFileSync(batchReportPath, "utf8");
const queue = readFileSync(queuePath, "utf8");

assert.match(report, /PR-4/);
assert.match(report, /لا نشر/);
assert.match(report, /PUBLISHED/);
assert.match(queue, /ISR-021|الدفعة 1/);
assert.match(queue, /خُفّف|أُزيل|فُصل/);

assert.equal(inventory.publishedCount, 0);

for (const id of BATCH1) {
  const rec = inventory.records.find((r: { id: string }) => r.id === id);
  assert.ok(rec, `سجل مفقود من الجرد: ${id}`);
  assert.notEqual(rec.publicationStatus, "PUBLISHED", `ممنوع PUBLISHED: ${id}`);
  assert.ok(
    Array.isArray(rec.inventoryFlags) &&
      rec.inventoryFlags.includes("pr4_batch1_claim_audit"),
    `يجب وسم pr4_batch1_claim_audit: ${id}`,
  );
  assert.equal(
    (rec.primarySources ?? []).length,
    0,
    `لا primarySources محققة تلقائيًا في PR-4: ${id}`,
  );
}

// منع عودة العبارات المحظورة القطعية في الدفعة 1 داخل ملف البيانات
const forbiddenExact = [
  "الغالبية العظمى من المسلمين في العالم",
  "انقرضوا إلا الإباضية التي تتبرأ من لقب «الخوارج» وتُعدّ أعدل فرقهم",
  "انقرضت كفرقة منظمة في القرن السادس الهجري مع انتشار الأشعرية والماتريدية",
  "الخوارج (أهل الوعيد)",
  "الإنسان بطبيعته يعرف الحسن والقبح عقلاً — واصل بن عطاء",
  "سائدة في المغرب العربي ومصر والشام وجنوب آسيا وتركيا",
  "سائدة في الأحناف في تركيا وآسيا الوسطى وجنوب آسيا",
  "عُمان (المذهب الرسمي)، وجيوب في زنجبار وتونس والجزائر وليبيا",
  "التأسيس النبوي — الصحابة الكرام",
  "الإيمان لا يزيد ولا ينقص في أصله",
];

for (const phrase of forbiddenExact) {
  assert.equal(
    dataSrc.includes(phrase),
    false,
    `عبارة محظورة عادت إلى islamic-sects.ts: ${phrase}`,
  );
}

// المعتزلة: لا اقتباس بلا مصدر
const mutazilaBlock = dataSrc.slice(
  dataSrc.indexOf('id: "mutazila"'),
  dataSrc.indexOf('id: "murjia"'),
);
assert.equal(
  /quote:\s*"/.test(mutazilaBlock),
  false,
  "المعتزلة: يجب ألا يعود اقتباس بلا إحالة",
);

console.log(
  `islamic-sects-batch1-review-gate.test.ts: ok (batch1=${BATCH1.length} published=${inventory.publishedCount})`,
);
