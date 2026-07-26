# تقرير إصلاح المحتوى — مجالس العلم

تاريخ البدء: 2026-07-26  
الفرع الأساسي لكل مرحلة: `cursor/content-fix-phaseN-*-1f54`

---

## المرحلة 1 — عزل عاجل (curriculum)

**الفرع:** `cursor/content-fix-phase1-isolate-curriculum-1f54`  
**PR:** https://github.com/yalabdullmohsen/majalis/pull/339

### ما نُفّذ
- راية `CONTENT_CURRICULUM_ENABLED=false` في:
  - `artifacts/majalis/lib/content-flags.mjs`
  - `artifacts/majalis/src/lib/content-flags.ts`
- عزل التوليد: `scripts/generate-rulings-encyclopedia.mjs` يتخطى `fromCurriculumRegistry()` عند الراية false.
- عزل البذر: `lib/rulings-db-seed.mjs` يصفّي سجلات curriculum.
- عزل الواجهة: `rulings-data-loader.ts` و`rulings-service.ts` يخفيان سجلات curriculum.
- إعادة توليد الموسوعة (بدون `build-curriculum`) → **507** حكماً، **0** سجل curriculum في الـ chunks.
- الملف المصدر `data/rulings-encyclopedia/curriculum-topics.json` **لم يُحذف** (36 سجلًا باقية).
- طابور المراجعة: `docs/curriculum-review-queue.md`.

### الملفات المعدّلة
| ملف | نوع التغيير |
|---|---|
| `artifacts/majalis/lib/content-flags.mjs` | جديد |
| `artifacts/majalis/src/lib/content-flags.ts` | جديد |
| `artifacts/majalis/scripts/generate-rulings-encyclopedia.mjs` | عزل |
| `artifacts/majalis/lib/rulings-db-seed.mjs` | عزل |
| `artifacts/majalis/src/lib/rulings-data-loader.ts` | عزل |
| `artifacts/majalis/src/lib/rulings-service.ts` | عزل |
| `artifacts/majalis/public/data/rulings-encyclopedia/**` | إعادة توليد بدون curriculum |
| `artifacts/majalis/src/lib/rulings-encyclopedia-seed.generated.ts` | إعادة توليد |
| `docs/curriculum-review-queue.md` | جديد |
| `docs/content-fix-report.md` | هذا التقرير |

### رصد بشري (بلا تصحيح نص قرآني/حديثي)
- `curriculum-1`: summary مبتور؛ منسوب للقرآن والحديث
- `curriculum-4`: نص منسوب للحديث — مراجعة تحريف محتمل
- `curriculum-5`: مراجعة صياغة الوجوب/الاستحباب
- `curriculum-10`: نص منسوب للحديث — راقب إنجليزي إن وُجد

### ما لم يُصلَح ولماذا
- لم تُصحَّح نصوص القرآن/الحديث في المنهج (قيد المرحلة: عزل ورصد فقط).
- صفوف curriculum الموجودة مسبقاً في Supabase الحي تُخفى من واجهة القراءة عبر الراية؛ لا حذف من قاعدة البيانات في هذه المرحلة.

### حالة البناء
(تُحدَّث بعد التشغيل)
