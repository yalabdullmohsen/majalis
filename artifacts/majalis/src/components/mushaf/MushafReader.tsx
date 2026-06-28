import { MushafPageView } from "./MushafPageView";
import { MushafToolbar } from "./MushafToolbar";
import { MushafSidebar } from "./MushafSidebar";
import { MushafAyahActions } from "./MushafAyahActions";
import type { KuwaitMushafState } from "@/hooks/useKuwaitMushaf";

type Props = {
  mushaf: KuwaitMushafState;
};

export function MushafReader({ mushaf }: Props) {
  return (
    <div className={`km-reader${mushaf.prefs.nightMode ? " km-reader--night" : ""}${mushaf.fullscreen ? " km-reader--fullscreen" : ""}`}>
      {mushaf.sidebarOpen && (
        <div className="km-reader__overlay" onClick={() => mushaf.setSidebarOpen(false)} aria-hidden />
      )}
      <div className={`km-reader__sidebar-wrap${mushaf.sidebarOpen ? " is-open" : ""}`}>
        <MushafSidebar mushaf={mushaf} onNavigate={() => mushaf.setSidebarOpen(false)} />
      </div>

      <div className="km-reader__main">
        <MushafToolbar mushaf={mushaf} />
        <div className="km-reader__stage">
          <MushafPageView page={mushaf.page} theme={mushaf.theme} zoom={mushaf.prefs.zoom} />
        </div>
        <MushafAyahActions mushaf={mushaf} />
      </div>
    </div>
  );
}
