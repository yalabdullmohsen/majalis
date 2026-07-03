# تقرير اختبارات Playwright

## آخر تشغيل: 2026-07-04 (بعد إعادة تصميم أرقام الآيات وبطاقة الآية)

| المقياس | القيمة |
|---|---|
| إجمالي الاختبارات | 296 |
| ناجح ✅ | 257 |
| متخطّى (skipped) ⏭ | 8 |
| فاشل ❌ | 2 |
| المدة | 32.8 دقيقة |
| البيئات | desktop + mobile |

### ملاحظة الاختبارات الفاشلة
كلا الفشلين في `14-prophets.spec.ts` — خطأ `Target page, context or browser has been closed` بسبب انهيار المتصفح بعد تجاوز مهلة 30 ثانية. لا علاقة بأي تعديل كودي (اختبارات عشوائية/flaky بسبب ضغط الجلسة الطويلة 32 دقيقة). اختبار `/quran renders without overflow` نجح في المحاولة الثانية.

## ملفات الاختبارات (15 ملف)

| الملف | الوصف |
|---|---|
| 00-public-routes.spec.ts | المسارات العامة |
| 01-auth.spec.ts | المصادقة وتسجيل الدخول |
| 02-lessons.spec.ts | صفحة الدروس |
| 03-sheikhs.spec.ts | صفحة المشايخ |
| 04-library.spec.ts | المكتبة |
| 05-search.spec.ts | البحث |
| 06-admin.spec.ts | لوحة الإدارة |
| 07-prayer-times.spec.ts | أوقات الصلاة |
| 08-hadith.spec.ts | الأحاديث |
| 09-fiqh.spec.ts | الفقه |
| 10-quran.spec.ts | القرآن |
| 11-seo.spec.ts | SEO والميتا |
| 12-accessibility.spec.ts | إمكانية الوصول |
| 13-new-features.spec.ts | الميزات الجديدة (الباحث الشرعي، الجامعات) |
| 14-prophets.spec.ts | قصص الأنبياء |
