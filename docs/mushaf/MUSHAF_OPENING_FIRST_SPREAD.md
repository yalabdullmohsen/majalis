# Mushaf First Spread — صفحات 1–2

**الفرع:** `cursor/mushaf-opening-first-spread`  
**النطاق:** Visual layout فقط · بلا مساس بالنص القرآني / QPC / ص٣…٦٠٤

## ROOT_CAUSE_CONFIRMED

`align-content: space-evenly` على `.nm-page--opening/.nm-page--lead` كان يوزّع الأسطر القليلة على كامل ارتفاع الصفحة → فراغات رأسية مفرطة، مع علامات آية ذهبية بالكامل وعرض نص 100٪.

## الإصلاح

1. كتلة قراءة متماسكة: `align-content: center` + `row-gap` + `max-inline-size` (~22.5rem).
2. `AyahMarkerOpening`: فيروزي `#0E7A6B` + حافة ذهبية — **ص١–ص٢ فقط**؛ ذهب مطبعي `#C9A82E` يبقى لص٣…٦٠٤.
3. Metadata pills لجزء/حزب · سطح رقم الصفحة — بلا اسم سورة في الـheader (بوابة P1).
4. `data-component="MushafOpeningPageLayout"` على MushafPage دون نسخ الصفحة أو تغيير البيانات.

## اختبارات

- `pnpm run test:mushaf-pages-1-2-layout-gold`
- `mushaf-opening-first-spread-gate.test.ts`
