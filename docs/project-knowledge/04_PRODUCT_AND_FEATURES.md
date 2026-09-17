# 04 — المنتج والميزات

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d`  
**منهج الجرد:** Route في `AppRoutes.tsx`/`App.tsx` + ارتباط بمكوّن + مصدر بيانات معروف. وجود ملف بلا Route ≠ ميزة فعالة.

## ملخص أعداد (Confirmed من التحليل)

- `<Route path=` في `AppRoutes.tsx`: **364**
- مسار `/` إضافي في `App.tsx`
- أقسام في `sections.registry.ts`: **78** route
- مسارات SEO في `seo-routes.json`: **~210**

## جدول الميزات الأساسية

| الاسم | Route أساسي | مكوّنات | مصدر بيانات | حالة | Web | iOS Cap | Android Cap | Admin | Offline | Deep link | اختبارات |
|---|---|---|---|---|---|---|---|---|---|---|---|
| الرئيسية | `/` | HomePage / HomeLazyRoute | widgets + updates seeds + supabase اختياري | Active | نعم | نعم* | نعم* | لا | جزئي | نعم | smoke/CI |
| مركز القرآن | `/quran-hub` | QuranHubPage | static hub | Active | نعم | نعم* | نعم* | لا | جزئي | نعم | content/SEO |
| المصحف | `/mushaf` | MushafReaderPage → NewMushafReader | quran-v2 pages + QPC fonts | Active | نعم | نعم* | نعم* | لا | قوي (ملفات) | نعم | mushaf-gates |
| التفسير | `/tafsir`, `/quran/tafsir` | صفحات tafsir | packs/API حسب التنفيذ | Active/Partial | نعم | نعم* | نعم* | Unknown | Partial | نعم | SEO |
| التلاوة/قراء | مسارات hub + مشغلات | audio components | remote catalogs | Partial (تراخيص) | نعم | نعم* | نعم* | لا | Partial | نعم | LICENSE docs |
| الدروس | `/lessons`, `/lessons/:id` | LessonsPage | Supabase lessons + chunks | Active | نعم | نعم* | نعم* | نعم | Partial | نعم | lesson gates |
| السلاسل/دورات | `/courses`, `/annual-courses`, learn*→lessons | متعددة | Supabase/static | Active/Partial | نعم | نعم* | نعم* | نعم | Partial | نعم | — |
| العلماء/معلمون | `/scholars`, `/teachers` | Scholar/Teacher pages | seeds + supabase | Active | نعم | نعم* | نعم* | Partial | Partial | نعم | sheikhs-dedup |
| الأقسام | `/sections` | SectionsPage | sections.registry | Active | نعم | نعم* | نعم* | لا | نعم | نعم | sections tests |
| العقيدة/توحيد | `/tawhid` (`/aqidah`→) | TawhidPage | static/views | Active | نعم | نعم* | نعم* | لا | نعم | نعم | — |
| الحديث | `/hadith`, `/hadith/:id` | HadithPage | hadith-verified JSON | Active | نعم | نعم* | نعم* | Partial | نعم | نعم | hadith integrity |
| الأربعون | `/arbaeen-nawawi` | صفحة | seed | Active | نعم | نعم* | نعم* | لا | نعم | نعم | — |
| السيرة | `/seerah` | SeerahPage | data | Active | نعم | نعم* | نعم* | لا | Partial | نعم | — |
| التاريخ | `/tarikh-islami` | TarikhIslamiPage | data (~217 في counts) | Active | نعم | نعم* | نعم* | لا | Partial | نعم | — |
| الأنبياء | `/prophets` | صفحات | data | Active | نعم | نعم* | نعم* | لا | Partial | نعم | — |
| الأذكار | `/adhkar` | AdhkarPage | verified adhkar | Active | نعم | نعم* | نعم* | Partial | نعم | نعم | import verify |
| الصلاة | `/prayer-times` | PrayerTimesPage | adhan-js + prefs | Active | نعم | نعم* | نعم* | لا | نعم (حساب) | نعم | prayer docs/tests |
| القبلة | `/qibla` | صفحة | geo prefs | Active | نعم | نعم* | نعم* | لا | Partial | نعم | — |
| التسبيح | `/tasbih` | صفحة | محلي | Active | نعم | نعم* | نعم* | لا | نعم | نعم | — |
| البحث | `/search` | SearchPage | search index مولَّد | Active | نعم | نعم* | نعم* | لا | Partial | نعم | search checks |
| المفضلة/تقدم | جداول/UI مرتبطة حساب | supabase favorites/progress | Partial | نعم | نعم* | نعم* | لا | لا | يتطلب حساب | — |
| بطاقات/مراجعة | `/flashcards`, `/reviewed-cards`, quiz | صفحات | JSON/supabase | Active/Partial | نعم | نعم* | نعم* | Partial | Partial | نعم | quiz guards |
| الحساب | `/login`, `/register`, `/profile`, `/auth/*` | Auth views | Supabase Auth | Active | نعم | نعم* | نعم* | لا | لا | نعم | — |
| الإعدادات | `/settings`, `/notification-settings`, `/adhan-settings` | Settings views | localStorage + optional remote | Active | نعم | نعم* | نعم* | لا | نعم | نعم | — |
| الإشعارات | native + settings routes | prayer + push modules | local + api | Partial حتى اختبار جهاز | ويب محدود | نعم* | نعم* | لا | — | — | rebuild inventory |
| الأصوات | كتالوجات أذان | adhan-* | ملفات/remote | Partial تراخيص | نعم | نعم* | نعم* | Partial | Partial | — | LICENSE |
| الإدارة | `/admin*` | AdminPage + لوحات | Supabase admin helpers | Active للمشرف | نعم | لا أولوية | لا | نعم | لا | نعم | admin gates جزئي |
| المساعد | `/assistant` | AssistantGate | API Anthropic | Active gate | نعم | نعم* | نعم* | لا | لا | نعم | assistant tests |
| Discover Islam | `/discover-islam/*` | views | static | Active | نعم | نعم* | نعم* | لا | نعم | نعم | SEO |
| فقه | `/fiqh` (+ كتب) | FiqhPage | content | Active | نعم | نعم* | نعم* | fiqh-review admin | Partial | نعم | fiqh audits |
| مجمع فقهي | `/fiqh-council*` | Redirect→`/fiqh` | — | **Deprecated product** | redirect | redirect | redirect | منع كتابة | — | — | removal gates |
| فوائد | `/fawaid` | صفحة | curated/supabase | Active | نعم | نعم* | نعم* | نعم | Partial | نعم | — |
| علامات الساعة | `/alamat-saah` | AlamatSaahPage | static | Active | نعم | نعم* | نعم* | لا | نعم | نعم | content r7 gate |
| أخلاق | `/akhlaq` | AkhlaqPage | static | Active | نعم | نعم* | نعم* | لا | نعم | نعم | — |
| المكتبة | `/library`→`/search` | redirect | catalog | Partial | redirect | — | — | — | — | — | LICENSE gaps |

\* Capacitor يعرض نفس حزمة الويب؛ سلوك أصلي يعتمد plugins وصلاحيات الجهاز — اختبار الجهاز **غير مثبت في هذه المهمة التوثيقية**.

## قواعد الحالة

- **Active:** مرتبط بـRouter ويعرض محتوى أو وظيفة.
- **Partial:** يعمل جزئيًا أو يعتمد ترخيص/جهاز/بيانات ناقصة.
- **Deprecated:** مسار موجود للتحويل فقط (مثل fiqh-council).
- **Hidden:** admin أو internal (`/internal/status`).
- **Unknown:** يحتاج تحقق مستضاف أو جهاز.

## ملاحظات

- كثير من مسارات `/learn*`, `/learning*`, `/tracks` تُحوَّل إلى `/lessons` أو `/quiz`.
- `/more`, `/topics`, `/explore` → `/sections`.
- لا تعتبر `features-in-progress` أو `feature-tour` جاهزية إنتاج دون فحص الصفحة.
