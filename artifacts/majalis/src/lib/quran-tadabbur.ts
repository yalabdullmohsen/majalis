/**
 * طبقة التدبّر — ملاحظات خاصة + مقاطع تفسير محفوظة + إشارات صوتية.
 * المصدر الأساسي IndexedDB مع مرآة localStorage للتوافق مع getNote/saveNote.
 */
import { getSurahMeta } from "@/lib/quran-api";
import { getNote, saveNote, getAllNotes, type QuranNote } from "@/lib/quran-personal";

const DB_NAME = "majalis-tadabbur";
const DB_VERSION = 1;
const STORE = "entries";
const VOICE_STORE = "voice-blobs";

export type TadabburEntry = {
  id: string; // `${surah}:${ayah}`
  surahNum: number;
  ayahNum: number;
  surahName: string;
  juz: number;
  text: string;
  /** مقطع تفسير قصير محفوظ مع الآية */
  tafsirClip?: string;
  tafsirEdition?: string;
  /** هل توجد إشارة صوتية مرفقة */
  hasVoice: boolean;
  updatedAt: number;
};

function entryId(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: "id" });
        s.createIndex("bySurah", "surahNum");
        s.createIndex("byJuz", "juz");
        s.createIndex("byUpdated", "updatedAt");
      }
      if (!db.objectStoreNames.contains(VOICE_STORE)) {
        db.createObjectStore(VOICE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(entry: TadabburEntry): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbGet(id: string): Promise<TadabburEntry | null> {
  const db = await openDb();
  const row = await new Promise<TadabburEntry | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as TadabburEntry | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return row;
}

async function idbDelete(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE, VOICE_STORE], "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.objectStore(VOICE_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbGetAll(): Promise<TadabburEntry[]> {
  const db = await openDb();
  const rows = await new Promise<TadabburEntry[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as TadabburEntry[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows;
}

/** يزامن ملاحظات localStorage القديمة إلى IndexedDB مرة واحدة. */
export async function migrateLegacyNotesToTadabbur(): Promise<void> {
  const legacy = getAllNotes();
  if (legacy.length === 0) return;
  for (const n of legacy) {
    const id = entryId(n.surahNum, n.ayahNum);
    const existing = await idbGet(id);
    if (existing) continue;
    const meta = getSurahMeta(n.surahNum);
    await idbPut({
      id,
      surahNum: n.surahNum,
      ayahNum: n.ayahNum,
      surahName: meta.name,
      juz: 1,
      text: n.text,
      hasVoice: false,
      updatedAt: n.updatedAt || Date.now(),
    });
  }
}

export async function upsertTadabbur(opts: {
  surahNum: number;
  ayahNum: number;
  text: string;
  juz?: number;
  tafsirClip?: string;
  tafsirEdition?: string;
}): Promise<TadabburEntry | null> {
  const id = entryId(opts.surahNum, opts.ayahNum);
  const prev = await idbGet(id);
  const trimmed = opts.text.trim();
  const clip = opts.tafsirClip?.trim() || prev?.tafsirClip;
  const hasVoice = prev?.hasVoice ?? false;

  // مرآة LS للتوافق مع ورقة الآية القائمة
  saveNote(opts.surahNum, opts.ayahNum, trimmed);

  if (!trimmed && !clip && !hasVoice) {
    await idbDelete(id);
    return null;
  }

  const meta = getSurahMeta(opts.surahNum);
  const entry: TadabburEntry = {
    id,
    surahNum: opts.surahNum,
    ayahNum: opts.ayahNum,
    surahName: meta.name,
    juz: opts.juz ?? prev?.juz ?? 1,
    text: trimmed,
    tafsirClip: clip || undefined,
    tafsirEdition: opts.tafsirEdition ?? prev?.tafsirEdition,
    hasVoice,
    updatedAt: Date.now(),
  };
  await idbPut(entry);
  return entry;
}

export async function saveTafsirClip(
  surahNum: number,
  ayahNum: number,
  clip: string,
  edition: string,
  juz = 1,
): Promise<void> {
  const note = getNote(surahNum, ayahNum);
  await upsertTadabbur({
    surahNum,
    ayahNum,
    text: note,
    juz,
    tafsirClip: clip.slice(0, 600),
    tafsirEdition: edition,
  });
}

export async function saveVoiceBookmark(
  surahNum: number,
  ayahNum: number,
  blob: Blob,
  juz = 1,
): Promise<void> {
  const id = entryId(surahNum, ayahNum);
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(VOICE_STORE, "readwrite");
    tx.objectStore(VOICE_STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();

  const note = getNote(surahNum, ayahNum);
  const prev = await idbGet(id);
  const meta = getSurahMeta(surahNum);
  await idbPut({
    id,
    surahNum,
    ayahNum,
    surahName: meta.name,
    juz: prev?.juz ?? juz,
    text: note || prev?.text || "",
    tafsirClip: prev?.tafsirClip,
    tafsirEdition: prev?.tafsirEdition,
    hasVoice: true,
    updatedAt: Date.now(),
  });
}

export async function getVoiceBookmarkUrl(surahNum: number, ayahNum: number): Promise<string | null> {
  const id = entryId(surahNum, ayahNum);
  const db = await openDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(VOICE_STORE, "readonly");
    const req = tx.objectStore(VOICE_STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob ? URL.createObjectURL(blob) : null;
}

export async function listTadabburEntries(): Promise<TadabburEntry[]> {
  await migrateLegacyNotesToTadabbur();
  const rows = await idbGetAll();
  // ادمج أي ملاحظات LS لم تُرحَّل بعد
  const map = new Map(rows.map((r) => [r.id, r]));
  for (const n of getAllNotes()) {
    const id = entryId(n.surahNum, n.ayahNum);
    if (!map.has(id)) {
      const meta = getSurahMeta(n.surahNum);
      map.set(id, {
        id,
        surahNum: n.surahNum,
        ayahNum: n.ayahNum,
        surahName: meta.name,
        juz: 1,
        text: n.text,
        hasVoice: false,
        updatedAt: n.updatedAt,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function hasTadabbur(surahNum: number, ayahNum: number): Promise<boolean> {
  const id = entryId(surahNum, ayahNum);
  if (await idbGet(id)) return true;
  return Boolean(getNote(surahNum, ayahNum));
}

/** مجموعة مفاتيح الآيات التي عليها تدبّر — لشريط المؤشر في القارئ. */
export async function getTadabburVerseKeySet(): Promise<Set<string>> {
  const entries = await listTadabburEntries();
  return new Set(entries.map((e) => `${e.surahNum}:${e.ayahNum}`));
}

export function groupTadabburBySurah(entries: TadabburEntry[]): Map<number, TadabburEntry[]> {
  const map = new Map<number, TadabburEntry[]>();
  for (const e of entries) {
    const list = map.get(e.surahNum) ?? [];
    list.push(e);
    map.set(e.surahNum, list);
  }
  return map;
}

export function groupTadabburByJuz(entries: TadabburEntry[]): Map<number, TadabburEntry[]> {
  const map = new Map<number, TadabburEntry[]>();
  for (const e of entries) {
    const list = map.get(e.juz || 1) ?? [];
    list.push(e);
    map.set(e.juz || 1, list);
  }
  return map;
}

export type { QuranNote };
