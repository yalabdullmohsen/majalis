/**
 * Safe one-shot migrations from legacy localStorage / raw IDB into the Dexie schema.
 * Additive only — never deletes legacy sources (zero user-data loss).
 */
import { openQuranOfflineDb, getQuranOfflineDb } from "@/lib/quran-offline/db";
import { upsertKhatmahProfile } from "@/lib/quran-offline/khatmah-store";
import { upsertReflection } from "@/lib/quran-offline/reflections-store";
import {
  flattenMutashabihatToKeys,
  invertTopicsToAyahMap,
  mergeKnowledgeMaps,
  putKnowledgeBatch,
  countKnowledgeRows,
} from "@/lib/quran-offline/knowledge-store";
import {
  makeAudioSurahAssetId,
  upsertAsset,
} from "@/lib/quran-offline/assets-store";
import type { KhatmahProfileType } from "@/lib/quran-offline/types";

const MIGRATE_FLAG = "mj-quran-offline-schema-migrated-v1";

export type MigrationReport = {
  ran: boolean;
  khatmah: number;
  reflections: number;
  knowledge: number;
  assets: number;
  sources: string[];
  error?: string;
};

function readLsFlag(): boolean {
  try {
    return localStorage.getItem(MIGRATE_FLAG) === "1";
  } catch {
    return false;
  }
}

function writeLsFlag(): void {
  try {
    localStorage.setItem(MIGRATE_FLAG, "1");
  } catch {
    /* ignore */
  }
}

function mapKhatmahType(kind?: string): KhatmahProfileType {
  if (kind === "memorization") return "memorization";
  return "reading";
}

async function migrateKhatmah(): Promise<{ count: number; source?: string }> {
  try {
    const { getKhatmahPlans } = await import("@/lib/quran-personal");
    const plans = getKhatmahPlans();
    let meta: Array<{ planId: string; kind?: string }> = [];
    try {
      meta = JSON.parse(localStorage.getItem("mj-khatmah-meta-v1") || "[]");
    } catch {
      meta = [];
    }
    let streak = 0;
    try {
      const s = JSON.parse(localStorage.getItem("mj-quran-streak-v1") || "null");
      streak = typeof s?.current === "number" ? s.current : typeof s === "number" ? s : 0;
    } catch {
      streak = 0;
    }
    let wirdTarget = 1;
    try {
      const g = JSON.parse(localStorage.getItem("mj-wird-goal-v1") || "null");
      if (g?.pagesPerDay) wirdTarget = Number(g.pagesPerDay) || 1;
      else if (typeof g?.target === "number") wirdTarget = g.target;
    } catch {
      /* default */
    }

    let lastPage = 1;
    let lastSurah = 1;
    let lastAyah = 1;
    try {
      const { loadLastReadDetail, loadPagePosition } = await import("@/lib/quran-api");
      const detail = loadLastReadDetail();
      lastPage = detail?.page ?? loadPagePosition() ?? 1;
      lastSurah = detail?.surah ?? 1;
      lastAyah = detail?.ayah ?? 1;
    } catch {
      /* optional */
    }

    let n = 0;
    for (const plan of plans) {
      const m = meta.find((x) => x.planId === plan.id);
      const pages = Math.min(604, Math.max(0, plan.totalPagesRead || 0));
      await upsertKhatmahProfile(
        {
          id: `legacy:${plan.id}`,
          title: plan.name || "ختمة",
          type: mapKhatmahType(m?.kind),
          current_surah: lastSurah,
          current_ayah: lastAyah,
          current_page: pages > 0 ? Math.min(604, pages) : lastPage,
          daily_wird_target: wirdTarget,
          streak_days: streak,
          is_completed: Boolean(plan.completedAt) || pages >= 604,
          last_read_timestamp: plan.completedAt || plan.startedAt || Date.now(),
          legacy_plan_id: plan.id,
        },
        { enqueueSync: false },
      );
      n += 1;
    }
    return { count: n, source: n ? "localStorage:mj-quran-khatmah-v1" : undefined };
  } catch {
    return { count: 0 };
  }
}

