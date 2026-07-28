/**
 * TafseerService — offline-first tafsir (IndexedDB → AlQuran Cloud API).
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

export const DEFAULT_TAFSEER_SOURCE = "ar.muyassar";

const memory = new Map<string, TafseerAyahResult>();

function memKey(surah: number, ayah: number, source: string): string {
  return `${source}:${surah}:${ayah}`;
}

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

  setSource(sourceId: string): void {
    this.sourceId = sourceId || DEFAULT_TAFSEER_SOURCE;
    void this.db.setSetting("preferredTafseerSource", this.sourceId);
  }

  getSource(): string {
    return this.sourceId;
  }

  async hydrateSource(): Promise<void> {
    const stored = await this.db.getSetting<string>("preferredTafseerSource");
    if (stored) this.sourceId = stored;
  }

  /**
   * Resolve ayah tafsir: memory → IndexedDB → remote API (then cache).
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
      void this.db.cacheTafseer({
        ayahId: verseKey(surah, ayah),
        source,
        content: hit.text,
      });
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
