/**
 * QuranViewer — Madani mushaf page surface (scaffold).
 *
 * Planned: RTL page swipe, ayah tap → ActionBar, persist progress via QuranEngineContext.
 * Status: empty template — not wired into App routes yet.
 */
import type { CSSProperties } from "react";

export type QuranViewerProps = {
  initialPage?: number;
  className?: string;
  style?: CSSProperties;
};

export function QuranViewer(_props: QuranViewerProps = {}) {
  return (
    <div className="quran-viewer quran-viewer--scaffold" dir="rtl" data-scaffold="quran-viewer">
      {/* TODO: MushafPageV2 + PageCurlStage + QuranActionBar */}
      <p>QuranViewer — scaffold</p>
    </div>
  );
}

export default QuranViewer;