async function migrateReflections(): Promise<{ count: number; sources: string[] }> {
  const sources: string[] = [];
  let n = 0;
  try {
    const { getAllNotes, getBookmarks } = await import("@/lib/quran-personal");
    const notes = getAllNotes();
    for (const note of notes) {
      await upsertReflection(
        {
          surah_id: note.surahNum,
          ayah_id: note.ayahNum,
          note_text: note.text,
          tags: ["note"],
        },
        { enqueueSync: false },
      );
      n += 1;
    }
    if (notes.length) sources.push("localStorage:mj-quran-notes-v1");

    const bookmarks = getBookmarks();
    for (const bk of bookmarks) {
      const id = `bk:${bk.surahNum}:${bk.ayahNum}`;
      await upsertReflection(
        {
          id,
          surah_id: bk.surahNum,
          ayah_id: bk.ayahNum,
          note_text: bk.text || "",
          bookmark_color: "#B08D2E",
          tags: ["bookmark", bk.list || "المفضلة"],
        },
        { enqueueSync: false },
      );
      n += 1;
    }
    if (bookmarks.length) sources.push("localStorage:mj-quran-bookmarks-v1");
  } catch {
    /* ignore */
  }

  // Legacy tadabbur IDB if present (engine Part 2+)
  try {
    if (typeof indexedDB === "undefined") return { count: n, sources };
    const dbName = "majalis-tadabbur";
    const exists = await databaseExists(dbName);
    if (!exists) return { count: n, sources };
    const raw = await readAllFromRawIdb<{
      id: string;
      surahNum: number;
      ayahNum: number;
      text: string;
      hasVoice?: boolean;
    }>(dbName, "entries");
    for (const e of raw) {
      await upsertReflection(
        {
          id: `tadabbur:${e.id}`,
          surah_id: e.surahNum,
          ayah_id: e.ayahNum,
          note_text: e.text || "",
          tags: e.hasVoice ? ["tadabbur", "voice"] : ["tadabbur"],
        },
        { enqueueSync: false },
      );
      n += 1;
    }
    if (raw.length) sources.push("idb:majalis-tadabbur");
  } catch {
    /* ignore */
  }
  return { count: n, sources };
}

async function migrateKnowledge(): Promise<{ count: number; sources: string[] }> {
  const sources: string[] = [];
  const existing = await countKnowledgeRows();
  if (existing > 0) return { count: 0, sources };

  let similar: Record<string, string[]> = {};
  try {
    // Prefer already-cached mutashabihat IDB, else fetch static JSON once
    let index: Record<string, Array<{ surah: number; ayah: number }>> | null = null;
    try {
      const { loadMutashabihatIndexCached } = await import("@/lib/mutashabihat-idb");
      index = await loadMutashabihatIndexCached();
      if (index) sources.push("idb:majalis-mutashabihat");
    } catch {
      try {
        const { loadMutashabihatIndex } = await import("@/lib/recitation-ai/mutashabihat");
        index = await loadMutashabihatIndex();
        sources.push("json:mutashabihat-index");
      } catch {
        index = null;
      }
    }
    if (index) similar = flattenMutashabihatToKeys(index);
  } catch {
    similar = {};
  }

  let themes: Record<string, string[]> = {};
  try {
    const { QURAN_TOPICS } = await import("@/lib/quran-topics-index");
    themes = invertTopicsToAyahMap(QURAN_TOPICS);
    if (Object.keys(themes).length) sources.push("module:quran-topics-index");
  } catch {
    themes = {};
  }

  const merged = mergeKnowledgeMaps(similar, themes);
  const count = await putKnowledgeBatch(merged);
  return { count, sources };
}

async function migrateAudioAssetMeta(): Promise<{ count: number; source?: string }> {
  try {
    if (typeof indexedDB === "undefined") return { count: 0 };
    const exists = await databaseExists("majalis-quran-audio");
    if (!exists) return { count: 0 };
    const keys = await listRawIdbKeys("majalis-quran-audio", "surah-audio");
    let n = 0;
    for (const key of keys) {
      const [reciterId, surahStr] = String(key).split(":");
      const surahId = Number(surahStr);
      if (!reciterId || !Number.isFinite(surahId)) continue;
      await upsertAsset({
        asset_id: makeAudioSurahAssetId(reciterId, surahId),
        type: "audio_surah",
        reciter_id: reciterId,
        surah_id: surahId,
        download_status: "completed",
        file_reference: `legacy:majalis-quran-audio:${key}`,
        size_bytes: 0,
      });
      n += 1;
    }
    return { count: n, source: n ? "idb:majalis-quran-audio" : undefined };
  } catch {
    return { count: 0 };
  }
}

