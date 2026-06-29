# تقرير: الحلقات القرآنية والعلمية

## 1. ما الذي أُضيف

- قسم متكامل **الحلقات القرآنية والعلمية** كمرجع منظم لفرص طلب العلم (حفظ القرآن، المتون، الدراسة الشرعية، فرص الشريعة).
- 4 تبويبات رئيسية: حفظ القرآن، حفظ المتون، دراسة شرعية، فرص دراسة الشريعة.
- بطاقات عرض احترافية مع فلاتر جانبية وبحث متقدم وفرز متعدد.
- صفحة تفاصيل كاملة مع جدول بيانات، واتساب، خريطة، تقويم، نسخ ومشاركة.
- لوحة إدارة مع CRUD، استيراد JSON/CSV، استخراج ذكي من نص/رابط/صورة.
- مخطط قاعدة بيانات (8 جداول) + بيانات seed للكويت.

## 2. الصفحات الجديدة

| المسار | الوصف |
|--------|--------|
| `/quran-scientific-circles` | الصفحة الرئيسية — تبويبات، بحث، فلاتر، بطاقات |
| `/quran-scientific-circles/:id` | صفحة تفاصيل الحلقة |
| `/admin/quran-scientific-circles` | لوحة إدارة الحلقات |

## 3. الجداول الجديدة

- `quran_scientific_circle_categories`
- `quran_scientific_circles`
- `quran_scientific_circle_schedules`
- `quran_scientific_circle_locations`
- `quran_scientific_circle_contacts`
- `quran_scientific_circle_import_jobs`
- `quran_scientific_circle_reviews`
- `quran_scientific_circle_audit_logs`

**الملف:** `supabase/quran_scientific_circles_v1.sql`

## 4. الحقول (الجدول الرئيسي)

`title`, `summary`, `description`, `requirements`, `registration_method`, `category_slug`, `subcategory_slug`, `tab_group`, `circle_type`, `country`, `governorate`, `region`, `venue_name`, `organizer`, `sheikh_name`, `supervisor_name`, `target_audience`, `gender_access`, `level`, `days[]`, `start_date`, `end_date`, `lesson_time`, `duration_text`, `has_live`, `has_attendance`, `is_online`, `registration_url`, `contact_phone`, `whatsapp_url`, `map_url`, `announcement_url`, `poster_image_url`, `notes`, `has_certificate`, `has_ijazah`, `has_exam`, `is_free`, `is_pinned`, `is_featured`, `status`, `registration_status`, `view_count`, `keywords[]`, `data_incomplete`

## 5. طريقة الاستيراد

- **يدوي:** نموذج في لوحة الإدارة.
- **JSON:** BulkImport + `parseCirclesJson`.
- **CSV:** `parseCirclesCsv` في رفع الملفات.
- **Excel:** رفع `.xlsx` (يُعالج كنص — يُفضّل CSV للإنتاج).
- **صورة إعلان:** `extractCircleFromPosterText` + رابط `/admin/content-import/image`.
- **رابط:** `extractCircleFromUrl` — يُنشئ مسودة للمراجعة.
- **مراجعة:** الحالة الافتراضية `review`؛ `data_incomplete=true` عند نقص البيانات.

## 6. طريقة البحث

- بحث عربي عبر `arabicMatchAny` في: العنوان، الملخص، الوصف، الشيخ، الجهة، المكان، المنطقة، الكلمات المفتاحية.
- مدمج في **البحث العام** (`SearchPage`) عبر `searchQuranScientificCircles`.
- فلاتر: الدولة، المحافظة، المنطقة، التبويب، النوع، المستوى، الجنس، حضوري/عن بُعد، مجاني، شهادة، إجازة، اليوم.

## 7. طريقة الفرز

الافتراضي (الأقرب موعدًا):
1. `start_date` ASC
2. `created_at` DESC
3. `country` ASC
4. `circle_type` ASC

خيارات إضافية: الأحدث، الأكثر مشاهدة، حسب الدولة، حسب النوع. الحلقات المثبتة (`is_pinned`) تظهر أولًا.

## 8. طريقة التحقق من البيانات

- `assessImportCompleteness`: يقيّم الحقول الأساسية (title, tab_group, country).
- `data_incomplete=true` عند نقص حقول مهمة — لا يُرفض الاستيراد.
- الحالة `review` للبيانات غير المؤكدة (إعلانات علمية محوّلة).
- RLS: القراءة العامة للحالات `published`, `registration_open`, `registration_closed`, `ongoing` فقط.

## 9. أين تظهر القائمة

- **PRIMARY_NAV:** «الحلقات» (اختصار)
- **NAV_GROUPS → المحتوى:** الحلقات القرآنية والعلمية
- **NAV_GROUPS → القرآن:** الحلقات القرآنية والعلمية
- **MOBILE_MORE_NAV**
- **HOME_FEATURE_CARDS**
- **HOME_MORE_SECTIONS**
- **SiteFooter**
- **SideNavDrawer**
- **البحث العام**
- **لوحة التحكم → الحلقات القرآنية والعلمية**
- **seo-routes.json + sitemap**

## 10. نتائج الاختبارات

```bash
node artifacts/majalis/scripts/test-quran-scientific-circles.mjs
```

يتحقق من: وجود SQL، المسارات، التنقل، SEO، seed، فلاتر، بحث، استيراد.

## 11. الجاهزية للإنتاج

**الهيكل جاهز للإنتاج** (واجهة، خدمات، إدارة، SEO، اختبارات).

**يحتاج قبل الإطلاق الكامل:**
1. تطبيق `quran_scientific_circles_v1.sql` على Supabase الإنتاجي.
2. إدخال/تحقق بيانات حقيقية — معظم إعلانات `scientific-announcements` محوّلة بحالة `review`.
3. مراجعة ونشر الحلقات المؤكدة من لوحة الإدارة.
4. (اختياري) ربط استخراج الصورة بـ API OCR/LLM للإنتاج.

---

**الفرع:** `cursor/quran-scientific-circles-92e6`
