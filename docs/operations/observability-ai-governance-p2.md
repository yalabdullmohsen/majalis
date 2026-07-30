# P2 Observability + AI Cost Governance

## Metrics design

In-process aggregatable metrics (`lib/observability/metrics.mjs`):

| Metric | Type | Notes |
|---|---|---|
| `http.request.duration_ms` / `ai.call.duration_ms` / `db.query.duration_ms` / `cron.duration_ms` | histogram → p50/p95/p99 | Ring buffer samples |
| `queue.depth` | gauge | queued+running from `background_jobs` (readyz) |
| `queue.dlq_count` | gauge | dead_letter rows |
| `ai.request.count` | counter | successful + attempted spend rows |
| `ai.token.usage` | counter | input+output tokens (counts only, never text) |
| `ai.provider.cost_usd` | gauge/counter | estimated USD |
| `ai.cache.hit_ratio` | gauge | hits/(hits+misses) |
| `ai.retry.count` | counter | rate_limit/network/timeout only |
| `ai.circuit.state` | gauge | closed/open/half-open |

Durable samples table (optional): `observability_metric_samples`.

Correlation fields on every structured log: `request_id`, `trace_id`, `job_run_id`.

## Spending limits design

Env (defaults):

- `AI_DAILY_SPEND_LIMIT_USD` (default 25)
- `AI_MONTHLY_SPEND_LIMIT_USD` (default 400)

`runAiCall` checks `ai_spend_ledger` aggregates (or memory in tests) before calling a provider.
Cost estimate uses `PROVIDER_COST_PER_1M` tiers; ledger never stores prompts/completions.

Retry policy: **no retry** on `credit_exhausted`; limited retry on `rate_limited` / `network_error` / `timeout` / `provider_unavailable`.
Fallback: never escalate to a higher cost tier unless `allowExpensiveFallback: true`.

## Migrations (do NOT apply to Production without approval)

- `artifacts/majalis/supabase/observability_ai_governance_p2_v1.sql`
- `artifacts/majalis/supabase/observability_ai_governance_p2_v1_ROLLBACK.sql`
