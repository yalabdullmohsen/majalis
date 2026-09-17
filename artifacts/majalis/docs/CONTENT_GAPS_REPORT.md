# CONTENT_GAPS_REPORT — سُنّة (جولة 7 · اكتمال الجودة)

تاريخ: 2026-09-17  
القاعدة: **لا اختراع محتوى شرعي**. الفراغ يُوثَّق أو Empty State موجّه.

## جرد الأقسام (ملخص تنفيذي)

| القسم | Route(ات) | المصدر | الحالة قبل | بعد r7 | ملاحظات |
|---|---|---|---|---|---|
| الرئيسية | `/` | widgets + updates | مكتمل مع تحديث مجمع | تحديث مجمع أُزيلت تسميته | — |
| القرآن / المركز | `/quran-hub` | hub cards | جيد | جيد + تطبيع مرجع آية | — |
| المصحف | `/mushaf` | QPC | محمي | محمي بلا تغيير نص | — |
| التلاوة/القراء | mushaf + audio | registry | جيد | جيد | — |
| التفسير | `/tafsir` | saadi packs | جيد | جيد | — |
| فهرس السور | hub | static | جيد | جيد | — |
| الدروس/السلاسل | `/lessons` | supabase+chunks | جيد | عنوان بلا UUID | — |
| العلماء | `/scholars` | seeds | جيد (r5) | جيد | — |
| الأقسام | `/sections` | registry 78 | جيد | علوم قرآن→`/quran-sciences`→knowledge | — |
| العقيدة | topics | pages | جيد | جيد | — |
| الحديث | `/hadith` | verified packs | قطع salutation | سجلات مقطوعة حُذفت | — |
| الأربعون | `/arbaeen-nawawi` | seed | جيد | جيد | — |
| الفرق | `/islamic-sects` | page | جيد | جيد | — |
| الفوائد | `/fawaid` | curated | r6 نظيف | نظيف | — |
| التاريخ/سيرة/أنبياء | `/tarikh*` `/prophets` | data | جيد | جيد | — |
| الأذكار/صلاة/قبلة/تسبيح | worship | engines | جيد | جيد | — |
| البحث | `/search` | index 4725 | بلا مجمع | بلا مجمع | علماء `/scholars` مفهرسون (Wave2) |
| المكتبة | `/library` | catalog | ~170 بلا URL | **Needs verification** | لا اختراع روابط |
| أحكام مؤرشفة | archive | 119 pending | غير منشور | غير منشور | — |
| deferred-nawazil | content/fiqh | 4 | internal | internal | — |
| المجمع الفقهي | `/fiqh-council` | محذوف | redirects | redirects + MANUAL purge | — |
| الإدارة | `/admin*` | panels | بلا كتابة council | بلا كتابة | — |
| SEO/Sitemap | generators | scripts | بلا council | بلا council | — |

Routes في AppRoutes: **364** · أقسام registry: **78** (76 live / 2 hidden).

## ما أُصلح في الجولة 7

- إصلاح جمل مقطوعة في `AlamatSaahPage`.
- حذف أحاديث/شواهد مقطوعة عند `صلى الله عليه و.` (JSON + مصادر TS) بدل اختراع المتن.
- إزالة تسمية «مجمع الفقه» من `updates-seed`.
- تصحيح مسار `quran-sciences` → `/ulum-quran`.
- RelatedRail: لا عرض slug خام.
- إحصاءات الإدارة: «درس بلا عنوان» بدل UUID.
- تطبيع مراجع الآيات (`normalizeSurahAyah`) — لا معرّفات عالمية ظاهرة.
- إعادة تسمية `assistant-soon` → `assistant-gate`.
- بوابة `content-quality-r7-gate`.

## Needs verification (لا تُنشر)

1. روابط مصادر كتب المكتبة (~170).
2. `content/fiqh/deferred-nawazil.json`.
3. موسوعة أحكام مؤرشفة (119 pending_review).
4. صفوف `fiqh_council_*` على Supabase حتى purge المالك.

## MANUAL_OWNER_ACTION

الملف: `supabase/fiqh_council_product_purge_v1.sql`

1. نسخة احتياطية.
2. تشغيل الـmigration يدويًا على المشروع المستضاف.
3. لا يُدَّعى التنفيذ من هذا الـPR.

## ما لن يُملأ هنا

- مقالات/تراجم مولَّدة.
- روابط كتب بلا مصدر مثبت.
- أحكام فقهية جديدة أو إعادة منتج المجمع.
- أي متن حديث ناقص بلا مصدر كامل.

## Wave 1 (P0 inventory) — 2026-09-17

جرد كامل: `reports/content-completeness-master.json` (364 مسارًا بسجل نهائي)  
تقرير: `docs/content-quality/CONTENT_COMPLETENESS_REPORT.md`  
مصادر: `docs/content-quality/SHARIA_SOURCE_REVIEW.md`  
بوابة: `pnpm --filter @workspace/majalis run test:content-quality-wave1`

النقص المفتوح للمالك (بدون اختراع): روابط كتب المكتبة 172، purge صفوف `fiqh_council_*` المستضافة، بنود `LICENSE_RISKS`.
