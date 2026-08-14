# Design Tokens — المجلس العلمي

مصدر الحقيقة: `src/styles/design-tokens.css` (يُحمَّل بعد `tokens.css`) + لوحة `--mj-*` في `src/app/styles/theme.css`.

## متى تستخدم ماذا؟

| Token | الاستخدام |
|---|---|
| `--bg` | خلفية الصفحة / الشاشة |
| `--surface` | بطاقة، قائمة، صف |
| `--surface-muted` | صفوف متناوبة، شريط أدوات خفيف |
| `--surface-elevated` | نوافذ، قوائم منبثقة، overlays |
| `--surface-brand` | أزرار/أشرطة خضراء فاتحة (نص `--text-on-brand` داكن ليلاً) |
| `--surface-brand-soft` | تمييز خفيف خلف أيقونة |
| `--border` / `--border-strong` | حدود ناعمة / واضحة |
| `--text-primary` | عناوين ونص أساسي |
| `--text-secondary` | وصف، تلميح ثانوي مقروء |
| `--text-muted` | بيانات مساعدة (≥ WCAG على `--bg`) |
| `--text-on-brand` | نص فوق زر أخضر فاتح |
| `--icon-primary` / `--icon-muted` | أيقونات (يفضّل `currentColor`) |
| `--accent` / `--accent-strong` | تمييز وروابط ليلاً |
| `--danger` / `--warning` / `--success` | حالات |

## قواعد إلزامية

1. **خلفية خضراء غامقة أو داكنة → نص أبيض** (`#FFFFFF` / `--text-primary` الليلي). ممنوع أسود فوق أخضر.
2. **زر brand فاتح ليلاً → نص `--on-accent` / `--text-on-brand` الداكن** (`#06231A`).
3. **لا** `text-black` / `bg-white` / `#111` / `#fff` في مكوّنات جديدة — استخدم التوكنز.
4. **SVG:** `fill="currentColor"` / `stroke="currentColor"`.
5. **خطوط:** `--font-xs` … `--font-xl` و`--text-body` من `typography-scale.css` — لا `0.6875rem` عشوائي في الواجهة.

## طباعة عربية

| Token | حجم تقريبي |
|---|---|
| `--font-xs` | ≥13px (تسميات تنقّل سفلي) |
| `--font-sm` | 14px |
| `--font-base` | ~17px (نص أساسي) |
| `--font-md` / `--font-lg` | 18–20px عناوين صغيرة |
| `--font-xl` | 22–26px عناوين صفحة |

`line-height`: `--lh-ui` 1.55 · `--lh-body` 1.7 · `--lh-prose` 1.8.

## فحوصات

- `pnpm run test:contrast` — انحدار تباين حي
- `pnpm run lint:design-tokens` — منع ألوان صلبة شائعة في `src/`

المصحف: لا تغيّر ألوان/خطوط QPC عبر هذه التوكنز؛ كروم الواجهة فقط (مثل نافذة القفز).
