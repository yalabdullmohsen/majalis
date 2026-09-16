# CONTENT_INVENTORY — سُنّة (جولة 4)

تاريخ الجرد: 2026-09-16  
الفرع: `cursor/content-quality-completeness-r4`  
النطاق: `artifacts/majalis` فقط  
الأساس: `origin/main` @ 968863cb8 (بعد #2070 و#2068 و#2069)

## مبدأ

لا يُختَرَع محتوى شرعي. الجودة والتوثيق مقدَّمان على ملء الفراغ.  
`IMPLEMENTATION_FROZEN` بعد اكتمال P0/P1 هذه الجولة.

## خريطة الأقسام (جرد r4)

| القسم | Route | مصدر | قبل r4 | بعد r4 | إجراء |
|---|---|---|---|---|---|
| العلماء/معلمون | `/teachers` | seed | **404 إنتاج** | SPA rewrite → index | P0✓ |
| شيوخ قديم | `/sheikhs` | redirect | → `/lessons` | → `/teachers` | P0✓ |
| دليل الصلاة | `/salah-guide` | SalahGuideView | نصوص مقطوعة | مكتملة من نفس الملف | P0✓ |
| الأخلاق | `/akhlaq` | AkhlaqPage | ملخصات مقطوعة | مكتملة | P0✓ |
| دورات | seeds | annual-courses | رحبية مقطوعة | مكتملة من body | P0✓ |
| أصول الفقه | usul topics | fiqh-usul-topics | «هيكل…» | ملخصات مرتبطة بمتون مذكورة | P1✓ |
| الرئيسية | `/` | catalog | «٨٠ سنة» | «٨٠ سُنّة» | P1✓ |
| المساعد | `/assistant` | AssistantGate | صياغة ضعيفة | أوضح | P1✓ |
| تراجم مشايخ | sheikhs-seed | seed | بقايا «والتربوي» | منظّفة | P1✓ |
| Open Platform | API | config | مورد قرارات | محذوف | P1✓ |
| إشعارات تعلم | notifications | | «قرار فقهي» | محذوف | P1✓ |
| نشر معرفة | knowledge-engine | | ينشر council | متوقف | P1✓ |
| البحث الموحّد | scholarly | | خريطة fiqh_decisions | محظور | P1✓ |
| فقه عام / مجمع | `/fiqh` / redirect | | منظّف r3 | يبقى | — |
| القرآن/مصحف | QPC | | مقفول | مقفول | لا تعديل |
| بقية الأقسام | انظر r3 | | مكتمل/جزئي موثّق | كما r3 | فجوات في GAPS |

## Routes عامة (عيّنة من 364 نمطًا في AppRoutes)

الرئيسية، قرآن، مصحف، تفسير، دروس، معلمون، بحث، حديث، أذكار، صلاة، قبلة، فوائد، إعجاز، تاريخ، سيرة، أنبياء، فرق، إدارة، خطأ، SEO…

## بوابات

- `test:fiqh-council-completeness` (موسّع r4: vercel teachers + open-platform + notifications)
