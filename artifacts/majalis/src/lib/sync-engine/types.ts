/** أنواع محرّك المزامنة الموحّد — P0 موثوقية. */

export const SYNC_ENTITY_KINDS = [
  "mushaf_position",
  "bookmark",
  "favorite",
  "note",
  "highlight",
  "khatmah_progress",
  "wird",
  "lesson_progress",
  "listen_position",
  "series_progress",
  "path_progress",
  "collection",
  "notification_pref",
  "reading_pref",
  "download_meta",
  "home_pref",
  "recommendation_dismissal",
] as const;

export type SyncEntityKind = (typeof SYNC_ENTITY_KINDS)[number];

export type SyncOpType = "upsert" | "delete" | "merge_events";

export type SyncRecord = {
  entityId: string;
  kind: SyncEntityKind;
  op: SyncOpType;
  payload: Record<string, unknown>;
  updatedAt: string;
  version: number;
  scopeId: string;
  opId: string;
};

export type ConflictPolicy =
  | "newest_wins"
  | "max_progress"
  | "union_tombstone"
  | "keep_both"
  | "last_settings"
  | "merge_events";

export type ConflictDecision =
  | { action: "keep_local"; reason: string }
  | { action: "keep_remote"; reason: string }
  | { action: "merge"; merged: SyncRecord; reason: string }
  | { action: "keep_both"; local: SyncRecord; remote: SyncRecord; reason: string };

export type SyncEngineStatus = {
  scopeId: string;
  pending: number;
  lastFlushAt: string | null;
  schemaVersion: number;
  syncing: boolean;
};
