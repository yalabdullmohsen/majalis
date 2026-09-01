# تدقيق طابور CI/CD — سُنّة

**تاريخ:** 2026-09-01T17:23:01.977Z
**عدد workflows:** 21
**Merge queue:** محفوظ ✓
**Required checks:** Verify build، ci-required

## ملخص

| Workflow | المحفّز | المدة | كاش | build | يمنع الدمج | paths | الإصلاح |
|----------|---------|-------|-----|-------|------------|-------|---------|
| Auto Deploy main → production | push+schedule+workflow_dispatch | medium | — | ✓ | **نعم** | — | تخطّي build/typecheck على push — CI سبق التحقق؛ اكتفِ بـ version.json |
| Auto Maintenance | schedule+workflow_dispatch | medium | — | — | — | — | — |
| Auto-ready and merge PRs to main | pull_request+schedule+workflow_dispatch+workflow_run | medium | — | — | **نعم** | — | — |
| CI | pull_request+push+merge_group | medium | ✓ | ✓ | **نعم** | — | بناء واحد + dist artifact — مسار PR مختصر للمصحف |
| Harvest sources | schedule+workflow_dispatch | heavy | ✓ | — | — | — | — |
| iOS Capacitor Gates | pull_request+push | fast | ✓ | — | — | ✓ | — |
| iOS native (macOS) | pull_request+push | heavy | — | ✓ | — | ✓ | — |
| iOS TestFlight Deploy | push+workflow_dispatch | heavy | ✓ | ✓ | — | — | — |
| Owner Bootstrap | workflow_dispatch | fast | — | — | — | — | — |
| Phase 2 Trial Import | workflow_dispatch | fast | — | — | — | — | — |
| Platform Self Bootstrap | workflow_dispatch | fast | — | — | — | — | — |
| PR Quality Verify Report | pull_request+workflow_dispatch | medium | ✓ | — | — | — | تخطّي audits عند docs-only عبر changed-scope |
| PR Safe Auto-Merge Report | pull_request+workflow_dispatch | fast | — | — | — | — | — |
| Preview smoke (manual) | workflow_dispatch | fast | — | — | **نعم** | — | — |
| Production Bootstrap | workflow_dispatch | fast | — | — | — | — | — |
| Release Majlisilm (يدوي فقط) | workflow_dispatch | medium | — | ✓ | — | — | — |
| Resolve PR conflicts from main | pull_request+schedule+workflow_dispatch | medium | — | — | **نعم** | — | — |
| Scheduled Release Train | schedule+workflow_dispatch | heavy | — | — | — | — | — |
| Supabase Migrations | push+workflow_dispatch | medium | — | — | — | ✓ | — |
| Tasmee3 CI | pull_request+push | fast | — | — | — | ✓ | — |
| Vercel Check (manual) | workflow_dispatch | heavy | ✓ | ✓ | **نعم** | — | — |

## build مكرر (يُفترض تحسينه)

- `ios-native-macos.yml`
- `vercel-check.yml`

## أوامر CI ناقصة

- لا شيء

## تشغيل ذكي (PR vs main)

- **PR صغير / docs:** `pnpm run verify:changed` → بوابات UI/SEO/PWA/iOS حسب النطاق
- **PR سريع:** `pnpm run verify:ci-fast`
- **main / release:** `pnpm run verify:ci-full` (= verify:ci + regression)

## سياسات ثابتة

- لا إلغاء merge queue
- لا نشر بدون Verify build ناجح
- لا تغيير خط المصحف/التفسير
- لا Majlisilm/المجلس العلمي للمستخدم
- لا /internal أو /review في routes/sitemap

