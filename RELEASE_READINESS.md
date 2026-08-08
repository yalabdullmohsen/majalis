# جاهزية الإصدار 1.0.0 — المجلس العلمي

آخر تحديث: 2026-08-09  
التصنيف: [`PLATFORMS.md`](./PLATFORMS.md) · خصوصية: [`PRIVACY_DATA_MAP.md`](./PRIVACY_DATA_MAP.md) · تراخيص: [`CREDITS.md`](./CREDITS.md) / [`LICENSE_RISKS.md`](./LICENSE_RISKS.md)

## دفعة UX/بحث (2026-08-09)

| البند | الحالة | رقم PR | ملاحظة |
|---|---|---|---|
| 1 تطبيع أرقام/حروف البحث + قفز مصحف | تم ✅ | [#947](https://github.com/yalabdullmohsen/majalis/pull/947) | `normalizeForSearch` + `parseMushafJumpQuery` |
| 2 Enter في حقول البحث | تم ✅ | [#948](https://github.com/yalabdullmohsen/majalis/pull/948) | جسر كسول + `enterKeyHint=search` |
| 3 بلا autoFocus بحث | تم ✅ | [#949](https://github.com/yalabdullmohsen/majalis/pull/949) | لا تركيز بحث «المزيد» |
| 4 تمرير لأعلى عند مسار جديد | تم ✅ | [#950](https://github.com/yalabdullmohsen/majalis/pull/950) | useLayoutEffect + خريطة ذاكرة |
| 5 خروج ذكي من المصحف | تم ✅ | [#951](https://github.com/yalabdullmohsen/majalis/pull/951) | أصل الدخول + رجوع غامر + مشغّل مصغّر |
| 6 شيت الآية الحديث | تم ✅ | [#952](https://github.com/yalabdullmohsen/majalis/pull/952) | صف إجراءات + المزيد + رموز mushaf |
| 11 توحيد شاشة الدخول | تم ✅ | [#953](https://github.com/yalabdullmohsen/majalis/pull/953) | هوية خضراء واحدة |
<<<<<<< HEAD
| 10 تنقّل وأزرار | جارٍ | هذا الفرع | المزيد بلا تكرار L1 + رصيف صلاة + لمس ≥44 |
| 7 ثم 8–9 | معلّق | — | حسب الترتيب المتفق |
=======
| 10 تنقّل وأزرار | تم ✅ | [#954](https://github.com/yalabdullmohsen/majalis/pull/954) | المزيد بلا تكرار L1 + رصيف صلاة + لمس ≥44 |
| 7 القرّاء والتلاوة | جارٍ | هذا الفرع | بث + سقف تنزيل + CREDITS |
| 8–9 سيرة / ابتلاءات | معلّق | — | محتوى موثّق فقط |
>>>>>>> a8e3946b1 (feat(quran-audio): توثيق القرّاء وسقف التنزيل دون اتصال)

| البند | الحالة | رقم PR | ما تبقّى |
|---|---|---|---|
| م1أ تجميد `majlisilm-flutter` | تم ✅ | [#923](https://github.com/yalabdullmohsen/majalis/pull/923) | — |
| م1ب تجميد `majalis-mobile` | تم ✅ | [#924](https://github.com/yalabdullmohsen/majalis/pull/924) | استبعاد workspace بعد TestFlight |
| م1ج خريطة المنصات + جرد تسميع | تم ✅ | [#925](https://github.com/yalabdullmohsen/majalis/pull/925) | — |
| م2 مصحف صور/مضلعات/توقيتات | **محظور بلا أصول** | — | توريد PDF مدينة مرخّص؛ الأعلام تبقى off (QPC) |
| م3 حواجز المتجر | جزئي ✅ | [#926](https://github.com/yalabdullmohsen/majalis/pull/926) + هذا الفرع | أصول المتجر؛ Android lane؛ push_subscriptions |
| م3 حذف الحساب | محسّن ✅ | `/account-deletion` + `clearUserLocalData` | تدقيق CASCADE لكل الجداول على الإنتاج |
| م3 Sign in with Apple | غير مطلوب الآن | — | Google معطّل (`GOOGLE_OAUTH_ENABLED=false`)؛ جهّز مع التفعيل |
| م3 خصوصية/شروط/دعم | موجود ✅ | `/privacy` `/terms` `/contact` `/support`→contact `/about` `/sources` | مطابقة PRIVACY_DATA_MAP |
| م4 تراخيص | توثيق بدأ | CREDITS + LICENSE_RISKS | حسم بنود LICENSE_RISKS المفتوحة |
| م5 بوابة محتوى شرعي | لم يبدأ | — | CI + quarantine |
| م6 أداء/CSS | لم يبدأ | — | ميزانيات CI + دفعات حذف |
| م7 أمان | جزئي | — | لا Sentry؛ تدقيق RLS؛ E2E حذف |
| م8 وصولية | جزئي | — | تباين أخضر على CI مؤخراً؛ تدقيق لمس 44 |
| م9 TestFlight 1.0.0 | يحتاج مالك | fastlane `ios beta` موثّق | أسرار ASC في CI |
| م10 تسميع 1.1 | محظور حتى TestFlight | جرد mushafi موجود | نقل خوارزمية TS بعد الرفع |

## قواعد ثابتة

- **`artifacts/mushafi` مرجع لميزة تسميع قادمة — ممنوع حذفه أو تجميده حذفاً.**
- المتجر = Capacitor حول `artifacts/majalis` فقط.
- لا اختراع أصول مصحف مدينة؛ م2 ينتظر التوريد المرخّص.

## تعريف «جاهز» لم3/م4

- [x] حذف حساب داخل التطبيق مربوط من الإعدادات  
- [x] مسح محلي أوسع عبر `clearUserLocalData`  
- [ ] push_subscriptions حذف صريح على الخادم  

- [x] خصوصية/شروط/مصادر بروابط ثابتة  
- [x] PRIVACY_DATA_MAP / CREDITS / LICENSE_RISKS موجودة  
- [ ] بنود LICENSE_RISKS الحرجة مغلقة أو المحتوى مخفي  
- [ ] أصول المتجر (أيقونة 1024، لقطات، وصف) جاهزة عند المالك  
- [x] fastlane README بلا أسرار في git  
