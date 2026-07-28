/**
 * Web port of RN AsyncStorage `userNotes` — map of verseId → note text.
 *
 * ```ts
 * await saveNote("2:255", "ملاحظة على آية الكرسي");
 * ```
 */

export const USER_NOTES_KEY = "userNotes";

export type UserNotesMap = Record<string, string>;

/** Canonical verse id used by the RN sketch and the knowledge vault (`surah:ayah`). */
export function makeVerseId(surahNum: number, ayahNum: number): string {
  return `${surahNum}:${ayahNum}`;
}

export function parseVerseId(verseId: string): { surahNum: number; ayahNum: number } | null {
  const m = /^(\d{1,3}):(\d{1,3})$/.exec(verseId.trim());
  if (!m) return null;
  const surahNum = Number(m[1]);
  const ayahNum = Number(m[2]);
  if (!Number.isFinite(surahNum) || surahNum < 1 || surahNum > 114) return null;
  if (!Number.isFinite(ayahNum) || ayahNum < 1) return null;
  return { surahNum, ayahNum };
}

export function getUserNotes(): UserNotesMap {
  if (typeof localStorage === "undefined") return {};
  try {
    const existingNotes = localStorage.getItem(USER_NOTES_KEY) || "{}";
    const notes = JSON.parse(existingNotes) as unknown;
    if (!notes || typeof notes !== "object" || Array.isArray(notes)) return {};
    const out: UserNotesMap = {};
    for (const [k, v] of Object.entries(notes as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function getUserNote(verseId: string): string {
  return getUserNotes()[verseId] ?? "";
}

/**
 * RN: saveNote(verseId, noteText) — binds a note to a verse id in `userNotes`.
 */
export async function saveNote(verseId: string, noteText: string): Promise<void> {
  const id = verseId.trim();
  if (!id) return;
  try {
    const existingNotes = localStorage.getItem(USER_NOTES_KEY) || "{}";
    const notes = JSON.parse(existingNotes) as UserNotesMap;
    if (typeof notes !== "object" || notes == null || Array.isArray(notes)) {
      throw new Error("invalid userNotes shape");
    }
    notes[id] = noteText;
    await Promise.resolve();
    localStorage.setItem(USER_NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error("خطأ في حفظ الملاحظة", e);
  }
}

/** Remove a note entry (empty string still kept by RN saveNote — use this to delete). */
export async function deleteUserNote(verseId: string): Promise<void> {
  const id = verseId.trim();
  if (!id) return;
  try {
    const notes = getUserNotes();
    if (!(id in notes)) return;
    delete notes[id];
    localStorage.setItem(USER_NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error("خطأ في حذف الملاحظة", e);
  }
}
