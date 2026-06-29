#!/usr/bin/env node
/** Unit checks for Permanent Committee import pipeline — dedup, classify, review staging. */
import {
  classifyPcCategory,
  dedupeKey,
  findDuplicates,
  normalizeImportRow,
  stageForReview,
} from "../lib/permanent-committee/import-pipeline.mjs";

let pass = 0;
let fail = 0;

function ok(c, m) {
  if (c) {
    pass++;
    console.log(`PASS  ${m}`);
  } else {
    fail++;
    console.error(`FAIL  ${m}`);
  }
}

const row = normalizeImportRow(
  {
    question: "ما حكم زكاة المال؟",
    answer: "تجب الزكاة في المال إذا بلغ النصاب.",
    fatwa_number: "123",
  },
  "https://www.alifta.gov.sa",
);
ok(row.ok === true, "normalizeImportRow ok");
ok(row.row.status === "pending", "import defaults to pending review");
ok(row.row.category === "الزكاة", "auto-classify zakat category");
ok(row.row.answer.includes("تجب الزكاة"), "answer text preserved");

const key = dedupeKey({ fatwa_number: "123", question: "test" });
ok(typeof key === "string" && key.length === 24, "dedupeKey hash length");

const { dupes, fresh } = findDuplicates(
  [{ external_key: "a" }, { external_key: "b" }],
  [{ external_key: "a" }],
);
ok(dupes.length === 1 && fresh.length === 1, "findDuplicates splits dupes/fresh");

const staged = stageForReview([{ title: "x", status: "approved" }]);
ok(staged[0].status === "pending", "stageForReview never auto-approves");
ok(staged[0].metadata?.requires_review === true, "stageForReview flags review");

ok(classifyPcCategory("", "صلاة الجمعة", "") === "الصلاة", "classify salah");
ok(classifyPcCategory("", "", "التوحيد") === "العقيدة", "classify aqeedah");

console.log(`\n=== Summary: ${pass} PASS, ${fail} FAIL ===\n`);
process.exit(fail > 0 ? 1 : 0);
