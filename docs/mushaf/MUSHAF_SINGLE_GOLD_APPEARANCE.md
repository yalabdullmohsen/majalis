# Mushaf Single Gold Appearance (2026-09-24)

## Decision

`MUSHAF_GOLD_APPEARANCE` فقط. حذف اختيار EMERALD/GOLD من الواجهة والكود والتخزين.

## Previous switch failure (confirmed)

`CSS_SPECIFICITY_OVERRIDE` + dual state/storage/default emerald → اختيار الذهبي غير موثوق ووميض زمردي.

## Contract

- Tokens ذهبية على `.nm-root` مباشرة.
- `data-mushaf-accent="gold"` ثابت (Migration تمسح `ssunnah-mushaf-accent-theme-v1`).
- Schema: `ssunnah-mushaf-settings-schema-v2` = `2-gold-only`.
- لا Provider متعدد الحالات · لا setTheme فعّال.
- لا واجهة «المظهر» / «الزمردي» / «الذهبي» كخيار.
- Cache: `sms-2026-09-24-single-gold`.

## Quran safety

لا QPC / Page Mapping / letter-spacing / scale / ayah text.
