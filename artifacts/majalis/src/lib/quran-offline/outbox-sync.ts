/**
 * Conflict-free sync outbox — durable mutation log + background drain.
 * Guarantees chronological push order and idempotent client_mutation_id.
 * Does not mutate UI; call `startQuranOutboxSync()` from bootstrap only.
 */
import { getQuranOfflineDb } from "@/lib/quran-offline/db";
import type {
  OutboxEntityType,
  OutboxOperation,
  OutboxSyncRecord,
} from "@/lib/quran-offline/types";

const MAX_ATTEMPTS = 8;
const BATCH_SIZE = 40;

let draining: Promise<{ pushed: number; remaining: number }> | null = null;
let listenersBound = false;

function newMutationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `mut_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export type EnqueueOutboxInput = {
  entity_type: OutboxEntityType;
  entity_id: string;
  operation: OutboxOperation;
  payload: unknown;
  client_mutation_id?: string;
};

export async function enqueueOutboxMutation(
  input: EnqueueOutboxInput,
): Promise<OutboxSyncRecord | null> {
  const db = getQuranOfflineDb();
  if (!db) return null;
  const row: OutboxSyncRecord = {
    client_mutation_id: input.client_mutation_id ?? newMutationId(),
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    operation: input.operation,
    payload: input.payload,
    created_at: Date.now(),
    status: "pending",
    attempts: 0,
  };
  const id = await db.outbox_sync_store.add(row);
  return { ...row, id: Number(id) };
}

export async function listPendingOutbox(limit = BATCH_SIZE): Promise<OutboxSyncRecord[]> {
  const db = getQuranOfflineDb();
  if (!db) return [];
  // Chronological: oldest pending first (compound index [status+created_at] backs this filter)
  const rows = await db.outbox_sync_store.where("status").equals("pending").sortBy("created_at");
  return rows.slice(0, limit);
}

export async function countPendingOutbox(): Promise<number> {
  const db = getQuranOfflineDb();
  if (!db) return 0;
  return db.outbox_sync_store.where("status").equals("pending").count();
}

export type OutboxDrainResult = {
  pushed: number;
  remaining: number;
  mode: "synced" | "offline" | "local-only" | "empty" | "unavailable";
};

/**
 * Push a chronological batch to `/api/reading-sync`.
 * Server should acknowledge by `client_mutation_id` (idempotent).
 * Failed items stay pending with attempts++ (backoff via caller).
 */
export async function drainQuranOutbox(): Promise<OutboxDrainResult> {
  if (draining) return draining;
  draining = (async (): Promise<OutboxDrainResult> => {
    const db = getQuranOfflineDb();
    if (!db) return { pushed: 0, remaining: 0, mode: "unavailable" };
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const remaining = await countPendingOutbox();
      return { pushed: 0, remaining, mode: "offline" };
    }

    const batch = await listPendingOutbox(BATCH_SIZE);
    if (batch.length === 0) {
      return { pushed: 0, remaining: 0, mode: "empty" };
    }

    const ids = batch.map((r) => r.id!).filter((id) => id != null);
    await db.outbox_sync_store.bulkUpdate(
      ids.map((id) => ({ key: id, changes: { status: "syncing" as const } })),
    );

    try {
      const res = await fetch("/api/reading-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "quran-outbox-batch",
          mutations: batch.map((m) => ({
            client_mutation_id: m.client_mutation_id,
            entity_type: m.entity_type,
            entity_id: m.entity_id,
            operation: m.operation,
            payload: m.payload,
            created_at: m.created_at,
          })),
        }),
        signal: AbortSignal.timeout(12_000),
      });

      if (!res.ok) {
        await failBatch(db, batch, `http_${res.status}`);
        return {
          pushed: 0,
          remaining: await countPendingOutbox(),
          mode: "local-only",
        };
      }

      let accepted = new Set(batch.map((m) => m.client_mutation_id));
      try {
        const body = (await res.json()) as {
          accepted?: string[];
          rejected?: string[];
        };
        if (Array.isArray(body.accepted) && body.accepted.length > 0) {
          accepted = new Set(body.accepted);
        }
        if (Array.isArray(body.rejected)) {
          for (const id of body.rejected) accepted.delete(id);
        }
      } catch {
        /* empty / non-JSON body ⇒ treat all as accepted */
      }

      for (const row of batch) {
        if (!row.id) continue;
        if (accepted.has(row.client_mutation_id)) {
          await db.outbox_sync_store.update(row.id, { status: "synced" });
          if (row.entity_type === "reflection") {
            try {
              const { markReflectionSynced } = await import(
                "@/lib/quran-offline/reflections-store"
              );
              await markReflectionSynced(row.entity_id);
            } catch {
              /* optional */
            }
          }
        } else {
          await failOne(db, row, "rejected");
        }
      }

      // Prune synced rows older than 7 days to keep the store lean
      await pruneSyncedOutbox(db, 7 * 24 * 60 * 60 * 1000);

      return {
        pushed: accepted.size,
        remaining: await countPendingOutbox(),
        mode: "synced",
      };
    } catch (err) {
      await failBatch(db, batch, err instanceof Error ? err.message : "network");
      return {
        pushed: 0,
        remaining: await countPendingOutbox(),
        mode: "local-only",
      };
    }
  })().finally(() => {
    draining = null;
  });
  return draining;
}

async function failBatch(
  db: NonNullable<ReturnType<typeof getQuranOfflineDb>>,
  batch: OutboxSyncRecord[],
  reason: string,
): Promise<void> {
  for (const row of batch) await failOne(db, row, reason);
}

async function failOne(
  db: NonNullable<ReturnType<typeof getQuranOfflineDb>>,
  row: OutboxSyncRecord,
  reason: string,
): Promise<void> {
  if (row.id == null) return;
  const attempts = (row.attempts ?? 0) + 1;
  await db.outbox_sync_store.update(row.id, {
    status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
    attempts,
    last_error: reason.slice(0, 240),
  });
}

async function pruneSyncedOutbox(
  db: NonNullable<ReturnType<typeof getQuranOfflineDb>>,
  maxAgeMs: number,
): Promise<void> {
  const cutoff = Date.now() - maxAgeMs;
  const synced = await db.outbox_sync_store.where("status").equals("synced").toArray();
  const stale = synced.filter((r) => r.created_at < cutoff && r.id != null);
  if (stale.length) {
    await db.outbox_sync_store.bulkDelete(stale.map((r) => r.id!));
  }
}

/** Bind online listener once — drains outbox on reconnect. */
export function startQuranOutboxSync(): void {
  if (typeof window === "undefined" || listenersBound) return;
  listenersBound = true;
  window.addEventListener("online", () => {
    void drainQuranOutbox();
  });
  // Soft kick after idle so cold start does not contend with first paint
  const kick = () => {
    void drainQuranOutbox();
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(kick, { timeout: 8_000 });
  } else {
    globalThis.setTimeout(kick, 4_000);
  }
}

export function __resetOutboxListenersForTests(): void {
  listenersBound = false;
  draining = null;
}
