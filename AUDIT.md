# تقرير التدقيق الشامل — منصة المجلس العلمي (majlisilm.com)

**تاريخ التقرير:** 10 يوليو 2026  
**المراجع:** كود المصدر في `/Users/alabdullmohsen/majalis-correct/artifacts/majalis/`  
**الفرع الحالي:** `feat/platform-audit-overhaul`

---

## ملخص تنفيذي

| المجال | الحالة | ملاحظة |
|--------|--------|---------|
| هيكل المسارات | ✅ كامل | ~190 مسار، جميعها محاطة بـ ErrorBoundary |
| حالة الفرع المنشور | ⚠️ ناقص | origin/main متأخر عن الفرع المحلي |
| جرد الصفحات | ✅ كامل | 219+ صفحة view |
| المصحف | ✅ كامل | QuranPage 1211 سطر، البسملة معالجة بشكل صحيح |
| قاعدة البيانات/البذور | ✅ كامل | ملفات seed ضخمة، بعضها يعتمد على Supabase |
| الأداء والبناء | ⚠️ ناقص | index.css كبير (1.35MB)، dist/ موجود (27MB) |
| PWA/Service Worker | ✅ كامل | v14، يدعم الأذان في الخلفية |
| SEO | ✅ كامل | 115 مسار في Sitemap، prerender.mjs موجود |
| Capacitor/iOS/Android | ✅ كامل | iOS وAndroid موجودان |
| الصفحات القانونية | ✅ كامل | Privacy، Terms، Contact، AccountDeletion جميعها موجودة |

---

## 1. هيكل المسارات

**المصدر:** `src/App.tsx`

### الإعداد العام

- **جميع المسارات lazy-loaded** باستخدام `lazyWithRetry` عدا:
  - `HomePage` — مُحمَّل مباشرة (غير lazy) لتحسين أداء الصفحة الرئيسية
  - `NotFound` — مُحمَّل مباشرة
- **غلاف الخطأ (ErrorBoundary):** جميع المسارات مُحاطة عبر:
  - `SafeLazyRoute` — يُستخدم لجميع المسارات العامة (يُرجع params + ErrorBoundary + Suspense)
  - `AdminLazyRoute` — يُستخدم للمسارات الإدارية (AdminRouteGuard + ErrorBoundary + Suspense)
  - 3 مسارات مع ErrorBoundary مباشرة: `/assistant`، `/transcribe`، `/`

### إحصاء المسارات

| النوع | العدد التقريبي |
|-------|---------------|
| مسارات عامة (SafeLazyRoute) | ~140 |
| مسارات إدارية (AdminLazyRoute) | ~20 |
| إعادة توجيه (Redirect) | ~15 |
| مسارات مع ErrorBoundary مباشرة | 3 |

### تصنيف المسارات الرئيسية

| المجال | المسارات |
|--------|---------|
| القرآن | `/quran`, `/quran-hub`, `/quran-radio`, `/quran-live`, `/tajweed`, `/quran/tajweed`, `/surah-stories`, `/quran/surah-stories/:number`, `/quran-circles` |
| الفقه والمجمع | `/fiqh`, `/fiqh-council`, `/fiqh-council/resolutions`, `/fiqh-council/fatwas`, `/fiqh-council/nawazil`, + 10 مسارات أخرى |
| الحديث | `/hadith`, `/hadith/sahih`, `/hadith/daif`, `/hadith/mawdu`, `/hadith-science` |
| الدروس | `/lessons`, `/lessons/:id`, `/calendar`, `/kuwait-lessons`, `/annual-courses` |
| الصلاة | `/prayer-times`, `/prayer-countdown`, `/prayer-ranks`, `/adhan-settings`, `/qibla`, `/tasbih`, `/daily-wird` |
| التعلم | `/learning/paths`, `/learning/quiz`, `/learning/calendar`, `/my-learning`, `/learning-path`, `/flashcards` |
| الأقسام العلمية | `/tawhid`, `/fiqh`, `/seerah`, `/adhkar`, `/asma-husna`, `/arkan`, `/arkan-iman`, `/duas`, `/akhlaq` + 20+ |
| إدارة | `/admin`, `/admin/dashboard`, `/admin/automation/*`, `/admin/fiqh-review`, + 10 مسارات |

