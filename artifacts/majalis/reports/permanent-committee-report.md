# تقرير قسم اللجنة الدائمة للبحوث العلمية والإفتاء

**التاريخ:** 2026-06-26  
**الفرع:** `cursor/permanent-committee-92e6`  
**المسار الرئيسي:** `/permanent-committee`

---

## 1. الصفحات الجديدة

| المسار | المكوّن | الوظيفة |
|--------|---------|---------|
| `/permanent-committee` | `PermanentCommitteeHubPage` | الصفحة الرئيسية: أحدث الفتاوى، الأكثر قراءة، التصنيفات، البحث، نبذة، أعضاء |
| `/permanent-committee/fatwas` | `PermanentCommitteeListPage` | فهرس جميع الفتاوى |
| `/permanent-committee/category/:name` | `PermanentCommitteeCategoryPage` | تصفية حسب التصنيف (رئيسي/فرعي) |
| `/permanent-committee/search` | `PermanentCommitteeSearchPage` | بحث متقدم (كلمة، رقم فتوى، باب، موضوع) |
| `/permanent-committee/:id` | `PermanentCommitteeDetailPage` | صفحة الفتوى: سؤال، جواب، مصدر، طباعة، مشاركة، حفظ، بحث داخل النص |

---

## 2. أنواع المحتوى الجديدة

- **جدول Supabase:** `permanent_committee_fatwas` (+ `permanent_committee_categories`, `permanent_committee_import_log`)
- **نوع CMS:** `permanent_committee_fatwa` في Smart CMS
- **نوع المكتبة الشخصية:** `permanent_committee_fatwa` (مفضلة / حفظ)
- **SQL:** `supabase/permanent_committee_v1.sql` — FTS، RLS، فهرسة، 20+ تصنيف

---

## 3. التكامل مع Smart CMS

- تسجيل في `content-registry.ts` → جدول `permanent_committee_fatwas`
- تسمية عربية في `content-types.ts`: «فتوى اللجنة الدائمة»
- استيراد جماعي عبر `content-import/registry.mjs` + `mappers.mjs` (حالة افتراضية: `pending`)
- خط أنابيب أتمتة: `lib/permanent-committee/import-pipeline.mjs`
  - جلب وتطبيع المحتوى
  - كشف التكرار (`dedupeKey`, `findDuplicates`)
  - تصنيف تلقائي (`classifyPcCategory`)
  - **لا نشر تلقائي** — `stageForReview` يفرض `pending` + `requires_review`

---

## 4. التكامل مع الباحث العلمي

- **بحث محلي:** `local-search-ext.ts` → مجموعة «اللجنة الدائمة» في `SearchPage`
- **محرك المعرفة:** `corpus-search.mjs` → `searchPermanentCommittee` في البحث الموحّد
- **تصنيف النتائج:** `KIND_GROUP_LABELS` + `ranker.mjs` (أولوية عالية للفتاوى الرسمية)
- **فلتر متقدم:** نوع `permanent_committee_fatwa` في الباحث العلمي
- **ربط بالدروس:** `RelatedPermanentCommittee` في `LessonDetailPage` (مثال: درس الزكاة → فتاوى الزكاة)

---

## 5. نتائج الاختبارات

| الاختبار | النتيجة |
|----------|---------|
| `pnpm --filter @workspace/majalis run typecheck` | ✅ نجح |
| `pnpm --filter @workspace/majalis run smoke:permanent-committee-routes` | ✅ 23/23 |
| `pnpm --filter @workspace/majalis run verify:pc-import-pipeline` | ✅ 10/10 |

---

## 6. نقاط التكامل الأخرى

| المنطقة | الحالة |
|---------|--------|
| القائمة الرئيسية (`PRIMARY_NAV`) | ✅ «اللجنة الدائمة» |
| الصفحة الرئيسية (`HOME_MORE_SECTIONS`) | ✅ بطاقة القسم |
| القائمة الجانبية (`SideNavDrawer`) | ✅ أيقونة + رابط |
| لوحة الإدارة | ✅ قسم مستقل: فتاوى + إحصاءات |
| SEO (`seo-routes.json`) | ✅ hub + search + fatwas |
| `App.tsx` + `AppRoutes.tsx` | ✅ جميع المسارات |
| Migration paths | ✅ `permanent_committee_v1.sql` |

---

## 7. تجربة المستخدم

- **المفضلة / المكتبة الشخصية** عبر `FavoriteButton`
- **آخر قراءة** — `localStorage` (`majalis-pc-last-read`)
- **بحث داخل النص** في صفحة الفتوى
- **نسخ الرابط + طباعة + مشاركة**
- **إشعار المصدر الرسمي** — «النص الأصلي محفوظ دون تعديل»
- **RTL + جوال** — أنماط `permanent-committee.css` + `@media print`

---

## 8. كيفية توسيع القسم مستقبلاً

1. **تطبيق SQL** في Supabase: `supabase/permanent_committee_v1.sql`
2. **استيراد الفتاوى الرسمية** من alifta.gov.sa عبر AKE (`lajna-daima`) أو CSV بـ `permanent_committee_fatwas`
3. **ربط صريح** عبر `linked_lesson_ids`, `linked_book_ids`, `linked_research_ids` في الجدول
4. **فهرسة knowledge_items** لإثراء `RelatedKnowledge` من محرك المعرفة
5. **Cron أتمتة** لجلب المحتوى الجديد → `permanent_committee_import_log` → مراجعة الإدارة
6. **Sitemap ديناميكي** لفتاوى منشورة بعد الاستيراد الجماعي

---

## الملفات الرئيسية

```
supabase/permanent_committee_v1.sql
artifacts/majalis/src/lib/permanent-committee/
artifacts/majalis/src/views/PermanentCommittee*.tsx
artifacts/majalis/src/views/admin/PermanentCommitteeAdminSection.tsx
artifacts/majalis/lib/permanent-committee/import-pipeline.mjs
artifacts/majalis/scripts/smoke-permanent-committee-routes.mjs
artifacts/majalis/scripts/verify-pc-import-pipeline.mjs
```
