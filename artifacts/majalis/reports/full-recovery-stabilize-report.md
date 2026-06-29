# Full Requirement Recovery — Stabilization Report

**Date:** 2026-06-29  
**Branch:** `cursor/full-recovery-stabilize-92e6`  
**Production URL:** https://www.majlisilm.com

---

## Phase A — Merge & Deploy

| Item | Status |
|------|--------|
| PR #182 (`cursor/vision-2-integration-92e6`) | **MERGED** → `9400ac8` |
| PR #183 (`cursor/full-requirement-recovery-92e6`) | **MERGED** → `43bc19e` |
| Conflicts | `feed.xml` only — resolved with `--ours`; research routes preserved |
| Push to `origin/main` | **DONE** |
| CI on merge | **PASS** (typecheck + build) |
| Post-Deploy Verification workflow | **FAIL** (health gate — pre-existing; not blocking deploy) |
| Vercel production | **LIVE** — SPA shell + APIs responding |

Research smoke: **20/20** (from prior session, routes intact after merges).

---

## Phase B — Contact Migration

| Check | Status |
|-------|--------|
| `GET /api/contact?action=info` | **PASS** — `{"ok":true,"email":"yalabdullmohsen1@gmail.com"}` |
| `POST /api/contact?action=submit` | **FAIL (pre-fix deploy)** — 500 due to rate-limiter bug; **FIXED in this branch** |
| `contact_messages` table in Supabase | **NOT APPLIED** — `PGRST205 Could not find table` |
| Cron migration curl | **BLOCKED** — `CRON_SECRET` not available to cloud agent |

### Fixes in this branch

1. **`lib/api-handlers/contact.js`** — replaced invalid `submitRateLimit.check()` with `checkRateLimit()`; added `isMissingTableError` handling + memory fallback when table missing.
2. **`.github/workflows/post-deploy.yml`** — applies `contact-messages` + `question-answer&seed=1` on deploy when `CRON_SECRET` is set.
3. **`.github/workflows/recovery-migrations.yml`** — dedicated workflow for contact + Q&A migrations (runs on push to migration files or manual dispatch).

### Owner action required

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.majlisilm.com/api/cron/apply-migrations?scope=contact-messages"
```

Or trigger **Recovery Migrations** workflow in GitHub Actions after this PR merges.

---

## Phase C — Recovery Verification

```
node artifacts/majalis/scripts/test-full-requirement-recovery.mjs --base=https://www.majlisilm.com
→ 47/47 PASS
```

Re-run after deploy of this branch expected to remain **47/47**.

---

## Phase D — Broken Detail Audit

**Root cause:** `SafeLazyRoute` rendered detail components without Wouter `params`, causing `TypeError: Cannot read properties of undefined (reading 'id')`.

### Fixes

| Area | Fix |
|------|-----|
| All detail routes | `SafeLazyRoute` now passes `useParams()` as `params` prop (`App.tsx`, `AppRoutes.tsx`) |
| `/sheikhs/:id` | Restored from redirect-to-lessons; added `SheikhDetailPage` + `SheikhsPage` |
| `/fawaid/:id`, `/qa/:id` | Added `FawaidDetailPage`, `QaDetailPage` |
| `/mosques` | Added `MosquesPage` (lists mosques from active lessons) |

### Audit results

**Before (production):** 22/40 pass, 18 fail  
**After (local preview build):** **40/40 pass**

Script: `node scripts/audit-detail-pages.mjs --base=<url>`

---

## Phase E — Data Integrity AM/PM

| Metric | Before | After |
|--------|--------|-------|
| Lessons audited | 16 | 16 |
| AM/PM shorthand issues | 6 | **0** |
| Unparseable times | 0 | **0** |
| Prayer rank coverage | 100% | **100%** |

### Changes

- Normalized Kuwait import times: `6:00 م` → `6:00 مساءً` (full period word, western digits)
- Updated `02-kuwait-lessons.json` + `02-kuwait-lessons.csv`
- **Lesson detail UI:** time + prayer rank grouped under **«التوقيت ومرتبة الصلاة»** section

---

## Phase F — Question & Answer DB Activation

| Item | Status |
|------|--------|
| `sin_jeem_questions` table | **NOT PRESENT** in Supabase (`PGRST205`) |
| Migration SQL | `supabase/sin_jeem_v1.sql` (ready) |
| Seed target | ≥527 questions |
| Cron apply | **BLOCKED** without `CRON_SECRET` |

Post-deploy + recovery-migrations workflows will run:

```
/api/cron/apply-migrations?scope=question-answer&seed=1
```

when GitHub `CRON_SECRET` is configured.

---

## Phase G — Summary & Remaining Blockers

### Completed this session

- PRs #182 + #183 merged and deployed to main
- Contact API rate-limit crash fixed
- Detail pages: 40/40 pass (local verification)
- Lesson AM/PM normalization + prayer section UI
- Recovery migration CI wiring
- Detail audit script added

### Remaining blockers (require owner secrets)

1. **`CRON_SECRET`** — apply `contact-messages` + `question-answer` migrations on production DB
2. **Contact submit persistence** — depends on migration; memory fallback works until then
3. **`/admin/contact-messages`** — requires migration + admin auth
4. **Sin Jeem game** — `/question-answer` UI loads but DB tables empty until Phase F migration runs
5. **Post-Deploy gate** — may still fail until contact submit + DB health pass

### Not started (per instructions)

- **Majlis Map** — deferred until all phases pass

---

## Verification commands

```bash
# Recovery gate
node artifacts/majalis/scripts/test-full-requirement-recovery.mjs --base=https://www.majlisilm.com

# Detail pages
node artifacts/majalis/scripts/audit-detail-pages.mjs --base=https://www.majlisilm.com

# Lesson times
node artifacts/majalis/scripts/audit-repair-lesson-times.mjs

# Contact (after deploy + migration)
curl -X POST "https://www.majlisilm.com/api/contact?action=submit" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Verification message for recovery."}'
```
