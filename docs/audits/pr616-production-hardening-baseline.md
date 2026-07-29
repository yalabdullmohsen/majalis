# PR #616 — Production Hardening Baseline

**Scope:** مراجعة ما بعد دمج PR #616 (merge `c0e560497532625375271fdcc384e572de20261a`)  
**تاريخ:** 2026-07-29  
**الهدف:** توثيق الفجوات قبل إصلاح المتابعة (لا يفترض أن نجاح CI = نجاح Production).

## ما الذي نفّذه PR #616 فعليًا

| المحور | التنفيذ |
|---|---|
| AI circuit | جدول `ai_provider_circuit` + client مع Memory fallback صامت |
| Queue | جدول `background_jobs` + claim أساسي + Memory fallback |
| Cron | `source-monitor` / `lesson-source-monitor` → enqueue 202 فقط |
| HTTP | `sendJson` يمنع double-response جزئيًا + timeout للـcron ~12s |
| Runtime DDL | بوابة `ALLOW_RUNTIME_SCHEMA_MIGRATIONS` (ما زال مسار طوارئ) |
| UUID/Slug | فصل جزئي في `supabase.ts` / `lesson-id.ts` |
| Auth | تعديلات `AuthProvider` / client واحد |
| اختبارات | Unit gates (`p0-reliability`) بدون Postgres حقيقي إلزامي |
| Vercel | `git.deploymentEnabled: { "*": false, "main": true }` → Preview Ignored |

## ما الذي لم ينفّذه / بقي ناقصًا

- منع الدمج التلقائي غير الآمن (`auto-merge-to-main.yml` دمج Draft رغم سياسة PR).
- Memory fallback ممنوع في Production (كان صامتًا).
- PostgreSQL integration حقيقي (SKIP LOCKED / lease / dead-letter).
- تحويل *كل* الـcron الطويل إلى enqueue.
- إزالة مسار Runtime DDL نهائيًا.
- Preview مربوط بـSHA لكل PR.
- Required checks شاملة قبل Production.
- قياس سجلات Production قبل/بعد ببيانات فعلية من هذه الجلسة.

## ما يعتمد على Memory

- `lib/jobs/queue.mjs` عند فشل/غياب Postgres.
- `lib/ai/provider-client.mjs` عند فشل/غياب جدول الدائرة.
- خطر: كل Vercel isolate بحالة مختلفة؛ Circuit لا يمنع الجميع؛ Queue تفقد Jobs.

## ما يعتمد على Migration غير مؤكدة التطبيق

- `supabase/enterprise_reliability_p0_v1.sql` (يدوي، غير مثبت على Production من هذا المستودع).
- بدون الجداول: enqueue يفشل أو يسقط إلى Memory؛ readiness يجب أن تفشل.

## ما اختُبر Unit فقط

- تصنيف الأخطاء، double-send، enqueue memory، gates نصية على الملفات.

## ما لم يُختبر عبر PostgreSQL (قبل هذا الإصلاح)

- Atomic claim / SKIP LOCKED / lease reclaim / checkpoint / dead-letter.

## ما لم يُختبر عبر Vercel Preview

- Deployments كانت Ignored بسبب `deploymentEnabled`.

## المخاطر الحالية (وقت الـbaseline)

1. Auto-merge يتجاوز نية Draft/NO-MERGE.
2. Memory في Production يوهم بالموثوقية.
3. Migration غير مطبقة → أخطاء relation / fallback.
4. Cron طويل تحت timeout → 504 / headers sent.
5. job-worker يكمل أنواعًا غير معروفة كنجاح (`no_inline_worker_yet`).
6. Preview معطّل → لا بوابة E2E قبل الدمج.

## التوافق مع Production

- الكود متوافق شكليًا مع build، لكن السلوك الموزع غير مضمون دون Migration + durable store + Preview.

## قياسات السجلات

- تعذّر القياس الآلي من هذه الجلسة بدون وصول Vercel Logs موثّق؛ راجع `docs/audits/pr616-production-log-verification.md`.
