# إصلاح تخطيط المصحف من الجذر — 2026-08-16

## السبب الجذري للقص والتراكب
1. إطار `aspect-ratio: 0.68 / 1` مع عرض `min(100vw, height×0.68)` ضيّق المحتوى ثم أخفاه بـ `overflow: hidden` → قص يمين/يسار وعمودي.
2. عند فتح شريط الآية رُفع `--mm-chrome-bottom-h` إلى ~8.25rem فقلّصت مساحة الـ15 سطرًا أكثر.
3. حجم خط `clamp(1.55rem … 2.12rem)` أكبر من العرض المتاح مع `white-space: nowrap` لأسطر QPC.
4. `mix-blend-mode: multiply` على التحديد + خلفيات داكنة/ضبابية على الشيتات أعطت مظهر تعتيم فوق الورق.

## الإصلاح
- إلغاء نسبة 0.68؛ صفحة بعرض `min(100%, 42rem)` وارتفاع `100svh/100dvh` مع `overflow-x: clip`.
- شيت الآية portal لا يقلّص الصفحة.
- `fitMushafPageFont` يضبط `--mm-qpc-size` حتى لا تفيض الأسطر أفقياً ولا الشبكة عمودياً (بلا `transform: scale`).
- تحديد آية خفيف بدون multiply؛ زر خروج دائم؛ سحب للأسفل يغلق الشيت.
- لوحة اسم السورة بعرض داخلي متوازن (هوامش داخلية).

## التلاوة والتفسير
- التلاوة من `AyahActionSheet` → `playAyah` / `togglePlay` + اختيار قارئ محفوظ.
- التفسير عبر `MushafTafsirSheet` (نصف شاشة، إغلاق بالسحب/الزر) — لا يغطي القراءة إلا عند الفتح الصريح.

## الملفات
- `mushaf-madinah.css`, `MushafPage.tsx`, `useMushafPageFontFit.ts`
- `VerifiedMushafReader.tsx`, `AyahActionSheet.tsx`
- بوابات: `mushaf-real-layout-gate`, `mushaf-rebuild-pages-gate`, `unit-gate.mjs`, `mushaf-layout-acceptance-gate.test.ts`

## تحقق متوقع 390 / 430
- لا شريط تمرير أفقي؛ الآيات كاملة داخل الورق.
- لا طبقة رمادية دائمة؛ الشيت فقط عند التفاعل.
- قلب صفحة: سحب يسار = التالية، يمين = السابقة؛ حواف لمس خفية.
