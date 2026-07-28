/**
 * TafseerService — fetch + cache Quranic interpretations (AlQuran Cloud editions).
 *
 * Cache ladder (never blocks UI; all async):
 *   1. in-memory LRU
 *   2. DatabaseManager.offline_assets_store (type tafseer_db)
 *   3. network via fetchTafsirAyahs → persist to IDB for offline
 *
 * No React dependencies.
 */
import { fetchTafsirAyahs, type TafsirAyah } from "@/lib/quran-api";
import { MUSHAF_TAFSIR_EDITIONS } from "@/lib/tafsir-seed";
import { getDatabaseManager } from "@/core/quran/DatabaseManager";
import type { TafseerAyahResult, TafseerSource, TafseerSourceId } from "@/core/tafseer/types";

const DEFAULT_EDITION: TafseerSourceId = "ar.muyassar";
const EDITION_SETTING_KEY = "tafseerDefaultEdition";
const MEM_MAX = 64;

/** Canonical sources exposed in the drawer (subset of MUSHAF_TAFSIR_EDITIONS). */
export const TAFSEER_SOURCES: TafseerSource[] = [
  {
    id: "ar.muyassar",
    label: "التفسير الميسّر",
    author: "مجمع الملك فهد",
    lang: "ar",
    level: "مبتدئ",
  },
  {
    id: "ar.jalalayn",
    label: "تفسير الجلالين",
    author: "المحلّي والسيوطي",
    lang: "ar",
    level: "مبتدئ",
  },
  {
    id: "ar.sadi",
    label: "تفسير السعدي",
    author: "عبد الرحمن السعدي",
    lang: "ar",
    level: "مبتدئ",
  },
  {
    id: "en.ibnukathir",
    label: "ابن كثير (إنجليزي)",
    author: "ابن كثير — ترجمة",
    lang: "en",
    level: "متوسط",
    caution:
      "ترجمة إنجليزية لتفسير ابن كثير عبر AlQuran Cloud (لا نص عربي كامل في هذه الطبعة).",
  },
  {
    id: "ar.baghawi",
    label: "تفسير البغوي",
    author: "البغوي",
    lang: "ar",
    level: "متوسط",
  },
  {
    id: "ar.qurtubi",
    label: "تفسير القرطبي",
    author: "القرطبي",
    lang: "ar",
    level: "متقدم",
  },
];

function assetId(edition: string, surah: number): string {
  return `tafseer_db:${edition}:s${surah}`;
}

function memKey(edition: string, surah: number, ayah: number): string {
  return `${edition}:${surah}:${ayah}`;
}

function resolveSource(edition: TafseerSourceId): TafseerSource {
  const fromList = TAFSEER_SOURCES.find((s) => s.id === edition);
  if (fromList) return fromList;
  const fromSeed = MUSHAF_TAFSIR_EDITIONS.find((s) => s.id === edition);
  if (fromSeed) {
    return {
      id: fromSeed.id,
      label: fromSeed.label,
      author: fromSeed.author,
      lang: fromSeed.id.startsWith("en.") ? "en" : "ar",
      level: fromSeed.level,
      caution: fromSeed.caution,
    };
  }
  return {
    id: edition,
    label: edition,
    author: "",
    lang: edition.startsWith("en.") ? "en" : "ar",
  };
}

/** Tiny LRU for ayah-level hits. */
class AyahLru {
  private map = new Map<string, TafseerAyahResult>();
  constructor(private max: number) {}
  get(key: string): TafseerAyahResult | undefined {
    const v = this.map.get(key);
    if (!v) return undefined;
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }
  set(key: string, value: TafseerAyahResult): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    while (this.map.size > this.max) {
      const first = this.map.keys().next().value;
      if (first == null) break;
      this.map.delete(first);
    }
  }
}

export class TafseerService {
  private mem = new AyahLru(MEM_MAX);
  private surahInflight = new Map<
    string,
    Promise<{ ayahs: TafsirAyah[]; fromCache: boolean }>
  >();
  private defaultEdition: TafseerSourceId = DEFAULT_EDITION;
  private editionHydrated = false;

  listSources(): TafseerSource[] {
    return TAFSEER_SOURCES.slice();
  }

  getDefaultEdition(): TafseerSourceId {
    return this.defaultEdition;
  }

