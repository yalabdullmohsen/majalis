# المصحف — مرحلة ٢: التفاسير والترجمات (كسولة)

تاريخ: 2026-08-08

## الهدف (القسم ١١-د)

- تفاسير قابلة للتبديل: الميسّر، السعدي، ابن كثير، البغوي، الطبري.
- حفظ التفضيل محليًا.
- حجم خط قابل للضبط.
- طيّ/توسيع للنصوص الطويلة.
- جلب كسول لكل طبعة/آية (لا تحميل سور كاملة عند فتح الشيت).
- ترجمات اختيارية بنفس الأسلوب.
- العرض البصري يبقى QPC V2 — بلا صور مدينة ولا مضلعات صور.

## التنفيذ

| جزء | مسار |
|---|---|
| كتالوج التفاسير | `src/features/mushaf/tafsir-editions.ts` |
| كتالوج الترجمات | `src/features/mushaf/translation-editions.ts` |
| جلب آية واحدة | `src/features/mushaf/fetch-ayah-content.ts` |
| تفضيلات localStorage | `src/features/mushaf/reader-prefs.ts` |
| واجهة الشيت | `src/components/quran/PageAyahActionSheet.tsx` |
| مصادر/أعلام | `src/features/mushaf/config.ts` |

## المصادر والتراخيص

- **التفاسير:** `GET https://api.quran.com/api/v4/tafsirs/{slug}/by_ayah/{s}:{a}`  
  slugs: `ar-tafsir-muyassar`, `ar-tafseer-al-saddi`, `ar-tafsir-ibn-kathir`, `ar-tafsir-al-baghawi`, `ar-tafsir-al-tabari`  
  عبر منظومة Quran.com / QUL.
- **الترجمات (اختيارية):** `GET https://api.alquran.cloud/v1/ayah/{s}:{a}/{edition}`  
  طبعات: `en.sahih`, `en.pickthall`, `fr.hamidullah`.
- لا حزم `offlineTafsirPacks` في هذه المرحلة (`MUSHAF_FEATURES.offlineTafsirPacks = false`).

## تفضيلات محفوظة

| مفتاح | المعنى |
|---|---|
| `majalis-mushaf-tafsir-edition-v1` | طبعة التفسير (مع ترحيل من `ar.muyassar` القديم) |
| `majalis-mushaf-tafsir-font-scale-v1` | مقياس الخط (0.9 / 1 / 1.15 / 1.3) |
| `majalis-mushaf-translation-on-v1` | إظهار الترجمة |
| `majalis-mushaf-translation-edition-v1` | طبعة الترجمة |

## تنظيف كود الصور الميت

أُزيلت من `config.ts` الأعلام والمهايئات الشرطية بلا فائدة:

- `pageImages` / `imagePolygons`
- `visual-page-images` / `coords-image-polygons`

لا مسار تفعيل لصور المدينة في الشيفرة الحية.

## قبول مرحلة ٢ (مقيس)

- فتح آية في `/mushaf` ⇒ شيت يعرض التفسير الميسّر افتراضيًا (أو المحفوظ).
- تبديل إلى السعدي/ابن كثير/البغوي/الطبري ⇒ جلب آية واحدة فقط، مع حفظ الاختيار.
- زر حجم الخط يدور المقاييس ويُحفظ.
- تفسير طويل (مثل ابن كثير) ⇒ «عرض المزيد / عرض أقل».
- تفعيل الترجمة ⇒ نص كسول لطبعة مختارة دون كسر RTL للتفسير.
- لا طلبات لصور صفحات ولا مضلعات.