async function databaseExists(name: string): Promise<boolean> {
  if (typeof indexedDB === "undefined") return false;
  try {
    if (typeof indexedDB.databases === "function") {
      const dbs = await indexedDB.databases();
      return dbs.some((d) => d.name === name);
    }
  } catch {
    /* fall through */
  }
  // Without databases(): probe via open — only treat as present if stores already exist
  // (avoid leaving an empty shell DB when name was never created).
  return new Promise((resolve) => {
    let upgraded = false;
    try {
      const req = indexedDB.open(name);
      req.onupgradeneeded = () => {
        upgraded = true;
      };
      req.onsuccess = () => {
        const db = req.result;
        const ok = !upgraded && db.objectStoreNames.length > 0;
        db.close();
        if (upgraded) {
          // We accidentally created an empty DB — delete it
          try {
            indexedDB.deleteDatabase(name);
          } catch {
            /* ignore */
          }
        }
        resolve(ok);
      };
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function readAllFromRawIdb<T>(dbName: string, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(store)) {
        db.close();
        resolve([]);
        return;
      }
      const tx = db.transaction(store, "readonly");
      const r = tx.objectStore(store).getAll();
      r.onsuccess = () => {
        db.close();
        resolve((r.result as T[]) ?? []);
      };
      r.onerror = () => {
        db.close();
        reject(r.error);
      };
    };
    req.onerror = () => reject(req.error);
  });
}

async function listRawIdbKeys(dbName: string, store: string): Promise<IDBValidKey[]> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(store)) {
        db.close();
        resolve([]);
        return;
      }
      const tx = db.transaction(store, "readonly");
      const r = tx.objectStore(store).getAllKeys();
      r.onsuccess = () => {
        db.close();
        resolve((r.result as IDBValidKey[]) ?? []);
      };
      r.onerror = () => {
        db.close();
        reject(r.error);
      };
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Idempotent migration. Safe to call on every boot.
 * Skips heavy work after first successful flag (unless force).
 */
export async function migrateLegacyQuranOfflineData(
  opts?: { force?: boolean },
): Promise<MigrationReport> {
  const db = await openQuranOfflineDb();
  if (!db) {
    return {
      ran: false,
      khatmah: 0,
      reflections: 0,
      knowledge: 0,
      assets: 0,
      sources: [],
      error: "indexeddb-unavailable",
    };
  }

  if (!opts?.force && readLsFlag()) {
    return {
      ran: false,
      khatmah: 0,
      reflections: 0,
      knowledge: 0,
      assets: 0,
      sources: [],
    };
  }

  const sources: string[] = [];
  try {
    const k = await migrateKhatmah();
    if (k.source) sources.push(k.source);
    const r = await migrateReflections();
    sources.push(...r.sources);
    const know = await migrateKnowledge();
    sources.push(...know.sources);
    const a = await migrateAudioAssetMeta();
    if (a.source) sources.push(a.source);

    writeLsFlag();
    return {
      ran: true,
      khatmah: k.count,
      reflections: r.count,
      knowledge: know.count,
      assets: a.count,
      sources,
    };
  } catch (err) {
    return {
      ran: false,
      khatmah: 0,
      reflections: 0,
      knowledge: 0,
      assets: 0,
      sources,
      error: err instanceof Error ? err.message : "migrate-failed",
    };
  }
}

/** Diagnostics — does not mutate. */
export async function getQuranOfflineStats(): Promise<{
  available: boolean;
  khatmah: number;
  reflections: number;
  knowledge: number;
  assets: number;
  outbox_pending: number;
}> {
  const db = getQuranOfflineDb();
  if (!db) {
    return {
      available: false,
      khatmah: 0,
      reflections: 0,
      knowledge: 0,
      assets: 0,
      outbox_pending: 0,
    };
  }
  const [khatmah, reflections, knowledge, assets, outbox_pending] = await Promise.all([
    db.khatmah_store.count(),
    db.user_reflections_store.count(),
    db.quran_knowledge_store.count(),
    db.offline_assets_store.count(),
    db.outbox_sync_store.where("status").equals("pending").count(),
  ]);
  return { available: true, khatmah, reflections, knowledge, assets, outbox_pending };
}
