# توحيد رموز التصميم — لقطات قبل/بعد

صفحات المقارنة (viewport 1280×900):

| الصفحة | المسار | قبل | بعد |
|---|---|---|---|
| الرئيسية | `/` | `before/home.png` | `after/home.png` |
| المصحف | `/mushaf` | `before/mushaf.png` | `after/mushaf.png` |
| المكتبة | `/library` | `before/library.png` | `after/library.png` |
| الفتاوى/الأحكام | `/rulings` | `before/rulings.png` | `after/rulings.png` |
| الإعدادات | `/settings` | `before/settings.png` | `after/settings.png` |

## مصدر الحقيقة بعد التوحيد

`src/app/styles/theme.css` — `@theme` + `:root` → `--mj-*` ومنها:

| الرمز | قيمة فاتحة متوقعة |
|---|---|
| `--background` / `--mj-bg` | `#F2F4F3` |
| `--primary` / `--mj-brand` | `#1F7A5A` |
| `--font-display` | Alexandria / IBM Plex Sans Arabic |

أُزيلت إعادة التعريفات المتعارضة من `brand-v4.css` و`index.css` و`theme-aliases.css`، وصُحّح `final-release.css` ليتتبع `--mj-*`.

## التحقق

- بوابة `test:color-contrast-gate` خضراء (58 تأكيد انحدار).
- لقطات قبل = بناء CSS من `origin/main`؛ بعد = هذا الفرع؛ الخصوصية مُغلقة والتيكر مخفي.
- فرق البكسل (ثابت): المصحف 0٪؛ الباقي ≈0.7–1.5٪ (عناصر ديناميكية/تنعيم خطوط)، بلا انزياح لوحة.
