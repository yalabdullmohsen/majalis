# 14 — CI/CD والنشر

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d`

## استراتيجية الفروع (الواقع التشغيلي المرجح)

| عنصر | الواقع من workflows/vercel.json | وثيقة DEPLOYMENT.md الجذر |
|---|---|---|
| دمج يومي | PR → **main** + auto-merge | يذكر production |
| نشر ويب | Vercel `deploymentEnabled.main=true` | يدّعي main=preview فقط |
| auto-deploy.yml | بعد push **main** + تحقق إنتاج | — |
| فرع production | تعليقات workflow: أُزيل؛ remote قد يغيب | مطلوب يدويًا |

**CONFLICT_AND_UNKNOWNS:** لا تحسم أي المصدر «صحيح تشغيليًا» دون قراءة إعداد Vercel Dashboard الحالي (خارج git). عند التعارض اتبع الدليل الأقوى للسلوك الآلي: `vercel.json` + `auto-deploy.yml` + نجاح نشر من main، مع الإبقاء على تعارض الوثيقة ظاهرًا.

## أوامر تحقق محلية

1. `pnpm run verify:preflight`  
2. مرة واحدة: `pnpm run verify:ci` بعد `IMPLEMENTATION_FROZEN`  
3. بناء ويب: `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build`

## Path-lane Matrix (من path-classifier)

| Lane (أمثلة) | أنواع ملفات | need_build | need_visual | need_mushaf | need_native | ملاحظات |
|---|---|---|---|---|---|---|
| docs-only | docs | غالبًا false | false | false | false | أسرع |
| content-only | بيانات محتوى | true غالبًا | حسب | حسب | false | |
| web-logic / frontend | src web | true | حسب | حسب | false | |
| visual | CSS/UI | true | true | حسب | false | contrast/LHCI |
| mushaf | مصحف | true | حسب | true | false | |
| native | ios/android/capacitor | true | حسب | حسب | true | |
| risky / full | واسع أو main push | true | true | true | حسب | main push يفرض full |

التفاصيل الدقيقة للأعلام: `.github/scripts/safe-auto-merge/path-classifier.mjs` و`emit-path-lane.mjs`.

## Required checks

- Verify build + ci-required (Skipped الإلزامي = فشل).  
- حسب النطاق: contrast, visual, LHCI, mushaf, native.

## Artifacts / fingerprints

- `dist` identity وci-artifact manifests في اختبارات `dist-artifact-identity`.
- لا تضعف البوابات ولا `continue-on-error` عشوائي.

## Capacitor / TestFlight

- `ios-testflight-deploy.yml` على وسوم/dispatch — **ليس** تلقائيًا من كل merge ويب.
- `cap sync` بعد build؛ لا تلتزم `ios/.../public` المولَّد.

## Workflows (22 ملفًا)

شمل: ci, auto-merge, auto-deploy, auto-maintenance, resolve-conflicts, release-train, release-majlisilm, ios-*, supabase-migrations, harvest-sources, full-regression-diagnostic, preview-smoke, vercel-check, pr-*-report, *-bootstrap, phase2-trial-import, tasmee3_ci.
