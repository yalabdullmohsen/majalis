import { useCallback, useEffect, useState } from "react";
import {
  fetchMultiTafseerForAyah,
  listComparableTafsirEditions,
  type MultiTafseerResult,
} from "@/lib/multi-tafseer-service";
import { lookupGhareeb, type GhareebEntry } from "@/lib/ghareeb-quran-dictionary";
import type { MushafTafsirEdition } from "@/lib/tafsir-seed";

/** Multi-tafseer + ghareeb lookup — logic only. */
export function useMultiTafseer(
  surah: number | null,
  ayah: number | null,
  editionIds?: string[],
  verseText?: string,
) {
  const [result, setResult] = useState<MultiTafseerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!surah || !ayah) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMultiTafseerForAyah(surah, ayah, editionIds, verseText);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر جلب التفاسير");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [surah, ayah, editionIds, verseText]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const editions: MushafTafsirEdition[] = listComparableTafsirEditions();

  const lookupWord = useCallback((q: string): GhareebEntry[] => lookupGhareeb(q), []);

  return { result, loading, error, reload, editions, lookupWord };
}
