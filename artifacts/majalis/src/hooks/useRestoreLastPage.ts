/**
 * RN sketch: restore `lastPage` on mount; caller still saves on page change
 * via {@link saveLastPage} / {@link savePagePosition}.
 *
 * ```ts
 * useEffect(() => { void loadLastPage().then(p => p && setCurrentPage(p)); }, []);
 * ```
 */
import { useEffect, useRef } from "react";
import { loadLastPage } from "@/lib/quran-last-page";

type Options = {
  /** When false, skip restore (e.g. URL already specifies a page). */
  enabled?: boolean;
  /** Called once when a saved page is found. */
  onRestore: (page: number) => void;
};

export function useRestoreLastPage({ enabled = true, onRestore }: Options): void {
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const run = async () => {
      try {
        const savedPage = await loadLastPage();
        if (cancelled || savedPage === null) return;
        onRestoreRef.current(savedPage);
      } catch (e) {
        console.error("خطأ في استعادة الصفحة", e);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
