import { useCallback, useEffect, useState } from "react";
import {
  listAdhkarByGrade,
  listAdhkarBySource,
  lookupHadithAuth,
  warmHadithAuthIndex,
  type AuthenticityGrade,
  type HadithAuthLookupResult,
  type HadithAuthRecord,
  type PrimaryHadithSource,
} from "@/lib/hadith-auth-engine";

/** Hadith authenticity background lookup — logic only. */
export function useHadithAuthLookup(opts?: { warmOnMount?: boolean }) {
  const [last, setLast] = useState<HadithAuthLookupResult | null>(null);
  const [indexSize, setIndexSize] = useState(0);

  useEffect(() => {
    if (opts?.warmOnMount === false) return;
    setIndexSize(warmHadithAuthIndex());
  }, [opts?.warmOnMount]);

  const lookup = useCallback((query: { id?: string; text?: string; gradeHint?: string; sourceHint?: string }) => {
    const result = lookupHadithAuth(query);
    setLast(result);
    return result;
  }, []);

  const byGrade = useCallback((grade: AuthenticityGrade, limit?: number): HadithAuthRecord[] => {
    return listAdhkarByGrade(grade, limit);
  }, []);

  const bySource = useCallback((source: PrimaryHadithSource, limit?: number): HadithAuthRecord[] => {
    return listAdhkarBySource(source, limit);
  }, []);

  return { last, indexSize, lookup, byGrade, bySource };
}
