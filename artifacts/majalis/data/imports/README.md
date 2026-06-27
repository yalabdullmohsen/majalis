# Content Import — المجلس العلمي

مجلد موحّد لاستيراد المحتوى عبر CLI أو لوحة الإدارة.

## الاستيراد عبر CLI

```bash
cd artifacts/majalis

# معاينة بدون كتابة
node scripts/import-content.mjs --type=lessons --file=data/imports/lessons.sample.json --dry-run

# استيراد فعلي (يتطلب Supabase service role)
node scripts/import-content.mjs --type=questions --file=data/imports/questions.sample.json

# أنواع staged (adhkar, quran_surahs, quran_topics) → data/imports/staged/
node scripts/import-content.mjs --type=adhkar --file=data/imports/adhkar.sample.json
```

## الأنواع المدعومة

| النوع | الهدف | الجدول / الملف |
|-------|--------|----------------|
| lessons | Supabase | `lessons` |
| courses | Supabase | `lessons` (is_course) |
| sheikhs | Supabase | `sheikhs` |
| books | Supabase | `library_items` |
| articles | Supabase | `library_items` |
| questions | Supabase | `qa_questions` |
| benefits | Supabase | `fawaid` |
| adhkar | staged + bundle | `src/lib/content-import-bundle.json` |
| quran_surahs | staged | bundle |
| quran_topics | staged | bundle |

## ملفات الأمثلة

| النوع | JSON | CSV |
|-------|------|-----|
| lessons | `lessons.sample.json` | `lessons.sample.csv` |
| sheikhs | `sheikhs.sample.json` | `sheikhs.sample.csv` |
| questions | `questions.sample.json` | `questions.sample.csv` |
| books | `books.sample.json` | `books.sample.csv` |
| adhkar | `adhkar.sample.json` | — |
| quran surahs | `quran-surahs.sample.json` | — |

بيانات تجريبية Phase 2: `trial/*.phase2.json`

## متغيرات البيئة

- `VITE_SUPABASE_URL` — عنوان المشروع
- `SUPABASE_SERVICE_ROLE_KEY` — مفتاح الخادم (لا تستخدم anon key)

## لوحة الإدارة

زر **«استيراد من ملف»** في قسم Content Aggregator (`/admin`) — يستخدم **مهام استيراد غير متزامنة**:

1. **تحليل** الملف محليًا في المتصفح (CSV/JSON)
2. **start** — إنشاء `job_id`
3. **stage** — رفع الدفعات (2000 صف/دفعة)
4. **commit** — إرجاع فوري (HTTP 202) ومعالجة في الخلفية
5. **poll** — تتبع التقدّم كل ثانية حتى `completed` أو `failed`

لا توجد مهلة 3 ثوانٍ على طلبات الاستيراد — التقدّم يُعرض عبر: رفع → تحليل → تحقق → استيراد → اكتمال.

Cron احتياطي: `/api/cron/process-import-jobs` (كل دقيقة) لاستئناف المهام العالقة.

## التحقق (Validation)

كل نوع له حقول مطلوبة. العناصر الناقصة تُرفض وتُسجّل في تقرير الأخطاء.

## عدم الحذف

السكربت **لا يحذف** أي بيانات — يضيف فقط أو يتخطى المكرر.

## مجلد قديم

`data/import/` (مفرد) — ملفات الاستيراد الجماعي اليدوي للوحة `/admin`.
`data/imports/` (جمع) — نظام CLI الجديد.
