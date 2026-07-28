/**
 * قاموس معانٍ سريع للكلمة — يعتمد ترجمة/نقل حرف quran-v2 مع كاش IDB اختياري.
 */
const DB_NAME = "majalis-gharib-lite";
const DB_VERSION = 1;
const STORE = "defs";

export type WordSense = {
  key: string;
  arabic: string;
  meaning: string;
  transliteration?: string;
  source: "qpc-v2" | "cache";
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheWordSense(sense: WordSense): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(sense, sense.key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}

export async function lookupWordSense(key: string): Promise<WordSense | null> {
  try {
    const db = await openDb();
    const row = await new Promise<WordSense | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as WordSense | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return row;
  } catch {
    return null;
  }
}

export function senseFromQpcWord(opts: {
  verseKey: string;
  position: number;
  arabic: string;
  meaning?: string | null;
  transliteration?: string | null;
}): WordSense | null {
  if (!opts.meaning?.trim()) return null;
  const sense: WordSense = {
    key: `${opts.verseKey}:${opts.position}`,
    arabic: opts.arabic,
    meaning: opts.meaning.trim(),
    transliteration: opts.transliteration?.trim() || undefined,
    source: "qpc-v2",
  };
  void cacheWordSense(sense);
  return sense;
}
