# تدقيق قاعدة البيانات والـ Queue — 2026

**الفرع:** `fix/p0-database-reliability`  
**قاعدة التدقيق (main tip بعد #645):** `1f2c8cede`  
**التاريخ:** 2026-07-30  
**Supabase Production ref:** `ngmvmlulzacrlicuagyp`  
**قيود:** لم يُطبَّق أي SQL على Production. لا DROP TABLE/COLUMN. لا Runtime DDL.

---

## 1) اتصال Production للقراءة

| البند | الحالة |
|---|---|
| `DATABASE_URL` المحلي | متاح — `127.0.0.1` (قاعدة اختبار فقط) |
| اتصال قراءة إلى Production (`ngmvmlulzacrlicuagyp`) | **غير متوفر في بيئة الوكيل** |
| فحص حي لمخطط Production | **لم يُنفَّذ — NOT MEASURED** |

أي نتيجة أدناه عن «الموجود في Production» هي استنتاج من ملفات SQL والكود فقط، وليست قراءة حية. لا تُخترع نتائج تفتيش حي.

---

## 2) الجداول التي يعتمد عليها الكود

| الجدول | الاعتماد في الكود | إلزامي للـ ready؟ |
|---|---|---|
| `public.background_jobs` | `lib/jobs/queue.mjs` (enqueue/claim/checkpoint/complete/fail) | نعم |
| `public.background_job_attempts` | تسجيل محاولات (fail-open إن غاب) | مفضّل |
| `public.background_job_dead_letters` | DLQ عند فشل دائم / تجاوز المحاولات | مفضّل |
| `public.ai_provider_circuit` | `lib/ai/provider-client.mjs` | نعم (readyz) |
| `public.ai_spend_ledger` | `lib/ai/spend-governance.mjs` — fail-open إن غاب | لا |

---

## 3) الأعمدة / القيود / الفهارس المطلوبة (من الكود)

### `background_jobs`

| العمود / القيد | الاستخدام |
|---|---|
| `job_id` UUID PK | مفتاح |
| `job_type` | claim filter + advisory lock |
| `status` | queued/running/succeeded/dead_letter… |
| `idempotency_key` | منع التكرار |
| `UNIQUE (job_type, idempotency_key)` | idempotency |
| `cursor` JSONB | checkpoint |
| `attempt_count` / `max_attempts` | retry / DLQ |
| `locked_at` / `locked_by` / `lease_expires_at` | lease + reclaim |
| `started_at` / `finished_at` | دورة الحياة |
| `next_run_at` | جدولة claim |
| `next_retry_at` | hardening — COALESCE مع next_run_at عند الوجود |
| `completed_at` | hardening — يُضبط عند succeeded |
| `last_error_code` / `last_error_message` | فشل |
| `metadata` JSONB | حمولة |
| فهرس claim على `(status, next_run_at)` | `enterprise_reliability_p0_v1` |
| فهرس `(job_type, lease_expires_at) WHERE running` | hardening |
| فهرس `(status, next_retry_at) WHERE queued` | hardening |

### `background_job_attempts`

`id`, `job_id` FK CASCADE, `attempt_no`, `started_at`, `finished_at`, `error_code`, `error_message`, `summary`.

### `background_job_dead_letters`

`job_id` PK FK CASCADE, `job_type`, `last_error_*`, `payload`, `created_at`.

### `ai_provider_circuit`

`provider` PK, `circuit_state`, `opened_reason`, `opened_at`, `retry_after`, `daily_request_count`, `day_key`, `concurrency_lease`, `last_alert_at`, …

### `ai_spend_ledger` (اختياري)

أعمدة التكلفة/التوكنات اليومية — غياب الجدول لا يوقف الطابور.

---

## 4) الموجود في ملفات migrations

| الملف | المحتوى |
|---|---|
| `enterprise_reliability_p0_v1.sql` | إنشاء الجداول الأربعة الأساسية + UNIQUE idempotency + فهرس claim + `qa_categories.sort_order` |
| `background_jobs_runtime_hardening_v1.sql` | `next_retry_at`, `completed_at` + فهارس |
| `observability_ai_governance_p2_v1.sql` | `ai_spend_ledger` والجداول المرتبطة |

سلسلة `MIGRATION_FILES` تتضمن الملفات أعلاه بعد `qa_phase4_seed.sql`.

---

## 5) Drift: الكود ↔ SQL (مراجَع على الملفات)

| النقطة | الحكم |
|---|---|
| جداول الطابور في SQL vs الكود | متطابقة في الملفات |
| UNIQUE `(job_type, idempotency_key)` | موجود في SQL ويُستخدم في الكود |
| `FOR UPDATE … SKIP LOCKED` | موجود في `claimNextJob` |
| `next_retry_at` / `completed_at` | الكود يتحمّل غيابهما عبر `getColumnSupport`؛ يُفضَّل تطبيق hardening يدويًا |
| Production live drift | **NOT MEASURED** — لا اتصال قراءة |

---

## 6) تدقيق مسارات الـ Queue (كود)

| المسار | الحالة بعد الإصلاح |
|---|---|
| enqueue | upsert منطقي + 23505 race |
| claim | SKIP LOCKED + advisory lock + منع lease نشط لنفس `job_type` + reclaim لـ lease منتهٍ |
| checkpoint | يمدّد `lease_expires_at` بـ `leaseMs` قابل للضبط |
| complete | `succeeded` + `completed_at` إن وُجد |
| fail / retry | backoff أسّي؛ يضبط `next_run_at` و`next_retry_at` |
| dead-letter | بعد فشل دائم أو `attempt_count >= max_attempts` |
| soft abort (`aborted`) | **كان خللًا:** يُعامل كدائم → DLQ. **أُصلح:** soft re-queue؛ والعامل يعمل checkpoint فقط عند انتهاء الميزانية |
| stale lease recovery | ضمن claim (`running` + `lease_expires_at < now()`) بدون زيادة `attempt_count` |

---

## 7) سبب `durable_store_unavailable` (تحليل كود — لا إثبات حي على Production)

مرشّحات مثبتة في الكود قبل هذا الفرع:

1. **`database_not_configured`** — غياب `DATABASE_URL` / فشل إنشاء الـ pool في بيئة Production.
2. **صف دائرة AI فارغ** — `getProviderState` كان يعامل «لا صف» كـ unavailable في Production حتى مع جدول موجود → يُرجع `durable_store_unavailable` لمسار AI. **أُصلح:** الافتراضي `closed` عند غياب الصف.
3. **`queue_schema_missing` / `queue_column_missing`** — إن لم تُطبَّق migrations يدويًا على Production (غير مُثبت حيًا).
4. **`database_connection_failed`** — خطأ اتصال/timeout/pooler.
5. **`queue_query_failed`** — فشل استعلام آخر.

**لا يُستبدل الخطأ بتخزين ذاكرة في Production** (fail-closed قائم).

التشخيص الآمن يمر عبر `DURABLE_REASONS` في `lib/reliability/env.mjs`.

---

## 8) نقاط لم تُفحص حيًا

- وجود الجداول/الأعمدة على Production `ngmvmlulzacrlicuagyp`
- صلاحيات دور الاتصال (RLS policies للـ service role vs anon)
- إعداد الـ pooler (transaction vs session) في Vercel secrets
- عمق الطابور وعدد الـ DLQ الحالي في Production
- قيم `DATABASE_URL` الفعلية على Vercel (ممنوع تسجيلها)

---

## 9) READY لتطبيق SQL يدويًا؟

حزمة المراجعة: `artifacts/majalis/supabase/PRODUCTION_SQL_EXECUTION_PACK.md`  
**الحكم:** انظر قسم التسليم في نهاية عمل الفرع — التطبيق يدوي وبموافقة مالك فقط بعد Preflight حي.
