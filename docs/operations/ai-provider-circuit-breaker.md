# AI provider circuit breaker

## Behavior

- Module: `artifacts/majalis/lib/ai/provider-client.mjs`
- Classifier: `lib/ai/error-classifier.mjs`
- Durable state: table `ai_provider_circuit` (memory fallback in tests)

On first `credit_exhausted` / `authentication_error`:

1. Open circuit.
2. Persist `retry_after`.
3. Log **one** aggregated `ai.circuit.opened` event per day/reason.
4. Subsequent calls return `{ status: "provider_paused", reason, retryAfter }` **without** calling the provider.

## Admin reopen

```sql
UPDATE ai_provider_circuit
SET circuit_state = 'closed', opened_reason = NULL, retry_after = NULL, updated_at = now()
WHERE provider = 'anthropic';
```

Or wait until `retry_after` (default 30 minutes) for half-open probe.
