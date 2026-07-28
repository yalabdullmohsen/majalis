/**
 * Minimal page wrapper so QuranViewer can be mounted via App routes.
 * Keeps chrome light — full mushaf shell remains MushafPageView.
 */
import { useRoute } from "wouter";
import { QuranViewer } from "@/components/QuranViewer";

export default function QuranViewerPage() {
  const [, params] = useRoute("/quran-viewer/page/:page");
  const initial = params?.page ? Number(params.page) : undefined;
  const initialPage =
    initial && Number.isFinite(initial) && initial >= 1 && initial <= 604
      ? initial
      : undefined;

  return (
    <main className="quran-viewer-page" dir="rtl">
      <header className="quran-viewer-page__header">
        <h1 className="quran-viewer-page__title">المصحف</h1>
        <p className="quran-viewer-page__sub">عرض مدني مرتبط بمحرك القراءة</p>
      </header>
      <QuranViewer
        initialPage={initialPage}
        className="quran-viewer-page__viewer"
        onAyahSelect={(ayah) => {
          // Soft debug hook for QA — no UI chrome change
          if (typeof window !== "undefined" && (window as unknown as { __QV_DEBUG?: boolean }).__QV_DEBUG) {
            console.info("[QuranViewer] ayah", ayah);
          }
        }}
      />
    </main>
  );
}
