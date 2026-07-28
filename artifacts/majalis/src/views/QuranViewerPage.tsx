/**
 * Minimal page wrapper so QuranViewer can be mounted via App routes.
 * Keeps chrome light — full mushaf shell remains MushafPageView.
 * Framer Motion enter pairs visually with HomeDashboard leave-to-read flow.
 */
import { useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { QuranViewer } from "@/components/QuranViewer";
import { getDatabaseManager } from "@/core/quran";

export default function QuranViewerPage() {
  const [, params] = useRoute("/quran-viewer/page/:page");
  const initial = params?.page ? Number(params.page) : undefined;
  const initialPage =
    initial && Number.isFinite(initial) && initial >= 1 && initial <= 604
      ? initial
      : undefined;

  const sessionStarted = useRef<number>(Date.now());

  useEffect(() => {
    sessionStarted.current = Date.now();
    return () => {
      const delta = Date.now() - sessionStarted.current;
      if (delta > 3_000) {
        void getDatabaseManager()
          .addDailyReadingTimeMs(Math.min(delta, 45 * 60_000))
          .catch(() => undefined);
      }
    };
  }, []);

  return (
    <motion.main
      className="quran-viewer-page"
      dir="rtl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="quran-viewer-page__header">
        <h1 className="quran-viewer-page__title">المصحف</h1>
        <p className="quran-viewer-page__sub">عرض مدني مرتبط بمحرك القراءة</p>
      </header>
      <QuranViewer
        initialPage={initialPage}
        className="quran-viewer-page__viewer"
        onAyahSelect={(ayah) => {
          if (
            typeof window !== "undefined" &&
            (window as unknown as { __QV_DEBUG?: boolean }).__QV_DEBUG
          ) {
            console.info("[QuranViewer] ayah", ayah);
          }
        }}
      />
    </motion.main>
  );
}
