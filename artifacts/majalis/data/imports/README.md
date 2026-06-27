# Content Import — المجلس العلمي

مجلد موحّد لاستيراد المحتوى عبر CLI أو لوحة الإدارة.

## الاستيراد عبر CLI

```bash
cd artifacts/majalis

# معاينة بدون كتابة
node scripts/import-content.mjs --type=lessons --file=data/imports/lessons.sample.json --dry-run

# استيراد فعلي (يتطلب Supabase service role)
node scripts/import-content.mjs --type=questions --file=data/imports/questions.sample.json

node scripts/import-content.mjs --type=adhkar --file=data/imports/adhkar.sample.csv --dry-run
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
| adhkar | Supabase | `verified_adhkar_items` |

## ملفات الأمثلة

| النوع | JSON | CSV |
|-------|------|-----|
| lessons | `lessons.sample.json` | `lessons.sample.csv` |
| sheikhs | `sheikhs.sample.json` | `sheikhs.sample.csv` |
| questions | `questions.sample.json` | `questions.sample.csv` |
| books | `books.sample.json` | `books.sample.csv` |
| adhkar | `adhkar.sample.json` | `adhkar.sample.csv` — see `adhkar.schema.md` |

بيانات تجريبية Phase 2: `trial/*.phase2.json`

## متغيرات البيئة

- `VITE_SUPABASE_URL` — عنوان المشروع
- `SUPABASE_SERVICE_ROLE_KEY` — مفتاح الخادم (لا تستخدم anon key)

## لوحة الإدارة

زر **«استيراد من ملف»** في قسم Content Aggregator (`/admin`) — يستدعي `/api/admin/content-import` ويدعم JSON و CSV.

## التحقق (Validation)

كل نوع له حقول مطلوبة. العناصر الناقصة تُرفض وتُسجّل في تقرير الأخطاء.

### الأذكار (adhkar)

الحقول المطلوبة: `text`, `category`, `source`, و **`count` أو `repeat_count`** (عدد التكرار).

- الاسم المفضّل في CSV الجديد: `count`
- للتوافق مع جداول قديمة: `repeat_count` مقبول أيضًا
- بدائل: `source_name` → `source`، `categoryId` / `category_id` → `category`

راجع `adhkar.schema.md` للتفاصيل الكاملة.

## عدم الحذف

السكربت **لا يحذف** أي بيانات — يضيف فقط أو يتخطى المكرر.

## مجلد قديم

`data/import/` (مفرد) — ملفات الاستيراد الجماعي اليدوي للوحة `/admin`.
`data/imports/` (جمع) — نظام CLI الجديد.
