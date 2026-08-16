# إعادة بناء المصحف — تقرير نهائي

## التصميم القديم الذي أُلغي / استُبدل
- غلاف `MushafViewport` القديم كمنطق وحيد → أصبح alias لـ `VerifiedMushafReader`.
- قلب صفحة مضمّن في الـviewport → `MushafPager` (سحب RTL + حواف + reduced-motion).
- شريط آية مسطّح → `AyahActionSheet` بتبويبات: التلاوة / التفسير / نسخ / مشاركة / حفظ.
- البحث الضاغط للإطار → `MushafSearchSheet` مستقل.
- تمرير رأسي داخل الصفحة (`overflow-y: auto`) → إطار fit-to-screen بلا قص.

## كيف تُعرض الصفحة
- بيانات QPC V2 محلية (`public/data/quran-v2/pages` + خطوط `qpc-v2`) — بلا PDF وبلا التفاف عشوائي.
- إطار `.mushaf-page-frame` بنسبة `aspect-ratio: 0.68 / 1`، وسط الشاشة، `overflow` مخفي أفقيًا وعموديًا.
- `100dvh` + `var(--inset-*)` لـ iPhone safe-area.
- preload للصفحة الحالية ±1 فقط.

## قلب الصفحة
- جوال: صفحة واحدة؛ swipe left = التالية؛ swipe right = السابقة؛ نقر الحواف كذلك.
- حركة خفيفة؛ احترام `prefers-reduced-motion`.
- حفظ آخر صفحة عبر `saveLastPage` (localStorage / Capacitor Preferences).

## التلاوة والتفسير
- لا تشغيل تلقائي؛ الضغط على الآية يفتح الـSheet فقط ولا يغيّر الصفحة.
- التلاوة: قارئ / تشغيل / من هذه الآية / إيقاف / سابق-تالي.
- التفسير: `MushafTafsirSheet` خارج النص (≤ ~50–55٪ من الشاشة).

## البسملة
- من بيانات `chapters.json` (`bismillah_pre`) + منطق `MushafPage` / `qpc-page-data`.
- الفاتحة: البسملة آية 1 (لا زخرفة مكررة).
- التوبة: بلا بسملة.
- البقرة / الكهف / مريم: بسملة افتتاحية بمقاس موحّد `--mm-qpc-size`.

## نتائج اختبار الصفحات
| صفحة | بوابة بيانات+خط | إطار بلا قص |
|------|-----------------|-------------|
| 1,2,3,8,50,57,100,300,604 | ok | ok (هيكل CSS + ملفات) |
| بسملة: 1,2,187,293,305 | ok | — |

## iPhone
- StatusBar عبر مسار الإطلاق الحالي؛ المصحف يستخدم `--inset-*` و`100dvh`.
- لا `env(safe-area)` خارج `theme.css`.

## الملفات الأساسية
- `VerifiedMushafReader.tsx`, `MushafPager.tsx`, `AyahActionSheet.tsx`, `MushafSearchSheet.tsx`
- `mushaf-madinah.css`, `MushafControls.tsx`, `MushafReaderPage.tsx`
- بوابات: `unit-gate.mjs`, `mushaf-real-layout-gate`, `mushaf-basmala-gate`, `mushaf-rebuild-pages-gate`