### المسارات في seo-routes.json

| الحالة | العدد |
|--------|-------|
| **sitemap:true** | **115** |
| **sitemap:false** | **40** |
| إجمالي المسارات في الملف | **158** |

---

## 2. حالة الفرع المنشور

**آخر 5 commits على الفرع الحالي (`feat/platform-audit-overhaul`):**

```
e7696eea feat(nav): إضافة غرفة الدراسة ومخزن المعرفة وتقويم الدروس إلى NAV_GROUPS
1856604c feat+perf: تفعيل 3 ميزات مكتملة + WebP صور + تحديث SW
c9534ca0 docs: إضافة DEPLOYMENT.md — سير عمل النشر اليدوي للإنتاج
d45a217f fix(a11y): WCAG AA contrast — darken secondary text + add contrast-check script
6604ce8a feat(fawaid): بطاقات مشاركة الفوائد كصور PNG قابلة للتنزيل
```

**آخر commits على `origin/main`:**

```
4427d28f P0 SEO: Organization+WebSite JSON-LD للصفحة الرئيسية + ItemList لمجمع الفقه والمؤسسات
a8a35bd1 P0 SEO: Organization/ItemList JSON-LD لصفحات من نحن ومصطلح الحديث والأذكار
72127719 P0 SEO: ItemList JSON-LD لصفحات المواريث والقصص الإسلامية
```

### الفروع المتاحة (16 فرع محلي + remote)

```
cursor/platform-hardening-final-92e6
design/full-redesign
dev/comprehensive-upgrade
dev/mobile-app-prep
feat/platform-audit-overhaul ← الحالي
features/major-upgrade
fixes/critical-bugs
fixes/data-pipeline-complete
home/full-polish
main
mushaf-dhahabi-redesign
public-pages-ux
quran-frame-refresh
quran/rebuild-from-scratch
refactor/full-overhaul
ui-ux-improvements
```

### ⚠️ ملاحظة حرجة

- الفرع المحلي `main` و `feat/platform-audit-overhaul` **يشتركان في نفس الـ commit** (`e7696eea`)
- `origin/main` **متأخر** — آخر commit موجود فيه يتعلق بـ P0 SEO وليس commit نقل التنقل الأخير
- **لا يوجد فرع `production` منفصل** — النشر يتم عبر `origin/main` مباشرة (راجع `DEPLOYMENT.md`)
- الكود المطور على `feat/platform-audit-overhaul` **لم يُدفع بعد** إلى `origin/main`

---

## 3. جرد الصفحات

### ملفات Views

| الموقع | عدد الملفات |
|--------|------------|
| `src/views/*.tsx` | 155 ملف |
| `src/views/admin/` | 59 ملف |
| `src/views/learning/` | 5 ملفات |
| **الإجمالي** | **219 ملف** |

**إجمالي الأسطر في جميع Views:** ~83,279 سطر

### أكبر الصفحات (بالأسطر)

| الملف | الأسطر |
|-------|--------|
| `QuranPage.tsx` | 1211 |
| `HikamSalafPage.tsx` | 1092 |
| `SahabahPage.tsx` | 1026 |
| `IslamicGlossaryPage.tsx` | 998 |
| `FadailAamalPage.tsx` | 942 |
| `AkhlaqPage.tsx` | 934 |
| `ProphetStoriesPage.tsx` | 921 |
| `DuasPage.tsx` | 852 |
| `IslamicScholarsPage.tsx` | 838 |
| `IslamicSectsPage.tsx` | 814 |
| `SunanYawmiyyaPage.tsx` | 794 |
| `HadithSciencePage.tsx` | 793 |
| `SawmPage.tsx` | 790 |

