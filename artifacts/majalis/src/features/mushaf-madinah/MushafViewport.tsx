import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { loadMushafPage, prefetchMushafPage, type MushafPageLayout } from "@/lib/quran-data/qpc-page-data";
import {
  clampMushafPage,
  MUSHAF_PAGE_MAX,
  MUSHAF_PAGE_MIN,
  saveLastPage,
} from "@/lib/quran-last-page";
import { MushafControls } from "./MushafControls";
import { MushafPage } from "./MushafPage";
import { useQpcPageFont } from "./useQpcPageFont";
import "./mushaf-madinah.css";

type Props = {
  pageNumber: number;
  onPageChange: (page: number) => void;
  onExit: () => void;
  onIndex: () => void;
};

const SWIPE_MIN = 48;

/** إطار القراءة: تحميل الصفحة، السحب، الأدوات عند اللمس. */
export function MushafViewport({ pageNumber, onPageChange, onExit, onIndex }: Props) {
  const page = clampMushafPage(pageNumber);
  const [layout, setLayout] = useState<MushafPageLayout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chromeOpen, setChromeOpen] = useState(true);
  const { fontFamily, ready: fontReady } = useQpcPageFont(page);
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLayout(null);
    loadMushafPage(page)
      .then((data) => {
        if (!cancelled) setLayout(data);
      })
      .catch(() => {
        if (!cancelled) setError("تعذّر تحميل الصفحة");
      });
    prefetchMushafPage(page - 1);
    prefetchMushafPage(page + 1);
    void saveLastPage(page);
    return () => {
      cancelled = true;
    };
  }, [page]);

  const bumpChrome = useCallback(() => {
    setChromeOpen(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setChromeOpen(false), 2800);
  }, []);

  useEffect(() => {
    bumpChrome();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [page, bumpChrome]);

  const go = useCallback(
    (next: number) => {
      onPageChange(clampMushafPage(next));
    },
    [onPageChange],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".mm-controls")) return;
    touchRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".mm-controls")) return;
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dt = Date.now() - start.t;
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) && dt < 800) {
      // سحب لليسار = التالي، لليمين = السابق
      if (dx < 0) go(page + 1);
      else go(page - 1);
      return;
    }
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      setChromeOpen((v) => !v);
      if (!chromeOpen) bumpChrome();
    }
  };

  return (
    <div
      className="mm-viewport"
      data-chrome={chromeOpen ? "1" : "0"}
      data-testid="mushaf-viewport"
      dir="rtl"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        touchRef.current = null;
      }}
    >
      <div className="mm-page-shell">
        {error ? <div className="mm-status">{error}</div> : null}
        {!error && (!layout || !fontReady) ? (
          <div className="mm-status" role="status">
            جاري تحميل الصفحة…
          </div>
        ) : null}
        {layout && fontReady ? <MushafPage layout={layout} fontFamily={fontFamily} /> : null}
      </div>

      <MushafControls
        open={chromeOpen}
        pageNumber={page}
        onExit={onExit}
        onIndex={onIndex}
        onPrev={() => go(page - 1)}
        onNext={() => go(page + 1)}
        onGoto={go}
      />

      <span className="sr-only" aria-live="polite">
        صفحة {page} من {MUSHAF_PAGE_MAX}
      </span>
      <span hidden data-min={MUSHAF_PAGE_MIN} />
    </div>
  );
}
