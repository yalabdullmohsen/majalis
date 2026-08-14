/**
 * يمنع عرض مواد/مسائل مجمع «بحث/قرار» بلا مادّة كافية للعامة.
 */
import assert from "node:assert/strict";
import { FIQH_COUNCIL_PUBLISHED_SEED } from "../fiqh-council-seed.ts";
import { isVerifiedPublicItem, isPublicIssue } from "../fiqh-council-trust.ts";
import { FIQH_ISSUES_PUBLISHED_SEED } from "../fiqh-issues-seed.ts";

const publicItems = FIQH_COUNCIL_PUBLISHED_SEED.filter(isVerifiedPublicItem);
assert.equal(publicItems.length, 4, "أربع مواد IIFA موثّقة فقط");
for (const item of publicItems) {
  assert.ok((item.content || item.ruling_text || "").trim().length > 80, `${item.slug}: نص كافٍ`);
  assert.ok(item.source_url, `${item.slug}: رابط رسمي`);
  assert.ok(item.decision_number, `${item.slug}: رقم قرار`);
}

const thinIssues = FIQH_ISSUES_PUBLISHED_SEED.filter((i) => {
  const ruling = String(i.ruling_summary ?? "").trim();
  const evidence = String(i.evidence_summary ?? "").trim();
  return i.status === "published" && (ruling.length < 60 || evidence.length < 30);
});
for (const issue of thinIssues) {
  assert.equal(isPublicIssue(issue), false, `مسألة رقيقة مخفية: ${issue.slug}`);
}

for (const slug of ["cultured-meat", "smart-contracts", "encrypted-digital-currencies", "gmo-animal-foods"]) {
  const issue = FIQH_ISSUES_PUBLISHED_SEED.find((i) => i.slug === slug);
  assert.ok(issue && isPublicIssue(issue), `مسألة عامة مكتملة: ${slug}`);
}

console.log("fiqh-council-completeness: OK", { publicItems: publicItems.length });
