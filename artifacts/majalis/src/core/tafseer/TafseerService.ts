/**
 * TafseerService — offline-first tafsir (IndexedDB → AlQuran Cloud API).
 *
 * Lookup order is intentional for perceived performance and offline resilience:
 * 1. In-memory Map (same session)
 * 2. Dexie `tafseer_cache` via {@link DatabaseManager}
 * 3. Remote `fetchTafsirAyahs` — then write-through to memory + IDB
 *
 * Network/IDB failures return `null` (never throw) so the ActionBar can show a
 * friendly fallback instead of breaking the ayah sheet.
 */
import { fetchTafsirAyahs } from "@/lib/quran-api";
import { getDatabaseManager, type DatabaseManager } from "@/core/quran/DatabaseManager";

export type TafseerAyahResult = {
  surah: number;
  ayah: number;
  text: string;
  sourceId: string;
  fromCache: boolean;
};

/** Default Arabic tafsir edition on AlQuran Cloud. */
export const DEFAULT_TAFSEER_SOURCE = "ar.muyassar";

const memory = new Map<string, TafseerAyahResult>();

/** Composite memory key: `source:surah:ayah`. */
function memKey(surah: number, ayah: number, source: string): string {
  return `${source}:${surah}:${ayah}`;
}

/** Stable verse key used by IndexedDB cache rows. */
function verseKey(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

export class TafseerService {
  private static instance: TafseerService | null = null;
  private db: DatabaseManager = getDatabaseManager();
  private sourceId = DEFAULT_TAFSEER_SOURCE;

  static getInstance(): TafseerService {
    if (!TafseerService.instance) TafseerService.instance = new TafseerService();
    return TafseerService.instance;
  }

  private constructor() {
    /* singleton */
  }

  /**
   * Switch tafsir edition and persist preference in IndexedDB settings.
   * Persistence is fire-and-forget; UI should not await it.
   */
  setSource(sourceId: string): void {
    this.sourceId = sourceId || DEFAULT_TAFSEER_SOURCE;
    void this.db.setSetting("preferredTafseerSource", this.sourceId);
  }

  getSource(): string {
    return this.sourceId;
  }

  /**
   * Restore preferred edition from IndexedDB (call once during engine hydrate).
   * Safe when IndexedDB is unavailable — keeps the default source.
   */
  async hydrateSource(): Promise<void> {
    try {
      const stored = await this.db.getSetting<string>("preferredTafseerSource");
      if (stored) this.sourceId = stored;
    } catch (err) {
      console.warn("[TafseerService] hydrateSource:", err);
    }
  }

  /**
   * Resolve ayah tafsir: memory → IndexedDB → remote API (then cache).
   *
   * @param surah 1–114
   * @param ayah 1-based within surah
   * @param source AlQuran Cloud edition id (defaults to active preference)
   * @returns resolved text row, or `null` when unavailable offline and online fetch fails
   */
  async getAyahTafsir(
    surah: number,
    ayah: number,
    source = this.sourceId,
  ): Promise<TafseerAyahResult | null> {
    const mk = memKey(surah, ayah, source);
    const memHit = memory.get(mk);
    if (memHit) return memHit;

    try {
      await this.db.initialize();
      const cached = await this.db.getCachedTafseer(verseKey(surah, ayah), source);
      if (cached?.content) {
        const row: TafseerAyahResult = {
          surah,
          ayah,
          text: cached.content,
          sourceId: source,
          fromCache: true,
        };
        memory.set(mk, row);
        return row;
      }
    } catch (err) {
      console.warn("[TafseerService] IDB read:", err);
    }

    try {
      const ayahs = await fetchTafsirAyahs(surah, source);
      const hit = ayahs.find((a) => a.numberInSurah === ayah);
      if (!hit?.text) return null;
      const row: TafseerAyahResult = {
        surah,
        ayah,
        text: hit.text,
        sourceId: source,
        fromCache: false,
      };
      memory.set(mk, row);
      try {
        await this.db.cacheTafseer({
          ayahId: verseKey(surah, ayah),
          source,
          content: hit.text,
        });
      } catch (cacheErr) {
        console.warn("[TafseerService] IDB write:", cacheErr);
      }
      return row;
    } catch (err) {
      console.warn("[TafseerService] network:", err);
      return null;
    }
  }
}

export function getTafseerService(): TafseerService {
  return TafseerService.getInstance();
}

export default getTafseerService;
