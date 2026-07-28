/**
 * TafseerService — memory → IndexedDB → remote tafsir fetch.
 *
 * Status: scaffold only — implement cache layers + edition selection next.
 */

export type TafseerAyahResult = {
  surah: number;
  ayah: number;
  text: string;
  sourceId: string;
};

/** Singleton placeholder — replace with offline-first tafsir pipeline. */
export class TafseerService {
  private static instance: TafseerService | null = null;

  static getInstance(): TafseerService {
    if (!TafseerService.instance) {
      TafseerService.instance = new TafseerService();
    }
    return TafseerService.instance;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /** TODO: resolve ayah tafsir (cache → network) */
  async getAyahTafsir(_surah: number, _ayah: number): Promise<TafseerAyahResult | null> {
    return null;
  }
}

export function getTafseerService(): TafseerService {
  return TafseerService.getInstance();
}
