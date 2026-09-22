# فهرس المستودع (REPO_INDEX)

حدّث بسطر عند تغيير بنيوي. لا تُعِد بناء الفهرس من الصفر كل جلسة.

جذر Git الفعلي: `/Users/alabdullmohsen/majlis-app` (لا تستخدم `majalis-correct`) · GitHub: `yalabdullmohsen/majalis` · منتج الويب: `artifacts/majalis`.

## حزم artifacts

| مسار | دور | في typecheck/build الجذري؟ |
|---|---|---|
| `artifacts/majalis` | ويب سُنّة (أساسي) | نعم |
| `artifacts/api-server` | Express/Vercel API | منفصل (يُبنى عند الحاجة في CI) |
| `artifacts/majalis-mobile` | Expo | مستبعد |
| `artifacts/majalis-pitch` | تسويق | مستبعد |
| `artifacts/majalis-promo` | تسويق | مستبعد |
| `artifacts/mockup-sandbox` | تجارب | مستبعد |
| `artifacts/mushafi` | أصول/أدوات مصحف | حسب الحاجة |
| `artifacts/supabase` | SQL/سياسات | يدوي/cron |
| `artifacts/majlisilm-flutter` | مهجور | مستبعد من workspace |
| `artifacts/data` / `release-train` | بيانات/قطارات | مساعدة |

## أوامر فعلية (جذر)

- `pnpm run typecheck` / `pnpm run build` — يستبعدان pitch/promo/mockup/mobile/api-server.
- ويب: `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run dev|build|typecheck|lint`
- بوابة PR محلية: `pnpm run verify:pr`
- CI موحّد: `.github/workflows/ci.yml` → **Verify build** + **ci-required** (Skipped في بوابة إلزامية = فشل)
- إعداد مساحة CI: `.github/actions/setup-workspace`

## مداخل التطبيق

- توجيه: `artifacts/majalis/src/App.tsx` (wouter)
- إقلاع: `artifacts/majalis/src/main.tsx`
- صفحات مجال: `src/pages/{quran,worship,fiqh,hadith,lessons,library,account}/`
- صفحات مسطّحة كثيرة: `src/views/*.tsx` (~211)
- مصحف: `src/pages/quran/ui/MushafPageView.tsx` + `src/components/quran/*` + `src/styles/quran.css` / `mushaf-v2.css`
- تنقّل مكاني: `src/lib/spatial-nav.ts` + `src/components/motion/*` + `styles/components/native-feel.css`
- سرد واعٍ (نطق فقط): `src/lib/ai-narration/*` + `src/lib/speech-read-aloud.ts` — واجهة منتج: قصص الأنبياء
- prerender/SEO: سكربتات `artifacts/majalis/scripts/prerender.mjs`, `post-build-seo.mjs`, بوابات `verify:seo-prerender` داخل `package.json` build
- sitemap: يُولَّد ضمن سلسلة `generate:seo` / post-build (لا تحذف مسارًا ظاهرًا فيه بلا حذف المدخل)

## CSS — حرج مستورد من `main.tsx` (مستورد)

`app/styles/theme.css` · `brand-v4.css` · `tokens.css` · `index.css` · `design-system.css` · `instant-interaction.css` · `native-feel.css` · `chunk-recovery-toast.css` · `final-release.css` · `brand-v4-components.css` · `brand-v4-contrast-fixes.css` · `a11y-release-gate.css` · `capacitor-native-ux.css` · `m2030/{foundation,navigation,pages,interactions}.css` · `theme-aliases.css` · `ios-edge.css` · `sunnah-visual-language.css` (مؤجّل) · `m2030/home.css` (مع الرئيسية)

`brand-v4` / `m2030` / `final-release` / SVL = **KEEP** وقت التشغيل حتى هجرة مرحلية — التصنيف الكامل: `docs/release/LEGACY_CLEANUP_REPORT.md` (PR-7).  
`styles/pages/*-legacy.css` = مستوردة كسولًا (ليست SAFE_REMOVE بالاسم). قبل أي حذف CSS: `rg -n "filename.css" artifacts/majalis`.

## رموز / تعارضات شائعة

