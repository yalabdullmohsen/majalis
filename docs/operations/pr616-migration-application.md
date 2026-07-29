# تطبيق Migration — enterprise_reliability_p0_v1

## التحقق هل مطبقة؟

في SQL Editor (Production) شغّل فقط استعلامات قراءة:

```sql
SELECT to_regclass('public.ai_provider_circuit') AS circuit,
       to_regclass('public.background_jobs') AS jobs,
       to_regclass('public.background_job_dead_letters') AS dead;

SELECT column_name FROM information_schema.columns
WHERE table_name = 'qa_categories' AND column_name = 'sort_order';

SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('ai_provider_circuit','background_jobs','background_job_dead_letters');
```

أو عبر Preview/Admin: `GET /api/cron/apply-migrations?action=verify` مع Cron secret (لا يطبّق DDL).

## التطبيق اليدوي الآمن

1. خذ نسخة احتياطية منطقية (Supabase backup / point-in-time).
2. طبّق الملف `artifacts/majalis/supabase/enterprise_reliability_p0_v1.sql` في SQL Editor.
3. أعد تشغيل استعلامات التحقق أعلاه.
4. راقب `/api/readyz` و`durable_store_unavailable` في السجلات.

**لا** تضبط `ALLOW_RUNTIME_SCHEMA_MIGRATIONS` — أُزيل مسار Runtime DDL.

## ترتيب Expand ثم Code

1. Migration أولًا (جداول/أعمدة/فهارس/RLS).
2. ثم نشر الكود الذي يعتمد عليها.
3. Rollback الكود ممكن دون حذف الجداول.

## Rollback غير مدمّر

- لا تحذف `background_jobs` / `ai_provider_circuit` إن احتوت بيانات.
- أوقف الميزات عبر إعادة نشر نسخة سابقة من الكود إن لزم.
- إزالة أعمدة فقط بعد فترة expand طويلة ومراجعة بيانات.

## اختبارات محلية / CI

```bash
export MIGRATION_TEST_DATABASE_URL=postgresql://...
pnpm db:migration:test:fresh
pnpm db:migration:test:upgrade
pnpm test:postgres-integration
```

لا تستخدم Production URL إلا بوعي صريح و`ALLOW_PROD_MIGRATION_TEST=1` (مرفوض افتراضيًا).
