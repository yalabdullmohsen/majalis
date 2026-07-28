/**
 * Part 21 — Cross-storage state drift reconciliation.
 * Detects discrepancies between Memory Cache, SessionStorage, LocalStorage,
 * and IndexedDB (abrupt tab close, multi-window, quota truncation) and
 * resolves toward the newest authoritative payload (LWW by updatedAt / savedAt).
 * Logic-only — no UI.
 */

import { isPlainObject, readLocalJson, writeLocalJson } from "@/lib/safe-json";

export type StorageLayerName = "memory" | "session" | "local" | "idb";

export type StorageSnapshot = {
  layer: StorageLayerName;
  /** ISO timestamp or epoch ms when known; 0 if unknown. */
  version: number;
  /** Serialized payload (JSON string) for comparison. */
  payload: string | null;
};

export type DriftFinding = {
  key: string;
  layers: StorageSnapshot[];
  drifted: boolean;
  /** Winning layer after LWW. */
  authoritative: StorageLayerName | null;
  /** Winning payload. */
  resolvedPayload: string | null;
};

export type ReconcileResult = {
  findings: DriftFinding[];
  repaired: number;
  checked: number;
  at: string;
};

type MemoryEntry = { version: number; payload: string | null };

const memoryCache = new Map<string, MemoryEntry>();

export function setMemoryStorageCache(key: string, value: unknown, version = Date.now()): void {
  try {
    memoryCache.set(key, {
      version,
      payload: value == null ? null : typeof value === "string" ? value : JSON.stringify(value),
    });
  } catch {
    /* ignore */
  }
}

export function getMemoryStorageCache(key: string): MemoryEntry | undefined {
  return memoryCache.get(key);
}

export function clearMemoryStorageCache(key?: string): void {
  if (key) memoryCache.delete(key);
  else memoryCache.clear();
}

function parseVersion(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const t = Date.parse(raw);
    if (Number.isFinite(t)) return t;
  }
  return 0;
}

/** Extract a best-effort version from common shapes. */
export function extractPayloadVersion(payload: string | null): number {
  if (!payload) return 0;
  try {
    const parsed: unknown = JSON.parse(payload);
    if (Array.isArray(parsed) && parsed.length) {
      let max = 0;
      for (const item of parsed) {
        if (!isPlainObject(item)) continue;
        const v =
          parseVersion(item.updatedAt) ||
          parseVersion(item.savedAt) ||
          parseVersion(item.reviewed_at) ||
          parseVersion(item.version);
        if (v > max) max = v;
      }
      return max || parsed.length;
    }
    if (isPlainObject(parsed)) {
      return (
        parseVersion(parsed.updatedAt) ||
        parseVersion(parsed.savedAt) ||
        parseVersion(parsed.reviewed_at) ||
        parseVersion(parsed.version) ||
        parseVersion(parsed.at) ||
        0
      );
    }
  } catch {
    /* ignore */
  }
  return 0;
}

function readSession(key: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string | null): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (value == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* quota */
  }
}

function readLocalRaw(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalRaw(key: string, value: string | null): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* quota */
  }
}

export type ReconcileChannel = {
  key: string;
  /** Optional IDB store + record key to compare. */
  idb?: { store: string; recordKey: string };
  /** Prefer this layer on equal versions. */
  prefer?: StorageLayerName;
};

/**
 * Compare layers for one logical key and pick LWW winner.
 * Does not mutate storage — use `applyReconcileFinding` / `reconcileChannels`.
 */
export function detectDrift(
  key: string,
  layers: StorageSnapshot[],
  prefer: StorageLayerName = "idb",
): DriftFinding {
  const present = layers.filter((l) => l.payload != null);
  if (present.length <= 1) {
    const only = present[0] ?? null;
    return {
      key,
      layers,
      drifted: false,
      authoritative: only?.layer ?? null,
      resolvedPayload: only?.payload ?? null,
    };
  }

  const payloads = new Set(present.map((l) => l.payload));
  const drifted = payloads.size > 1;

  let best = present[0]!;
  for (const snap of present.slice(1)) {
    const bv = snap.version || extractPayloadVersion(snap.payload);
    const av = best.version || extractPayloadVersion(best.payload);
    if (bv > av) best = snap;
    else if (bv === av && snap.layer === prefer) best = snap;
    else if (bv === av && best.layer !== prefer && layerRank(snap.layer) > layerRank(best.layer)) {
      best = snap;
    }
  }

  return {
    key,
    layers,
    drifted,
    authoritative: best.layer,
    resolvedPayload: best.payload,
  };
}

function layerRank(layer: StorageLayerName): number {
  // Higher = more durable / preferred on ties after `prefer`
  switch (layer) {
    case "idb":
      return 4;
    case "local":
      return 3;
    case "session":
      return 2;
    case "memory":
      return 1;
    default:
      return 0;
  }
}

