# جاهزية الإطلاق — ١٢ أغسطس ٢٠٢٦

## ١. قبل/بعد (مقيس حتى الآن)

| مقياس | قبل | بعد (هذه الدفعة) |
|--------|-----|-------------------|
| `/library` → `/` | نعم | **لا** — LibraryPage (PR #1073) |
| `/updates` → `/` | نعم | **لا** |
| `/knowledge-graph` → `/` | نعم | **لا** |
| `/more` 404 | نعم | **صفحة حقيقية** |
| `/prayer` | مفقود | → `/prayer-times` |
| `/quran/mushaf` | مفقود | → `/mushaf` |
| شريط خطوط المصحف في الإنتاج | يظهر | **مخفي** إلا DEV (PR #1074) |
| مصحف بسيط بلا أرابيسك | زخارف | PR #1072 قيد الدمج |
| JS gzip رئيسي | ~131 KB | كما هو |
| CSS حرج gzip | ~65 KB | فوق هدف 60 KB |

## ٢. PRs
| PR | الغرض | حالة |
|----|--------|------|
| #1072 | مصحف minimal flow | auto-merge |
| #1073 | مسارات حرجة + تدقيق ٠ | auto-merge |
| #1074 | إخفاء شريط الخطوط | auto-merge |
| #893 | ترويسة | قديم — مراجعة |

## ٣. هل جاهز للإطلاق؟
**لا** — لأسباب مقيسة:
1. مصحف #1072 لم يُدمَج بعد على `main`.
2. CSS حرج فوق الميزانية؛ LCP/TTI غير مقيسة.
3. مراحل البحث الموحّد / SEO الكامل / a11y الكامل / ContentTrustBox / قواعد `.cursor` لم تُغلق.
4. Sitemap ما زال يحتاج تنظيفاً بعد استقرار المسارات.

## ٤. أوامر
```bash
pnpm --filter @workspace/majalis run lint
pnpm run typecheck
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
pnpm --filter @workspace/majalis run test:mushaf-gates
pnpm --filter @workspace/majalis run test:nav-active
```

## ٥. متبقٍ مرتّب
1. دمج #1072–#1074 والتحقق من الإنتاج
2. تباين/لمس WCAG
3. أداء CSS + Lighthouse
4. بحث موحّد + SEO sitemap
5. حوكمة محتوى + أمان CSP
6. قواعد Cursor `.mdc`
