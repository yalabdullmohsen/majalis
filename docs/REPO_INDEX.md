# فهرس المستودع (REPO_INDEX)

حدّث بسطر عند تغيير بنيوي. لا تُعِد بناء الفهرس من الصفر كل جلسة.

جذر Git: `/Users/alabdullmohsen/majlis-app` · GitHub: `yalabdullmohsen/majalis` · منتج الويب: `artifacts/majalis`.

## حزم artifacts

| مسار | دور | في typecheck/build الجذري؟ |
|---|---|---|
| `artifacts/majalis` | ويب مجالس العلم (أساسي) | نعم |
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
- CI موحّد: `.github/workflows/ci.yml` → الفحص المطلوب **Verify build**
- إعداد مساحة CI: `.github/actions/setup-workspace`

## مداخل التطبيق

- توجيه: `artifacts/majalis/src/App.tsx` (wouter)
- إقلاع: `artifacts/majalis/src/main.tsx`
- صفحات مجال: `src/pages/{quran,worship,fiqh,hadith,lessons,library,account}/`
- صفحات مسطّحة كثيرة: `src/views/*.tsx` (~211)
- مصحف: `src/pages/quran/ui/MushafPageView.tsx` + `src/components/quran/*` + `src/styles/quran.css` / `mushaf-v2.css`
- تنقّل مكاني: `src/lib/spatial-nav.ts` + `src/components/motion/*` + `styles/components/native-feel.css`
- prerender/SEO: سكربتات `artifacts/majalis/scripts/prerender.mjs`, `post-build-seo.mjs`, بوابات `verify:seo-prerender` داخل `package.json` build
- sitemap: يُولَّد ضمن سلسلة `generate:seo` / post-build (لا تحذف مسارًا ظاهرًا فيه بلا حذف المدخل)

## CSS — حرج مستورد من `main.tsx` (مستورد)

`app/styles/theme.css` · `brand-v4.css` · `tokens.css` · `index.css` · `design-system.css` · `instant-interaction.css` · `native-feel.css` · `chunk-recovery-toast.css` · `final-release.css` · `brand-v4-components.css` · `brand-v4-contrast-fixes.css` · `a11y-release-gate.css` · `capacitor-native-ux.css` · `m2030/{foundation,navigation,pages,interactions}.css` · `theme-aliases.css` · `ios-edge.css`

باقي ~210 ملفات CSS تحت `src/styles/**` و`src/**/*.css`: **على الأرجح محملة كسولًا مع الصفحات/المكوّنات** — قبل الحذف: `rg -n "filename.css" artifacts/majalis`.

## رموز / تعارضات شائعة

- Git الصحيح للمستودع = جذر monorepo (ليس داخل `artifacts/majalis` وحده).
- لا `framer-motion` (بوابة `test:native-feel`).
- ازدواج `@types/react` web/mobile معروف؛ `skipLibCheck`؛ لا «تصلح» بحذف UI.
- مسار المصحف الغمري: `isImmersiveChromePath` يخفي الشرائط العامة.

## Workflows (مختصر)

| ملف | متى |
|---|---|
| `ci.yml` | PR/push main — المطلوب Verify build |
| `auto-merge-to-main.yml` | تفعيل squash بعد Verify |
| `auto-deploy.yml` | بعد main |
| `vercel-check.yml` | يدوي فقط (بعد throughput) |
| `preview-smoke.yml` | يدوي فقط (بعد throughput) |
| `ios-*.yml` | paths على ios/capacitor |
| `mushaf-gates-nightly.yml` | ليلي كامل |

بروتوكول الوكيل: `docs/AGENT_THROUGHPUT.md`.