  async hydrateDefaultEdition(): Promise<TafseerSourceId> {
    if (this.editionHydrated) return this.defaultEdition;
    this.editionHydrated = true;
    try {
      const db = getDatabaseManager();
      await db.initialize();
      const stored = await db.getSetting<string>(EDITION_SETTING_KEY);
      if (stored && TAFSEER_SOURCES.some((s) => s.id === stored)) {
        this.defaultEdition = stored;
      }
    } catch {
      /* keep default */
    }
    return this.defaultEdition;
  }

  async setDefaultEdition(edition: TafseerSourceId): Promise<void> {
    this.defaultEdition = edition;
    try {
      const db = getDatabaseManager();
      await db.setSetting(EDITION_SETTING_KEY, edition);
    } catch {
      /* ignore */
    }
  }

  /**
   * Resolve tafseer text for one ayah.
   * Prefers cache; network fetch is fire-and-cache for the whole surah.
   */
  async getAyahTafseer(
    surah: number,
    ayah: number,
    edition: TafseerSourceId = this.defaultEdition,
  ): Promise<TafseerAyahResult | null> {
    const s = Math.min(114, Math.max(1, Math.floor(surah) || 1));
    const a = Math.max(1, Math.floor(ayah) || 1);
    const ed = edition || this.defaultEdition;
    const mk = memKey(ed, s, a);

    const hit = this.mem.get(mk);
    if (hit) return { ...hit, fromCache: true };

    const { ayahs, fromCache } = await this.loadSurahEdition(s, ed);
    const row = ayahs.find((r) => r.numberInSurah === a);
    const text = row?.text?.trim() || "";
    if (!text) return null;

    const meta = resolveSource(ed);
    const result: TafseerAyahResult = {
      surah: s,
      ayah: a,
      edition: ed,
      text,
      sourceLabel: meta.label,
      fromCache,
    };
    this.mem.set(mk, result);
    return result;
  }

  /** Warm cache for a surah edition without awaiting on the UI path. */
  prefetchSurah(surah: number, edition: TafseerSourceId = this.defaultEdition): void {
    void this.loadSurahEdition(surah, edition).catch(() => undefined);
  }

  private async loadSurahEdition(
    surah: number,
    edition: string,
  ): Promise<{ ayahs: TafsirAyah[]; fromCache: boolean }> {
    const key = `${edition}:${surah}`;
    const inflight = this.surahInflight.get(key);
    if (inflight) return inflight;

    const run = (async () => {
      const cached = await this.readIdb(surah, edition);
      if (cached) return { ayahs: cached, fromCache: true };

      const fetched = await fetchTafsirAyahs(surah, edition);
      if (fetched.length) {
        void this.writeIdb(surah, edition, fetched).catch(() => undefined);
      }
      return { ayahs: fetched, fromCache: false };
    })();

    this.surahInflight.set(key, run);
    try {
      return await run;
    } finally {
      this.surahInflight.delete(key);
    }
  }

  private async readIdb(surah: number, edition: string): Promise<TafsirAyah[] | null> {
    try {
      const db = getDatabaseManager();
      await db.initialize();
      const row = await db.getAsset(assetId(edition, surah));
      if (!row || row.download_status !== "completed" || row.file_reference == null) {
        return null;
      }
      const ref = row.file_reference;
      let raw: string;
      if (typeof ref === "string") raw = ref;
      else if (ref instanceof Blob) raw = await ref.text();
      else return null;
      const parsed = JSON.parse(raw) as TafsirAyah[];
      if (!Array.isArray(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private async writeIdb(
    surah: number,
    edition: string,
    ayahs: TafsirAyah[],
  ): Promise<void> {
    try {
      const db = getDatabaseManager();
      await db.initialize();
      const json = JSON.stringify(ayahs);
      const blob = new Blob([json], { type: "application/json" });
      await db.upsertAsset({
        asset_id: assetId(edition, surah),
        type: "tafseer_db",
        surah_id: surah,
        download_status: "completed",
        file_reference: blob,
        size_bytes: blob.size,
        content_hash: `${edition}:${surah}:${ayahs.length}`,
        pinned: false,
      });
    } catch (err) {
      console.warn("[TafseerService] cache write failed:", err);
    }
  }
}

let singleton: TafseerService | null = null;

export function getTafseerService(): TafseerService {
  if (!singleton) singleton = new TafseerService();
  return singleton;
}

/** Test helper. */
export function __resetTafseerServiceForTests(): void {
  singleton = null;
}
