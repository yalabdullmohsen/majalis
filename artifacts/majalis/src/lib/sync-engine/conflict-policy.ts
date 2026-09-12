import type { ConflictDecision, ConflictPolicy, SyncEntityKind, SyncRecord } from "./types";

export const CONFLICT_POLICY_BY_KIND: Record<SyncEntityKind, ConflictPolicy> = {
  mushaf_position: "newest_wins",
  bookmark: "union_tombstone",
  favorite: "union_tombstone",
  note: "keep_both",
  highlight: "keep_both",
  khatmah_progress: "merge_events",
  wird: "max_progress",
  lesson_progress: "max_progress",
  listen_position: "newest_wins",
  series_progress: "max_progress",
  path_progress: "max_progress",
  collection: "union_tombstone",
  notification_pref: "last_settings",
  reading_pref: "last_settings",
  download_meta: "newest_wins",
  home_pref: "last_settings",
  recommendation_dismissal: "union_tombstone",
};

function ts(r: SyncRecord): number {
  const t = Date.parse(r.updatedAt);
  return Number.isFinite(t) ? t : 0;
}

function progressOf(r: SyncRecord): number {
  const p = r.payload.progress ?? r.payload.ratio ?? r.payload.pagesCompleted ?? r.payload.position;
  const n = typeof p === "number" ? p : Number(p);
  return Number.isFinite(n) ? n : 0;
}

export function resolveSyncConflict(local: SyncRecord, remote: SyncRecord): ConflictDecision {
  if (local.kind !== remote.kind || local.entityId !== remote.entityId) {
    return { action: "keep_both", local, remote, reason: "different_entities" };
  }
  const policy = CONFLICT_POLICY_BY_KIND[local.kind];

  if (policy === "keep_both") {
    const localText = String(local.payload.text ?? local.payload.body ?? "");
    const remoteText = String(remote.payload.text ?? remote.payload.body ?? "");
    if (localText && remoteText && localText !== remoteText) {
      return { action: "keep_both", local, remote, reason: "divergent_note_text" };
    }
  }

  if (policy === "max_progress") {
    const lp = progressOf(local);
    const rp = progressOf(remote);
    if (lp !== rp) {
      return lp > rp
        ? { action: "keep_local", reason: "higher_progress_local" }
        : { action: "keep_remote", reason: "higher_progress_remote" };
    }
  }

  if (policy === "merge_events") {
    const localEvents = Array.isArray(local.payload.events) ? local.payload.events : [];
    const remoteEvents = Array.isArray(remote.payload.events) ? remote.payload.events : [];
    const byId = new Map<string, unknown>();
    for (const e of [...remoteEvents, ...localEvents]) {
      if (e && typeof e === "object" && "id" in e) {
        byId.set(String((e as { id: unknown }).id), e);
      }
    }
    const merged: SyncRecord = {
      ...local,
      updatedAt: ts(local) >= ts(remote) ? local.updatedAt : remote.updatedAt,
      version: Math.max(local.version, remote.version) + 1,
      payload: {
        ...remote.payload,
        ...local.payload,
        events: [...byId.values()],
        pagesCompleted: Math.max(progressOf(local), progressOf(remote)),
      },
    };
    return { action: "merge", merged, reason: "khatmah_events_union" };
  }

  if (policy === "union_tombstone") {
    const localDeleted = local.op === "delete" || local.payload.deleted === true;
    const remoteDeleted = remote.op === "delete" || remote.payload.deleted === true;
    if (localDeleted || remoteDeleted) {
      const newer = ts(local) >= ts(remote) ? local : remote;
      return newer === local
        ? { action: "keep_local", reason: "tombstone_newest_local" }
        : { action: "keep_remote", reason: "tombstone_newest_remote" };
    }
  }

  if (ts(local) === ts(remote)) {
    return local.version >= remote.version
      ? { action: "keep_local", reason: "same_time_higher_version_local" }
      : { action: "keep_remote", reason: "same_time_higher_version_remote" };
  }
  return ts(local) > ts(remote)
    ? { action: "keep_local", reason: "newer_local" }
    : { action: "keep_remote", reason: "newer_remote" };
}

export function isSuspiciousMushafJump(
  previousPage: number,
  nextPage: number,
  deltaMs: number,
  maxPages = 30,
  windowMs = 8_000,
): boolean {
  if (!Number.isFinite(previousPage) || !Number.isFinite(nextPage)) return false;
  if (deltaMs > windowMs) return false;
  return Math.abs(nextPage - previousPage) > maxPages;
}
