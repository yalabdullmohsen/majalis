/**
 * Unified Sync Engine — local-first، delta، idempotent، بلا حجب للواجهة.
 */

import { enqueueOutbox, flushOutbox, outboxPendingCount } from "@/lib/sync-outbox";
import { ensureHybridSyncOutboxHandlers } from "@/lib/hybrid-sync-handlers";
import { resolveSyncConflict, isSuspiciousMushafJump } from "./conflict-policy";
import {
  SYNC_SCHEMA_VERSION,
  clearQueue,
  getClock,
  getLastFlushAt,
  getSyncSchemaVersion,
  loadQueue,
  saveQueue,
  setClock,
  setLastFlushAt,
} from "./local-store";
import { runSyncMigrations } from "./migrations";
import { activeSyncScope, GUEST_SCOPE } from "./account-scope";
import type { SyncEngineStatus, SyncEntityKind, SyncOpType, SyncRecord } from "./types";

let currentScope = GUEST_SCOPE;
let syncing = false;
let bootstrapped = false;

function newOpId(): string {
  return `op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function bootstrapSyncEngine(userId?: string | null): SyncEngineStatus {
  runSyncMigrations();
  currentScope = activeSyncScope(userId);
  if (!bootstrapped) {
    try {
      ensureHybridSyncOutboxHandlers();
    } catch {
      /* optional in unit tests */
    }
    bootstrapped = true;
  }
  return getSyncEngineStatus();
}

export function setSyncScope(userId?: string | null): void {
  currentScope = activeSyncScope(userId);
}

export function getSyncEngineStatus(): SyncEngineStatus {
  return {
    scopeId: currentScope,
    pending: loadQueue(currentScope).length,
    lastFlushAt: getLastFlushAt(),
    schemaVersion: getSyncSchemaVersion() || SYNC_SCHEMA_VERSION,
    syncing,
  };
}

export type EnqueueInput = {
  kind: SyncEntityKind;
  entityId: string;
  op?: SyncOpType;
  payload: Record<string, unknown>;
  updatedAt?: string;
  version?: number;
  scopeId?: string;
};

export function enqueueSyncRecord(input: EnqueueInput): SyncRecord {
  const scopeId = input.scopeId ?? currentScope;
  const updatedAt = input.updatedAt ?? new Date().toISOString();
  const existing = getClock(scopeId, input.kind, input.entityId);

  if (input.kind === "mushaf_position" && existing) {
    const prev = Number(existing.payload.page);
    const next = Number(input.payload.page);
    const deltaMs = Date.parse(updatedAt) - Date.parse(existing.updatedAt);
    if (isSuspiciousMushafJump(prev, next, deltaMs)) {
      return existing;
    }
  }

  const candidate: SyncRecord = {
    entityId: String(input.entityId),
    kind: input.kind,
    op: input.op ?? "upsert",
    payload: { ...input.payload },
    updatedAt,
    version: input.version ?? (existing ? existing.version + 1 : 1),
    scopeId,
    opId: newOpId(),
  };

  if (existing) {
    const decision = resolveSyncConflict(existing, candidate);
    if (decision.action === "keep_local") return existing;
    if (decision.action === "keep_both") {
      const forked = { ...candidate, entityId: `${candidate.entityId}__fork_${candidate.opId}` };
      setClock(forked);
      const q = loadQueue(scopeId);
      q.push(forked);
      saveQueue(scopeId, q);
      return forked;
    }
    if (decision.action === "merge") {
      setClock(decision.merged);
      const q = loadQueue(scopeId);
      q.push(decision.merged);
      saveQueue(scopeId, q);
      return decision.merged;
    }
    candidate.version = Math.max(existing.version + 1, candidate.version);
  }

  const queue = loadQueue(scopeId).filter(
    (r) => !(r.kind === candidate.kind && r.entityId === candidate.entityId && r.op === candidate.op),
  );
  queue.push(candidate);
  saveQueue(scopeId, queue);
  setClock(candidate);
  void bridgeToLegacyOutbox(candidate).catch(() => undefined);
  return candidate;
}

async function bridgeToLegacyOutbox(record: SyncRecord): Promise<void> {
  if (record.scopeId === GUEST_SCOPE) return;
  const userId = record.scopeId.startsWith("user:") ? record.scopeId.slice(5) : "";
  if (!userId) return;

  if (
    record.kind === "mushaf_position" ||
    record.kind === "lesson_progress" ||
    record.kind === "listen_position"
  ) {
    await enqueueOutbox("reading_progress", `${record.kind}:${record.entityId}`, {
      userId,
      ...record.payload,
      updatedAt: record.updatedAt,
      opId: record.opId,
    });
    return;
  }
  if (record.kind === "bookmark" || record.kind === "favorite") {
    await enqueueOutbox("favorite_toggle", `${record.kind}:${record.entityId}`, {
      userId,
      contentType: record.payload.contentType ?? record.kind,
      contentId: record.payload.contentId ?? record.entityId,
      title: record.payload.title ?? null,
      on: record.op !== "delete" && record.payload.deleted !== true,
      updatedAt: record.updatedAt,
      opId: record.opId,
    });
    return;
  }
  if (record.kind === "note") {
    await enqueueOutbox("preference_patch", `note:${record.entityId}`, {
      userId,
      ...record.payload,
      updatedAt: record.updatedAt,
      opId: record.opId,
    });
    return;
  }
  if (
    record.kind === "notification_pref" ||
    record.kind === "reading_pref" ||
    record.kind === "home_pref" ||
    record.kind === "khatmah_progress" ||
    record.kind === "wird"
  ) {
    await enqueueOutbox("preference_patch", `${record.kind}:${record.entityId}`, {
      userId,
      ...record.payload,
      updatedAt: record.updatedAt,
      opId: record.opId,
    });
  }
}

function isBridgeable(kind: SyncEntityKind): boolean {
  return (
    kind === "mushaf_position" ||
    kind === "lesson_progress" ||
    kind === "listen_position" ||
    kind === "bookmark" ||
    kind === "favorite" ||
    kind === "note" ||
    kind === "notification_pref" ||
    kind === "reading_pref" ||
    kind === "home_pref" ||
    kind === "khatmah_progress" ||
    kind === "wird"
  );
}

export async function flushSyncEngine(): Promise<{ flushed: number; remaining: number }> {
  if (syncing) {
    return { flushed: 0, remaining: loadQueue(currentScope).length };
  }
  syncing = true;
  try {
    const result = await flushOutbox();
    if (result.flushed > 0) {
      const remainingLocal = loadQueue(currentScope);
      saveQueue(
        currentScope,
        remainingLocal.filter((r) => r.scopeId === GUEST_SCOPE || !isBridgeable(r.kind)),
      );
      setLastFlushAt(new Date().toISOString());
    }
    const pendingOutbox = await outboxPendingCount().catch(() => 0);
    return {
      flushed: result.flushed,
      remaining: Math.max(loadQueue(currentScope).length, pendingOutbox),
    };
  } catch {
    return { flushed: 0, remaining: loadQueue(currentScope).length };
  } finally {
    syncing = false;
  }
}

export function stopSyncAndClearScope(scopeId: string): void {
  clearQueue(scopeId);
}

export function applyRemoteRecord(remote: SyncRecord): SyncRecord {
  const local = getClock(remote.scopeId, remote.kind, remote.entityId);
  if (!local) {
    setClock(remote);
    return remote;
  }
  const decision = resolveSyncConflict(local, remote);
  if (decision.action === "keep_local") return local;
  if (decision.action === "keep_remote") {
    setClock(remote);
    return remote;
  }
  if (decision.action === "merge") {
    setClock(decision.merged);
    return decision.merged;
  }
  const fork = { ...remote, entityId: `${remote.entityId}__remote_${remote.opId}` };
  setClock(fork);
  return fork;
}
