# Supabase Security Hardening Pack — مراجعة فقط

**الحالة: لم يُطبَّق على Production.**  
**المشروع:** `ngmvmlulzacrlicuagyp`  
**المصدر:** تدقيق حي anon بتاريخ 2026-07-30 + ملفات `platform_hardening_security_v1.sql` / `rls_lockdown_v1.sql` / `p0_security_definer_grants_v2.sql`

## قيود ملزمة

- لا `DROP TABLE` / لا `DROP COLUMN`
- لا سياسات `USING (true)` في هذه الحزمة
- لا منح واسعة جديدة لـ `anon` / `authenticated`
- `REVOKE` قبل أي `GRANT`
- كل خطوة في `BEGIN` … `COMMIT` مستقلة؛ عند الخطأ: `ROLLBACK` قبل أي `COMMIT`
- لا تغيير إعدادات Auth Dashboard من هنا
- التطبيق يدوي بعد Preflight وموافقة المالك فقط

---

## Preflight (read-only) — نفّذ أولًا في SQL Editor

```sql
-- P0: الجداول الحساسة + RLS
SELECT c.relname,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'background_jobs','background_job_attempts','background_job_dead_letters',
    'ai_provider_circuit','ake_connectors','knowledge_official_sources',
    'open_api_keys','open_webhooks','open_webhook_deliveries',
    'admin_audit_logs','governance_security_audits','governance_user_roles',
    'ake_job_queue','akp_dead_letter_jobs','mke_runs'
  )
ORDER BY 1;

-- P1: سياسات
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'background_jobs','ai_provider_circuit','ake_connectors',
    'open_api_keys','governance_user_roles'
  )
ORDER BY tablename, policyname;

-- P2: Grants لـ anon/authenticated على الحساس
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon','authenticated','PUBLIC')
  AND table_name IN (
    'background_jobs','background_job_attempts','background_job_dead_letters',
    'ai_provider_circuit','ake_connectors','knowledge_official_sources',
    'open_api_keys','open_webhooks','admin_audit_logs','governance_security_audits'
  )
ORDER BY table_name, grantee, privilege_type;

-- P3: SECURITY DEFINER + search_path + EXECUTE
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef AS security_definer,
       p.proconfig AS config,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec,
       has_function_privilege('PUBLIC', p.oid, 'EXECUTE') AS public_exec
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_admin','record_lesson_view','increment_fiqh_item_views',
    'accept_family_invite','get_similar_users','upsert_user_interest'
  )
ORDER BY 1;

-- P4: extensions في public
SELECT e.extname, n.nspname
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY 1;

-- P5: DEFAULT PRIVILEGES الخطرة
SELECT defaclrole::regrole, defaclnamespace::regnamespace, defaclobjtype, defaclacl
FROM pg_default_acl
WHERE defaclnamespace = 'public'::regnamespace;
```

فسّر النتائج قبل أي خطوة كتابة. إن كانت الجداول الحساسة أصلًا `401` من PostgREST وبدون grants لـ anon، تخطَّ الخطوة الموافقة.

---

## الخطوة A — جداول الموثوقية / الطابور (service-role only)

```sql
BEGIN;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'background_jobs',
    'background_job_attempts',
    'background_job_dead_letters',
    'ai_provider_circuit'
  ]
  LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      RAISE NOTICE 'skip missing %', t;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);

    -- سياسات رفض صريحة (ليست USING true)
    EXECUTE format('DROP POLICY IF EXISTS deny_all_select ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS deny_all_insert ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS deny_all_update ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS deny_all_delete ON public.%I', t);

    EXECUTE format(
      'CREATE POLICY deny_all_select ON public.%I FOR SELECT TO anon, authenticated USING (false)',
      t
    );
    EXECUTE format(
      'CREATE POLICY deny_all_insert ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (false)',
      t
    );
    EXECUTE format(
      'CREATE POLICY deny_all_update ON public.%I FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false)',
      t
    );
    EXECUTE format(
      'CREATE POLICY deny_all_delete ON public.%I FOR DELETE TO anon, authenticated USING (false)',
      t
    );

    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', t);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t);
  END LOOP;
END $$;

COMMIT;
```

### تحقق A

```sql
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public'
  AND table_name LIKE 'background_job%'
  AND grantee IN ('anon','authenticated');
-- المتوقع: صفر صفوف

-- من عميل anon (خارج SQL): GET /rest/v1/background_jobs → 401
```

عند الفشل قبل COMMIT: `ROLLBACK;`

---

## الخطوة B — إغلاق التسريب الحي: `ake_connectors` + مصادر رسمية

```sql
BEGIN;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ake_connectors',
    'knowledge_official_sources'
  ]
  LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      RAISE NOTICE 'skip missing %', t;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);

    -- إزالة سياسات القراءة العامة إن وُجدت بأسماء شائعة (لا DROP للجدول)
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'enable_read_for_all', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'public_read', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_public_read', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'anon_select', t);

    EXECUTE format('DROP POLICY IF EXISTS deny_client_select ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS deny_client_write ON public.%I', t);

    EXECUTE format(
      'CREATE POLICY deny_client_select ON public.%I FOR SELECT TO anon, authenticated USING (false)',
      t
    );
    EXECUTE format(
      'CREATE POLICY deny_client_write ON public.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      t
    );

    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', t);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t);
  END LOOP;
END $$;

COMMIT;
```

