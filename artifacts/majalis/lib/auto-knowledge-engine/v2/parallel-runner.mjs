/**
 * AKE v2 — Parallel connector runner with rate limiting and circuit breaker.
 */

const circuitBreakers = new Map();

export function getCircuitState(slug) {
  return circuitBreakers.get(slug) || { failures: 0, openUntil: 0 };
}

export function recordCircuitFailure(slug) {
  const state = getCircuitState(slug);
  state.failures++;
  if (state.failures >= 3) {
    state.openUntil = Date.now() + 15 * 60 * 1000;
  }
  circuitBreakers.set(slug, state);
}

export function recordCircuitSuccess(slug) {
  circuitBreakers.set(slug, { failures: 0, openUntil: 0 });
}

export function isCircuitOpen(slug) {
  const state = getCircuitState(slug);
  if (state.openUntil > Date.now()) return true;
  if (state.openUntil && state.openUntil <= Date.now()) {
    circuitBreakers.set(slug, { failures: 0, openUntil: 0 });
  }
  return false;
}

export async function runConnectorsParallel(connectors, processor, { maxWorkers = 4, budgetMs = 35000 } = {}) {
  const started = Date.now();
  const results = [];
  const queue = [...connectors];
  const active = new Set();

  return new Promise((resolve) => {
    const pump = () => {
      while (active.size < maxWorkers && queue.length > 0 && Date.now() - started < budgetMs) {
        const config = queue.shift();
        if (isCircuitOpen(config.slug)) {
          results.push({ slug: config.slug, skipped: true, reason: "circuit_open" });
          continue;
        }

        const promise = processor(config)
          .then((result) => {
            if (result?.errors?.length) recordCircuitFailure(config.slug);
            else recordCircuitSuccess(config.slug);
            results.push({ slug: config.slug, ...result });
          })
          .catch((err) => {
            recordCircuitFailure(config.slug);
            results.push({ slug: config.slug, error: err.message });
          })
          .finally(() => {
            active.delete(promise);
            if (queue.length === 0 && active.size === 0) {
              resolve({ results, durationMs: Date.now() - started });
            } else {
              pump();
            }
          });

        active.add(promise);
      }

      if (queue.length === 0 && active.size === 0) {
        resolve({ results, durationMs: Date.now() - started });
      }
    };

    pump();
  });
}

export async function loadV2Settings(admin) {
  if (!admin) {
    return { cron_interval_minutes: 15, max_parallel_workers: 4, enable_unified_dedup: true };
  }
  try {
    const { data } = await admin.from("ake_v2_settings").select("*").eq("id", "global").maybeSingle();
    return data || { cron_interval_minutes: 15, max_parallel_workers: 4 };
  } catch {
    return { cron_interval_minutes: 15, max_parallel_workers: 4 };
  }
}
