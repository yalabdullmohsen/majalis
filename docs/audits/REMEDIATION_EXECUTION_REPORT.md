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

| المرحلة | PR | النتيجة |
|---|---|---|
| Phase 1 | https://github.com/yalabdullmohsen/majalis/pull/627 | MERGED → `59db9b77` |
| Phase 2 | (هذا الفرع) | قيد الإنشاء |

## 10) ما يحتاج موافقة صريحة

انظر `docs/REQUIRES_EXPLICIT_APPROVAL.md`:

1. SQL Staging→Production (enterprise + hardening + bootstrap_runs + definer grants + import schema).
2. Auth Dashboard: Leaked Password Protection + MFA إداري + Redirect URLs.
3. Vercel: تأكيد `DATABASE_URL` لدوال Production.
4. لا TestFlight / لا Signing.

## 11) Rollback

- Phase 1: `background_jobs_runtime_hardening_v1_ROLLBACK.sql` + revert PR.
- Phase 2: `platform_bootstrap_runs_v1_ROLLBACK.sql` + `p0_security_definer_grants_v2_ROLLBACK.sql` + revert PR (يعيد Admin DDL — غير مرغوب).

---

# المرحلة الثانية — P0 Security / Runtime DDL

## SHA البداية

`59db9b77a85064e2591baa0cc4315bba04797a73`

## مشاكل أُعيد إثباتها

1. Admin `platform-bootstrap` / `production-activate` ما زالا يستدعيان `runPlatformBootstrap` / `runActivationMigrations` (DDL عبر HTTP).
2. `ensureContentImportSchema` / `ensureImportTables` يطبّقان SQL من ملفات الهجرة عند طلبات الاستيراد.
3. `platform-bootstrap-state` ينفّذ `CREATE TABLE` في كل تشغيل.
4. Universities Admin تستخدم `profiles.is_admin` فقط — خارج RBAC الموحّد.
5. `requireAdminAccess` كان يعيد `debug` للعميل؛ ومعظم Admin catch يمرّر `error.message` خامًا.
6. وثائق ما زالت تذكر `ALLOW_RUNTIME_SCHEMA_MIGRATIONS` رغم حذفه من الكود.

## ما أُصلح

- Admin bootstrap/activate → verify-only + `runtime_schema_migrations_disabled`.
- Content-import schema → verify-only؛ لا `client.query(sql)`.
- Bootstrap state → بدون DDL؛ جدول عبر SQL migration.
- `applyMigrations` يرفض على Vercel بلا `MAJALIS_ALLOW_CLI_MIGRATIONS=1`.
- Universities → `requireAdminAccess` + RBAC.
- `sendSafeError` / إزالة debug من استجابات Admin.
- توسيع `verify:no-runtime-ddl` + خطوة CI.
- SQL + rollback + `docs/REQUIRES_EXPLICIT_APPROVAL.md`.

## اختبارات Phase 2

- `pnpm verify:no-runtime-ddl`
- `lib/__tests__/p0-security-runtime-ddl.test.mjs` (ضمن `test:p0-reliability`)
