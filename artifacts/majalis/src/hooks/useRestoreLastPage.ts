/**
 * RN sketch: restore `lastPage` on mount; caller still saves on page change
 * via {@link storageService.saveLastPage} / {@link savePagePosition}.
 *
 * ```ts
 * useEffect(() => {
 *   void storageService.getLastPage().then((p) => p && setCurrentPage(Number(p)));
 * }, []);
 * ```
 */
import { useEffect, useRef } from "react";
import { storageService } from "@/lib/quran-storage-service";

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
        const savedPage = await storageService.getLastPageNumber();
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