- Git الصحيح للمستودع = جذر monorepo (ليس داخل `artifacts/majalis` وحده).
- لا `framer-motion` (بوابة `test:native-feel`).
- ازدواج `@types/react` web/mobile معروف؛ `skipLibCheck`؛ لا «تصلح» بحذف UI.
- مسار المصحف الغمري: `isImmersiveChromePath` يخفي الشرائط العامة.
- حالات تفاعل ليلي: `src/styles/interaction-states.css` (DEFAULT/HOVER/ACTIVE/FOCUS_VISIBLE/SELECTED/CURRENT/HIGHLIGHTED/VISITED + `::selection` + breadcrumbs).

## Workflows (مختصر)

| ملف | متى |
|---|---|
| `ci.yml` | PR/push main — المطلوب Verify build + ci-required |
| `auto-merge-to-main.yml` | تفعيل squash بعد Verify |
| `auto-deploy.yml` | بعد main |
| `vercel-check.yml` | يدوي فقط (بعد throughput) |
| `preview-smoke.yml` | يدوي فقط (بعد throughput) |
| `ios-*.yml` | paths على ios/capacitor |
| `mushaf-gates-nightly.yml` | ليلي كامل |


## تطور المنتج

| `artifacts/majalis/docs/design/SUNNAH_VISUAL_LANGUAGE.md` | لغة سُنّة البصرية (SVL) — أساس + موجات PR |
| `docs/design/SUNNAH_DESIGN_SYSTEM_REPORT.md` | توحيد Design System (PR-3 استقرار) |
| `docs/design/SUNNAH_FOUNDATION_RESET_PR0_BASELINE.md` | Foundation Reset PR-0 — خريطة اعتماديات + Baseline |

| `docs/performance/SUNNAH_WORLD_CLASS_BASELINE.md` | خط أساس برنامج World-Class Product Polish (PR-1) |

| `docs/lessons-guide/` | دليل الدروس — عقد + Migration مقترحة (Feature Flag OFF) |

| `docs/product-evolution/` | خط أساس برنامج التطوير + تقرير المراحل (P0+) |
| `docs/content-quality/TOTAL_TRUST_*` + `reports/total-trust/` | برنامج TOTAL TRUST (تحقق محتوى/مسارات؛ لا حكم شرعي آلي) |
| `docs/content-quality/islamic-sects-*` + `ISLAMIC_SECTS_*` | جرد/قرارات بشرية/حراسة نشر الفرق (لا PUBLISHED آلي) |
| `docs/admin/LEGACY_ADMIN_INVENTORY.md` | جرد Admin Legacy قبل Admin v3 Complete Rebuild |
| `docs/release/CURRENT_PROJECT_STATUS.md` | **سطح الحالة الحي الوحيد** — tip/إنتاج/HOLD/P0/Owner/Device |
| `docs/release/CURRENT_RELEASE_TRUTH.md` | حقيقة main/إنتاج/تصنيف البنود — مصدر مزامنة التقارير |
| `docs/release/OWNER_ACTIONS_CURRENT.md` | قرارات المالك فقط (لا ينفّذها الوكيل) |
| `docs/release/RELEASE_FREEZE.md` | تجميد Store RC مفصول عن دمج main للإصلاح |
| `docs/audit/SUNNAH_FULL_PROJECT_AUDIT.md` | تدقيق شامل 2026-09-21 (`PARTIAL`) — خط أساس Remediation |

## حوكمة الوكيل

| ملف | دور |
|---|---|
| `docs/AGENT_THROUGHPUT.md` | مسار Targeted Read → … → Full Verify + **Finalization Freeze Protocol** |
| `.cursor/rules/majlisilm-agent-throughput.mdc` | قاعدة Cursor الدائمة للمسار والتجميد |
| `.cursor/rules/majlisilm-ci-safe.mdc` | منع إضعاف CI؛ `verify:preflight` قبل `verify:ci` |
| `scripts/verify-preflight.mjs` | فحوص سريعة إلزامية قبل `verify:ci` (`pnpm run verify:preflight`) |
| `scripts/__tests__/agent-throughput-policy.test.mjs` | بوابة نصية لمنع الدوران/التوسع/تخفيف البوابات |

بروتوكول الوكيل: `docs/AGENT_THROUGHPUT.md` (يشمل `IMPLEMENTATION_FROZEN` وميزانيات البحث/التصحيح).
