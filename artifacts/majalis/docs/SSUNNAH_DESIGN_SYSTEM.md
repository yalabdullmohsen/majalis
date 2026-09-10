# نظام تصميم سُنّة — المستويات والاستخدام

مرجع مختصر لتثبيت الواجهة ومنع القيم المباشرة. التفاصيل التاريخية: `SSUNNAH_TYPOGRAPHY_FOUNDATION.md`.

## المستويات (من المصدر إلى الشاشة)

| المستوى | ماذا | أين |
|---|---|---|
| **1 — المصدر** | قيم حقيقية (ألوان، أحجام، مسافات، حواف) | `src/app/styles/theme.css` فقط |
| **2 — الواجهة** | أسماء `--ss-*` تشير لـ `var(--mj-*)` بلا هكس | `src/styles/ssunnah-theme-api.css` + `src/lib/ssunnah-theme.ts` |
| **3 — المكوّنات** | أدوار نص دلالية + بطاقات/أزرار | `src/components/design-system/**` |
| **4 — الشاشات** | تركيب فقط؛ لا `fontSize`/`#hex`/`text-[Npx]` مباشرة | `src/pages/**` · `src/views/**` |

```
theme.css  →  --ss-* API  →  SsText / ScreenTitle / …  →  الشاشة
```

## النص — اختر الدور لا الحجم

| احتياج | مكوّن |
|---|---|
| عنوان شاشة | `ScreenTitle` |
| عنوان قسم | `SectionTitle` |
| عنوان بطاقة | `CardTitle` |
| متن | `BodyText` |
| نص شرعي (عرض) | `ScriptureText` |
| شرح / داعم / تسمية / تعليق | `ExplanationText` · `SupportingText` · `LabelText` · `Caption` |
| عام | `SsText variant="…"` |

```tsx
import { ScreenTitle, BodyText } from "@/components/design-system";
// tone: default | muted | brand | onBrand
```

لا تمسّ نص القرآن/التشكيل — المكوّنات للغلاف والعرض فقط. المصحف (`/mushaf`) مسار عرض خاص بأحجام ديناميكية موثّقة ومستثنى من قيود الحجم الحرفي.

## الألوان والسطح

- استخدم `--ss-color-*` / `--mj-*` / أصناف السطح الموجودة.
- ممنوع في الشاشات الجديدة: `#…` و`rgb()` داخل `style`، و`text-black` / `text-white` / `bg-white` / `bg-black` (بما فيها `dark:`).

## الحماية من الرجوع

1. **ESLint** — `designSystemLockRules` في `eslint.config.js` (خطأ على القوالب المهاجَرة + pages/views).
2. **Allowlist** — `eslint-ds-legacy-allowlist.json` لدين الهجرة؛ يُقلَّص مع دفعات Typography 2–7.
3. **تغطية** — `node scripts/ds-coverage-report.mjs --assert` → `docs/ds-coverage-report.json`.
4. **لقطات** — PNG في `tests/snapshots/ui-regression/` + بنية مصدرية `tests/snapshots/ds-core-screens.structure.json`.
5. **بوابة** — `ssunnah-design-system-lockdown-gate.test.ts` ضمن `test:typography-readable`.

## ماذا تفعل عند لمس شاشة قديمة؟

1. استبدل العناوين والنصوص بمكوّنات المستوى 3.
2. انقل أي لون/حجم جديد إلى `theme.css` ثم استهلكه عبر `--ss-*`.
3. احذف الملف من `eslint-ds-legacy-allowlist.json` إن أصبح نظيفًا.
4. شغّل `pnpm run lint` و`pnpm run test:typography-readable`.