> ملاحظة منتج: إن كانت الواجهة تعتمد قراءة `ake_connectors` من المتصفح، انقل القراءة إلى API خادمي بـ `service_role` قبل التطبيق.

### تحقق B

```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name='ake_connectors'
  AND grantee IN ('anon','authenticated');
-- المتوقع: صفر
```

---

## الخطوة C — طوابير/مفاتيح/سجلات تشغيلية (دفعة واحدة)

```sql
BEGIN;

DO $$
DECLARE
  t TEXT;
  ops TEXT[] := ARRAY[
    'open_api_keys','open_webhooks','open_webhook_deliveries','open_api_audit_logs',
    'admin_audit_logs','governance_security_audits','governance_audit_log',
    'governance_user_roles','governance_backup_runs','governance_reviews',
    'ake_job_queue','ake_audit_log','ake_cache','ake_engine_runs',
    'akp_dead_letter_jobs','akp_retry_queue','akp_pipeline_runs','akp_review_queue',
    'akp_content_sources','akp_alerts','akp_metrics_snapshots',
    'mke_runs','mke_queue_jobs','mke_notification_jobs','mke_self_heal_log',
    'ai_generation_jobs',
    'content_production_logs','content_production_dead_letter',
    'content_production_retry_queue','content_production_review_queue',
    'content_production_staging','content_scheduler_jobs','content_scheduler_runs',
    'auto_import_logs','auto_import_runs','auto_publish_queue',
    'automation_runs','automation_step_logs'
  ];
BEGIN
  FOREACH t IN ARRAY ops
  LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS deny_client_all ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY deny_client_all ON public.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      t
    );
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', t);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t);
  END LOOP;
END $$;

COMMIT;
```

### تحقق C

من عميل anon:  
`GET /rest/v1/open_api_keys` و `GET /rest/v1/ake_job_queue` و `GET /rest/v1/admin_audit_logs` → **401**.

---

## الخطوة D — SECURITY DEFINER / EXECUTE

```sql
BEGIN;

-- is_admin: يبقى DEFINER (يحتاج قراءة profiles عبر RLS) مع search_path مثبت
DO $fn$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='is_admin'
      AND pg_get_function_identity_arguments(p.oid)=''
  ) THEN
    ALTER FUNCTION public.is_admin() SET search_path = pg_catalog, public;
    REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
    GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
  END IF;
END
$fn$;

-- عدّادات مقصودة للعامة — تثبيت المسار + منع PUBLIC العريض
DO $fn$
BEGIN
  IF to_regprocedure('public.record_lesson_view(uuid)') IS NOT NULL THEN
    ALTER FUNCTION public.record_lesson_view(uuid) SET search_path = pg_catalog, public;
    REVOKE ALL ON FUNCTION public.record_lesson_view(uuid) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.record_lesson_view(uuid) TO anon, authenticated, service_role;
  END IF;
  IF to_regprocedure('public.increment_fiqh_item_views(text)') IS NOT NULL THEN
    ALTER FUNCTION public.increment_fiqh_item_views(text) SET search_path = pg_catalog, public;
    REVOKE ALL ON FUNCTION public.increment_fiqh_item_views(text) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.increment_fiqh_item_views(text) TO anon, authenticated, service_role;
  END IF;
END
$fn$;

-- دوال عائلية/توصيات إن وُجدت: لا EXECUTE لـ anon/PUBLIC
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'accept_family_invite','revoke_family_link',
        'get_similar_users','upsert_user_interest',
        'profile_privileges_unchanged'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = pg_catalog, public',
      r.nspname, r.proname, r.args
    );
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC', r.nspname, r.proname, r.args);
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM anon', r.nspname, r.proname, r.args);
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role',
      r.nspname, r.proname, r.args
    );
  END LOOP;
END $$;

COMMIT;
```

### تحقق D

```sql
SELECT p.proname,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.proname='is_admin';
-- المتوقع: anon_exec = false

-- من عميل anon: POST /rest/v1/rpc/is_admin → 401
```

---

## الخطوة E — DEFAULT PRIVILEGES (إن سمحت الصلاحيات)

```sql
BEGIN;

DO $$
BEGIN
  BEGIN
    EXECUTE $sql$
      ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
        REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated
    $sql$;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'skip defaults for postgres (42501)';
  END;
  BEGIN
    EXECUTE $sql$
      ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
        REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated
    $sql$;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'skip defaults for supabase_admin (42501)';
  END;
END $$;

-- سحب TRUNCATE الخطرة من كل جداول public الحالية
REVOKE TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public
  FROM anon, authenticated;

COMMIT;
```

### تحقق E

```sql
SELECT defaclrole::regrole, defaclacl
FROM pg_default_acl
WHERE defaclnamespace = 'public'::regnamespace;
```

---

## خارج النطاق في هذه الحزمة

- إنشاء/تعديل سياسات محتوى عام (`lessons`, `qa_*`, …)
- أي `USING (true)`
- Auth Dashboard (MFA / Leaked passwords / redirect URLs)
- نقل امتدادات من `public` (يتطلب تخطيطًا منفصلًا)
- Storage policies (لم تُثبت حيًا؛ راجع بعد Preflight `storage.objects`)

---

## تأكيد الوكيل

- **لم يُطبَّق** أي جزء من هذه الحزمة على Production.
- التطبيق يدوي فقط بعد Preflight وموافقة صريحة.
- بعد التطبيق: أعد فحص anon على `ake_connectors` / `background_jobs` / `open_api_keys` / `rpc/is_admin`.
