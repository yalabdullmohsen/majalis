# Production SQL Execution Pack — Queue / Reliability (مراجعة فقط)

**الحالة: لم يُطبَّق على Production.**  
**Supabase ref المستهدف (يدويًا لاحقًا):** `ngmvmlulzacrlicuagyp`  
**قيود ملزمة:** لا `DROP TABLE`، لا `DROP COLUMN`، لا حذف بيانات، لا Runtime DDL من API/Cron.  
**هذه الحزمة للمراجعة البشرية فقط — لا تنفّذها من الوكيل.**

مبنية على الكود الحالي + ملفات:

- `enterprise_reliability_p0_v1.sql`
- `background_jobs_runtime_hardening_v1.sql`
- (اختياري لاحقًا) أجزاء `observability_ai_governance_p2_v1.sql` الخاصة بـ `ai_spend_ledger`

---

## Preflight (read-only) — نفّذ أولًا في SQL Editor

```sql
-- Preflight: وجود الجداول والأعمدة الحرجة (قراءة فقط)
SELECT
  to_regclass('public.background_jobs') AS background_jobs,
  to_regclass('public.background_job_attempts') AS background_job_attempts,
  to_regclass('public.background_job_dead_letters') AS background_job_dead_letters,
  to_regclass('public.ai_provider_circuit') AS ai_provider_circuit,
  to_regclass('public.ai_spend_ledger') AS ai_spend_ledger;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'background_jobs'
ORDER BY ordinal_position;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'background_jobs';

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.background_jobs'::regclass;
```

فسّر النتائج قبل أي `BEGIN`. إن كان الجدول غائبًا بالكامل → الخطوة A. إن وُجدت الجداول وغابت أعمدة hardening فقط → الخطوة B.

---

## الخطوة A — جداول الموثوقية الأساسية (expand-only)

نفّذ داخل معاملة واحدة. عند الخطأ: `ROLLBACK` قبل أي `COMMIT`.

```sql
BEGIN;

-- A1: دائرة مزوّد AI
CREATE TABLE IF NOT EXISTS public.ai_provider_circuit (
  provider TEXT PRIMARY KEY,
  circuit_state TEXT NOT NULL DEFAULT 'closed'
    CHECK (circuit_state IN ('closed', 'open', 'half-open')),
  opened_reason TEXT,
  opened_at TIMESTAMPTZ,
  retry_after TIMESTAMPTZ,
  daily_request_count INT NOT NULL DEFAULT 0,
  daily_usage_estimate NUMERIC NOT NULL DEFAULT 0,
  concurrency_lease INT NOT NULL DEFAULT 0,
  day_key TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD'),
  last_alert_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A2: طابور الوظائف
CREATE TABLE IF NOT EXISTS public.background_jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'dead_letter', 'cancelled')),
  idempotency_key TEXT NOT NULL,
  cursor JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  lease_expires_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error_code TEXT,
  last_error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT background_jobs_idempotency UNIQUE (job_type, idempotency_key)
);

-- فهرس claim فقط إن وُجد الجدول
DO $$
BEGIN
  IF to_regclass('public.background_jobs') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_background_jobs_claim
      ON public.background_jobs (status, next_run_at)
      WHERE status IN ('queued', 'running');
  END IF;
END $$;

-- إن وُجد الجدول مسبقًا بلا قيد idempotency — أضِفه دون DROP
DO $$
BEGIN
  IF to_regclass('public.background_jobs') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conrelid = 'public.background_jobs'::regclass
         AND conname = 'background_jobs_idempotency'
     ) THEN
    ALTER TABLE public.background_jobs
      ADD CONSTRAINT background_jobs_idempotency UNIQUE (job_type, idempotency_key);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.background_job_attempts (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.background_jobs(job_id) ON DELETE CASCADE,
  attempt_no INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.background_job_dead_letters (
  job_id UUID PRIMARY KEY REFERENCES public.background_jobs(job_id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  last_error_code TEXT,
  last_error_message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ملاحظة: سياسات RLS موجودة في ملف المصدر؛ لا تُعدَّل في هذه المرحلة إن كانت موجودة مسبقًا.
-- ENABLE RLS فقط إن رغب المراجع بذلك بعد مراجعة السياسات — خارج نطاق هذا الـ pack إن كانت مفعّلة.

COMMIT;
```

### تحقق A (read-only)

```sql
SELECT
  to_regclass('public.background_jobs') IS NOT NULL AS has_jobs,
  to_regclass('public.background_job_attempts') IS NOT NULL AS has_attempts,
  to_regclass('public.background_job_dead_letters') IS NOT NULL AS has_dlq,
  to_regclass('public.ai_provider_circuit') IS NOT NULL AS has_circuit;

SELECT 1
FROM pg_constraint
WHERE conrelid = 'public.background_jobs'::regclass
  AND conname = 'background_jobs_idempotency';
```

عند الفشل قبل `COMMIT`: نفّذ `ROLLBACK;` ولا تُكمل الخطوة B.

---

## الخطوة B — Hardening أعمدة الطابور (معاملة مستقلة)

فقط إذا نجح تحقق A والجداول موجودة و`next_retry_at` / `completed_at` غائبان أو أحدهما غائب.

```sql
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.background_jobs') IS NULL THEN
    RAISE EXCEPTION 'public.background_jobs missing — abort step B';
  END IF;
END $$;

ALTER TABLE public.background_jobs
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

ALTER TABLE public.background_jobs
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- مواءمة بيانات موجودة (expand-only، لا حذف)
UPDATE public.background_jobs
SET next_retry_at = next_run_at
WHERE status = 'queued'
  AND last_error_code IS NOT NULL
  AND next_retry_at IS NULL;

UPDATE public.background_jobs
SET completed_at = finished_at
WHERE status = 'succeeded'
  AND finished_at IS NOT NULL
  AND completed_at IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'background_jobs'
      AND column_name = 'lease_expires_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_background_jobs_type_running_lease
      ON public.background_jobs (job_type, lease_expires_at)
      WHERE status = 'running';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'background_jobs'
      AND column_name = 'next_retry_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_background_jobs_next_retry
      ON public.background_jobs (status, next_retry_at)
      WHERE status = 'queued' AND next_retry_at IS NOT NULL;
  END IF;
END $$;

COMMIT;
```

### تحقق B (read-only)

```sql
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'background_jobs' AND column_name = 'next_retry_at'
  ) AS has_next_retry_at,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'background_jobs' AND column_name = 'completed_at'
  ) AS has_completed_at;

SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'background_jobs'
  AND indexname IN (
    'idx_background_jobs_type_running_lease',
    'idx_background_jobs_next_retry',
    'idx_background_jobs_claim'
  );
```

---

## خارج النطاق في هذه المرحلة

- تعديل سياسات RLS / Auth
- إنشاء/تعديل `ai_spend_ledger` (اختياري P2 — راجع ملفه منفصلًا)
- أي `DROP` أو إعادة تسمية أعمدة
- تطبيق تلقائي من Vercel / Cron / Admin API

---

## تأكيد الوكيل

- **لم يُطبَّق** هذا الـ SQL على Production من هذا الفرع.
- التطبيق يدوي بعد Preflight حي وموافقة المالك فقط.
