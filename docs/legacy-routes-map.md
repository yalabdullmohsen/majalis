# خريطة المسارات القديمة والتحويلات — سُنّة

النطاق الرسمي: **https://www.ssunnah.com**  
آخر مراجعة: 2026-09-02

## سياسات ثابتة

| القاعدة | التطبيق |
|---------|---------|
| `/more` ملغاة | تحويل 308 إلى `/#explore` — لا sitemap، لا بحث، لا تنقل |
| دومينات قديمة | `majlisilm.com`، `ssunnah.com` → `www.ssunnah.com` (Vercel) |
| canonical | دائماً `https://www.ssunnah.com/...` |
| admin/internal/review | noindex — خارج التنقل العام |
| المصحف/التفسير | ممنوع تغيير `--mushaf-font-size` و`line-height` الأساسي |

## التنقل الحالي (الشريط السفلي)

| المسار | التسمية |
|--------|---------|
| `/` | الرئيسية |
| `/lessons` | الدروس |
| `/quran-hub` | القرآن |
| `/adhkar` | الأذكار |
| `/prayer-times` | الصلاة |
| `/fiqh` | الفقه |
| `/search` | البحث |
| `/sections` | الأقسام (بديل «المزيد») |

---

## جدول المسارات القديمة

| المسار القديم | الحالة الحالية | التحويل المقترح | sitemap | بحث | السبب |
|---------------|----------------|-----------------|---------|-----|-------|
| `/more` | **ملغاة** | `/#explore` (308) | لا | لا | استُبدلت بـ`/sections` والرئيسية؛ لا تُعاد الصفحة |
| `/sections` | فعّالة | — | نعم | نعم | فهرس الأقسام العلمية |
| `/explore` | تحويل | `/` | لا | لا | مكرر للرئيسية |
| `/topics` | تحويل | `/sections` | لا (noindex للفرع) | لا للفرع | دُمجت الموضوعات في الأقسام |
| `/courses` | تحويل | `/lessons` | لا | لا | مسار تعلم قديم |
| `/learning` | تحويل | `/lessons` | لا | لا | |
| `/learning-paths` | تحويل | `/lessons` | لا | لا | |
| `/learning-path` | تحويل | `/lessons` | لا | لا | |
| `/start-here` | تحويل | `/lessons` | لا | لا | |
| `/annual-courses` | تحويل | `/lessons` | لا | لا | دُمجت في الدروس |
| `/quran` | تحويل | `/quran-hub` | لا | لا | توحيد بوابة القرآن |
| `/quran/mushaf` | تحويل | `/mushaf` | لا | لا | مسار رسمي للمصحف |
| `/quran/tajweed` | تحويل | `/quran-hub/tajweed` | لا | لا | |
| `/tajweed` | تحويل | `/quran-hub/tajweed` | لا | لا | |
| `/quran/tafsir` | تحويل | `/tafsir` | لا | لا | |
| `/prayer` | تحويل | `/prayer-times` | لا | لا | |
| `/prayer-countdown` | تحويل | `/prayer-times` | لا | لا | |
| `/fatwa` | تحويل | `/fiqh` | لا | لا | |
| `/fatwas` | تحويل | `/fiqh` | لا | لا | |
| `/rulings` | تحويل | `/fiqh` | لا | لا | موسوعة أحكام مؤرشفة |
| `/memorize` | تحويل | `/flashcards` | لا | لا | |
| `/qa` | تحويل | `/quiz` | لا | لا | |
| `/anbiya` | تحويل | `/prophets` | لا | لا | |
| `/islamic-stories` | تحويل | `/stories` | لا | لا | |
| `/glossary` | تحويل | `/islamic-glossary` | لا | لا | |
| `/support` | تحويل | `/contact` | لا | لا | |
| `/about-us` | تحويل | `/about` | لا | لا | |
| `/who-we-are` | تحويل | `/about` | لا | لا | |
| `/man-nahnu` | تحويل | `/about` | لا | لا | |
| `/delete-account` | تحويل | `/account-deletion` | لا | لا | 302 مؤقت |
| `/research` | تحويل | `/academic-research` | لا | لا | |
| `/researches` | تحويل | `/academic-research` | لا | لا | |
| `/muezzins` | تحويل | `/adhan-settings` | لا | لا | |
| `/knowledge-map` | تحويل | `/` | لا | لا | أداة داخلية |
| `/features-in-progress` | تحويل | `/` | لا | لا | |
| `/scientific-library` | تحويل | `/` | لا | لا | |
| `/majlisilm-og-2026.jpg` | تحويل | `/brand/official-og.png` | لا | لا | أصل قديم |
| `ssunnah.com/*` | تحويل | `www.ssunnah.com/*` | — | — | توحيد نطاق |
| `majlisilm.com/*` | تحويل | `www.ssunnah.com/*` | — | — | علامة قديمة |
| `/assistant` | noindex | — | لا | لا | أداة داخلية |
| `/knowledge-graph` | noindex | — | لا | لا | تجربة تفاعلية |
| `/search` | noindex | — | لا | لا | أداة بحث |
| `/admin` | noindex | — | لا | لا | لوحة إدارة |
| `/dashboard` | noindex | — | لا | لا | |
| `/login` | noindex | — | لا | لا | |
| `/register` | noindex | — | لا | لا | |
| `/fiqh-council/live` | noindex | — | لا | لا | لوحة بيانات حية |
| `/fiqh-council/stats` | noindex | — | لا | لا | إحصائيات داخلية |

