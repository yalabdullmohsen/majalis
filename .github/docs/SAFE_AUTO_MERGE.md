# Safe Auto-Merge (الدمج التلقائي الآمن)

Auto-merge يبقى **مفعّلًا** للتعديلات البسيطة/المتوسطة بعد نجاح الفحوصات، مع منع التغييرات الخطرة. لا يُعطَّل Auto-merge — يُقيَّد بفحوص حقيقية ومسارات آمنة.

## ما الذي يندمج تلقائيًا؟

PR **Ready** (غير Draft) إلى `main` عندما:

1. فحوصات CI الأساسية خضراء (`Verify build` = typecheck + lint + test/content-guard + build)
2. ليس موسومًا `release-train-ready` (يملكه قطار الإصدار)
3. ليس موسومًا `risky:manual-review` أو `blocked:danger-path`
4. لا تعارض / ليس `BEHIND`
5. لا `CHANGES_REQUESTED`
6. ≤ **40** ملفًا، بلا حذف كبير
7. لا يلمس مسارات خطرة (SQL / iOS / CI / Auth / …)
8. **Labels اختيارية** للتصنيف والوضوح — غيابها لا يمنع الدمج للتغييرات منخفضة المخاطر (يظهر تحذيرًا فقط)
9. إذا كان الوسم `content-safe` / `safe:content`: الملفات ضمن مسارات تدقيق المحتوى فقط:
   - `artifacts/majalis/public/data/quiz/**`
   - `artifacts/majalis/public/data/**`
   - `artifacts/majalis/data/**`
   - `CONTINUATION_PLAN.md`
10. **Vercel Preview ignored/skipped** لا يمنع تدقيق المحتوى الآمن
11. إذا كانت الفحوصات **pending**: النظام ينتظر (لا يُعطّل Auto-merge نهائيًا)

بعد الدمج (squash): **Vercel ينشر Production من `main` تلقائيًا** عبر مشروع **`majalis-majalis`** (المشروع القديم `majalis` إن وُجد يُعامل كـ legacy).

## Labels

Labels **اختيارية للتصنيف** — ليست شرطًا للدمج التلقائي بعد نجاح الفحوصات وسلامة المسارات.

| Label | المعنى |
|---|---|
| `safe:auto-merge` | وضوح إضافي في التقارير (موصى به، غير إلزامي) |
| `safe:content` | محتوى/بذور/نصوص آمنة |
| `safe:ui` | واجهة بسيطة |
| `safe:test` | اختبارات/توثيق اختبارات |
| `release-train-ready` | ينتظر قطار الإصدار فقط (لا دمج فوري) |
| `risky:manual-review` | يحتاج مراجعة بشرية — يمنع auto-merge |
| `blocked:danger-path` | ملفات خطرة — يمنع auto-merge |

Aliases قديمة ما زالت مقبولة للتصنيف: `content-safe`, `ui-safe`, `code-safe`, `tests-safe`, `maintenance-safe`.

## ما الذي لا يندمج تلقائيًا؟

أي تغيير في:

- `.github/workflows/**`
- `supabase/**` و `artifacts/majalis/supabase/**`
- `artifacts/majalis/ios/**` و `capacitor.config.ts`
- `artifacts/majalis/api/**`
- `artifacts/majalis/lib/api-handlers/**`
- `artifacts/majalis/lib/security/**`
- `artifacts/majalis/lib/auth/**`
- `artifacts/majalis/lib/jobs/**`
- `package.json` / `pnpm-lock.yaml`
- `**/vercel.json` / `fastlane/**`
- إشارات Auth / Security / RLS / secrets

السلوك: تعطيل `--auto` إن وُجد، تعليق تقرير يشرح السبب، وسم `blocked:danger-path` + `risky:manual-review`، **بدون إغلاق الـPR**.

## الفحوصات المطلوبة قبل الدمج

| Check | أين |
|---|---|
| typecheck / lint / test / build | داخل `Verify build` |
| generated artifacts `--check` | داخل `Verify build` |
| `verify:no-runtime-ddl` | داخل `Verify build` |
| `verify:single-response` | داخل `Verify build` |
| `verify:no-unsafe-auto-merge` | داخل `Verify build` |
| `db:migration:verify` | داخل `Verify build` |
| `preview-smoke` | workflow مستقل (/, /mushaf, /prayer-times, /lessons, healthz, readyz) |
| `lint-typecheck-build` | Vercel Check (PR) + git diff clean |
| `postgres-integration` | CI job |
| Color contrast | عند وجود الـjob — يجب أن ينجح |
| iOS static gates | عند تغيّر ملفات iOS/Capacitor |

`/api/readyz` بـ **503** على Preview → فشل smoke → لا auto-merge.

## بعد الدمج إلى `main`

| ماذا | السلوك |
|---|---|
| موقع الويب | Vercel ينشر تلقائيًا من `main` فقط |
| Preview | على PRs التي تحتاج واجهة؛ content-safe قد يُتخطى (Ignored Build Step) دون منع الدمج |
| TestFlight | **لا** — tag `v*.*.*` أو `workflow_dispatch` |
| Supabase migrations | **لا** — فقط `workflow_dispatch` + `apply=true` (+ `confirm_include_all` لـ `--include-all`) |

> Production deploy يتم **فقط** بعد الدمج إلى `main` — ليس من Preview.

## التنفيذ

| ملف | دور |
|---|---|
| `.github/workflows/auto-merge-to-main.yml` | تفعيل `--auto --squash` بعد تقييم السياسة |
| `.github/workflows/pr-safe-merge-report.yml` | تقرير أهلية + مزامنة الوسوم |
| `.github/scripts/safe-auto-merge/` | المنطق + الاختبارات |
| `.github/workflows/scheduled-release-train.yml` | قطار 06:00 و18:00 الكويت |

Bundle ID ثابت: `com.yousef.majlisilm`.
