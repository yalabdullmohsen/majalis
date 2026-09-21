# First Pages Visual Validation — ص١–ص٢ (PR-6)

**تاريخ:** 2026-09-21  
**نطاق:** الصفحة ١ (الفاتحة) · الصفحة ٢ (بداية البقرة) فقط  
**ممنوع:** أي تعديل على النص القرآني / التشكيل / الوقف / أرقام الآيات كمحتوى / تقسيم الصفحات / QPC

## حالة الذهب

| Token | قيمة |
|---|---|
| Quran Gold / printed / verse fill | `#C9A82E` |
| Border | `#B89620` |
| Number ink | `#5F4814` |
| Global ayah mark size | `1.15em` (ص٣…٦٠٤) |
| Opening/lead mark size | `1.22em` + border `1.5px` + glyph `0.65em` + inset 30% |

## تخطيط

- Content-driven: `minmax(0, auto)` + `align-content: space-evenly`
- لا `repeat(N, 1fr)` على ص١–ص٢
- تكتل banner/basmala بمسافات دقيقة (`0.04em` / `0.02em`) على `--opening/--lead` فقط
- `letter-spacing: 0` على `.nm-basmala` (مثل سطور الآيات)

## سلامة الصفحات الأخرى

| صفحة | توقع |
|---|---|
| 1 · 2 | تحسينات PR-6 فقط عبر `.nm-page--opening` / `--lead` |
| 5 · 100 · 604 | بدون override للحجم أو content-pack |

## بوابات

- `mushaf-pages-1-2-layout-gold-gate.test.ts`
- `mushaf-verse-marker-printed-gold-gate.test.ts`
- mushaf measure+assert في `verify:ci`
