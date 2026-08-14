# سُلّم الطباعة الموحّد — المجلس العلمي

تاريخ: 2026-08-14  
النطاق: كل الواجهة **عدا المصحف** (`src/features/mushaf/**`, QPC, `docs/MUSHAF_SPEC.md`).

## قبل → بعد (جذر)

| الرمز | قبل | بعد |
|---|---|---|
| `--ds-base` (html) | 15px | **16.5px** (~+10%) |
| body | 1rem ≈ 15px | **1.0625rem** ≈ 17.5px |
| أدنى واجهة | 0.6875–0.75rem (~10–12px) | **`--text-caption` 0.8125rem** (≥13px) |

## السُلّم (`@theme` + `typography-scale.css`)

| الرمز | القيمة |
|---|---|
| `--text-display` | `clamp(1.75rem, 5.2vw, 2.25rem)` |
| `--text-h1` | `clamp(1.5rem, 4.6vw, 1.875rem)` |
| `--text-h2` | `clamp(1.25rem, 3.9vw, 1.5rem)` |
| `--text-h3` | `clamp(1.125rem, 3.4vw, 1.25rem)` |
| `--text-body-lg` | `1.125rem` |
| `--text-body` | `1.0625rem` |
| `--text-body-sm` | `0.9375rem` |
| `--text-label` | `0.875rem` |
| `--text-caption` | `0.8125rem` |

الجسور: `--mj-fs-*` و`--ds-text-*` و`--text-mj-*` وTailwind `--text-xs…` تشير إلى السُلّم.

## سياقات مضبوطة

- المزيد / الشيت: عنوان ≥ h3، وصف ≥ body-sm، ارتفاع بطاقة مرن
- الفقه: عنوان بطاقة h2، وصف body (بلا قصّ سطر على بطاقات المحور)
- الصلاة: أسماء/أوقات h3، العدّاد display
- الدروس: عنوان البطاقة h3
- قرآن hub: إحصاءات display، بطاقات h3 + body-sm
- تنقّل سفلي: تسمية caption (0.8125rem)، أيقونة كما هي
- حقول إدخال: `max(1rem, 16px)`

## بوابات

- `pnpm run test:typography` → `scripts/verify-typography-scale.mjs`
- `pnpm run lint:hard-font-px` → يمنع `text-[Npx]` تحت 13
- مسح حي اختياري: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:24216 pnpm run test:typography`

## ملاحظة عن خط الثلث للترويسة

مهمة منفصلة (`feat/header-thuluth-font`) — غير مشمولة هنا. عنوان «المجلس العلمي» يبقى على `--font-app` حتى يُوفَّر `assets-src/fonts/thuluth.ttf`.
