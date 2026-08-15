# إصلاح فشل CI / repo-gates — SEO admin privacy

**التاريخ:** 2026-08-15  
**الفرع:** `cursor/ci-seo-admin-exclude-20260815`

## سبب الفشل

فحص `test:seo` (ضمن `test:ci-unit` → `repo-gates`) كان يعامل صفحات `/admin/**` كصفحات عامة من ناحية طول `meta description`، فظهرت عشرات التحذيرات/الضغط على البوابة لوصف قصير في صفحات داخلية غير مفهرسة.

## ملفات SEO التي تعدّلت

| ملف | الدور |
|---|---|
| `scripts/seo-path-class.mjs` | تصنيف `admin/dashboard/internal` + وصف admin الافتراضي |
| `scripts/test-seo.mjs` | استثناء private من P0 لطول الوصف؛ فرض noindex للمسارات الخاصة |
| `scripts/generate-seo.mjs` | فرض noindex + خارج sitemap لـ admin؛ Disallow لـ dashboard/internal |
| `src/lib/seo-privacy.ts` | نفس التصنيف للـruntime SPA |
| `src/lib/seo.ts` | metadata افتراضية لصفحات admin عند التنقّل |
| `src/lib/seo-routes.json` | أوصاف admin الموحّدة + إصلاح 18 وصفًا عامًا قصيرًا |
| `src/lib/__tests__/seo-admin-privacy.test.ts` | بوابة انحدار |
| `public/robots.txt` / `seo-prerender/**` | أُعيد توليدها عبر `generate:seo` |

## تصنيف admin pages

- المسارات: `/admin`, `/admin/*`, `/dashboard`, `/dashboard/*`, `/internal`, `/internal/*`
- `robots`: `noindex,nofollow`
- `sitemap`: `false`
- الوصف الافتراضي: صفحات داخلية لإدارة المحتوى… غير مخصصة للفهرسة
- في فحص SEO: طول الوصف لا يسبب P0 (info فقط إن وُجد)
- P0 يبقى لـ: غياب الوصف في الصفحات العامة، ووصف عام أقصر من 50 حرفًا، وغياب noindex للمسارات المحمية

## النتيجة بعد الإصلاح

| المقياس | قبل (تقريبي من اللوق/الوضع السابق) | بعد |
|---|---|---|
| صفحات مفحوصة | ~909–1087 | 909 |
| P0 | 1 (في اللوق المذكور) / كان 0 محليًا مع تحذيرات admin | **0** |
| تحذيرات | ~40–74 (غالبها admin) | **0** |
| معلومات admin | — | 0 (الأوصاف صارت كافية) |

## التحقق المحلي

- `node scripts/test-seo.mjs` → ✅ P0=0 · warns=0
- `node --import tsx src/lib/__tests__/seo-admin-privacy.test.ts` → ✅
- `pnpm run typecheck` → ✅
- `pnpm run lint` → ✅
- `pnpm run build` → ✅
- ملاحظة: لا يوجد سكربت باسم `audit:seo` أو `repo-gates` في package — بوابة CI هي job `repo-gates` وتشغّل `test:ci-unit` الذي يشمل `test:seo`.

## PR

يُفتح مع هذا الفرع ويُفعَّل auto-merge بعد Verify build.
