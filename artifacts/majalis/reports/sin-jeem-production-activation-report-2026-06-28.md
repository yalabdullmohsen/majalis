# Sin Jeem — Production Database Activation Report

**Branch:** `cursor/sin-jeem-production-92e6`  
**Date:** 2026-06-28  
**Engineer:** Cloud Agent (Production)  
**Honest status:** **NOT 100%** — blocked on Vercel/Supabase secrets and production deploy

---

## Phase 1 — Secrets Check (Vercel Production)

| Variable | Present in agent env? | Required for |
|----------|----------------------|--------------|
| `DATABASE_URL` | **NO** | Apply migrations via `pg` (Transaction Pooler `:6543`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **NO** | Seed 527+ questions (bypass RLS), row-count verify |
| `CRON_SECRET` | **NO** | `GET/POST /api/cron/apply-migrations?scope=sin-jeem&seed=1` |
| `VITE_SUPABASE_URL` | YES | REST probes only |
| `VITE_SUPABASE_ANON_KEY` | YES | REST probes only |

### للمشرف — ما المطلوب؟

#### 1. `DATABASE_URL`

- **لماذا:** تطبيق `sin_jeem_v1.sql` و `sin_jeem_v1_2_types.sql` على PostgreSQL مباشرة (idempotent).
- **أين:** Vercel → Project → Settings → Environment Variables → **Production**
- **القيمة (مثال لمشروع `[PROJECT_REF]`):**
  ```
  postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres
  ```
- **مصدر كلمة المرور:** Supabase Dashboard → Project Settings → Database → Database password

#### 2. `SUPABASE_SERVICE_ROLE_KEY`

- **لماذا:** استيراد 527+ سؤال و 43+ فئة عبر REST upsert (بدونها لا يمكن seed من CI/agent).
- **أين:** Vercel Production env (و **لا** تُعرض في المتصفح — server only)
- **مصدر:** Supabase Dashboard → Project Settings → API → `service_role` secret

#### 3. `CRON_SECRET`

- **لماذا:** تشغيل migration + seed من Vercel cron/API بعد النشر.
- **أين:** Vercel Production env
- **الاستخدام:**
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" \
    "https://www.majlisilm.com/api/cron/apply-migrations?scope=sin-jeem&seed=1"
  ```

#### بديل: Supabase SQL Editor (بدون `DATABASE_URL` في Vercel)

نعم — يمكن تطبيق الـ schema يدوياً:

1. افتح [Supabase SQL Editor](https://supabase.com/dashboard/project/[PROJECT_REF]/sql)
2. نفّذ بالترتيب:
   - `supabase/sin_jeem_v1.sql`
   - `supabase/sin_jeem_v1_2_types.sql`
3. بعد ذلك شغّل seed من جهاز فيه `SUPABASE_SERVICE_ROLE_KEY`:
   ```bash
   pnpm --filter @workspace/majalis run seed:sin-jeem
   ```

**ملاحظة:** SQL Editor يغطي Phase 2 فقط. Phase 3 (seed) ما زالت تحتاج service role.

---

## Phase 2 — Migrations

| Item | Status |
|------|--------|
| `sin_jeem_v1.sql` exists | YES |
| `sin_jeem_v1_2_types.sql` exists | YES |
| Idempotent (`IF NOT EXISTS`) | YES |
| Applied on production | **NO** — `DATABASE_URL` missing |

**Live REST probe (2026-06-28):** all 18 tables return `PGRST205`.

---

## Phase 3 — Seed Production

| Item | Offline bank | Production DB |
|------|-------------|---------------|
| Questions | **527** | **0** |
| Categories | **43** (68 slugs incl. subs) | **0** |
| Question types | **18** | N/A |
| Seed integrity | **12/12 PASS** | Not run |

Seed blocked: no `SUPABASE_SERVICE_ROLE_KEY`.

---

## Phase 4 — `verify:sin-jeem:db`

```
Sin Jeem DB verify: 0 passed, 18 failed, 2 skipped
```

- 18/18 tables: **FAIL** (PGRST205)
- Questions ≥ 500: **skipped** (no service role)
- Categories ≥ 40: **skipped**

---

## Phase 5 — Live API Verification

Production URL tested: `https://www.majlisilm.com`

| Endpoint | HTTP | Result |
|----------|------|--------|
| `/api/sin-jeem?action=categories` | 200 | `{"ok":false,"message":"المسار غير موجود."}` |
| `/api/sin-jeem?action=questions` | — | Not deployed on current production |
| `/api/sin-jeem?action=leaderboard` | — | Not deployed |
| `/api/cron/apply-migrations?scope=sin-jeem` | 405/401 | Cron exists but auth/scope not activated |

**Additional blocker:** Sin Jeem API routes appear **not deployed** on production main — branch `cursor/sin-jeem-production-92e6` must be merged and deployed before live API tests pass.

---

## Phase 6 — Game Live Test (Production DB)

| Step | Status |
|------|--------|
| `/sin-jeem` UI | Works with **JSON fallback** (offline bank) |
| Questions from Supabase | **NO** — 0 rows |
| Score → Leaderboard in DB | **NO** — tables missing |
| Full live flow on Production DB | **BLOCKED** |

---

## Phase 7 — Admin Verification (Production DB)

Admin CRUD/import/audit: **code ready**, **live Supabase: NOT TESTED** (no tables, no service role).

---

## Phase 8 — Final Tests (This Run)

| Command | Result |
|---------|--------|
| `pnpm run typecheck` | **PASS** |
| `pnpm run build` | **PASS** |
| `pnpm run lint` | **PASS** (0 errors, 13 warnings) |
| `pnpm run verify:sin-jeem` | **30/30 PASS** |
| `pnpm run verify:sin-jeem:production` | **31/31 PASS** |
| `pnpm run verify:sin-jeem:seed` | **12/12 PASS** |
| `pnpm run test:sin-jeem-engine` | **7/7 PASS** |
| `pnpm run test:sin-jeem-e2e` | **44/44 PASS** |
| `pnpm run verify:sin-jeem:db` | **FAIL** (0/18 tables) |
| `pnpm run activate:sin-jeem` | **FAIL** at migration (`DATABASE_URL` missing) |

---

## Phase 9 — Summary Answers

| Question | Answer |
|----------|--------|
| DATABASE_URL exists? | **NO** |
| SUPABASE_SERVICE_ROLE_KEY exists? | **NO** |
| CRON_SECRET exists? | **NO** |
| Migrations applied? | **NO** |
| Tables present | **0/18** |
| Questions in Supabase | **0** |
| Categories in Supabase | **0** |
| verify:sin-jeem:db | **FAIL** |
| Live API | **FAIL** (route not found on prod + no DB) |
| Live browser on Production DB | **NOT PASS** |
| Leaderboard live | **NO** |
| Admin live on Supabase | **NO** |
| Anything blocking 100%? | **YES — see below** |

### Blockers (must resolve before claiming 100%)

1. Add **DATABASE_URL**, **SUPABASE_SERVICE_ROLE_KEY**, **CRON_SECRET** to Vercel Production
2. Merge & deploy `cursor/sin-jeem-production-92e6` to production (API + game routes)
3. Run activation:
   ```bash
   pnpm --filter @workspace/majalis run activate:sin-jeem
   ```
   Or SQL Editor + `seed:sin-jeem`
4. Re-run `verify:sin-jeem:db` — expect **18/18**, questions **≥500**
5. Live test: play → submit → leaderboard → admin CRUD

---

## Activation Checklist (for admin after secrets added)

```bash
export DATABASE_URL='postgresql://postgres.[PROJECT_REF]:...@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
export SUPABASE_SERVICE_ROLE_KEY='...'
export VITE_SUPABASE_URL='https://[PROJECT_REF].supabase.co'

pnpm --filter @workspace/majalis run activate:sin-jeem
pnpm --filter @workspace/majalis run verify:sin-jeem:db
```

Expected final state:

- 18/18 tables
- ≥527 questions published
- ≥43 categories
- Leaderboard entries writable
- API `/api/sin-jeem?action=*` returns JSON 200
- No PGRST205

**Do not mark Sin Jeem as production-ready until all above pass on live Supabase.**
