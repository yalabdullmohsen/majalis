/**
 * Multi-device / multi-tab sync conflict resolution — LWW + version vectors.
 * Deterministic merge: never overwrite newer progress with stale records.
 * Logic-only — no UI.
 */

export type VersionVector = Record<string, number>;

export type LwwMeta = {
  /** Unix ms wall clock */
  updatedAt: number;
  /** Device/tab actor id */
  actorId: string;
  /** Per-actor monotonic counters */
  vv: VersionVector;
};

export type LwwRecord<T> = {
  value: T;
  meta: LwwMeta;
};

export function emptyVersionVector(): VersionVector {
  return Object.create(null) as VersionVector;
}

export function bumpVersionVector(vv: VersionVector, actorId: string): VersionVector {
  const next = { ...vv };
  next[actorId] = (next[actorId] ?? 0) + 1;
  return next;
}

/** True if `a` dominates `b` (every counter ≥). */
export function vvDominates(a: VersionVector, b: VersionVector): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if ((a[k] ?? 0) < (b[k] ?? 0)) return false;
  }
  return true;
}

/** True if vectors are concurrent (neither dominates). */
export function vvConcurrent(a: VersionVector, b: VersionVector): boolean {
  return !vvDominates(a, b) && !vvDominates(b, a);
}

export function mergeVersionVectors(a: VersionVector, b: VersionVector): VersionVector {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: VersionVector = {};
  for (const k of keys) {
    out[k] = Math.max(a[k] ?? 0, b[k] ?? 0);
  }
  return out;
}

/**
 * Last-Write-Wins with version-vector guard.
 * Prefer higher updatedAt; on equal timestamps break ties by actorId.
 * Concurrent VV + older wall clock loses.
 */
export function lwwPick<T>(local: LwwRecord<T>, remote: LwwRecord<T>): LwwRecord<T> {
  const vvMerged = mergeVersionVectors(local.meta.vv, remote.meta.vv);

  // If remote VV is strictly older and dominated, keep local
  if (vvDominates(local.meta.vv, remote.meta.vv) && !vvDominates(remote.meta.vv, local.meta.vv)) {
    if (local.meta.updatedAt >= remote.meta.updatedAt) {
      return { value: local.value, meta: { ...local.meta, vv: vvMerged } };
    }
  }
  if (vvDominates(remote.meta.vv, local.meta.vv) && !vvDominates(local.meta.vv, remote.meta.vv)) {
    if (remote.meta.updatedAt >= local.meta.updatedAt) {
      return { value: remote.value, meta: { ...remote.meta, vv: vvMerged } };
    }
  }

  // Concurrent or tied VV → wall-clock LWW
  if (remote.meta.updatedAt > local.meta.updatedAt) {
    return { value: remote.value, meta: { ...remote.meta, vv: vvMerged } };
  }
  if (local.meta.updatedAt > remote.meta.updatedAt) {
    return { value: local.value, meta: { ...local.meta, vv: vvMerged } };
  }
  // Equal timestamps — stable tie-break by actorId
  if (remote.meta.actorId > local.meta.actorId) {
    return { value: remote.value, meta: { ...remote.meta, vv: vvMerged } };
  }
  return { value: local.value, meta: { ...local.meta, vv: vvMerged } };
}

export function stampLww<T>(value: T, actorId: string, prevVv?: VersionVector): LwwRecord<T> {
  const vv = bumpVersionVector(prevVv ?? emptyVersionVector(), actorId);
  return {
    value,
    meta: {
      updatedAt: Date.now(),
      actorId,
      vv,
    },
  };
}

/**
 * Merge two arrays of keyed records by LWW on `getUpdatedAt`.
 * Deterministic: never lets a stale remote overwrite a newer local.
 */
export function mergeKeyedByLww<T>(
  local: readonly T[],
  remote: readonly T[],
  opts: {
    getKey: (item: T) => string;
    getUpdatedAt: (item: T) => number;
    /** Optional actor for VV when wrapping — unused in plain array merge */
  },
): T[] {
  const map = new Map<string, T>();
  for (const item of local) {
    map.set(opts.getKey(item), item);
  }
  for (const item of remote) {
    const key = opts.getKey(item);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, item);
      continue;
    }
    const localTs = opts.getUpdatedAt(prev);
    const remoteTs = opts.getUpdatedAt(item);
    if (remoteTs > localTs) {
      map.set(key, item);
    } else if (remoteTs === localTs) {
      // Stable: keep lexicographically greater JSON for determinism
      if (JSON.stringify(item) > JSON.stringify(prev)) {
        map.set(key, item);
      }
    }
    // else keep local (newer or equal-prefer-local)
  }
  return [...map.values()];
}

/**
 * Merge reading-progress style maps: section → entry with `at` ISO timestamp.
 */
export function mergeProgressMapsByLww<T extends { at?: string }>(
  local: Record<string, T>,
  remote: Record<string, T>,
): Record<string, T> {
  const out: Record<string, T> = { ...local };
  for (const [key, remoteEntry] of Object.entries(remote)) {
    const localEntry = out[key];
    if (!localEntry) {
      out[key] = remoteEntry;
      continue;
    }
    const localTs = Date.parse(localEntry.at || "") || 0;
    const remoteTs = Date.parse(remoteEntry.at || "") || 0;
    if (remoteTs > localTs) {
      out[key] = remoteEntry;
    }
  }
  return out;
}

/** Parse ISO / number timestamps safely. */
export function toUpdatedAtMs(value: string | number | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Date.parse(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
