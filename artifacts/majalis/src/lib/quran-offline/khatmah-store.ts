/**
 * Data-access layer for `khatmah_store`.
 * All reads/writes are async Dexie calls (non-blocking).
 */
import { getQuranOfflineDb } from "@/lib/quran-offline/db";
import type { KhatmahProfileType, KhatmahStoreRecord } from "@/lib/quran-offline/types";
import { enqueueOutboxMutation } from "@/lib/quran-offline/outbox-sync";

function now(): number {
  return Date.now();
}

export async function listKhatmahProfiles(
  opts?: { type?: KhatmahProfileType; activeOnly?: boolean },
): Promise<KhatmahStoreRecord[]> {
  const db = getQuranOfflineDb();
  if (!db) return [];
  let rows: KhatmahStoreRecord[];
  if (opts?.type != null && opts?.activeOnly) {
    rows = await db.khatmah_store
      .where("[type+is_completed]")
      .equals([opts.type, false])
      .toArray();
  } else if (opts?.type != null) {
    rows = await db.khatmah_store.where("type").equals(opts.type).toArray();
  } else if (opts?.activeOnly) {
    rows = await db.khatmah_store.where("is_completed").equals(false).toArray();
  } else {
    rows = await db.khatmah_store.toArray();
  }
  return rows.sort((a, b) => b.last_read_timestamp - a.last_read_timestamp);
}

export async function getKhatmahProfile(id: string): Promise<KhatmahStoreRecord | null> {
  const db = getQuranOfflineDb();
  if (!db) return null;
  return (await db.khatmah_store.get(id)) ?? null;
}

export type UpsertKhatmahInput = Omit<
  KhatmahStoreRecord,
  "revision" | "updated_at" | "last_read_timestamp" | "is_completed" | "streak_days"
> &
  Partial<
    Pick<
      KhatmahStoreRecord,
      | "revision"
      | "updated_at"
      | "last_read_timestamp"
      | "is_completed"
      | "streak_days"
      | "legacy_plan_id"
    >
  >;

export async function upsertKhatmahProfile(
  input: UpsertKhatmahInput,
  opts?: { enqueueSync?: boolean },
): Promise<KhatmahStoreRecord | null> {
  const db = getQuranOfflineDb();
  if (!db) return null;
  const existing = await db.khatmah_store.get(input.id);
  const ts = now();
  const row: KhatmahStoreRecord = {
    id: input.id,
    title: input.title,
    type: input.type,
    current_surah: input.current_surah,
    current_ayah: input.current_ayah,
    current_page: input.current_page,
    daily_wird_target: input.daily_wird_target,
    streak_days: input.streak_days ?? existing?.streak_days ?? 0,
    last_read_timestamp: input.last_read_timestamp ?? ts,
    is_completed: input.is_completed ?? existing?.is_completed ?? false,
    revision: (input.revision ?? existing?.revision ?? 0) + (existing ? 1 : 0),
    updated_at: ts,
    legacy_plan_id: input.legacy_plan_id ?? existing?.legacy_plan_id,
  };
  await db.khatmah_store.put(row);
  if (opts?.enqueueSync !== false) {
    await enqueueOutboxMutation({
      entity_type: "khatmah",
      entity_id: row.id,
      operation: "upsert",
      payload: { ...row, audio_memo_blob: undefined },
    });
  }
  return row;
}

export async function updateKhatmahProgress(
  id: string,
  patch: Partial<
    Pick<
      KhatmahStoreRecord,
      | "current_surah"
      | "current_ayah"
      | "current_page"
      | "streak_days"
      | "daily_wird_target"
      | "is_completed"
      | "title"
    >
  >,
): Promise<KhatmahStoreRecord | null> {
  const existing = await getKhatmahProfile(id);
  if (!existing) return null;
  return upsertKhatmahProfile({
    ...existing,
    ...patch,
    last_read_timestamp: now(),
  });
}

export async function deleteKhatmahProfile(id: string): Promise<boolean> {
  const db = getQuranOfflineDb();
  if (!db) return false;
  await db.khatmah_store.delete(id);
  await enqueueOutboxMutation({
    entity_type: "khatmah",
    entity_id: id,
    operation: "delete",
    payload: { id },
  });
  return true;
}
