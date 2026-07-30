# Reliability — المجلس العلمي

## Contracts

| Concern | Implementation |
|---|---|
| Timeouts | `REQUEST_TIMEOUT_MS` / `PAGE_LOAD_TIMEOUT_MS` = 8s (`request-manager.ts`) |
| Retries | `DEFAULT_RETRY_POLICY` — max 1 retry, exponential backoff + full jitter |
| Circuit breaker | `CircuitBreakerRegistry` / `networkCircuitBreakers` — open after 5 failures, half-open after 30s |
| Dedupe | In-flight GET/HEAD + `RequestManager.run` by `dedupeKey` |
| Graceful failure | `runWithTimeout` returns `{ data, error }` without throwing when `fallback` set |
| Structured logs | `structuredLog` JSON lines (`ts`, `level`, `msg`, `service`) — secrets redacted |
| Health | `GET /api/healthz` — `ok`, `uptimeMs`, commit/build ids, `Cache-Control: no-store` |
| Diagnostics | Ring buffer `logDiagnostic` (audio/idb/fetch) |

## Failure modes

1. **Transient network** → backoff retry → success or surfaced error.
2. **Repeated dependency failure** → circuit opens → `CircuitOpenError` (fail-fast).
3. **Page load hang** → hard-cap timeout → loading cleared via `safeLoadEffect` / `runWithTimeout`.
4. **Stale chunk after deploy** → `lazyWithRetry` single reload.

## Monitoring hooks

- Slow ops: `PERF_SLOW_MS` (3s) via `performance-monitor`.
- Client errors: `error-report` + local ring + optional server post.
- Platform crons: `/api/cron/system-health`, `/api/cron/connector-health` (authenticated).

## Gates

- `pnpm --filter @workspace/majalis run test:phase8-reliability`
- Unit: `src/lib/__tests__/phase8-reliability.test.ts`

## Anti-patterns

- Silent `catch {}` that leaves UI in infinite loading.
- Unbounded retries without circuit breaker.
- Logging Authorization / anon keys.
- Caching `/api/healthz`.
