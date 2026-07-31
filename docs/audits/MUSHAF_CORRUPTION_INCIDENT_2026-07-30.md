# تقرير حادث: تحريف بصري في بعض صفحات المصحف — 2026-07-30

**الحالة:** أُصلح عبر فرع `cursor/mushaf-page-corruption-urgent-38ac` (PR #653)  
**الخطورة:** حرجة (نص قرآني معروض بشكل غير صحيح بصريًا)  
**نوع الخلل:** تحريف **عرض** (CSS/bidi) — **ليس** تحريف بيانات النص المخزّنة

---

## 1) الملخص التنفيذي

شكاوى «المصحف محرّف في بعض الصفحات» نتجت عن قاعدة CSS عامة في `elite-2026.css` تطابق أي صنف يحتوي `ayah`، ففرضت `unicode-bidi: plaintext !important` (وخصائص خط/ارتفاع) على حاويات قارئ المصحف الجديدة بعد إعادة تصميم وضع «آية». وراثة `plaintext` إلى أسطر QPC (Presentation Forms + خط صفحة `pN.woff2`) تفسد ترتيب/عزل الحروف على صفحات معيّنة فتبدو محرّفة.

بيانات `quran-v2` (604 صفحة / 6236 آية / `code_v2`) سليمة (`verify-mushaf-v2-integrity`: 0 مشاكل).

---

## 2) التحقيق

| الفحص | النتيجة |
|---|---|
| سلامة JSON للصفحات والخطوط | 604/604 — سليمة |
| مطابقة `page_number` ووجود `code_v2` | سليمة على العيّنات 1,2,50,255,604 |
| مسار الرسم | ليس صورًا: خط QPC لكل صفحة + `code_v2` |
| قاعدة elite `[class*="ayah"]` | تطابق `quran-shell--ayah`, `qs-mushaf-body--ayah`, `mpv-ayah-*`, … |
| استثناءات سابقة | `mf2-` و `qs-ayah` فقط — لا تغطي أصناف #636–#638 |
| آلية الضرر | وراثة `unicode-bidi: plaintext` إلى `.mf2-line` / الكلمات |

---

## 3) السبب الجذري

بعد إدخال أصناف immersive مثل:

- `quran-shell--ayah`
- `qs-mushaf-body--ayah` / `qs-mushaf-frame--ayah`
- `mpv-body--ayah` / `mpv-ayah-header` / …

أصبحت تطابق:

```css
[class*="ayah"]:not(...mf2-...):not(...qs-ayah...) {
  unicode-bidi: plaintext !important;
  font-family: "Noto Naskh Arabic" !important;
  ...
}
```

`unicode-bidi` موروث. أسطر المصحف لم تكن تعزل bidi صراحةً → عرض QPC ينكسر على بعض الصفحات (كثافة/اتجاه/رموز نهاية الآية).

---

## 4) الإصلاح

1. توسيع استثناءات elite لتشمل: `qs-mushaf-`, `mpv-`, `quran-shell--ayah`.
2. عزل صريح: `unicode-bidi: isolate` على `.mf2-line` / `.mf2-word` / `.mf2-ayah-group` و`.qs-mushaf-body--ayah` + inline في `MushafPageV2`.
3. اختبار انحدار `mushaf-qpc-css-isolation.test.ts` + ربطه بـ `test` / `test:regression`.
4. سكربت `verify:mushaf-v2` في بوابات البناء عبر سكربت الاختبار.

---

## 5) ضمان عدم التكرار

- أي صنف جديد يحتوي `ayah` داخل قارئ المصحف يجب أن يبقى تحت بادئات مستثناة (`mf2-` / `qs-mushaf-` / `mpv-` / `quran-shell--ayah`) أو يُضاف للاستثناء في الاختبار.
- الاختبار يفشل إن حُذف استثناء من قاعدة elite.
- التحقق من وجود 604 ملف JSON + 604 خط و`code_v2` على صفحات حرجة.

---

## 6) ما لم يكن السبب

- تلف ملفات `page-NNN.json` أو نقص آيات
- استخدام `code_v1` بدل `code_v2` في المسار الحالي
- تحريف نص المصدر الشرعي المخزّن

---

## 7) التحقق بعد الإصلاح

- `npx tsx src/lib/__tests__/mushaf-qpc-css-isolation.test.ts`
- `node scripts/quran-import/verify-mushaf-v2-integrity.mjs`
- فتح `/mushaf/page/1`, `/50`, `/255`, `/604` والتأكد أن `getComputedStyle(.mf2-line).unicodeBidi` = `isolate` وأن `fontFamily` يبدأ بـ `qpc-page-N`
