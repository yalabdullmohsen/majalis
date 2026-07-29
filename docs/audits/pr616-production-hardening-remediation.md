# PR #616 — Production Hardening Remediation

**الفرع:** `cursor/fix-pr616-production-hardening-1f54`  
**الأساس:** `main` @ `c0e560497` (PR #616)  
**الدمج إلى main:** لا  
**نشر Production:** لا

## 1) ملخص تنفيذي

أُزيل الدمج التلقائي غير الآمن، ومُنع Memory fallback في Production، وحُوّلت معظم Cron الطويلة إلى enqueue(202)، ومُنع Runtime DDL، وأُضيفت اختبارات PostgreSQL حقيقية + بوابات CI، وأُعيد تفعيل Preview عبر `vercel.json`.

## 2) أسباب فشل العملية السابقة

- نجاح Unit/CI لا يثبت سلوكًا موزعًا على Vercel.
- Memory fallback أخفى غياب Migration.
- Preview كان Ignored.
- Auto-merge دمج Draft رغم تحذيرات الوصف.

## 3) سبب الدمج التلقائي

Workflow سابق `auto-merge-to-main.yml`: undraft + `gh pr merge --auto --squash`.  
**بعد الإصلاح:** الملف محذوف؛ بديل تعليقات فقط؛ `verify-no-unsafe-auto-merge` في CI.

## 4) حالة Migration

- ملف `enterprise_reliability_p0_v1.sql` محسّن (idempotent، حراسة جداول غائبة، `pgcrypto`).
- مختبر على Postgres محلي/CI (`fresh`/`upgrade`).
- **لا يُدعى أنه طُبّق على Production** — يدوي عبر SQL Editor.

## 5) Memory fallback قبل/بعد

| قبل | بعد |
|---|---|
| صامت عند فشل PG | ممنوع في Production؛ 503 / `durable_store_unavailable` |
| مسموح ضمنيًا | فقط `NODE_ENV=test` أو `ALLOW_IN_MEMORY_RELIABILITY_STORE=1` |

## 6–8) Postgres / Queue / Circuit

- Integration: claim ذري، lease reclaim، idempotency، dead-letter لـ`credit_exhausted`.
- Queue claim يشمل expired `running`.
- Classifier أضيق؛ `opensCircuitImmediately`؛ Retry-After؛ fail-closed بلا store.

## 9) HTTP lifecycle

- الإبقاء على `sendJson` الآمن + فحص `finally`/enqueue عبر `verify-single-response`.
- `/api/readyz` منفصل عن `/api/healthz`.

## 10) Cron المحوّلة

كل المهام الثقيلة تقريبًا → `createEnqueueCronHandler`؛ allowlist للـhealth/verify/worker فقط.  
`job-worker` لم يعد يُكمل الأنواع المجهولة كنجاح.

## 11) Runtime migrations

- `apply-migrations` و`bootstrap` بدون DDL نهائيًا.
- `verify-no-runtime-ddl` في CI.

## 12–13) UUID/Slug و Auth

- أُبقيت إصلاحات #616؛ أُضيفت اختبارات fail-closed/reliability حولها. مراجعة أوسع مستمرة كدين تقني.

## 14–17) Preview / Smoke / Playwright

- `deploymentEnabled: true`.
- Preview smoke/Playwright الكامل ما زال يتطلب Deployment جاهزًا + secrets؛ موثّق كخطوة يدوية/لاحقة.
- لا تُدعى نتائج E2E Preview إن لم تُشغَّل على URL حقيقي.

## 18) Production logs

انظر `pr616-production-log-verification.md` — غير مقاسة آليًا هنا.

## 19–20) الملفات / migrations

انظر git diff على الفرع؛ migration المعدّلة: `enterprise_reliability_p0_v1.sql`.

## 21) مخاطر متبقية

- Migration Production غير مؤكدة التطبيق.
- معظم job types بلا worker مضمّن → dead-letter حتى تُسجَّل workers.
- Preview smoke/Playwright غير مفعّلين كـrequired بعد.
- حماية main يدوية في GitHub Settings.

## 22–24) خطوات يدوية

**GitHub:** Branch protection + required checks من `github-branch-protection.md`.  
**Vercel:** تأكيد Root/`majalis-majalis` وتعطيل deploy لمشروع ثانوي غير مطلوب.  
**Supabase:** تطبيق SQL يدويًا ثم verify.

## 25) Rollback

- إعادة نشر كود سابق من `main` دون حذف جداول.
- لا force-push؛ لا حذف بيانات Queue.

## جدول الحالة

| البند | قبل | بعد | الحالة | الدليل |
|---|---|---|---|---|
| Auto-merge | يدمج Draft | محذوف + تحقق CI | تم | workflows + script |
| Memory Prod | صامت | fail-closed | تم | failclosed test |
| Queue PG | Unit فقط | integration | تم | test-postgres-queue |
| Runtime DDL | escape hatch | ممنوع | تم | apply-migrations.js |
| Cron طويل | HTTP | enqueue | تم | verify-single-response |
| Preview | Ignored | enabled | تم كودًا | vercel.json |
| Migration Prod | غير مؤكد | غير مؤكد | يدوي | ops doc |
| دمج هذا PR | — | لا | مفتوح Draft | سياسة |
| نشر Prod | — | لا | لا | سياسة |
