# Legacy Visual Elements To Remove

> Majlisilm 2030 — مرحلة الكشف قبل التنفيذ. أي عنصر أدناه يُزال أو يُستبدل بالكامل.

## 1. لوحة الألوان القديمة

| قيمة | دور قديم | قرار |
|---|---|---|
| `#143F35` / `#052E16` | Forest primary | إزالة — استبدال بـ Midnight Emerald |
| `#226A56` / `#1F5A45` / `#2F6B55` | Emerald interactive | إزالة — استبدال بـ Teal Glow |
| `#FAFAF8` / `#F4F4F1` / `#FEFDF9` / `#F7F4EC` | Cream parchment | إزالة — استبدال بـ Porcelain Ivory |
| `#B8963F` / `#9C7C41` كثيف | Manuscript gold | تقليص شديد — Soft Gold محدود فقط |
| `#f5f5dc` | Flutter beige shell | عزل/تجاهل من هوية الويب |
| تدرّج `#0f3326→#1f5a45` | Hero الرئيسية | إزالة بالكامل |

## 2. أنظمة الرموز المتوازية

إزالة السلطة البصرية من: `--elite-*` (قيم صلبة في elite-2026)، `--msk-*`، `--majalis-*`، `--m26-*`، `--mj-*`، `--v2-*`، `--ds-*` اللونية، `--txt-*`، `--igd-*`.

الإبقاء التقني: aliases فقط تشير إلى رموز M2030 — بلا قيم هوية قديمة.

## 3. أشكال البطاقات

- `.ds-card` / `.card-v2` / `.ui-card` / `[class$="-card"]` — زوايا 16–20px + ظل رفع + حدود كريمية
- شريط ذهب/أخضر جانبي `.card-v2--accent-*`
- بطاقات الوصول السريع `.hp-quick-card` المستطيلة

→ استبدال بـ cut-corner / tiles هندسية / أسطح Sage بلا رفع مبالغ.

## 4. الأزرار

- `.ds-btn--primary` / `.btn--primary` / `.hpv4-hero__cta-*` (كريمي على أخضر غابة)
- حبوب `border-radius: 9999px` كافتراضي

→ أزرار هندسية حادة الزوايا نسبيًا + Teal Glow للتفاعلي.

## 5. Navigation

- `.navbar-v3` + `dark-emerald-menus.css` (شريط أخضر متدرّج)
- `.bottom-nav--v2` زجاج ضبابي + غسلة خضراء
- `.top-section-bar__tab` حبوب زجاجية
- SideNav header `#12362a→#0f4a31`
- تبويب «حسابي» في الشريط السفلي → يُستبدل بـ «التعلّم»

## 6. خلفيات وزخارف

- `patterns.css` — حقن نجوم على 40+ hero
- `.home-hero-pattern` / corner SVG في HomePage
- `IslamicDecorations` / `GeometricPattern` / `corner-ornament.svg` كهوية افتراضية
- `body { background: cream !important }` من elite

→ نمط هندسي خفيف في Hero فقط + فراغات Porcelain/Midnight.

## 7. مسافات / radius / ظلال

- ظلال زمردية متعددة الطبقات `--e-3` رفع hover
- `--r-lg: 1.25rem` بطاقات ناعمة
- `backdrop-filter: blur(16–24px)` كروم زجاجي

→ مسافات أوضح، زوايا أهدأ، ظل مسطّح تقريبًا، مؤشر نشط هندسي.

## 8. صفحات بهوية قديمة (أولوية إعادة البناء)

1. الرئيسية (`HomePage` + `home.css`)
2. Chrome العام (NavBar / BottomNav / TopSectionBar / More)
3. الصلاة (`prayer-times.css`)
4. القرآن / المصحف (قائمة + صفحة قريبًا)
5. الدروس / الاختبارات
6. حالات Loading / Empty / Error

## ملفات تُسحب من المسار الحرج

| ملف | سبب |
|---|---|
| `elite-2026.css` | أكبر جلد قديم + `!important` |
| `patterns.css` | زخارف بطولية قديمة |
| `majalis-v2.css` | card-v2 + navbar زجاجي |
| `modern-2026.css` | نظام رموز موازٍ |

## تعريف النجاح لهذه القائمة

لا يبقى بعد التنفيذ: نفس الأخضر الغابة، نفس الكريمي، نفس بطاقات الرفع، نفس Hero، نفس الإحساس بالشريط السفلي.
