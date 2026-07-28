/**
 * Abortable data hooks — cancel stale fetches on navigation / dependency change.
 * Logic-only wrappers around RequestManager / local loaders.
 */

import { useEffect, useState } from "react";
import { useAsyncData, type UseAsyncDataOptions, type UseAsyncDataResult } from "@/hooks/use-async-data";
import { fetchSurahDetail, type SurahDetail } from "@/lib/quran-api";
import { loadMushafPage, type MushafPageLayout } from "@/lib/mushaf-v2-data";
import { usePublishedAdhkarItems } from "@/lib/adhkar-service";
import {
  MUSHAF_TAFSIR_EDITIONS,
  type MushafTafsirEdition,
} from "@/lib/tafsir-seed";

/**
 * useQuran — abortable surah detail fetch (cancels previous surah on change).
 */
export function useQuran(
  surahNumber: number | null | undefined,
  options?: UseAsyncDataOptions<SurahDetail>,
): UseAsyncDataResult<SurahDetail> {
  const n = surahNumber && surahNumber >= 1 && surahNumber <= 114 ? surahNumber : null;
  return useAsyncData<SurahDetail>(
    `useQuran:${n ?? "none"}`,
    async (signal) => {
      if (n == null) throw new Error("invalid_surah");
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      return fetchSurahDetail(n);
    },
    {
      ...options,
      enabled: (options?.enabled ?? true) && n != null,
      dedupeKey: `useQuran:${n}`,
    },
  );
}

/**
 * useQuranPage — abortable mushaf page layout load.
 */
export function useQuranPage(
  pageNumber: number | null | undefined,
  options?: UseAsyncDataOptions<MushafPageLayout>,
): UseAsyncDataResult<MushafPageLayout> {
  const p =
    pageNumber && pageNumber >= 1 && pageNumber <= 604 ? Math.floor(pageNumber) : null;
  return useAsyncData<MushafPageLayout>(
    `useQuranPage:${p ?? "none"}`,
    async (signal) => {
      if (p == null) throw new Error("invalid_page");
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      return loadMushafPage(p);
    },
    {
      ...options,
      enabled: (options?.enabled ?? true) && p != null,
      dedupeKey: `useQuranPage:${p}`,
    },
  );
}

/**
 * useAzkar — published adhkar list via existing service (same return shape).
 */
export function useAzkar() {
  return usePublishedAdhkarItems();
}

/**
 * useTafseer — tafsir edition catalogue with abortable selection hydrate.
 */
export function useTafseer(editionId?: string | null): {
  editions: MushafTafsirEdition[];
  edition: MushafTafsirEdition | null;
  loading: boolean;
} {
  const [edition, setEdition] = useState<MushafTafsirEdition | null>(null);
  const [loading, setLoading] = useState(Boolean(editionId));

  useEffect(() => {
    if (!editionId) {
      setEdition(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const ac = new AbortController();
    setLoading(true);
    queueMicrotask(() => {
      if (cancelled || ac.signal.aborted) return;
      const found = MUSHAF_TAFSIR_EDITIONS.find((w) => w.id === editionId) ?? null;
      setEdition(found);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [editionId]);

  return { editions: MUSHAF_TAFSIR_EDITIONS, edition, loading };
}
