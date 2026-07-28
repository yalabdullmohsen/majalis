/**
 * Calls {@link logProgress} whenever `page` changes (skips the initial mount),
 * matching the RN sketch that logs on page navigation.
 */
import { useEffect, useRef } from "react";
import { logProgress } from "@/lib/quran-reading-history";

export function useLogReadingProgress(page: number): void {
  const skipFirst = useRef(true);

  useEffect(() => {
    if (!Number.isFinite(page) || page < 1) return;
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    void logProgress();
  }, [page]);
}

export default useLogReadingProgress;
