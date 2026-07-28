import { useCallback, useState } from "react";
import {
  flattenFiqhReferences,
  getFiqhCrossLinkById,
  searchFiqhCrossLinks,
  type FiqhCrossLinkPayload,
  type FiqhCrossReference,
} from "@/lib/fiqh-cross-linker";

/** Comparative Fiqh cross-linker — logic only, no layout. */
export function useFiqhCrossLinker() {
  const [payload, setPayload] = useState<FiqhCrossLinkPayload | null>(null);
  const [results, setResults] = useState<FiqhCrossLinkPayload[]>([]);

  const loadRuling = useCallback((rulingId: string) => {
    const next = getFiqhCrossLinkById(rulingId);
    setPayload(next);
    return next;
  }, []);

  const search = useCallback((query: string, limit?: number) => {
    const hits = searchFiqhCrossLinks(query, limit);
    setResults(hits);
    return hits;
  }, []);

  const flatRefs: FiqhCrossReference[] = payload ? flattenFiqhReferences(payload) : [];

  const clear = useCallback(() => {
    setPayload(null);
    setResults([]);
  }, []);

  return { payload, results, flatRefs, loadRuling, search, clear };
}
