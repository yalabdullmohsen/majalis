import { useEffect, useState } from "react";
import type { KuwaitMushafState } from "@/hooks/useKuwaitMushaf";

type Props = {
  mushaf: KuwaitMushafState;
};

export function MushafToolbar({ mushaf }: Props) {
  const [pageInput, setPageInput] = useState(String(mushaf.page));
  const [ayahSurah, setAyahSurah] = useState(String(mushaf.pageMeta.surah));
  const [ayahNum, setAyahNum] = useState("1");

  useEffect(() => {
    setPageInput(String(mushaf.page));
  }, [mushaf.page]);

  const submitPage = () => {
    const n = Number(pageInput);
    if (Number.isFinite(n)) mushaf.setPage(n);
  };

  const submitAyah = () => {
    const s = Number(ayahSurah);
    const a = Number(ayahNum);
    if (Number.isFinite(s) && Number.isFinite(a)) void mushaf.goToAyah(s, a);
  };

  const zoomIn = () => mushaf.setPref({ zoom: Math.min(2.5, mushaf.prefs.zoom + 0.15) });
  const zoomOut = () => mushaf.setPref({ zoom: Math.max(0.6, mushaf.prefs.zoom - 0.15) });

  return (
    <div className={`km-toolbar${mushaf.prefs.hideChrome ? " km-toolbar--hidden" : ""}`}>
      <div className="km-toolbar__row km-toolbar__row--primary">
        <button type="button" className="km-btn" onClick={() => mushaf.setSidebarOpen(true)} aria-label="فهرس المصحف">
          ☰
        </button>
        <button
          type="button"
          className="km-btn"
          disabled={!mushaf.prevPage}
          onClick={() => mushaf.prevPage && mushaf.setPage(mushaf.prevPage)}
        >
          السابق
        </button>
        <div className="km-toolbar__page-info">
          <strong>صفحة {mushaf.page}</strong>
          <span>{mushaf.pageMeta.surahName} · جزء {mushaf.pageMeta.juz}</span>
        </div>
        <button
          type="button"
          className="km-btn km-btn--primary"
          disabled={!mushaf.nextPage}
          onClick={() => mushaf.nextPage && mushaf.setPage(mushaf.nextPage)}
        >
          التالي
        </button>
      </div>

      <div className="km-toolbar__row km-toolbar__row--secondary">
        <label className="km-toolbar__field">
          <span>صفحة</span>
          <input
            type="number"
            min={1}
            max={604}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitPage()}
            className="ds-input"
          />
          <button type="button" className="km-btn km-btn--sm" onClick={submitPage}>انتقل</button>
        </label>
        <label className="km-toolbar__field">
          <span>آية</span>
          <input type="number" min={1} max={114} value={ayahSurah} onChange={(e) => setAyahSurah(e.target.value)} className="ds-input km-input--surah" aria-label="رقم السورة" />
          <input type="number" min={1} value={ayahNum} onChange={(e) => setAyahNum(e.target.value)} className="ds-input km-input--ayah" aria-label="رقم الآية" />
          <button type="button" className="km-btn km-btn--sm" onClick={submitAyah}>انتقل</button>
        </label>
        <div className="km-toolbar__actions">
          <button type="button" className="km-btn km-btn--sm" onClick={zoomOut} aria-label="تصغير">−</button>
          <span className="km-toolbar__zoom">{Math.round(mushaf.prefs.zoom * 100)}%</span>
          <button type="button" className="km-btn km-btn--sm" onClick={zoomIn} aria-label="تكبير">+</button>
          <button
            type="button"
            className={`km-btn km-btn--sm${mushaf.prefs.nightMode ? " is-active" : ""}`}
            onClick={() => mushaf.setPref({ nightMode: !mushaf.prefs.nightMode })}
          >
            {mushaf.prefs.nightMode ? "نهاري" : "ليلي"}
          </button>
          <button
            type="button"
            className="km-btn km-btn--sm"
            onClick={() => mushaf.setPref({ hideChrome: !mushaf.prefs.hideChrome })}
          >
            {mushaf.prefs.hideChrome ? "إظهار" : "إخفاء"}
          </button>
          <button type="button" className="km-btn km-btn--sm" onClick={() => void mushaf.toggleFullscreen()}>
            {mushaf.fullscreen ? "خروج" : "ملء"}
          </button>
          <button type="button" className="km-btn km-btn--sm" onClick={mushaf.resumeLast}>آخر موضع</button>
          <button type="button" className="km-btn km-btn--sm" onClick={() => mushaf.bookmarkCurrent()}>علامة</button>
        </div>
      </div>
    </div>
  );
}
