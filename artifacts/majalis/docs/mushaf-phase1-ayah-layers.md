# المصحف — مرحلة ١: الطبقات الثلاث + ضغط الآية

تاريخ: 2026-08-08

## المعمارية

كل صفحة تُبنى من:

| طبقة | التنفيذ الحالي | المصدر |
|---|---|---|
| ١ بصري | خط QPC V2 لكل صفحة (`MushafPageV2`) | `public/fonts/qpc-v2/` + `public/data/quran-v2/` عبر `api.qurancdn.com` (منظومة QUL) |
| ٢ إحداثيات | مستطيلات SVG نسبية 0..1 مشتقّة من `line_number` + `position` | نفس `quran-v2` — **ليست** مضلعات صور المدينة الرسمية |
| ٣ نص | عثماني مخفي بصريًا (`MushafTextLayer`) | كلمات `text_uthmani` من الصفحة + سور `public/data/quran/` (Tanzil/AlQuran Cloud) |

المفتاح الموحّد: `surah:ayah` و`page`.

تبديل المصادر: `src/features/mushaf/config.ts` (`MUSHAF_SOURCES` / `MUSHAF_FEATURES`).

## Feature flags (معطّل بلا مصدر موثوق)

| العلم | السبب |
|---|---|
| `ayahTimingsMs` | لا JSON توقيتات بداية/نهاية آية داخل ملف تلاوة متصل |
| `offlineTafsirPacks` | مرحلة ٢: جلب كسول حي لكل آية — لا حزم تفاسير محلية كاملة |
| `imlaeiEditionLocal` | لا طبعة إملائية منفصلة محلية؛ البحث يطبّع عثمانيًا عند الحاجة لاحقًا |

أُزيلت أعلام/مهايئات الصور الميتة (`pageImages` / `imagePolygons` / `visual-page-images` / `coords-image-polygons`) — الاعتماد على QPC V2 فقط. انظر مرحلة ٢: `docs/mushaf-phase2-tafsir-translation.md`.

مفعّل في مرحلة ١: `ayahHitLayer`, `ayahTextLayer`.

## التراخيص / الإسناد

- **النص العثماني (سور):** Tanzil عبر AlQuran Cloud — انظر `docs/quran-data-source.md`.
- **تخطيط الكلمات/الأسطر وخطوط QPC V2:** بيانات وخطوط عبر Quran.com CDN / QUL (`api.qurancdn.com`) — راجع أيضًا `MushafEditionInfoPage` و`docs/mushaf-rebuild-inventory.md` §7.
- **الصوت (موجود سابقًا، خارج نطاق مرحلة ١ الجديدة):** everyayah.com / mp3quran — يبقى كما هو خلف مشغّل الآيات الحالي.
- **صور المدينة وPolygons الرسمية:** غير مُدخَلة — لا ترخيص مُثبَّت في المستودع بعد.

## قبول مرحلة ١ (مقيس)

- فتح `/mushaf` يعرض القارئ ثلاثي الطبقات (لا صفحة «قريبًا»).
- ضغط مستقر (~320ms) على آية ⇒ تظليل ناعم + شيت الإجراءات القائم.
- ضغط الخلفية ⇒ إلغاء التحديد.
- `?ayah=s:a` يحدّد الآية.
- لا تحميل صور/مضلعات/توقيتات مخترَعة.

## حجم البيانات

لا حزم بيانات جديدة في هذه المرحلة — إعادة استخدام `quran-v2` والخطوط الموجودة. زيادة JS: مكوّنات `features/mushaf/*` خفيفة (هدف القسم ١١ ≤ ٦٠ ك.ب gzip لكامل التوسعة عبر المراحل).
