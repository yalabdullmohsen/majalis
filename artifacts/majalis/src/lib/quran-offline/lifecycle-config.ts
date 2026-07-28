/**
 * Quran offline resource lifecycle — budgets, inactivity windows, pin rules.
 * Pure config (no UI). User overrides via localStorage key below.
 */

export const LIFECYCLE_BUDGET_LS_KEY = "mj-quran-storage-budget-bytes-v1";
export const LIFECYCLE_INACTIVE_DAYS_LS_KEY = "mj-quran-asset-inactive-days-v1";

/** Default footprint ceiling — 500 MiB. */
export const DEFAULT_STORAGE_BUDGET_BYTES = 500 * 1024 * 1024;

/** Assets unused longer than this become LRU eviction candidates (unless pinned). */
export const DEFAULT_INACTIVE_DAYS = 14;

/** Evict down to this fraction of budget (hysteresis). */
export const BUDGET_HYSTERESIS = 0.85;

/** Knowledge rows colder than this may be pruned under pressure (days). */
export const KNOWLEDGE_COLD_DAYS = 30;

/** Max knowledge rows retained when pruning cold cache. */
export const KNOWLEDGE_SOFT_CAP = 12_000;

export type LifecycleBudgetConfig = {
  budgetBytes: number;
  inactiveDays: number;
};

function readPositiveInt(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  } catch {
    /* ignore */
  }
  return fallback;
}

export function getLifecycleBudgetConfig(): LifecycleBudgetConfig {
  if (typeof localStorage === "undefined") {
    return {
      budgetBytes: DEFAULT_STORAGE_BUDGET_BYTES,
      inactiveDays: DEFAULT_INACTIVE_DAYS,
    };
  }
  return {
    budgetBytes: readPositiveInt(LIFECYCLE_BUDGET_LS_KEY, DEFAULT_STORAGE_BUDGET_BYTES),
    inactiveDays: readPositiveInt(LIFECYCLE_INACTIVE_DAYS_LS_KEY, DEFAULT_INACTIVE_DAYS),
  };
}

/** Settings / vault may call this — no UI coupling required. */
export function setLifecycleBudgetBytes(bytes: number): void {
  try {
    localStorage.setItem(
      LIFECYCLE_BUDGET_LS_KEY,
      String(Math.max(32 * 1024 * 1024, Math.floor(bytes))),
    );
  } catch {
    /* ignore */
  }
}

export function setLifecycleInactiveDays(days: number): void {
  try {
    localStorage.setItem(
      LIFECYCLE_INACTIVE_DAYS_LS_KEY,
      String(Math.max(1, Math.min(365, Math.floor(days)))),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Combined LRU+LFU score — lower = evict first.
 * Primary: last access time; tie-break: access_count then larger size.
 */
export function evictionScore(opts: {
  lastAccessedAt: number;
  accessCount: number;
  sizeBytes: number;
  now?: number;
}): number {
  const now = opts.now ?? Date.now();
  const ageMs = Math.max(0, now - (opts.lastAccessedAt || 0));
  const freq = Math.max(0, opts.accessCount || 0);
  // Age dominates; low frequency boosts eviction priority; large blobs slightly preferred
  return ageMs / (1 + freq) + Math.min(opts.sizeBytes, 50 * 1024 * 1024) * 0.000001;
}
