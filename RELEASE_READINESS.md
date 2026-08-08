# جاهزية الإصدار 1.0.0 — المجلس العلمي

آخر تحديث: 2026-08-08  
الجذر: `/Users/alabdullmohsen/majalis-correct` → مستودع `majalis`  
التصنيف: انظر [`PLATFORMS.md`](./PLATFORMS.md)

| البند | الحالة | رقم PR | ما تبقّى |
|---|---|---|---|
| م1أ تجميد `majlisilm-flutter` | تم ✅ | [#923](https://github.com/yalabdullmohsen/majalis/pull/923) → `9faadc7af` | لا شيء |
| م1ب حسم `majalis-mobile` | تم ✅ | [#924](https://github.com/yalabdullmohsen/majalis/pull/924) → `10bcf01bb` | استبعاد workspace بعد TestFlight |
| م1ج `PLATFORMS.md` + جرد تسميع | قيد التنفيذ | — | توثيق + حماية mushafi |
| م2 مصحف (صور/مضلعات/أعلام) | محظور جزئياً | — | **ينقص PDF مدينة مرخّص**؛ الأعلام تبقى معطّلة بلا بيانات |
| م3 حواجز المتجر | جزئي موجود | — | تدقيق حذف حساب فعلي، PRIVACY_DATA_MAP، أصول، contrast، fastlane |
| م4 تراخيص | جزئي (`/sources`) | — | CREDITS.md + LICENSE_RISKS.md + تدقيق 117 كتاباً |
| م5 توثيق شرعي آلي | لم يبدأ | — | بوابة CI + quarantine |
| م6 أداء وتنظيف CSS | لم يبدأ | — | ميزانيات + دفعات حذف ≤400 |
| م7 أمان وموثوقية | جزئي | — | تدقيق RLS، Sentry، E2E حذف حساب |
| م8 وصولية ومساحات | جزئي | — | بوابة تباين خضراء مطلوبة؛ تدقيق 44×44 |
| م9 إطلاق 1.0.0 | لم يبدأ | — | يحتاج أسرار المالك (ASC، Play) |
| م10 تمهيد تسميع 1.1 | محظور حتى TestFlight | — | خوارزمية TS + OpenAPI ثابت + sr_* |

## قواعد ثابتة

- **`artifacts/mushafi` مرجع لميزة تسميع قادمة — ممنوع حذفه أو تجميده حذفاً.**
- الحذف الفعلي للمنصات المجمَّدة فقط بعد وسم `snapshot/pre-cleanup-2026-08` واستقرار TestFlight أسبوعاً.
- مسار المتجر = Capacitor حول `artifacts/majalis` فقط.

## ملاحظات م2

لا توجد في المستودع حزمة صور مصحف المدينة 604 ولا PDF منقّى. حتى توريد الأصول المرخّصة:

- `pageImages` / `imagePolygons` تبقى **معطّلة** (أُزيلت سابقاً من `config.ts` لصالح QPC V2).
- `ayahTimingsMs` / `offlineTafsirPacks` / `imlaeiEditionLocal` تبقى معطّلة بلا بيانات كاملة.
- العرض الافتراضي: QPC V2.

## ملاحظات م10 (تسجيل مبكر للخصوصية)

- `NSMicrophoneUsageDescription` عربي مطلوب قبل تفعيل التسميع في المتجر.
- التسجيلات = بيانات مستخدم؛ تدخل في حذف الحساب وبطاقات الخصوصية.
- قرار التخزين (جهاز / Supabase Storage) يُحسم قبل 1.1 — يُسجَّل في `PRIVACY_DATA_MAP.md`.
