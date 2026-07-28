import { useCallback, useState } from "react";
import {
  compareMutashabihVerses,
  listMutashabihatCandidates,
  type MutashabihatCandidate,
  type VerseComparisonResult,
} from "@/lib/mutashabihat-comparison";

/** Contextual mutashabihat comparison — logic only. */
export function useMutashabihatComparison() {
  const [candidates, setCandidates] = useState<MutashabihatCandidate[]>([]);
  const [comparison, setComparison] = useState<VerseComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCandidates = useCallback(async (surah: number, ayah: number) => {
    setLoading(true);
    try {
      const list = await listMutashabihatCandidates(surah, ayah);
      setCandidates(list);
      return list;
    } finally {
      setLoading(false);
    }
  }, []);

  const compare = useCallback(
    (opts: Parameters<typeof compareMutashabihVerses>[0]) => {
      const result = compareMutashabihVerses(opts);
      setComparison(result);
      return result;
    },
    [],
  );

  const clear = useCallback(() => {
    setComparison(null);
    setCandidates([]);
  }, []);

  return { candidates, comparison, loading, loadCandidates, compare, clear };
}
