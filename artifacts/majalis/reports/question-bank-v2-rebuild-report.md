# Question Bank v2 Emergency Rebuild Report

**Date:** 2026-06-29  
**Branch:** `cursor/question-bank-rebuild-v2-92e6`

## Summary

| Metric | Value |
|--------|-------|
| Legacy questions deleted | 527 |
| New questions (v2) | 527 |
| Categories | 43 |
| References | 20 |
| Quality rate | 100% |
| Text duplicate rate | 0% |
| Substantive similarity violations (≥90%) | 0 |
| Archive rejected (validation) | 2 |
| New curated facts added | 89 |

## Phases Completed

1. **Purge** — Archived `questions-bank-v1-archived.json`, cleared legacy inline seed
2. **v2 Schema** — UUID, title, evidence, reference, book_name, version, content_hash, player log tables (`sin_jeem_v2_rebuild.sql`)
3. **10-stage validation** — `lib/question-bank-v2/validate.mjs`
4. **Duplicate detection** — content hash + semantic similarity (`dedup.mjs`, 90% threshold)
5. **Player no-repeat** — `player-history.ts` + API `record_answer`
6. **Admin stats** — bank_stats panel in SinJeemSection
7. **Automation** — existing daily generation pipeline preserved; new facts gated by validation

## Tests

| Test | Result |
|------|--------|
| `verify:question-bank-v2` | 14/14 PASS |
| `verify-sin-jeem-seed-integrity` | PASS |
| `pnpm --filter @workspace/majalis run build` | PASS |
| ESLint | N/A (not configured) |
| Unit tests | N/A (no suite) |

## Production Migration (owner action)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.majlisilm.com/api/cron/apply-migrations?scope=question-answer&seed=1"
```

## Files Modified

- `data/sin-jeem/questions-bank.json` — full v2 rebuild
- `data/sin-jeem/archive/questions-bank-v1-archived.json` — legacy archive
- `lib/question-bank-v2/*` — validation, dedup, generator, facts, format, purge
- `scripts/rebuild-question-bank.mjs`, `scripts/verify-question-bank-v2.mjs`
- `supabase/sin_jeem_v2_rebuild.sql`
- `src/lib/sin-jeem/*` — types, engine, player-history, questions-bank
- `lib/api-handlers/sin-jeem.js` — record_answer, bank_stats
- `src/views/admin/SinJeemSection.tsx`, `SinJeemPlayPage.tsx`
- `lib/sin-jeem-seed.mjs` — category alignment

## Remaining

- Supabase production tables need migration (`CRON_SECRET` required)
- 2 archive questions rejected (validation edge cases) — replaced by new facts
