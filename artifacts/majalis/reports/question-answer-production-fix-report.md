# سؤال وجواب — Production Fix Report

**Date:** 2026-06-28  
**Branch:** `cursor/final-production-activation-92e6`

---

## 1. Why the game disappeared

| Root cause | Detail |
|------------|--------|
| Never merged/deployed | Game code was on feature branches, not on production bundle |
| Wrong table assumed | Reports checked `quiz_questions` (0 rows) — game uses **`sin_jeem_questions`** |
| Tables missing | `sin_jeem_*` tables return **404/PGRST205** on production — migration never applied |
| Seed never run | 527-question bank existed in repo JSON but was **never imported** to Supabase |

---

## 2. Where the question bank was

| Path | Count | Status |
|------|-------|--------|
| `artifacts/majalis/data/sin-jeem/questions-bank.json` | **527** | Primary production bank |
| `src/lib/sin-jeem/questions-seed.ts` | ~50 | Offline fallback (merged at runtime) |
| `scripts/sin-jeem-bank/` | generator sources | Used to build JSON bank |

**NOT the source of game data:**
- `quiz_questions` — separate quiz page feature (0 rows)
- `platform_quiz_questions` — content engine output (0 rows)
- `learning_quiz_questions` — digital learning module (0 rows)
- `content_engine_generated_questions` — AKE pipeline (0 rows)

---

## 3. Empty tables on production (verified live)

| Table | Rows | Used by game? |
|-------|------|---------------|
| `quiz_questions` | 0 | No |
| `platform_quiz_questions` | 0 | No |
| `learning_quiz_questions` | 0 | No |
| `content_engine_generated_questions` | 0 | No |
| `sin_jeem_questions` | **404 (missing)** | **Yes — source of truth** |
| `sin_jeem_categories` | **404 (missing)** | Yes |

---

## 4. Source of truth adopted

**Table:** `sin_jeem_questions` + `sin_jeem_categories`  
**API:** `/api/question-answer` (alias; legacy `/api/sin-jeem` retained)  
**Fallback:** `questions-bank.json` (527 questions) when DB empty — game never crashes

---

## 5–6. Question counts

| | Before | After (code) | After (production DB) |
|---|--------|--------------|----------------------|
| `sin_jeem_questions` | 0 (table missing) | Ready to seed 527 | **BLOCKED — needs secrets** |
| Local bank file | 527 | 527 | — |
| Merged runtime fallback | ~550+ | ~550+ | Works offline |

---

## 7. Categories

- **43** in `CATEGORY_SEED` (sin-jeem-seed.mjs)
- **37** unique category slugs used in question bank
- All bank questions have valid `category_slug` (verified)

---

## 8. UI rename to سؤال وجواب

| Area | Status |
|------|--------|
| Nav desktop + mobile | ✓ |
| Home feature card | ✓ |
| Game title | ✓ |
| Admin menu | ✓ |
| Legacy Sin Jeem visible text | Removed |
| Internal code/table names | `sin_jeem_*` kept (no breaking rename) |

---

## 9–11. Routes & navigation

| Route | Status |
|-------|--------|
| `/question-answer` | ✓ Registered |
| All sub-routes | ✓ |
| `/sin-jeem/*` redirects | ✓ |
| `/admin/question-answer` | ✓ |
| Nav links (always visible) | ✓ — not hidden when DB empty |

---

## 12. Test results

| Test | Result |
|------|--------|
| `smoke:question-answer-routes` | **30/30 PASS** |
| `verify-sin-jeem-seed-integrity` | **12/12 PASS** |
| `test-sin-jeem-engine` | **7/7 PASS** |
| `build` | **PASS** |
| `verify:question-answer:db` (live) | **FAIL** — tables missing (expected without migration) |
| `seed:question-answer` (live) | **BLOCKED** — no `SUPABASE_SERVICE_ROLE_KEY` |

---

## 13. Remaining blockers

To reach **>= 500 questions in Supabase Production**:

```bash
# 1. Add to Vercel:
#    DATABASE_URL
#    SUPABASE_SERVICE_ROLE_KEY

# 2. One-shot activation:
pnpm --filter @workspace/majalis run activate:question-answer

# OR via cron on deployed Vercel:
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.majlisilm.com/api/cron/apply-migrations?scope=question-answer&seed=1"

# 3. Verify:
pnpm --filter @workspace/majalis run verify:question-answer:db
```

**Also required:** Merge & deploy PR with this branch so `/api/question-answer` is live on production.

---

## Files changed

- `lib/question-answer-bank.mjs` — shared bank loader
- `lib/sin-jeem-seed.mjs` — idempotent seed with full report
- `lib/api-handlers/question-answer.js` — API alias
- `lib/api-handlers/sin-jeem.js` — categories/questions/daily_challenge actions
- `lib/api-dispatch.mjs` — register `/api/question-answer`
- `lib/api-handlers/cron/apply-migrations.js` — `scope=question-answer`
- `scripts/seed-question-answer.mjs` — official seed script
- `scripts/activate-question-answer-production.mjs` — one-shot activation
- `scripts/verify-question-answer*.mjs` — verification aliases
- `scripts/smoke-question-answer-routes.mjs` — enhanced (30 checks)
- Frontend API URLs → `/api/question-answer`

---

*Task code-complete. Production DB seed blocked on owner credentials only.*
