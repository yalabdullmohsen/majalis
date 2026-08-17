# تشخيص انحدار ملاءمة خط المصحف

تاريخ: 2026-08-17  
الصفحات الشاهدة: ٢، ٣، ٥ (و١) — خط عملاق، أسطر متراكبة، اقتطاع أفقي باقٍ.

## ماذا فحصنا في المصدر (قبل الإصلاح)

| نقطة | النتيجة |
|---|---|
| `document.fonts.check()` قبل `canvas.measureText` | **غير مستدعى**. `waitPageFont` كان `load('1em …')` ثم `ready` ثم يقيس حتى لو فشل التحميل. |
| خط الصفحة نفسها (`qpc-v2-pN`) | `useQpcPageFont` يعيد العائلة **مع اقتباس CSS** (`"qpc-v2-p2"`). القياس كان `ctx.font = \`${mid}px "${family}"\`` → `24px ""qpc-v2-p2""` وهو واصف باطل → **قياس بالخط الاحتياطي الأضيق**. |
| سقف الصفحتين ١–٢ | `fitPageFontSize(..., opening ? 56 : 40)` — أوسع من أي سطر مصحف مقروء. |
| قيد الارتفاع | **غائب**. البحث الثنائي على العرض فقط. `line-height: 1.32` ثابت نسبيًا لكن الحجم المنفجر يملأ الخانة ويتراكب. |
| التخزين | `mushaf-fitPageFontSize-v1` — قيم ضخمة تُعاد لكل زائر بعد أول قياس معطوب. |
| `overflow` على المتن | `.mm-page__body { overflow: visible }` و`.mm-page-shell { overflow-x: visible }` — الحبر يخرج من الإطار حتى بعد فشل الحساب. |

## ماذا يعني `fonts.check() === false` هنا

حتى بعد `FontFace.load()` وإضافة الوجه إلى `document.fonts`، **قياس Canvas بواصف خط باطل لا يستخدم QPC أبدًا**. النتيجة العملية مطابقة لفحص `check` الخاطئ: عرض مُقدَّر أضيق → حجم مختار 40–56px → أربع كلمات تملأ العرض → فيض واقتطاع.

هذا هو عطل القياس قبل تحميل/استخدام **خط الصفحة نفسها**، لا عطل بيانات التخطيط.

## الإصلاح (v2)

1. تطبيع اسم العائلة قبل Canvas و`fonts.check('16px "qpc-v2-pN"')` **إلزامي** قبل أي `measureText`.
2. سقف مطلق 12–34px. قيد ارتفاع: `floor(blockHeight / lineCount / 1.75)`.
3. `line-height: 1.75em` مشتق من الحجم. البسملة `var(--mm-qpc-size)`.
4. `overflow-x: clip` على الصفحة والمتن والخانة.
5. نزول تدريجي بعد الرسم إن بقي `scrollWidth > clientWidth`.
6. `ResizeObserver` + `document.fonts.loadingdone`. مفتاح تخزين `mushaf-fitPageFontSize-v2`.

قياس الرسم الفعلي (لا بيانات JSON وحدها) في `scripts/mushaf-madinah/measure.mjs`: `fontCheck` · حجم 12–34 · صفر فيض · صفر تراكب أسطر.
