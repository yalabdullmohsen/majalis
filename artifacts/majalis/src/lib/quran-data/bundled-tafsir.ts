/**
 * قراءة التفسير المجمَّع محلياً — public/data/tafsir/{id}/{surah}.json
 */

import type { TafsirRegistryEntry } from "@/lib/quran-data/tafsir-registry";

export type BundledSurahTafsir = {
  surah: number;
  tafsirId: string;
  quranComSlug?: string;
  ayahs: Record<string, string>;
};

const surahCache = new Map<string, BundledSurahTafsir>();

function cacheKey(tafsirId: string, surah: number): string {
  return `${tafsirId}:${surah}`;
}

export async function readBundledTafsirAyah(
  surah: number,
  ayah: number,
  tafsirId: string,
): Promise<string | null> {
  const surahKey = cacheKey(tafsirId, surah);
  let pack = surahCache.get(surahKey);
  if (!pack) {
    const file = `/data/tafsir/${encodeURIComponent(tafsirId)}/${String(surah).padStart(3, "0")}.json`;
    try {
      const res = await fetch(file, { credentials: "omit" });
      if (!res.ok) return null;
      pack = (await res.json()) as BundledSurahTafsir;
      surahCache.set(surahKey, pack);
    } catch {
      return null;
    }
  }
  const text = pack.ayahs[String(ayah)]?.trim();
  return text || null;
}

export function isBundledTafsir(entry: TafsirRegistryEntry): boolean {
  return entry.bundled === true;
}

export function clearBundledTafsirCache(): void {
  surahCache.clear();
}