### صفحات Admin الكبرى

| الملف | الأسطر |
|-------|--------|
| `admin/ImageImportSection.tsx` | 931 |
| `admin/FiqhCouncilSection.tsx` | 806 |
| `admin/DashboardSection.tsx` | 668 |
| `admin/TelegramSection.tsx` | 666 |
| `admin/LessonImportImagePage.tsx` | 607 |

### ملاحظات

- `StartHerePage.tsx` موجود في views/ لكن **غير مُعرَّف في Router** في App.tsx (يحتاج إضافة مسار `/start-here`) — ملاحظة: المسار `/start-here` موجود فقط في SHELL_ROUTES لـ SW ولكنه غير موجود كـ Route في App.tsx

---

## 4. المصحف (القرآن الكريم)

### ✅ حالة QuranPage.tsx

- **الحجم:** 1211 سطر — أكبر صفحة في المنصة
- **مصدر البيانات:** `api.alquran.cloud` (external API)
- **البسملة:** معالجة بشكل صحيح — تُعرض كعنصر HTML منفصل قبل كل سورة

```tsx
{/* سطر 622 */}
<div className="qs-basmala" lang="ar" dir="rtl">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>
```

- يوجد تعليق في سطر 154: `/* يفصل البسملة المدمجة في نص الآية الأولى من API في طبقة العرض فقط */`
  - **المعنى:** البسملة مُدمجة في نص الآية الأولى من API، لكن الكود يفصلها ليعرضها بشكل منفصل ومميز

### مسارات القرآن في SEO

| المسار | sitemap | الأولوية |
|--------|---------|---------|
| `/quran` | ✅ true | 0.9 |
| `/quran-radio` | ✅ true | 0.78 |
| `/quran-live` | ✅ true | 0.8 |
| `/quran/tajweed` | ✅ true | 0.82 |
| `/quran/surah-stories` | ✅ true | 0.84 |
| `/quran-hub` | ✅ true | 0.85 |
| `/quran-circles` | ✅ true | 0.8 |
| `/tajweed` | ✅ true | 0.75 |
| `/surah-stories` | ✅ true | 0.75 |

### ملفات بيانات القرآن

- `src/lib/quran-api.ts` — واجهة API القرآن
- `src/lib/quran-audio.ts` — إدارة ملفات الصوت
- `src/lib/quran-radio.ts` — إذاعة القرآن
- `src/lib/quran-personal.ts` — حفظ التقدم الشخصي
- `src/lib/surah-extended-meta.ts` — بيانات موسعة للسور
- `src/lib/surah-stories.ts` — قصص السور
- `src/lib/share-ayah.ts` — مشاركة الآيات
- `public/quran.pdf` — نسخة PDF (15.16MB)

---

## 5. قاعدة البيانات وملفات البذور (Seed)

### ملفات Seed المحلية

| الملف | الأسطر | الملاحظة |
|-------|--------|---------|
| `quiz-seed.ts` | 6,275 | أكبر ملف seed |
| `qa-seed.ts` | 5,063 | أسئلة وأجوبة |
| `adhkar-seed.ts` | 3,601 | أذكار وأدعية |
| `fawaid-seed.ts` | 2,850 | فوائد دينية |
| `fatwa-seed.ts` | 2,279 | فتاوى |
| `rulings-encyclopedia-seed.generated.ts` | 9,136 | موسوعة الأحكام (مُولَّدة) |
| `rulings-seed.ts` | 1,478 | أحكام |
| `miracles-seed.ts` | 1,358 | إعجاز علمي |
| `library-catalog.ts` | 1,519 | كتالوج المكتبة |
| `fiqh-council-seed.ts` | 770 | بيانات المجمع الفقهي |
| `arbaeen-nawawi-seed.ts` | 362 | الأربعون النووية |
| `fawaid-curated-seed.ts` | 353 | فوائد مختارة |
| `lessons-seed.ts` | 93 | يعتمد على Supabase |
| `library-seed.ts` | 30 | يُعيد تصدير library-catalog |

