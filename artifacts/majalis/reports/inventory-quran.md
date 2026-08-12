# جرد — قسم القرآن وعلومه

**تاريخ:** 2026-07-26  
**محور القسم:** `/quran-hub` (و`/quran` يعيد التوجيه إليه). المصحف الحي: `/mushaf`.

## صفحات الواجهة

| المسار | الملف | الحالة | ملاحظات تدقيق |
|---|---|---|---|
| `/quran-hub` | `QuranHubPage.tsx` | دُقّق جزئيًا | أُضيف المكي والمدني؛ أُزيل ربط الإعجاز بصفحة miracles العلمية |
| `/mushaf*` | `MushafPageView.tsx` | قارئ | خارج نطاق النص التعليمي |
| `/ulum-quran` | `UlumQuranPage.tsx` | **دُقّق** | حُذف الإعجاز العددي/العلمي/النفسي؛ اقتصار على بياني/تشريعي/غيبي/حفظ |
| `/quran/tajweed` | `QuranTajweedPage.tsx` | دُقّق جزئيًا | تخريج «زيّنوا القرآن…» |
| `/quran/makki-madani` | `MakkiMadaniPage.tsx` | دُقّق جزئيًا | إصلاح رابط العودة إلى `/mushaf` |
| `/quran/revelation-order` | `RevelationOrderPage.tsx` | لم يُدقّق سطرًا | |
| `/quran/surahs` | `SurahIndexPage.tsx` | فهرس | |
| `/quran/surah-stories` | `SurahStoriesPage.tsx` | يحتاج مرور أسباب نزول | |
| `/duas-quran` | `DuasQuranPage.tsx` | لم يُدقّق | |
| `/miracles` | `MiraclesPage.tsx` | حذر منهجي | عُدّل SEO؛ أُزيل من بطاقات المحور كممثّل للإعجاز |
| `/quran-studies` | `QuranStudiesPage.tsx` | هيكل رقيق | ليس على المحور |
| `/quran-memorization` | … | أداة | |
| `/quran/memorization-plans` | … | أداة | |
| `/quran-circles` | … | مجتمع | |

## دروس SQL

`learn_library_v2_quran_uloom_batch1.sql` + مسارات `uloom-quran` — لم يُراجع سطرًا سطرًا بعد.

## غير موجود كصفحة مستقلة (مغطى جزئيًا)

الأحرف السبعة، رسم المصحف، الوقف والابتداء، غريب القرآن — جزئيًا في ulum/دروس SQL.

## نتيجة جولة التدقيق (2026-07-26 — full-audit)

| المسار | الإجراء |
|---|---|
| surah-stories فضائل | ✅ إزالة الواقعة الضعيفة + ضبط أخرى |
| surah-stories قصص | ✅ حذف سدوم/نمرود/بلقيس |
| quran-api + quiz | ✅ نفي «قلب القرآن» |
| duas-quran | ✅ تخريج سياقات حرجة |
| ulum-quran | ✅ تبويب آداب وأدوات + تنقية أنواع التفسير |
