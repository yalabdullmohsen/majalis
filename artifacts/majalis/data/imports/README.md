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

- `lessons.sample.json`
- `sheikhs.sample.json`
- `questions.sample.json`
- `adhkar.sample.json`
- `books.sample.json`
- `quran-surahs.sample.json`

## التحقق (Validation)

كل نوع له حقول مطلوبة. العناصر الناقصة تُرفض وتُسجّل في تقرير الأخطاء.

## عدم الحذف

السكربت **لا يحذف** أي بيانات — يضيف فقط أو يتخطى المكرر.

## مجلد قديم

`data/import/` (مفرد) — ملفات الاستيراد الجماعي اليدوي للوحة `/admin`.
`data/imports/` (جمع) — نظام CLI الجديد.
