# الهيكل المستهدف — Feature-Sliced Design (حزمة B)

مرجع الترحيل بعد جرد الحزمة A (`docs/refactor/*`). هذا الـPR ينشئ الهيكل والملفات الجذرية فقط؛ النقل في C1…C7.

## الطبقات

| طبقة | المسار | المسؤولية |
|---|---|---|
| app | `src/app/` | providers، سجل المسارات، حدود الأخطاء، أنماط الجذر |
| pages | `src/pages/` | صفحات رقيقة (≤١٥٠ سطرًا): تركيب widgets/features/entities |
| widgets | `src/widgets/` | تراكيب UI مشتركة (Nav، RelatedRail، PageShell…) |
| features | `src/features/` | تفاعلات: bookmark، memorize، search، audio، prayer… |
| entities | `src/entities/` | كيان علمي: model + api + ui (بطاقة واحدة لكل كيان) |
| shared | `src/shared/` | ui/lib/hooks/types/config بلا معرفة بميزة |

## قواعد الاستيراد (تُفرض بـ `verify:fsd-layers`)

1. `pages` → `widgets` | `features` | `entities` | `shared` فقط.
2. `entities` لا تستورد من `features` ولا `pages` ولا `widgets`.
3. `shared` لا تستورد من أي طبقة أعلى (`app`/`pages`/`widgets`/`features`/`entities`).
4. لا استيراد نسبي بأكثر من مستوى واحد (`../../..` ممنوع) — استخدم `@/`.
5. المصدر التشغيلي للمسارات يبقى `App.tsx` حتى حزمة F؛ `app/router/routes.ts` هو السجل المستهدف.

## حالة الترحيل

- **B (هذا الـPR):** هيكل + stubs + توثيق + بوابة طبقات.
- **C1…C7:** نقل `src/views` → `src/pages/<feature>/` دون تغيير سلوكي.
- **D1:** نقل رموز `@theme` إلى `src/app/styles/theme.css`.
- **E/F:** تفعيل المستودعات وسجل المسارات.

## قرار هندسي (B)

- لم نُثبت `eslint-plugin-import` في B لتجنب تبعية جديدة؛ بوابة `scripts/verify-fsd-layers.mjs` تغطي القيود الحرجة.
- لم نربط `AppProviders` / `routes.ts` بـ `main.tsx` بعد — صفر تغيير مرئي.
- `features/lessons` الموجود يبقى كما هو ويُواءم تدريجيًا مع FSD.
## C1 — قرآن/مصحف (جزئي)

- نُقلت ١٠ صفحات إلى `src/pages/quran/`.
- الصفحات >١٥٠ سطرًا: غلاف رقيق + `ui/*View.tsx`.
- المؤجّل لـ C1b: MushafPageView، RecitationTest، Tajweed، DuasQuran، UlumQuran، QuranMemorization.

## C1b — بقية القرآن

- أكمل ترحيل صفحات القرآن المتبقية إلى `pages/quran/`.

## C2 — الدروس

- ترحيل ٩ صفحات دروس/معلمين إلى `pages/lessons/`.
- سكربت مساعد: `scripts/migrate-views-batch.mjs`.

## C3 — الحديث

- ترحيل ١٠ صفحات حديث إلى `pages/hadith/`.

## C4 — الفقه

- ترحيل ١٤ صفحة فقه/فرائض إلى `pages/fiqh/` (مجلس الفقه لاحقًا).

## C5 — المكتبة والعلماء

## C5 — المكتبة والعلماء

- ترحيل صفحات المكتبة والعلماء إلى `pages/library/`.

## C6 — أذكار وصلاة

- ترحيل الأذكار والصلاة والقبلة إلى `pages/worship/`.

## C7a — حساب وتنقّل أساسي

- ترحيل الرئيسية/بحث/إعدادات/دخول إلى `pages/account/`.
- مؤجّل C7b: مصطلحات، مسابقة، حفظ، فوائد، خريطة الموقع.

## C7b — مصطلحات ومسابقة وحفظ

## D1 — طبقة الرموز

- نقل `styles/theme.css` → `app/styles/theme.css` مع أسماء دلالية.
- shim توافقي في المسار القديم.

## G — الرسم البياني

- `public/data/graph/links.json` + `verify:knowledge-graph` + محمّل shared.

## H — RelatedRail

- GraphRelatedRail يقرأ links.json ويُعرض في ملف العالِم.
- توسعة: GraphRelatedRail في تفاصيل المكتبة (`LibraryDetailView`, kind=book).
- توسعة: GraphRelatedRail في تفاصيل الحكم (`RulingDetailView`, kind=ruling).

## G2 — محاذاة معرّفات الرسم

- تحديث `links.json` لتعكس معرّفات المنصة الحقيقية (`ibn-qudama`, `book-mughni`, `ruling-wudu-nullifiers`…).
- إزالة روابط/عقد دروس وهمية كانت تشير لمسارات غير موجودة.

## D2 — سلّم المسافات

- سلّم ٤/٨/١٢/١٦/٢٤/٣٢/٤٨ + `--page-gutter` على PageShell وفهرس السور.

## E — طبقة البيانات

- مستودعات scholar/book حية + DataResult + Zod للرسم + hooks Query.
- E2: `useBooksQuery` / `useBookQuery` بجانب hooks العلماء.

## F — سجل المسارات

- ROUTE_REGISTRY يغطي كل مسارات App (٣١٨) + verify:route-registry.

## I — بحث موحّد

- فهرس محلي `public/data/search/index.json` (علماء/كتب/سور) + `parseQuickNav` + نتائج في SearchView.

## D3 — تنظيف CSS ميت (دفعة 1)

- إزالة محددات مؤكَّدة عدم استخدامها من JSX: about-page، async-empty/error، admin-nav/panel/stat، ar-tabs/filter من مجموعات final-release.

## D4 — تنظيف CSS ميت (دفعة 2)

- ~208 سطر من index.css + design-system (شبكة/شارة/ورقة/قائمة افتراضية) + final-release + m2030/foundation — بعد تحقق rg من عدم الاستخدام في TSX.

## D5 — تنظيف CSS ميت (دفعة 3)

- ~263 سطر من `index.css`: home-demo/cta/banner، content-card-grid/mini-card، home-content-*، lessons-contact، ds-btn-* (شرطة واحدة).

## E3 — ربط hooks

- `ReadingPlansView` / `NewPlanForm` يستخدم `useBooksQuery` + `useBookQuery`.

## H2 — RelatedRail للأنبياء

- `GraphRelatedRail` في `ProphetDetailView`؛ `hrefFor(prophet)` → `/prophets/:slug`.

## G3 — توسيع الرسم

- عقد/روابط: أحمد↔مسند، مسلم↔صحيحه، النووي↔رياض، ابن حجر↔فتح الباري/نخبة.