/** Write the authoritative payload into all weaker / drifted layers. */
export async function applyReconcileFinding(
  finding: DriftFinding,
  opts?: { idb?: { store: string; recordKey: string } },
): Promise<boolean> {
  if (!finding.drifted || finding.resolvedPayload == null) return false;
  const payload = finding.resolvedPayload;
  const version = extractPayloadVersion(payload) || Date.now();

  writeLocalRaw(finding.key, payload);
  writeSession(finding.key, payload);
  setMemoryStorageCache(finding.key, payload, version);

  if (opts?.idb) {
    try {
      const { idbPut } = await import("@/lib/offline-db");
      const parsed = JSON.parse(payload) as unknown;
      await idbPut(
        opts.idb.store as "meta" | "quran" | "adhkar" | "articles" | "flashcards",
        opts.idb.recordKey,
        parsed,
      );
    } catch {
      /* IDB optional */
    }
  }
  return true;
}

async function snapshotIdb(
  store: string,
  recordKey: string,
): Promise<StorageSnapshot> {
  try {
    const { idbGet } = await import("@/lib/offline-db");
    const row = await idbGet(
      store as "meta" | "quran" | "adhkar" | "articles" | "flashcards",
      recordKey,
    );
    if (!row) return { layer: "idb", version: 0, payload: null };
    return {
      layer: "idb",
      version: parseVersion(row.updatedAt),
      payload: JSON.stringify(row.value),
    };
  } catch {
    return { layer: "idb", version: 0, payload: null };
  }
}

/**
 * Reconcile a list of channels (LS ↔ session ↔ memory ↔ optional IDB).
 */
export async function reconcileChannels(
  channels: ReconcileChannel[],
): Promise<ReconcileResult> {
  const findings: DriftFinding[] = [];
  let repaired = 0;

  for (const ch of channels) {
    const mem = memoryCache.get(ch.key);
    const localRaw = readLocalRaw(ch.key);
    const sessionRaw = readSession(ch.key);
    const layers: StorageSnapshot[] = [
      {
        layer: "memory",
        version: mem?.version ?? extractPayloadVersion(mem?.payload ?? null),
        payload: mem?.payload ?? null,
      },
      {
        layer: "session",
        version: extractPayloadVersion(sessionRaw),
        payload: sessionRaw,
      },
      {
        layer: "local",
        version: extractPayloadVersion(localRaw),
        payload: localRaw,
      },
    ];
    if (ch.idb) {
      layers.push(await snapshotIdb(ch.idb.store, ch.idb.recordKey));
    }

    const finding = detectDrift(ch.key, layers, ch.prefer ?? "idb");
    findings.push(finding);
    if (finding.drifted) {
      const ok = await applyReconcileFinding(finding, { idb: ch.idb });
      if (ok) repaired += 1;
    } else if (finding.resolvedPayload != null) {
      // Warm memory from authoritative even when no drift
      setMemoryStorageCache(
        ch.key,
        finding.resolvedPayload,
        extractPayloadVersion(finding.resolvedPayload) || Date.now(),
      );
    }
  }

  return {
    findings,
    repaired,
    checked: channels.length,
    at: new Date().toISOString(),
  };
}

/** Core user-state keys watched at boot. */
export const DEFAULT_RECONCILE_CHANNELS: ReconcileChannel[] = [
  { key: "majalis-local-bookmarks-v1", prefer: "local" },
  { key: "mj-quran-bookmarks-v1", prefer: "local" },
  { key: "majalis-flashcard-reviews-v1", prefer: "local" },
  { key: "majalis-khatmah-v1", prefer: "local" },
  { key: "majalis-user-streak-v1", prefer: "local" },
];

let lastResult: ReconcileResult | null = null;

export function getLastReconcileResult(): ReconcileResult | null {
  return lastResult;
}

/** Boot-safe reconcile of default channels + optional extras. */
export async function runStorageReconcile(
  extra: ReconcileChannel[] = [],
): Promise<ReconcileResult> {
  const result = await reconcileChannels([...DEFAULT_RECONCILE_CHANNELS, ...extra]);
  lastResult = result;
  try {
    writeLocalJson("majalis-storage-reconcile-meta-v1", {
      at: result.at,
      repaired: result.repaired,
      checked: result.checked,
    });
  } catch {
    /* ignore */
  }
  return result;
}

/** Test helper */
export function resetStorageReconcilerForTests(): void {
  memoryCache.clear();
  lastResult = null;
}

/** Convenience: compare two JSON strings for equality (order-sensitive). */
export function payloadsEqual(a: string | null, b: string | null): boolean {
  return a === b;
}

/** Read reconcile meta for diagnostics. */
export function readReconcileMeta(): { at?: string; repaired?: number; checked?: number } {
  return readLocalJson("majalis-storage-reconcile-meta-v1", {}, isPlainObject);
}
