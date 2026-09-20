# Sunnah Visual Language (SVL)

**الحالة:** موجة 4 / 10 — Spacing Scale + إيقاع فراغ موحّد.  
**لا إعلان:** `SUNNAH_VISUAL_EXCELLENCE_COMPLETE` حتى اكتمال كل الموجات والنشر.

## المبادئ

1. المحتوى أولًا.
2. الزخرفة تدعم ولا تنافس.
3. نقطة تركيز واحدة لكل شاشة.
4. Accent بصري قوي واحد كحد أقصى.
5. لا تكرار زخرفة على كل بطاقة.
6. الإطار ليس الحل الوحيد للتنظيم.
7. المساحة + المحاذاة + التسلسل الطباعي أساس التنظيم.

السمات: عربية · هادئة · معاصرة · تعليمية · موثوقة · هندسية · غير متكلفة · مناسبة للقراءة الطويلة.

## جرد بصري

| مشكلة | دليل حالي | موجة الإصلاح |
|---|---|---|
| شريط أخضر جانبي على البطاقات | `green-surface-system.css` + ~28 ملف CSS بـ `border-inline-start: 3–4px` | **PR-2 ✅** |
| عمود جانبي على هيرو الأقسام | `page-hero-mj--bleed` كان `4px` | **PR-3 ✅** |
| خط أخضر قصير تحت العناوين | `::after` على lobby / quran-hub / sections-hub | **PR-3 ✅** → `--svl-header-ornament-bg` |
| Card داخل Card | `FeatureCard` يلف `AppCard` داخل رابط بطاقة | ترحيل لاحق / PR-5 |
| فراغ بعد إزالة حدود / هيرو متمدد | padding/margin غير موحّدة · `min-height` زخرفي | **PR-4 ✅** |
| ضعف فصل عنوان/متن/مراجع | `reading-prose-system` + رؤوس SVL | **PR-3 ✅** أساس الرؤوس |
| اختلاف بطاقات الأقسام | طبقات متعددة | PR-2 + ترحيل |
| قائمة جانبية مسطحة | m2030 navigation | PR-6 |
| تداخل أزرار عائمة | final-release / floating | PR-6/7 |
| خلفيات فارغة بلا بنية خفيفة | primitives + PageHero motif | PR-1 + PR-3 · تطبيق أوسع لاحقًا |

**استثناءات وظيفية للشرائط:** اقتباس/دليل (`blockquote`، `kx-block--definition`، حالة admin/hadith grading).

**مصحف:** خارج النطاق تمامًا.

## طبقات الأسطح (4 فقط)

| طبقة | رمز | استخدام |
|---|---|---|
| App Background | `--svl-background-primary` | جذر التطبيق |
| Section Surface | `--svl-background-secondary` / `--svl-surface-section` | أحزمة أقسام |
| Card Surface | `--svl-surface-primary` | بطاقات تفاعل |
| Elevated | `--svl-surface-elevated` | Sheet / Dialog فقط |

## عائلة الحواف

| اسم | رمز | استخدام |
|---|---|---|
| Small | `--svl-radius-sm` | أزرار / chips |
| Medium | `--svl-radius-md` | بطاقات |
| Large | `--svl-radius-lg` | أقسام / sheets |
| Capsule | `--svl-radius-pill` | أزرار محددة فقط |

## مقياس المسافات (PR-4)

مقياس واحد (أساس 4px). ممنوع أرقام عشوائية لعناصر من نفس الدور.

| اسم | رمز | قيمة |
|---|---|---|
| XS | `--svl-space-xs` | 0.25rem (4) |
| S | `--svl-space-s` | 0.5rem (8) |
| M | `--svl-space-m` | 0.75rem (12) |
| L | `--svl-space-l` | 1rem (16) |
| XL | `--svl-space-xl` | 1.5rem (24) |
| 8 | `--svl-space-8` | 2rem (32) |

أدوار:

| دور | رمز |
|---|---|
| Section stack | `--svl-space-section` → M |
| Card padding | `--svl-space-card` → L |
| Card / grid gap | `--svl-space-card-gap` → M |
| List gap | `--svl-space-list-gap` → S |
| Title → body | `--svl-space-title-to-body` → S |
| Hero padding | `--svl-space-hero` |

تطبيق الإيقاع: `.svl-page-header` · `.svl-card-surface` · `.svl-section-header` · شبكات lobby/hub · `page-shell` · `details` accordion (لا حجز فراغ للمخفي).

ملفات مرتبطة: `page-hero.css` · `page-shell.css` · `modern-section-shell.css` · `home-brand-title.css` · `sections-calm-polish.css` · `ssunnah-ux-polish.css`.

## مقياس الطباعة (PR-3)

| دور | رمز |
|---|---|
| Display | `--svl-type-display` |
| Page Title | `--svl-type-page-title` |
| Section Title | `--svl-type-section-title` |
| Card Title | `--svl-type-card-title` |
| Body Large | `--svl-type-body-lg` |
| Body | `--svl-type-body` |
| Supporting | `--svl-type-supporting` |
| Metadata | `--svl-type-metadata` |
| Caption | `--svl-type-caption` |

جسر إلى `reading-prose-system` / `--ss-type-*`. فقرات طويلة: `text-align: start` · مقياس `--svl-read-measure`.

## زخارف معتمدة

| نوع | مكوّن / صنف | قواعد |
|---|---|---|
| Corner Motif | `GeometricMotif` | زاوية Hero/Section · شفافية منخفضة |
| Section Divider | `GeometricDivider` | بين أقسام رئيسية فقط |
| Background Pattern | `.svl-pattern` | Hero / Empty · ليس خلف نثر طويل |
| Geometric Medallion | `IconMedallion` | Headers / Empty |
| Header Ornament | `HeaderOrnament` / `.svl-header-ornament` | بدل الخط الأخضر القصير |
| Quote Ornament | `.svl-quote` | اقتباسات منهجية · لا حول كل فقرة |

كل زخرفة: `pointer-events: none` · `aria-hidden` · بلا animation · `prefers-reduced-motion`.

## رؤوس موحّدة (PR-3)

| مكوّن | دور |
|---|---|
| `PageHero` + `PageHeader` | رأس صفحة · `svl-page-header` · ornament + corner motif |
| `CompactSectionHeader` / `SectionHeader` | رأس قسم مضغوط |
| `SvlSectionHeader` | رأس قسم خفيف بلا سطح بطاقة · medallion اختياري |

محذوف من الهيرو الداخلي: `border-inline-start: 4px` أخضر.

## ملفات الموجات

- PR-1: `sunnah-visual-language.css` · geometry primitives · gate
- PR-2: `card-decorative-strip-cleanup.css` · إزالة شرائط البطاقات
- PR-3: رموز طباعة · `HeaderOrnament` · رؤوس · توحيد `::after` · إزالة شريط الهيرو
- PR-4: Spacing Scale · إيقاع Hero/Shell/Lobby/Cards/Accordion

## موجات لاحقة

PR-5 أقسام علمية · … · PR-10 انحدار بصري.
