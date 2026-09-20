# Sunnah Visual Language (SVL) — أساس PR-1

**الحالة:** موجة 1 / 10 — جرد + رموز + primitives فقط.  
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

## جرد بصري (PR-1)

| مشكلة | دليل حالي | موجة الإصلاح |
|---|---|---|
| شريط أخضر جانبي على البطاقات | `green-surface-system.css` + ~28 ملف CSS بـ `border-inline-start: 3–4px` | **PR-2** |
| Card داخل Card | `FeatureCard` يلف `AppCard` داخل رابط بطاقة | PR-2 / ترحيل مكوّنات |
| حدود متراكبة / ظل+حد ثقيل | `box-shadow` + `border` + accent strip معًا في Green Surface | PR-2 |
| فراغ بعد إزالة حدود | صفحات تعتمد على الإطار بدل المساحة | PR-4…5 |
| ضعف فصل عنوان/متن/مراجع | جزئيًا عبر `reading-prose-system` (#2148) | PR-3 يعزّز الرؤوس |
| اختلاف بطاقات الأقسام | طبقات متعددة: soft-card / hub / gs-surface / rsc | PR-2 |
| قائمة جانبية مسطحة | m2030 navigation | PR-6 |
| تداخل أزرار عائمة | final-release / floating | PR-14 مسار PR-6/7 |
| خلفيات فارغة بلا بنية خفيفة | لا نمط Hero موحّد | primitives هنا + تطبيق PR-4 |

**استثناءات وظيفية للشرائط (تُبقى حتى مراجعة صريحة):** اقتباس/دليل (`blockquote`، `kx-block--definition`، حالة admin/hadith grading) — ليست زخرفة بطاقة عامة.

**مصحف:** خارج النطاق تمامًا (نص + هندسة صفحات).

## طبقات الأسطح (4 فقط)

| طبقة | رمز | استخدام |
|---|---|---|
| App Background | `--svl-background-primary` | جذر التطبيق |
| Section Surface | `--svl-background-secondary` / `--svl-surface-section` | أحزمة أقسام |
| Card Surface | `--svl-surface-primary` | بطاقات تفاعل |
| Elevated | `--svl-surface-elevated` | Sheet / Dialog فقط |

قواعد: Card = حد خفيف **أو** ظل خفيف (لا الاثنين بثقل) · لا عمود جانبي زخرفي على `.svl-*`.

## عائلة الحواف

| اسم | رمز | استخدام |
|---|---|---|
| Small | `--svl-radius-sm` | أزرار / chips |
| Medium | `--svl-radius-md` | بطاقات |
| Large | `--svl-radius-lg` | أقسام / sheets |
| Capsule | `--svl-radius-pill` | أزرار محددة فقط |

## زخارف معتمدة (primitives)

| نوع | مكوّن / صنف | قواعد |
|---|---|---|
| Corner Motif | `GeometricMotif` / `.svl-motif--corner` | زاوية Hero/Section فقط · شفافية منخفضة |
| Section Divider | `GeometricDivider` / `.svl-divider` | بين أقسام رئيسية فقط |
| Background Pattern | `.svl-pattern` | Hero / Empty · ليس خلف نثر طويل |
| Geometric Medallion | `IconMedallion` / `.svl-medallion` | Headers / Empty · لا لكل بطاقة |
| Header Ornament | `.svl-header-ornament` | بدل خط أخضر متكرر تحت العناوين المهمة |
| Quote Ornament | `.svl-quote` | اقتباسات منهجية/شرعية · لا حول كل فقرة |

كل زخرفة: `pointer-events: none` · `aria-hidden` · بلا animation · احترام `prefers-reduced-motion`.

## ملفات الموجة

- `src/styles/sunnah-visual-language.css` — رموز + أصناف طبقات/زخارف
- `src/components/design-system/geometry/*` — primitives
- `src/lib/__tests__/sunnah-visual-language-gate.test.ts`
- تحميل مؤجّل من `main.tsx` (خارج CSS الحرج)

## موجات لاحقة (لا تُنفَّذ هنا)

PR-2 شرائط+بطاقات · PR-3 طباعة/رؤوس · PR-4 Home/Quran Hub · … · PR-10 انحدار بصري.
