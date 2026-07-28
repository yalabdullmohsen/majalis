/**
 * Data-access layer for `user_reflections_store`.
 * Composite index `[surah_id+ayah_id]` enables O(log n) page-render lookups
 * (effectively O(1) for typical page ayah counts).
 */
import { getQuranOfflineDb } from "@/lib/quran-offline/db";
import type { UserReflectionRecord } from "@/lib/quran-offline/types";
import { enqueueOutboxMutation } from "@/lib/quran-offline/outbox-sync";

function reflectionId(surah: number, ayah: number, wordIndex?: number): string {
  return wordIndex == null ? `${surah}:${ayah}` : `${surah}:${ayah}:w${wordIndex}`;
}

export async function getReflectionsForAyah(
  surah_id: number,
  ayah_id: number,
): Promise<UserReflectionRecord[]> {
  const db = getQuranOfflineDb();
  if (!db) return [];
  return db.user_reflections_store.where("[surah_id+ayah_id]").equals([surah_id, ayah_id]).toArray();
}

/** Fast set of ayah keys that have any reflection on a page (for badge rendering). */
export async function getReflectionAyahKeySet(
  ayahKeys: Array<{ surah_id: number; ayah_id: number }>,
): Promise<Set<string>> {
  const out = new Set<string>();
  if (ayahKeys.length === 0) return out;
  const db = getQuranOfflineDb();
  if (!db) return out;
  await Promise.all(
    ayahKeys.map(async ({ surah_id, ayah_id }) => {
      const n = await db.user_reflections_store
        .where("[surah_id+ayah_id]")
        .equals([surah_id, ayah_id])
        .count();
      if (n > 0) out.add(`${surah_id}:${ayah_id}`);
    }),
  );
  return out;
}

export async function getReflectionById(id: string): Promise<UserReflectionRecord | null> {
  const db = getQuranOfflineDb();
  if (!db) return null;
  return (await db.user_reflections_store.get(id)) ?? null;
}

export type UpsertReflectionInput = {
  surah_id: number;
  ayah_id: number;
  word_index?: number;
  note_text: string;
  audio_memo_blob?: Blob;
  bookmark_color?: string;
  tags?: string[];
  id?: string;
};

export async function upsertReflection(
  input: UpsertReflectionInput,
  opts?: { enqueueSync?: boolean },
): Promise<UserReflectionRecord | null> {
  const db = getQuranOfflineDb();
  if (!db) return null;
  const id = input.id ?? reflectionId(input.surah_id, input.ayah_id, input.word_index);
  const existing = await db.user_reflections_store.get(id);
  const ts = Date.now();
  const row: UserReflectionRecord = {
    id,
    surah_id: input.surah_id,
    ayah_id: input.ayah_id,
    word_index: input.word_index,
    note_text: input.note_text,
    audio_memo_blob: input.audio_memo_blob ?? existing?.audio_memo_blob,
    bookmark_color: input.bookmark_color ?? existing?.bookmark_color,
    tags: input.tags ?? existing?.tags ?? [],
    created_at: existing?.created_at ?? ts,
    sync_status: "pending",
    updated_at: ts,
  };
  await db.user_reflections_store.put(row);
  if (opts?.enqueueSync !== false) {
    const { audio_memo_blob: _blob, ...syncable } = row;
    await enqueueOutboxMutation({
      entity_type: "reflection",
      entity_id: row.id,
      operation: "upsert",
      payload: {
        ...syncable,
        has_audio_memo: Boolean(row.audio_memo_blob),
      },
    });
  }
  return row;
}

export async function markReflectionSynced(id: string): Promise<void> {
  const db = getQuranOfflineDb();
  if (!db) return;
  const row = await db.user_reflections_store.get(id);
  if (!row) return;
  await db.user_reflections_store.put({ ...row, sync_status: "synced", updated_at: Date.now() });
}

export async function deleteReflection(id: string): Promise<boolean> {
  const db = getQuranOfflineDb();
  if (!db) return false;
  await db.user_reflections_store.delete(id);
  await enqueueOutboxMutation({
    entity_type: "reflection",
    entity_id: id,
    operation: "delete",
    payload: { id },
  });
  return true;
}

export async function listPendingReflections(): Promise<UserReflectionRecord[]> {
  const db = getQuranOfflineDb();
  if (!db) return [];
  return db.user_reflections_store.where("sync_status").equals("pending").toArray();
}

export { reflectionId };
