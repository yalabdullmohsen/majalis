/**
 * بوابة: تسميات أنواع البحث عربية بلا لاتينية ظاهرة.
 * node --import tsx src/features/search/__tests__/search-kind-i18n-gate.test.ts
 */
import assert from "node:assert/strict";
import {
  SEARCH_KIND_LABELS_AR,
  searchKindLabelAr,
  assertArabicKindLabel,
} from "../search-kind-i18n";

for (const [key, label] of Object.entries(SEARCH_KIND_LABELS_AR)) {
  assert.ok(assertArabicKindLabel(label), `تسمية ${key} يجب أن تكون عربية: ${label}`);
}
for (const sample of ["history", "lesson", "article", "course", "unknown_kind_xyz"]) {
  const label = searchKindLabelAr(sample);
  assert.ok(assertArabicKindLabel(label), `fallback لـ ${sample} يجب ألا يعرض الإنجليزية: ${label}`);
  assert.notEqual(label, sample);
}
console.log("search-kind-i18n-gate.test.ts: ok");