**ملاحظة:** لا يوجد ملف `hadith-seed.ts` محلي — بيانات الحديث تُحمَّل من Supabase عبر `seed-hadith-collections.mjs`

### ملفات Seed الأخرى

| الملف | الأسطر |
|-------|--------|
| `lessons-catalog.ts` | 121 |
| `annual-courses-seed.ts` | موجود |
| `updates-seed.ts` | موجود |
| `fiqh-issues-seed.ts` | موجود |
| `fiqh-sessions-seed.ts` | موجود |
| `islamic-occasions-seed.ts` | موجود |
| `islamic-stories-seed.ts` | موجود |
| `scientific-announcements-seed.ts` | موجود |
| `prophets-data.ts` | موجود |
| `scholars-data.ts` | موجود |

### ⚠️ ملاحظات على البيانات

- **الدروس (`lessons-seed.ts`):** 93 سطر فقط — يعتمد أساساً على Supabase وليس على بيانات محلية ثابتة
- **المكتبة (`library-seed.ts`):** 30 سطر فقط — يستورد من `library-catalog.ts` (1519 سطر)
- **الحديث:** لا يوجد ملف seed محلي — يُحمَّل من قاعدة البيانات

---

## 6. الأداء (Build Output)

### حالة dist/

| المعيار | القيمة |
|---------|--------|
| **حجم dist/ الكلي** | 27MB |
| **عدد ملفات dist/assets/** | 168 ملف |
| **آخر بناء** | 10 يوليو 2026 (22:32) |

### أكبر Chunks في dist/assets/

| الملف | الحجم |
|-------|-------|
| `index-CjRxlVTe.css` | **1.36MB** ⚠️ |
| `admin-CBGMkO5P.js` | 515KB |
| `home-sections-iGoYtod_.js` | 396KB |
| `platform-services-DgzqipM6.js` | 315KB |
| `content-data-CUA7XZYa.js` | 265KB |
| `vendor-DRan-eZF.js` | 253KB |
| `adhkar-fawaid-seed-CA2QmFbe.js` | 242KB |
| `index-D_1XUwTd.js` | 221KB |
| `html2canvas-rUfCZJQk.js` | 214KB |
| `supabase-CWJnfID4.js` | 210KB |
| `fatwa-rulings-seed-D-sy6hN3.js` | 191KB |
| `IslamicStoriesPage-BYtS9zDf.js` | 104KB |
| `fiqh-council-QyfKHGgU.js` | 100KB |

### vite.config.ts — manualChunks

الـ manualChunks مُعرَّف بشكل شامل ويُقسّم:
- `vendor` — React + wouter + scheduler
- `supabase` — عميل Supabase
- `html2canvas` — تحويل HTML إلى صورة
- `icons` — lucide-react
- `admin` — جميع صفحات Admin
- `home-sections` — أقسام الصفحة الرئيسية
- `adhkar-fawaid-seed` — بيانات الأذكار والفوائد
- `lessons-seed-data` — بيانات الدروس
- `fatwa-rulings-seed` — بيانات الفتاوى والأحكام
- `fiqh-council` — صفحات المجمع الفقهي
- `science-pages` — الطب النبوي والإعجاز
- `content-data` — الخرائط الذهنية والاختبارات
- `platform-services` — خدمات المنصة

### ⚠️ نقطة تحسين

- **`index.css` يبلغ 1.36MB** — ضخم جداً ويُبطئ التحميل الأول
- يُوصى بتطبيق code-splitting للـ CSS أو PurgeCSS لتقليص هذا الحجم

---

## 7. PWA / Service Worker

**الملف:** `public/sw.js`

### إعدادات SW

| المعيار | القيمة |
|---------|--------|
| **الإصدار** | **v14** |
| SHELL_CACHE | `majalis-shell-v14` |
| DATA_CACHE | `majalis-data-v14` |
| FETCH_TIMEOUT | 8000ms (8 ثوانٍ) |

### SHELL_ROUTES (محفوظة offline)

```js
const SHELL_ROUTES = [
  "/",
  "/offline.html",
  "/start-here",
  "/adhkar",
  "/prayer-times",
  "/tasbih",
  "/daily-wird",
  "/sunan-yawmiyya",
];
```

**8 مسارات** محفوظة في ذاكرة التخزين المؤقت للوضع Offline.

### ميزات SW

1. **Cache-first** — بيانات القرآن والصلاة من APIs الخارجية (`api.alquran.cloud`، `api.aladhan.com`)
2. **Network-first** — Shell navigation مع fallback للـ Cache
3. **JS/CSS hashed bundles** — دائماً من الشبكة (لتجنب خطأ الـ chunks القديمة)
4. **جدولة الأذان في الخلفية** — يستقبل رسائل `SCHEDULE_ADHAN` ويُطلق الإشعار في الوقت المحدد حتى عند إغلاق التبويب
5. **Push Notifications** — دعم كامل لإشعارات Push مع RTL وLang=ar
6. **تحديث تلقائي** — عند التحديث يُعيد تحميل جميع النوافذ المفتوحة

---

## 8. SEO

### seo-routes.json

| المعيار | القيمة |
|---------|--------|
| إجمالي المسارات | 158 |
| مسارات sitemap:true | **115** |
| مسارات sitemap:false | **40** |
| الموقع الأساسي | `https://majlisilm.com` |

### الأولويات الأعلى (priority = 1.0 و 0.9+)

| المسار | الأولوية | تكرار التحديث |
|--------|---------|-------------|
| `/` | 1.0 | daily |
| `/lessons` | 0.9 | daily |
| `/quran` | 0.9 | weekly |
| `/fatwa` | 0.9 | daily |
| `/fiqh-council/live` | 0.9 | daily |
| `/calendar` | 0.88 | daily |
| `/prayer-times` | 0.88 | daily |

### ملفات SEO الداعمة

| الملف | الوصف |
|-------|-------|
| `public/sitemap.xml` | موجود (30,549 bytes) |
| `public/robots.txt` | موجود |
| `public/feed.xml` | موجود (10,263 bytes) |
| `scripts/prerender.mjs` | ✅ موجود |
| `scripts/generate-seo.mjs` | ✅ موجود |
| `scripts/post-build-seo.mjs` | ✅ موجود |
| `src/lib/seo.ts` | مكتبة SEO |
| `src/lib/seo-structured-data.ts` | بيانات منظمة JSON-LD |

### ⚠️ ملاحظات SEO

- المسار `/start-here` مدرج في SHELL_ROUTES لـ SW ومدرج في `seo-routes.json` (sitemap:true, priority 0.85) لكن **`StartHerePage.tsx` موجود في views/ دون مسار مُعرَّف في App.tsx**
- `/anbiya` موجود كـ Route في App.tsx لكن في seo-routes.json: `sitemap:false`
- بعض المسارات مكررة في seo-routes.json (مثال: `/updates` ظاهرة مرتين، `/islamic-stories` مرتين)

---

## 9. Capacitor / iOS / Android

### capacitor.config.ts

| المعيار | القيمة |
|---------|--------|
| **App ID** | `com.majlisilm.app` |
| **App Name** | `مجالس العلم` |
| **webDir** | `dist` |
| **androidScheme** | `https` |
| **cleartext** | false (أمان) |
| **Splash Duration** | 2000ms |
| **Splash Color** | `#153025` (أخضر داكن) |
| **StatusBar Style** | LIGHT |

### الإضافات المُعرَّفة

- `SplashScreen` — شاشة البداية
- `StatusBar` — شريط الحالة
- `Keyboard` — إدارة لوحة المفاتيح

### مجلدات الأجهزة

| المجلد | الحالة |
|--------|--------|
| `artifacts/majalis/ios/` | ✅ موجود (`App/`, `App.xcodeproj/`, `CapApp-SPM/`) |
| `artifacts/majalis/android/` | ✅ موجود (`app/`, `build.gradle`, `gradle/`) |

### إعدادات Android

- **Keystore:** `majalisilm-release.keystore` (متغيرات بيئة للكلمات السرية)
- **Release Type:** APK
- **webContentsDebuggingEnabled:** false (إنتاج آمن)

---

## 10. الصفحات القانونية وأساسية

| الصفحة | المسار | الملف | الأسطر | sitemap | الحالة |
|--------|--------|-------|--------|---------|--------|
| سياسة الخصوصية | `/privacy` | `PrivacyPage.tsx` | 137 | true | ✅ كامل |
| إعادة توجيه | `/privacy-policy` | → `/privacy` | — | — | ✅ |
| شروط الاستخدام | `/terms` | `TermsPage.tsx` | 121 | true | ✅ كامل |
| تواصل معنا | `/contact` | `ContactPage.tsx` | 136 | true | ✅ كامل |
| حذف الحساب | `/account-deletion` | `AccountDeletionPage.tsx` | 147 | — | ✅ كامل |
| من نحن | `/about` | `AboutPage.tsx` | موجود | true | ✅ كامل |
| المنهجية | `/methodology` | `MethodologyPage.tsx` | موجود | true | ✅ كامل |

---

## 11. ملاحظات إضافية

### مسارات غير موثقة في seo-routes.json

المسارات التالية موجودة في App.tsx لكن **غير موجودة في seo-routes.json**:
- `/account-deletion`
- `/prophet-stories` (إعادة توجيه إلى `/prophets`)
- `/c/:slug` (اقتباسات عامة)
- `/updates/auto/:slug`

### ملفات scripts

`scripts/` يحتوي على 90+ ملف سكريبت للعمليات التشغيلية، أبرزها:
- **التحقق:** 30+ ملف `verify-*.mjs` لفحص الإنتاج
- **البيانات:** ملفات seed وimport
- **smoke tests:** اختبارات التنقل والتحميل
- **التقارير:** تقارير الذكاء الاصطناعي والمحتوى

### مكتبات وتقنيات رئيسية

| التقنية | الاستخدام |
|---------|---------|
| React + Vite | الإطار الأساسي |
| Supabase | قاعدة البيانات والمصادقة |
| Wouter | التوجيه |
| TanStack Query | إدارة الحالة والطلبات |
| Radix UI | مكونات UI |
| Tailwind CSS | التصميم |
| Capacitor | تطبيق iOS/Android |
| Lucide React | الأيقونات |
| html2canvas | تصدير الصور |

---

## 12. التوصيات ذات الأولوية

### ⚠️ عاجل

1. **دفع الفرع الحالي إلى origin/main** — 3+ commits مهمة (التنقل، الأداء، SW v14) لم تُنشر بعد
2. **إضافة مسار `/start-here`** في App.tsx — الصفحة موجودة في Views وSEO وSW لكنها غير مُسجَّلة كـ Route

### 🔧 تحسينات

3. **تقليص `index.css` (1.36MB)** — أكبر حجم ملف في البناء؛ يُوصى بـ PurgeCSS أو CSS code-splitting
4. **تنظيف مسارات seo-routes.json المكررة** — `/updates` و`/islamic-stories` مكررتان
5. **إضافة `/account-deletion` إلى seo-routes.json** — صفحة مطلوبة لـ App Store ومتجر Google Play
6. **مراجعة lessons-seed.ts** (93 سطر) — بيانات الدروس تعتمد كلياً على Supabase، يُوصى بـ seed محلي تجريبي
7. **توسيع SHELL_ROUTES في SW** — لإضافة مسارات أكثر تكراراً مثل `/quran` و`/adhkar` في التخزين المؤقت Offline

---

*انتهى التقرير — لا تعديلات أُجريت على الكود*
