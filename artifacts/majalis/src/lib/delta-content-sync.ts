/**
 * Delta Data Synchronization — apply JSON diffs for static packs
 * (adhkar / tafsir / text fixes) instead of full re-downloads.
 * Compatible with offline-engine logical stores + revision strings.
 */

import {
  idbDelete,
  idbGetValue,
  idbPut,
  isOnline,
  OFFLINE_STORES,
  type OfflineStoreName,
} from "@/lib/offline-db";

export type DeltaOp =
  | { op: "set"; key: string; value: unknown }
  | { op: "delete"; key: string }
  | { op: "merge"; key: string; value: Record<string, unknown> };

export type ContentDeltaPack = {
  packId: string;
  store: OfflineStoreName;
  baseRevision: string;
  targetRevision: string;
  ops: DeltaOp[];
  fetchedAt?: string;
};

export type DeltaSyncState = {
  /** packId → last applied revision */
  revisions: Record<string, string>;
  lastSyncAt: string | null;
  lastError: string | null;
};

const LS_STATE = "majalis-delta-sync-state-v1";
const IDB_STATE = "delta-sync-state";
const DEFAULT_DELTA_URL = "/api/content-delta";

function emptyState(): DeltaSyncState {
  return { revisions: {}, lastSyncAt: null, lastError: null };
}

export function loadDeltaSyncState(): DeltaSyncState {
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<DeltaSyncState>;
    return {
      revisions: parsed.revisions || {},
      lastSyncAt: parsed.lastSyncAt ?? null,
      lastError: parsed.lastError ?? null,
    };
  } catch {
    return emptyState();
  }
}

export function saveDeltaSyncState(state: DeltaSyncState): DeltaSyncState {
  try {
    localStorage.setItem(LS_STATE, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_STATE, state).catch(() => undefined);
  return state;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Apply a delta pack locally. Returns number of successful ops. */
export async function applyContentDelta(pack: ContentDeltaPack): Promise<number> {
  const state = loadDeltaSyncState();
  const current = state.revisions[pack.packId];

  // Skip if already at/after target
  if (current && current === pack.targetRevision) return 0;

  // Soft check base — still apply if base unknown (first install)
  if (current && pack.baseRevision && current !== pack.baseRevision) {
    // Allow forward apply anyway for lightweight clients; record warning
    state.lastError = `base mismatch for ${pack.packId}: have ${current}, expected ${pack.baseRevision}`;
  }

  let applied = 0;
  for (const op of pack.ops || []) {
    try {
      if (op.op === "set") {
        await idbPut(pack.store, op.key, op.value, pack.targetRevision);
        applied += 1;
      } else if (op.op === "delete") {
        await idbDelete(pack.store, op.key);
        applied += 1;
      } else if (op.op === "merge") {
        const prev = (await idbGetValue<Record<string, unknown>>(pack.store, op.key)) || {};
        const next = isPlainObject(prev) ? { ...prev, ...op.value } : { ...op.value };
        await idbPut(pack.store, op.key, next, pack.targetRevision);
        applied += 1;
      }
    } catch {
      /* continue other ops */
    }
  }

  state.revisions[pack.packId] = pack.targetRevision;
  state.lastSyncAt = new Date().toISOString();
  if (!state.lastError) state.lastError = null;
  saveDeltaSyncState(state);
  return applied;
}

/**
 * Fetch delta packs from a lightweight endpoint.
 * Query: ?packs=adhkar,tafsir&sinceRev[adhkar]=...
 * Silent empty array on failure / offline.
 */
export async function fetchContentDeltas(opts?: {
  url?: string;
  packIds?: string[];
}): Promise<ContentDeltaPack[]> {
  if (!isOnline()) return [];
  try {
    const state = loadDeltaSyncState();
    const packs = opts?.packIds || ["adhkar", "tafsir", "fawaid"];
    const params = new URLSearchParams();
    params.set("packs", packs.join(","));
    for (const id of packs) {
      const rev = state.revisions[id];
      if (rev) params.set(`since_${id}`, rev);
    }
    const url = `${opts?.url || DEFAULT_DELTA_URL}?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return [];
    const json = (await res.json()) as { packs?: ContentDeltaPack[] } | ContentDeltaPack[];
    if (Array.isArray(json)) return json;
    return Array.isArray(json.packs) ? json.packs : [];
  } catch {
    return [];
  }
}

/** Fetch + apply all available deltas — scheduled with backoff when used from background. */
export async function runDeltaSync(opts?: {
  url?: string;
  packIds?: string[];
}): Promise<{ packs: number; ops: number }> {
  try {
    const packs = await fetchContentDeltas(opts);
    let ops = 0;
    for (const pack of packs) {
      ops += await applyContentDelta(pack);
    }
    if (!packs.length) {
      const state = loadDeltaSyncState();
      state.lastSyncAt = new Date().toISOString();
      state.lastError = null;
      saveDeltaSyncState(state);
    }
    return { packs: packs.length, ops };
  } catch (e) {
    const state = loadDeltaSyncState();
    state.lastError = e instanceof Error ? e.message : "delta sync failed";
    saveDeltaSyncState(state);
    return { packs: 0, ops: 0 };
  }
}

/** Enqueue delta sync with exponential backoff + jitter (Part 17). */
export function scheduleDeltaSync(opts?: {
  url?: string;
  packIds?: string[];
}): void {
  void import("@/lib/sync-backoff").then(({ scheduleBackgroundSync }) => {
    scheduleBackgroundSync(
      "delta-content-sync",
      async () => {
        try {
          await runDeltaSync(opts);
          return { ok: true };
        } catch (err) {
          return { ok: false, error: String((err as Error)?.message || err) };
        }
      },
      { baseMs: 2_000, maxMs: 120_000, minIntervalMs: 10_000 },
    );
  });
}

/**
 * Build a local delta from two JSON snapshots (for tests / admin tooling).
 * Shallow key-level diff only.
 */
export function buildShallowDelta(opts: {
  packId: string;
  store: OfflineStoreName;
  baseRevision: string;
  targetRevision: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}): ContentDeltaPack {
  const ops: DeltaOp[] = [];
  const beforeKeys = new Set(Object.keys(opts.before));
  const afterKeys = new Set(Object.keys(opts.after));

  for (const key of afterKeys) {
    const a = opts.after[key];
    const b = opts.before[key];
    if (!(key in opts.before)) {
      ops.push({ op: "set", key, value: a });
    } else if (JSON.stringify(a) !== JSON.stringify(b)) {
      if (isPlainObject(a) && isPlainObject(b)) {
        ops.push({ op: "merge", key, value: a });
      } else {
        ops.push({ op: "set", key, value: a });
      }
    }
  }
  for (const key of beforeKeys) {
    if (!afterKeys.has(key)) ops.push({ op: "delete", key });
  }

  return {
    packId: opts.packId,
    store: opts.store,
    baseRevision: opts.baseRevision,
    targetRevision: opts.targetRevision,
    ops,
    fetchedAt: new Date().toISOString(),
  };
}

/** Validate pack shape before apply. */
export function isValidContentDeltaPack(pack: unknown): pack is ContentDeltaPack {
  if (!pack || typeof pack !== "object") return false;
  const p = pack as ContentDeltaPack;
  return (
    typeof p.packId === "string" &&
    typeof p.store === "string" &&
    typeof p.targetRevision === "string" &&
    Array.isArray(p.ops)
  );
}
