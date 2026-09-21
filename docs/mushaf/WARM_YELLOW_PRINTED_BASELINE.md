# Sunnah Warm Yellow — Baseline

تاريخ تحديث: 2026-09-21 (PR-6 مزامنة مع Quran Gold الموحّد)  
مرجع التنفيذ: `mushaf-warm-yellow-tokens.ts` + `mushaf-reader.css`

## Quran Integrity (P0)

| فحص | نتيجة |
|---|---|
| mushaf-604-integrity-gate | مطلوب أخضر قبل الدمج |
| new-mushaf-reader-gate | مطلوب أخضر قبل الدمج |

لم يُمسّ أي ملف بيانات قرآن / Page Mapping / Line Mapping في موجات التثبيت البصري.

## Geometry المحمية

- `--mushaf-ayah-mark-size: 1.15em` عالميًا (ص٣…٦٠٤)
- ص١–ص٢ فقط: `1.22em` عبر `.nm-page--opening` / `.nm-page--lead`
- شبكة 15 سطرًا للصفحات العادية؛ content-driven لصفحتي الافتتاح
- ممنوع: letter-spacing على النص / scaleX / auto-fit

## Runtime Colors (Light)

| Token | قيمة |
|---|---|
| paper | `#FCF6E3` |
| ink | `#1C160E` |
| verse fill / Quran Gold | `#C9A82E` |
| verse border | `#B89620` |
| verse number | `#5F4814` |
| printed gold | `#C9A82E` |

## Dark

| Token | قيمة |
|---|---|
| verse fill | `#C4A030` |
| verse border | `#A88618` |
| verse number | `#F0E2B8` |

انظر أيضًا: `docs/mushaf/FIRST_PAGES_VISUAL_VALIDATION.md`