### علماء — مسارات slug قديمة

| القديم | الجديد |
|--------|--------|
| `/scholars/imam-malik` | `/scholars/malik` |
| `/scholars/al-nawawi` | `/scholars/nawawi` |
| `/scholars/hanafi` | `/scholars/abu-hanifa` |
| `/scholars/shafi` | `/scholars/shafii` |
| `/scholars/al-bukhari` | `/scholars/bukhari` |
| `/scholars/ibn-taymiya` | `/scholars/ibn-taymiyyah` |

### مكتبة — مسارات كتب قديمة

| القديم | الجديد |
|--------|--------|
| `/library/book-bukhari` | (slug حالي في الكتالوج) |
| `/library/book-mustasfa` | `/library/book-al-mustasfa-ghazali` |
| `/library/book-alfiyya` | `/library/book-alfiyyah` |
| `/library/book-tabari-tafsir` | `/library/book-tafsir-tabari` |

### أذكار — query `?cat=` قديم

| القديم | الجديد |
|--------|--------|
| `/adhkar?cat=morning` | `/adhkar/morning` |
| `/adhkar?cat=evening` | `/adhkar/evening` |
| `/adhkar?cat=sleep` | `/adhkar/sleep` |
| (وغيرها في `vercel.json`) | `/adhkar/{slug}` |

---

## أقسام ثانوية — وصول مباشر (بدون `/more`)

| القسم | المسار | الرئيسية | التذييل | `/sections` | بحث |
|-------|--------|----------|---------|-------------|-----|
| المكتبة | `/library` | FEATURE_CATS | نعم | نعم | نعم |
| العلماء | `/scholars` | — | نعم | — | نعم |
| الحديث | `/hadith` | FEATURE_CATS | نعم | نعم | نعم |
| المسابقات | `/competitions` | — | نعم | نعم | نعم |
| التاريخ الإسلامي | `/tarikh-islami` | FEATURE_CATS | نعم | نعم | نعم |
| السيرة | `/seerah` | FEATURE_CATS | — | نعم | نعم |
| قصص الأنبياء | `/prophets` | FEATURE_CATS | — | نعم | نعم |
| الأمم السابقة | `/nations` | explore-links | — | نعم | نعم |
| ذكر في القرآن | `/quran/people` | — | — | نعم | نعم |
| المصادر | `/sources` | — | نعم | نعم | نعم |

---

## مصادر الحقيقة في الكود

| الملف | الغرض |
|-------|--------|
| `artifacts/majalis/vercel.json` | تحويلات 308 الإنتاج |
| `artifacts/majalis/src/lib/ia-final-structure.ts` | `IA_REDIRECTS` + تنقل IA |
| `artifacts/majalis/src/config/sections.registry.ts` | `SECTION_MERGE_REDIRECTS` |
| `artifacts/majalis/src/AppRoutes.tsx` | تحويلات SPA |
| `artifacts/majalis/src/lib/seo-routes.json` | SEO + noindex |
| `artifacts/majalis/scripts/legacy-routes-redirects-audit.mjs` | فحص CI |

تشغيل الفحص: `pnpm run audit:legacy-routes` من `artifacts/majalis`.
