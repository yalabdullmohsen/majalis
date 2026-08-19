# DEAD_CODE_SWEEP_REPORT.md

## الفرع
- `chore/dead-code-sweep`

## قبل الإزالة: مخرجات الأدوات (إثبات فقط)

### knip
مرشّحون للـ`files` (unused CSS files):
- `artifacts/majalis/src/styles/components/cookie-consent.css`
- `artifacts/majalis/src/styles/components/jump-page-modal.css`
- `artifacts/majalis/src/styles/components/qpc-font-pack-banner.css`
- `artifacts/majalis/src/styles/components/reciter-picker-sheet.css`

ملاحظة: `critical-first-paint.css` و `quran.css` كانت ضمن التقرير لكن **تم الإبقاء** لوجود مراجع سكربت/تعريفات ديناميكية مؤكدة.

### ts-prune
- تم التشغيل على `src` لإثبات وجود/عدم وجود مرشحين لـ unused exports.
- تم تأجيل أي حذف TS واسع بسبب نطاق output الكبير؛ هذا PR يقتصر على CSS “الميتة” فقط بعد تحقق `rg`.
- ملف المخرجات: `/tmp/ts-prune-deadcode2.txt`

### depcheck
`depcheck --json --skip-missing`:
- `missing=0`
- `invalidFiles=0`
- `invalidDirs=0`
- `unused=0`

### jscpd
مسح strict على `src/components src/views src/pages`:
- duplicates(clones)=0
- report: `/tmp/jscpd-deadcode2/jscpd-report.json`

## إثبات عدم المرجعية للـ CSS (قبل الحذف)
لكل ملف CSS مُرشّح: `rg -n "<filename>"` لم يظهر أي matches في:
- `artifacts/majalis/src`
- `artifacts/majalis/scripts`
- `artifacts/majalis/lib`
- `artifacts/majalis/src/styles`

النتيجة: `no matches` لكل ملف.

## الإزالة الفعلية (CSS فقط)
تم حذف الملفات التالية (الميتة):
- `artifacts/majalis/src/styles/components/cookie-consent.css` (2477 bytes)
- `artifacts/majalis/src/styles/components/jump-page-modal.css` (5507 bytes)
- `artifacts/majalis/src/styles/components/qpc-font-pack-banner.css` (1399 bytes)
- `artifacts/majalis/src/styles/components/reciter-picker-sheet.css` (6996 bytes)

إجمالي bytes المحذوفة: **16379 bytes**.
عدد الملفات المحذوفة: **4**.

## فحص ما بعد الإزالة
- `pnpm -C artifacts/majalis run lint` نجح.
- تم بناء dist وإعادة تشغيل `test:bundle-budget` لالتقاط قبل/بعد:

### test:bundle-budget — قبل
- entry index-CwpLJlbx.js gzip=121.1 KiB (≤ 164) ✓
- icons icons-CWqHD3aE.js gzip=22.0 KiB (≤ 30) ✓
- css index-C2Jm8FBs.css gzip=45.3 KiB (≤ 100) ✓

### test:bundle-budget — بعد
- entry gzip=121.1 KiB (لم يتجاوز الميزانية) ✓
- css gzip=45.3 KiB (لم يتجاوز الميزانية) ✓

## تغييرات بوابة الرسم (guardrail ضد الخضرة الكاذبة)
تعديل `artifacts/majalis/scripts/verify-knowledge-graph.mjs`:
- fail إذا كانت عقد `section/bab/masalah` صفراً.
- fail إذا لم توجد عقد `kind="section"` لكل مسار `route` في `src/config/sections.registry.ts`.

> ملاحظة: هذا متوقع أن يفشل الآن لأن الرسم الحالي لا يحتوي على section/bab/masalah بعد.

