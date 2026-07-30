# REQUIRES_EXPLICIT_APPROVAL

خطوات تتطلب موافقة يدوية من المالك — **لا ينفّذها الوكيل تلقائيًا**.

## 1) SQL على Staging ثم Production

طبّق بالترتيب في Supabase SQL Editor (أو CLI موثّق) بعد مراجعة:

1. `artifacts/majalis/supabase/enterprise_reliability_p0_v1.sql`  
   (إن كانت جداول الطابور/`ai_provider_circuit` ناقصة — يفسّر `/api/readyz` = 503)
2. `artifacts/majalis/supabase/background_jobs_runtime_hardening_v1.sql`
3. `artifacts/majalis/supabase/platform_hardening_security_v1.sql`
4. `artifacts/majalis/supabase/platform_bootstrap_runs_v1.sql`
5. `artifacts/majalis/supabase/p0_security_definer_grants_v2.sql`
6. عند الحاجة للاستيراد: `content_import_jobs_v1.sql` و `kuwait_lessons_extend.sql`

### Rollback

| Migration | Rollback |
|---|---|
| `background_jobs_runtime_hardening_v1.sql` | `background_jobs_runtime_hardening_v1_ROLLBACK.sql` |
| `platform_hardening_security_v1.sql` | `platform_hardening_security_v1_ROLLBACK.sql` |
| `platform_bootstrap_runs_v1.sql` | `platform_bootstrap_runs_v1_ROLLBACK.sql` |
| `p0_security_definer_grants_v2.sql` | `p0_security_definer_grants_v2_ROLLBACK.sql` |

CLI الموثّق (ليس HTTP):

```bash
MAJALIS_ALLOW_CLI_MIGRATIONS=1 DATABASE_URL=... \
  pnpm --filter @workspace/majalis exec node scripts/apply-activation-migrations.mjs
```

## 2) Supabase Auth Dashboard (لا يغيّره الوكيل)

- تفعيل **Leaked Password Protection**
- تفعيل **MFA** لحسابات الإدارة
- تثبيت **Redirect URLs**:
  - `https://majlisilm.com/**`
  - `https://www.majlisilm.com/**`
  - معاينات Vercel عند الحاجة
  - مخططات Capacitor إن لزم (`majlisilm://`)

راجع أيضًا: `artifacts/majalis/supabase/pending/2026-07-29_auth_dashboard_REQUIRES_APPROVAL.md`

## 3) Vercel Dashboard

- التأكد من `DATABASE_URL` / `SUPABASE_*` لدوال Production (سبب شائع لـ `/api/readyz` = 503)
- عدم تفعيل أي متغير `ALLOW_RUNTIME_SCHEMA_MIGRATIONS` (محظور نهائيًا)

## 4) Branch Protection / GitHub

- الإبقاء على Verify build إلزاميًا
- عدم توسيع PAT إن كفى `GITHUB_TOKEN`

## 5) ما لن يُنفَّذ من الوكيل

- لا SQL على Production
- لا تغيير Auth/Vercel Dashboard
- لا TestFlight / Signing
- لا Runtime DDL من Admin/Cron/API
