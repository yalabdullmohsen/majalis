# تقرير المهمة — Orchestration + SEO

**التاريخ:** 2026-09-01  
**الفرع:** `cursor/seo-indexing-og`  
**النطاق:** https://www.ssunnah.com

---

## ما أُنجز هذه الجولة

### 1. خطة مركزية
- `reports/master-execution-plan.md` — ترتيب 4 مراحل، تعارضات محلولة، أوامر فحص.

### 2. حارس regression
- `artifacts/majalis/scripts/master-regression-guard.mjs`
- `guard:master` + `verify:master` في `package.json`
- **نتيجة:** Critical 0 · High 0

### 3. SEO (متابعة الجولة السابقة)
- `seo-index-policy.mjs` + `check-seo-indexing.js`
- sitemap: 812 URL — بلا assistant/login/dashboard/knowledge-graph/fiqh-council/live|stats|compare|recommendations
- OG per-section: `og-home`, `og-quran`, `og-lessons`, `og-fiqh`, `og-hadith`, `og-adhkar`, `og-library`, `og-contact`
- أوصاف meta فريدة للصفحات الرئيسية
- WebApplication + Person (علماء) + ItemList (hadith/quran/library)
- hadith/daif: banner تنبيه، لا رابط في index.html noscript

### 4. /more — إزالة من التنقل
- `home-feature-catalog.ts` → `/sections`
- `site-footer-nav.ts` → `/sections`
- `ia-final-structure.ts` → `/sections`
- `HomeExplorePlatform.tsx` → `/sections`
- seo-routes: `/more` sitemap=false + redirect `/sections` (بدون تغيير)

---

## فحوصات

| الأمر | النتيجة |
|-------|---------|
| `guard:master` | ✅ |
| `check-seo-indexing` | ✅ 812 URL |
| `test:seo` | ✅ P0=0 |
| `test:identity` | ✅ (ضمن guard) |
| `lint` + `typecheck` | ✅ |
| `verify:ci --changed` | ✅ (بعد إصلاح font guard) |
| `verify:master` (build) | 🔄 جاري |

---

## مؤجل (لا تعارض)

| المهمة | السبب |
|--------|-------|
| PWA + iOS trust | stash `pwa-wip-local` — فرع منفصل |
| Visual QA / E2E كامل | مرحلة 4 بعد merge |
| Lighthouse production | خارج نطاق guard |

---

## الخطوة التالية

1. إتمام `pnpm run verify:master` (build)
2. commit + push → PR Ready → auto-merge
3. تحقق post-deploy: sitemap + og:image على `/` `/hadith` `/quran-hub`
