# تقرير إصلاح الطبقات البصرية والألوان

## أين كانت المشكلة؟
- تعارض طبقات: هيرو الفقه الأخضر الداكن مع أنماط `ve-hero`/نصوص فاتحة-داكنة متضاربة.
- في الوضع الليلي كان `--text-on-primary` ينعكس إلى لون داكن (مناسب لأزرار primary الفاتحة) فيُطبَّق خطأً على هيرو العلامة → نص شبه مخفي فوق الأخضر (خصوصًا كتاب الطهارة).
- حدود قاسية وبطاقات بلا تمييز طبقي واضح عن `--bg-app`.
- فلاتر الدروس: chips ممتدة/مربعات فارغة بسبب `flex` خاطئ.
- القائمة الجانبية: خلفية بيضاء ميتة وعنصر نشط ثقيل الظل.

## التوكنات (مركزية)
ملف: `src/styles/semantic-layer-tokens.css`

| Token | الغرض |
|---|---|
| `--bg-app` | خلفية عامة هادئة |
| `--surface` / `--surface-muted` / `--surface-elevated` / `--surface-tinted` | طبقات البطاقات |
| `--surface-warn` / `--surface-info` / `--surface-danger` | تنبيه/دليل/خطر ناعم |
| `--primary` / `--primary-strong` / `--primary-soft` / `--accent` | العلامة |
| `--text-main` / `--text-muted` / `--text-faint` | نصوص عامة |
| `--text-on-primary` / `--text-on-primary-muted` | نص فوق زر primary (ينعكس ليلاً) |
| `--text-on-brand` / `--text-on-brand-muted` | نص فوق هيرو أخضر داكن (أبيض دائمًا) |
| `--border-soft` / `--border-strong` / `--shadow-soft` | حدود وظلال ناعمة |

طبقة إصلاح نهائية: `src/styles/visual-layer-contrast-fix.css` (تُحمَّل بعد `theme-aliases.css`).

## الصفحات/المكوّنات المصلحة
- الفقه: كتاب الطهارة + أبواب (هيرو، بطاقات، أدلة/تنبيهات/مصادر)
- الدروس: شريط chips أفقي ملتف بلا فراغات
- القائمة الجانبية
- الهيدر/البحث (placeholder أوضح)
- الإعجاز (حدود ناعمة مربوطة بالتوكنات)
- عامة: بطاقات/أزرار أساسية/شارات

## نتائج الفحص
- `pnpm run lint` ✅
- `pnpm run typecheck` ✅
- `pnpm run verify:content` ✅
- `pnpm run build` ✅
- Playwright: iPhone 390×844 + Desktop 1280×900 · نهاري/ليلي
  - الرئيسية، الدروس، الفقه، كتاب الطهارة، باب المياه، الإعجاز، القائمة الجانبية
- قياس CSS لهيرو الطهارة: `bg rgb(10,61,46)` + عنوان `rgb(255,255,255)` في النهاري والليلي.

## لقطات
مجلد: `reports/ui-contrast-fix/`  
أبرزها: `verify-dark-taharah.png`, `iphone-light-lessons.png`, `iphone-light-drawer.png`, `iphone-light-fiqh-miyah.png`.
