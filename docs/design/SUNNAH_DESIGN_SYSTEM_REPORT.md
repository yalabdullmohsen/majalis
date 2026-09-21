# Sunnah Design System — تقرير التوحيد (PR-3)

**تاريخ:** 2026-09-21  
**الحالة:** Consolidation wave · ليس هجرة جماعية لكل الشاشات

## مصدر الحقيقة

| المستوى | الملف | دور |
|---|---|---|
| 1 — حرفي | `artifacts/majalis/src/app/styles/theme.css` | قيم الألوان والمسافات والحواف؛ أسماء `--sunnah-*` |
| 2 — جسر | `artifacts/majalis/src/styles/ssunnah-theme-api.css` + `src/lib/ssunnah-theme.ts` | استهلاك `--ss-*` / `SS_COLOR` بلا hex في المكوّنات |
| 3 — مكوّنات | `src/components/design-system/**` | FeatureCard · ContentCard · AppCard · نص دلالي · Geometry |
| 4 — شاشات | pages/views | تركيب فقط؛ الهجرة تدريجية (PR-4/PR-5) |

## لوحة الاستقرار

| اسم | رمز | ملاحظة |
|---|---|---|
| Warm Ivory | `--sunnah-ivory` → `--ss-color-ivory` | خلفية التطبيق |
| Layered Ivory | `--sunnah-ivory-surface` / `--sunnah-ivory-muted` | أسطح البطاقات |
| Deep Emerald | `--sunnah-emerald` | Primary |
| Quran Gold | `--sunnah-quran-gold` = **`#C9A82E`** | موحّد مع مصحف مطبوع |
| Rich Ink | `--sunnah-ink` | نص نهاري |
| Night bg / text / gold | `--sunnah-night-*` | ليلي |

## Geometry

`sunnah-geometry-system.css` + `components/design-system/geometry/*`  
قواعد: `pointer-events: none` · `aria-hidden` · بلا animation مستمرة · ذهب عبر `--sunnah-quran-gold`.

## البطاقات

- `AppCard` / `FeatureCard` / `ContentCard` — سطح واحد، بلا عمود أخضر جانبي.
- لا hex داخل `design-system/**` (بوابة consolidation).

## خارج هذه الموجة

- استبدال hex في الرئيسية/مركز القرآن/الأنبياء → PR-4
- بقية الأقسام → PR-5
- حذف brand-v4 / m2030 كحزم هوية منافسة → PR-7

## بوابة

`src/lib/__tests__/sunnah-design-system-consolidation-gate.test.ts`
