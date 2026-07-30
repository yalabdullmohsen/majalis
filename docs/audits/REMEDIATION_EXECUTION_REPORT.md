# تقرير تنفيذ المعالجة — Majalis Remediation

## 1) SHA البداية

- `8472d205adaa3f5720edf07066de07fb64e35d78` (`main` عند بدء المرحلة الأولى)
- الفرع: `cursor/fix-p0-runtime-queue-workers-38ac`

## 2) Baseline (قبل التعديل)

| أمر | النتيجة |
|---|---|
| `pnpm install --frozen-lockfile` | نجح |
| `pnpm exec tsc -b --clean` / `tsc -b` | نجح |
| `pnpm -r --if-present run typecheck` | نجح |
| `eslint src lib --max-warnings=0` | نجح |
| `pnpm --filter @workspace/majalis run test` | نجح |
| `pnpm --filter @workspace/majalis run build` على Node 22.14 | **فشل** — `registerHooks` غير متاح (بيئة الوكيل؛ CI يستخدم Node 24) |
| `git diff --exit-code` بعد محاولة البناء | dirty بسبب `content-counts.json` generatedAt — أُعيد دون commit |

## 3) مشاكل أُعيد إثباتها (Phase 1)

1. **14 نوع job مسموح بلا worker** → كل claim ينتهي `no_worker_registered` / dead-letter وهمي بعد 202.
2. **`metadata.mode` لا يُمرَّر** من `createEnqueueCronHandler` → مسارات `autonomous-platform-*` وMKE تعمل `full`.
3. **`metadata.job` غير مضبوط** لـ `content-scheduler`.
4. **`background_job_attempts` غير مكتوب** رغم وجود الجدول.
5. **لا منع صريح لنسختين متزامنتين لنفس `job_type`** (فقط SKIP LOCKED على صف واحد).
6. **Abort عند مهلة الـworker غير محلي** — يعتمد فقط على `req.abortSignal`.
7. **`/api/readyz`** يفحص وجود الجدولين فقط دون محاولات/DLQ/أعمدة التشغيل.

## 4) ادعاءات قديمة/جزئية في تقارير سابقة

- وجود جداول `background_jobs` / `ai_provider_circuit` وenqueue 202 **صحيح** على `8472d205` (من #624).
- لكن الادعاء بأن الطابور «جاهز تشغيليًا» غير صحيح طالما أغلب الـcrons بلا workers.
- Memory fallback في Production **مرفوض أصلًا** في الكود الحالي (أُعيد التحقق).

## 5) الأسباب الجذرية

- تحويل Cron إلى enqueue في #624 دون إكمال سجل `JOB_WORKERS`.
- مصنع `createEnqueueCronHandler` لا يستخرج `mode`/`job` من المسار أو الاستعلام.
- مسار الإكمال/الفشل لا يكتب محاولات ولا يفرض قفل نوع المهمة.

## 6) ما أُصلح (Phase 1)

- تسجيل workers حقيقية لكل `ALLOWED_JOB_TYPES` (استعادة منطق crons السابق حيث لزم).
- رفض enqueue عند غياب worker (لا 202 وهمي).
- تمرير `metadata.mode` / `metadata.job` + تضمينهما في idempotency key.
- Claim: advisory lock + منع lease نشط ثانٍ لنفس `job_type`.
- محاولات + DLQ + `next_retry_at`/`completed_at` (migration + توافق خلفي).
- `job-worker`: `AbortController` عند الموعد النهائي.
- `/api/readyz`: فحوص جداول/أعمدة أساسية + تحذير لأعمدة hardening.
- اختبارات وحدة + توسيع بوابة P0 + تكامل Postgres (عند توفر URL).
- SQL: `background_jobs_runtime_hardening_v1.sql` + rollback — **لم يُطبَّق على Production**.

## 7) الملفات المعدّلة/المضافة (Phase 1)

- `artifacts/majalis/lib/jobs/queue.mjs`
- `artifacts/majalis/lib/jobs/job-workers.mjs`
- `artifacts/majalis/lib/jobs/cron-enqueue.mjs`
- `artifacts/majalis/lib/jobs/*-runner.mjs` (content-scoring / universities-review / researches-daily-import)
- `artifacts/majalis/lib/api-handlers/cron/job-worker.js`
- `artifacts/majalis/lib/api-handlers/cron/autonomous-platform.js`
- `artifacts/majalis/lib/api-handlers/cron/majlis-knowledge-engine.js`
- `artifacts/majalis/lib/api-handlers/cron/content-scheduler.js`
- `artifacts/majalis/lib/api-handlers/readyz.js`
- `artifacts/majalis/lib/migration-paths.mjs`
- `artifacts/majalis/supabase/background_jobs_runtime_hardening_v1.sql`
- `artifacts/majalis/supabase/background_jobs_runtime_hardening_v1_ROLLBACK.sql`
- `artifacts/majalis/lib/__tests__/p0-queue-workers.test.mjs`
- `artifacts/majalis/scripts/test-p0-reliability-gates.mjs`
- `artifacts/majalis/package.json`
- `scripts/test-postgres-queue-integration.mjs`
- `scripts/db-migration-verify.mjs`
- `docs/audits/p0-runtime-queue-matrix.md`
- هذا الملف

## 8) الاختبارات (Phase 1)

شُغِّلت فعليًا:

- `test-p0-reliability-gates.mjs` → ok
- `p0-reliability.test.mjs` → ok
- `p0-queue-workers.test.mjs` → ok
- `p0-reliability-failclosed.test.mjs` → ok
- `verify:single-response` → ok
- `verify:no-runtime-ddl` → ok

Postgres integration / migration live: تُشغَّل في CI عند توفر `MIGRATION_TEST_DATABASE_URL`؛ محليًا بدون URL تُسجَّل SKIPPED.

## 9) PRs

- Phase 1: يُنشأ بعد نجاح الفحوص المحلية (هذا الفرع).

## 10) ما يحتاج موافقة صريحة

1. تطبيق `background_jobs_runtime_hardening_v1.sql` على Staging ثم Production.
2. أي تغييرات Dashboard لاحقة (Auth/Vercel/Branch protection) — خارج هذه المرحلة.
3. لا TestFlight / لا Signing.

## 11) Rollback Phase 1

1. Revert PR / رجوع `main` للـSHA السابق.
2. SQL: تشغيل `background_jobs_runtime_hardening_v1_ROLLBACK.sql` إن طُبِّقت الهجرة فقط.
3. الـcrons تعود لسلوك #624 (enqueue بلا workers) إن أُرجِع الكود دون إبقاء الـworkers.

## 12) المراحل التالية

لم تبدأ. Phase 2 تُنفَّذ فقط بعد أخضر CI لـPR المرحلة الأولى.
