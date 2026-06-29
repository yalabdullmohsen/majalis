import { useRef, type TouchEvent } from "react";
import { MushafPageView } from "./MushafPageView";
import { MushafToolbar } from "./MushafToolbar";
import { MushafSidebar } from "./MushafSidebar";
import { MushafAyahActions } from "./MushafAyahActions";
import { MushafPageInfo } from "./MushafPageInfo";
import { MushafBottomNav } from "./MushafBottomNav";
import type { KuwaitMushafState } from "@/hooks/useKuwaitMushaf";

type Props = {
  mushaf: KuwaitMushafState;
};

export function MushafReader({ mushaf }: Props) {
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    touchRef.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) mushaf.goNext();
    else mushaf.goPrev();
  };

  const hideChrome = mushaf.prefs.hideChrome || mushaf.prefs.readingMode;

  return (
    <div
      className={`km-reader${mushaf.prefs.nightMode ? " km-reader--night" : ""}${mushaf.fullscreen ? " km-reader--fullscreen" : ""}${mushaf.prefs.readingMode ? " km-reader--reading" : ""}${mushaf.prefs.dualPage ? " km-reader--spread" : ""}`}
    >
      {mushaf.sidebarOpen && (
        <div className="km-reader__overlay" onClick={() => mushaf.setSidebarOpen(false)} aria-hidden />
      )}
      <div className={`km-reader__sidebar-wrap${mushaf.sidebarOpen ? " is-open" : ""}`}>
        <MushafSidebar mushaf={mushaf} onNavigate={() => mushaf.setSidebarOpen(false)} />
      </div>

      <div className="km-reader__main">
        <MushafToolbar mushaf={mushaf} />
        <div
          className="km-reader__stage"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {mushaf.prefs.dualPage && mushaf.spreadSecondPage ? (
            <div className="km-spread">
              <MushafPageView page={mushaf.spreadSecondPage} theme={mushaf.theme} zoom={mushaf.prefs.zoom} />
              <MushafPageView page={mushaf.page} theme={mushaf.theme} zoom={mushaf.prefs.zoom} />
            </div>
          ) : (
            <MushafPageView page={mushaf.page} theme={mushaf.theme} zoom={mushaf.prefs.zoom} />
          )}
        </div>
        {!hideChrome && (
          <MushafPageInfo page={mushaf.page} ayahCount={mushaf.ayahCountEstimate} />
        )}
        <MushafAyahActions mushaf={mushaf} />
        {!hideChrome && <MushafBottomNav mushaf={mushaf} />}
      </div>
    </div>
  );
}
