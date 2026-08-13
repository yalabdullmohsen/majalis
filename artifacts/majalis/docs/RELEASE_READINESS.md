# جاهزية الإطلاق — ١٢ أغسطس ٢٠٢٦

## ١. قبل/بعد (مقيس حتى الآن)

| مقياس | قبل | بعد (دفعة المسارات — هذا الفرع) |
|--------|-----|-------------------|
| `/library` → `/` (App + vercel) | نعم | **لا** — `LibraryPage` + حذف تحويل Vercel |
| `/updates` → `/` | نعم | **لا** — `UpdatesPage` |
| `/knowledge-graph` → `/` | نعم | **لا** — `KnowledgeGraphPage` |
| `/more` 404 | نعم | **صفحة حقيقية** + روابط اكتشاف |
| `/prayer` | مفقود | → `/prayer-times` |
| `/quran/mushaf` | مفقود | → `/mushaf` |
| بوابة `critical-routes-no-home-redirect` | لا | **نعم** (App + vercel) |
| native-feel (#1078) | مدمج | محفوظ (`EdgeSwipeBack`/`RouteEnterMotion`) |
| شريط خطوط المصحف في الإنتاج | يظهر | قيد #1074 (لم يُدمَج بعد) |
| JS gzip رئيسي | ~135 KB | كما هو بعد البناء |
| CSS حرج | ~366 KB خام / فوق هدف gzip 60 | فوق الهدف |

## ٢. PRs
| PR | الغرض | حالة |
|----|--------|------|
| هذا الفرع `feat/audit-stabilize-routes` | مسارات حرجة + تدقيق ٠–٢ + وثائق | قيد الدمج |
| #1073 | مسارات (قديم) | يُغلق كمستبدل |
| #1072 | مصحف minimal flow | CI فاشل سابقاً |
| #1074 | إخفاء شريط الخطوط | تعارض مع main |
| #1075 | قواعد `.mdc` | جاهز للمراجعة |
| #893 | ترويسة | قديم |

## ٣. هل جاهز للإطلاق؟
**لا** — لأسباب مقيسة:
1. مراحل المصحف/التباين/الأداء/البحث/SEO/الأمان لم تُغلق.
2. CSS حرج فوق الميزانية؛ LCP/TTI غير مقيسة في هذه الجلسة.
3. شريط تشخيص خطوط المصحف ما زال بلا علم DEV في الإنتاج.

## ٤. أوامر
```bash
pnpm --filter @workspace/majalis run lint
pnpm run typecheck
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
pnpm --filter @workspace/majalis run test:mushaf-gates
pnpm --filter @workspace/majalis run test:nav-active
pnpm --filter @workspace/majalis run test:native-feel
```

## ٥. متبقٍ مرتّب
1. دمج هذه الدفعة والتحقق من الإنتاج (`version.json`)
2. إخفاء شريط خطوط المصحف + بوابات الشارة/الميداليات
3. تباين/لمس WCAG
4. أداء CSS + Lighthouse
5. بحث موحّد + SEO sitemap
6. حوكمة محتوى + أمان CSP
7. قواعد Cursor `.mdc` (#1075)
