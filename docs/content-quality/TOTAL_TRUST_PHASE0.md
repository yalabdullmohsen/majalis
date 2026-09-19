# TOTAL TRUST — المرحلة 0: تثبيت المستودع

| حقل | قيمة |
|---|---|
| `auditBranch` | `cursor/sunnah-total-trust-audit` |
| `sourceCommit` | `246407ae1491f12238ee3ee21905aa24d0d092fc` (`origin/main` بعد دمج Wave35؛ أساس التدقيق الحالي) |
| `currentProductionCommit` | `246407ae` عبر `https://www.ssunnah.com/version.json` (200) |
| `currentTestFlightBuild` | غير مثبت آليًا من هذه البيئة — راجع `docs/release/RELEASE_FREEZE.md` (Build 46 / 1.0.0 على فرع RC تاريخيًا) |
| `currentAppStoreSubmissionVersion` | قيد مراجعة Apple — **لا تعديل Connect**؛ الوثائق المحلية: `artifacts/majalis/store/app-store/review-notes.md` (Version 1.0) |
| `product` | `artifacts/majalis` |
| `protectedQuran` | `verify:protected-quran-byte-lock` → مطابق Byte-for-Byte (3 ملفات) عند بدء المرحلة |
| `priorInventory` | `reports/content-completeness-master.json` (Wave1 @ 4b7bb6944) — يُحدَّث بمقارنة Router الحي دون الاعتماد الأعمى |
| `wave35Open` | PR #2140 على فرع منفصل — لا يُخلط مع هذا البرنامج |

## قرارات تشغيلية

- لا لمس `artifacts/mushafi` / QPC / صفحات المصحف المحمية يدويًا.
- أي انحراف قرآن → `RELEASE_BLOCKER_CRITICAL` بلا إصلاح آلي.
- وصف متجر يدّعي ميزة غير موجودة → توثيق + `OWNER_DECISION` (لا سحب تلقائي).

## التالي

المرحلة 1–2: تشغيل `scripts/total-trust-inventory.mjs` وإغلاق فجوات المصفوفة موجةً موجةً.
