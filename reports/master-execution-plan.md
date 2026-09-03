# خطة التنفيذ المركزية — سُنّة / Ssunnah.com

**التاريخ:** 2026-09-01  
**النطاق الحي:** https://www.ssunnah.com  
**الاسم الرسمي:** سُنّة  
**الفرع النشط:** `cursor/seo-indexing-og` (SEO + orchestration)

---

## ثوابت لا تُمس

| الثابت | السياسة |
|--------|---------|
| الهوية | سُنّة فقط — لا Majlisilm ولا «المجلس العلمي» للمستخدم |
| `/more` | ملغاة — تحويل 301 إلى `/sections` فقط، لا روابط تنقل ولا sitemap |
| المصحف/التفسير | لا تغيير `font-size` / `line-height` / layout للنص القرآني |
| الصفحات الناقصة | شارة واضحة (`قريبًا` / `قيد الإكمال`) — لا إخفاء |
| الأذان/التلاوة | لا إيقاف بسبب الحقوق — `rightsStatus` داخليًا `unknown` إن لزم |
| `/admin` `/internal` `/review` | لا تفعيل في navigation أو sitemap أو search |

**التنقل الرسمي (شريط + prerender):** الرئيسية · الدروس · القرآن · الأذكار · الصلاة · الفقه · البحث

---

## جرد المهام (من الجولات السابقة)

| المهمة | الحالة | ملاحظة |
|--------|--------|--------|
| SEO: sitemap pruning + noindex | 🟡 جاري | `seo-index-policy.mjs`, `check-seo-indexing.js`, أوصاف فريدة، OG per-section |
| SEO: structured data + breadcrumbs | 🟡 جاري | WebApplication، Person للعلماء، ItemList للأقسام |
| SEO: hadith/daif تنبيه | ✅ | banner + no recommendation على الرئيسية |
| CI Queue Optimization | ✅ مدمج | PR #1633 على `main` |
| PWA + iOS trust | ⏸️ مؤجل | stash `pwa-wip-local` — لا يتعارض مع SEO |
| Master regression guard | 🟡 هذه الجولة | `scripts/master-regression-guard.mjs` |
| Quran/Tafsir style isolation | ✅ بوابات موجودة | `mushaf-page-layout-consistency-gate`, `test:mushaf-gates:unit` |
| Feature flags / kill switches | ✅ جزئي | `adhan-audio-remote-config`, nav-visibility |
| XSS / browser security | ✅ بوابات CI | `test:ci-security-gates`, CSP gates |
| Cache / versioning | 🟡 SEO assetVersion | PWA versioning في stash |
| Hydration parity | ✅ gates | `verify:head-shell-gate`, prerender |
| Prayer / Adhan | ✅ | `test:adhan-catalog` + offline packs |
| Quran recitation audio | ✅ | `test:tafsir-audio-map`, recitation providers |
| Lessons automation | ✅ | harvest + intelligence scripts |
| Search quality | ✅ | unified search index + normalize tests |
| Hadith / Fiqh sections | ✅ | corpus gates + takhrij guards |
| Content completion badges | ✅ | `nav-soon-badge`, library `contentStatus` |
| Visual QA / Mobile / E2E | ⏸️ مرحلة 4 | Playwright snapshots — بعد استقرار guard |
| Bundle budget | ✅ | `test:critical-css-budget`, LHCI |

---

## تعارضات محلولة (تُتجاهل الأوامر القديمة)

| أمر/افتراض قديم | القرار |
|-----------------|--------|
| إعادة `/more` كصفحة أو تبويب | ❌ مرفوض — `/sections` فقط |
| إخفاء الصفحات الناقصة | ❌ مرفوض — شارة `قريبًا` |
| noindex للأذان/التلاوة بسبب rights | ❌ مرفوض |
| تفعيل `/review` أو `/internal` | ❌ مرفوض |
| تكبير خط المصحف/التفسير | ❌ مرفوض |
| `official-og.png` موحّد لكل الصفحات | ❌ استُبدل بـ `og-{section}.png` |
| فحص أمن/أداء/PWA في جولة SEO | ❌ خارج النطاق — مسار منفصل |

---

## ترتيب التنفيذ

### المرحلة 1 — حماية الأساس (الآن)

**الهدف:** ثوابت لا تنكسر أثناء أي PR.

| خطوة | أمر الفحص |
|------|-----------|
| Master guard | `pnpm --filter @workspace/majalis run guard:master` |
| SEO indexing | `node scripts/check-seo-indexing.js` |
| الهوية | `pnpm run test:identity` |
| مصحف | `pnpm run test:mushaf-gates:unit` |
| أمن CI | `pnpm run test:ci-security-gates` |

**Backup:** `artifacts/majalis/lib/governance/backup.mjs` (عند تعديل محتوى حرج)

### المرحلة 2 — الوظائف المهمة (بعد merge SEO)

| المجال | أوامر |
|--------|-------|
| أذان | `pnpm run test:adhan-catalog` |
| تلاوة | `pnpm run test:tafsir-audio-map` |
| دروس | `pnpm run test:lessons-domain && pnpm run verify:lesson-automation` |
| بحث | `pnpm run test:unified-search` |
| تفضيلات | `pnpm run test:adhan-settings-prefs` |

### المرحلة 3 — المحتوى

| المجال | أوامر |
|--------|-------|
| حديث | `pnpm run test:hadith-takhrij && pnpm run verify:hadith-integrity` |
| فقه | `pnpm run test:fiqh-hub-routing && pnpm run test:fiqh-books-gates` |
| تدقيق محتوى | `pnpm run test:content-audit-gates && pnpm run audit:feature-readiness` |
| شارات اكتمال | `pnpm run test:section-nav-daily` |

### المرحلة 4 — الجودة

| المجال | أوامر |
|--------|-------|
| CI سريع | `pnpm run verify:ci-fast -- --changed` |
| CI كامل | `pnpm run verify:ci-full` |
| Lighthouse | `pnpm run lighthouse:ci` (اختياري — CI) |
| Playwright | `pnpm exec playwright test tests/01-smoke.spec.ts` |

---

## مخاطر

| خطر | تخفيف |
|-----|-------|
| SEO prerender ضخم (958 صفحة) | `verify:changed` قبل push |
| `/more` روابط متبقية | `guard:master` يفشل صراحة |
| dual `@types/react` | `skipLibCheck` — لا override |
| build طويل (~5–10 د) | `verify:master` = guard + build فقط عند الحاجة |
| stash PWA يتعارض | فرع منفصل لاحقًا من `main` |

---

## أوامر سريعة

```bash
cd "$(git rev-parse --show-toplevel)"
pnpm --filter @workspace/majalis run guard:master
pnpm --filter @workspace/majalis run verify:master   # guard + build
pnpm run verify:ci-fast -- --changed               # قبل push
pnpm run verify:ci-full                            # قبل merge
```

---

## معايير إغلاق الدورة

- [ ] `guard:master` = 0 critical, 0 high
- [ ] `pnpm run build` (majalis) ينجح
- [ ] sitemap بلا login/assistant/dashboard/noindex
- [ ] لا `/more` في navigation/sitemap/search
- [ ] OG مختلفة per-section على `/hadith` `/quran-hub` `/`
- [ ] PR واحد Ready → auto-merge → نشر Vercel
