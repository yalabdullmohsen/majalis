# Production Automation Recovery Report

**Date:** 2026-06-26  
**Branch:** `cursor/automation-recovery-92e6`  
**Baseline (PR #191 audit):** ~45–55% production automation readiness  
**Post-code audit (pre-deploy):** 52% weighted readiness  
**Target:** ≥80% after deploy + migration/bootstrap execution

---

## 1. ما تم دمجه (Merged / Integrated)

| Item | Status |
|------|--------|
| PR #191 — production automation audit script | Cherry-picked (`7c61006`) |
| Health Dashboard timeout fix (8s → 35s via `AbortSignal.timeout`) | Included |
| Parallelized AKP production-health queries | Included |
| **New:** unified `automation-recovery` migration scope | This PR |
| **New:** `run-production-automation-recovery.mjs` orchestrator | This PR |
| **New:** AKE/MKE run recorders (no silent failures) | This PR |
| **New:** Content import schema hardening + `error_message` columns | This PR |

---

## 2. Migrations المطلوب تطبيقها على Production

Execute after deploy (requires `CRON_SECRET` + `DATABASE_URL` on Vercel):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.majlisilm.com/api/cron/apply-migrations?scope=automation-recovery"
```

---

## 3. Bootstrap / Recovery

```bash
CRON_SECRET=... pnpm --filter @workspace/majalis run recover:production-automation -- --production --apply
```

---

## 4. Root Causes

1. Missing migrations (`question_generation_*` 404)
2. Silent AKE/MKE run insert failures
3. Content import schema drift (`error_message` column)
4. AKP v3 never bootstrapped
5. Missing Vercel secrets (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`)

---

## 5. Readiness

| Metric | Value |
|--------|-------|
| PR #191 baseline | ~45–55% |
| Current (live, pre-deploy) | 52% |
| Target | ≥80% after deploy + recovery script |

See full operator steps in PR description.
