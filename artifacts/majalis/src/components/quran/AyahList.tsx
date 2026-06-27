import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AyahCard } from "./AyahCard";
import type { QuranPreferences } from "@/hooks/useQuranPreferences";

type Ayah = { numberInSurah: number; text: string };

type Props = {
  ayahs: Ayah[];
  prefs: QuranPreferences;
  targetAyah: number;
  onSelectAyah: (n: number) => void;
  tafsirByAyah?: Map<number, string>;
  onPlayFromAyah?: (n: number) => void;
  surahName: string;
};

const ROW_HEIGHT = 120;
const OVERSCAN = 5;

export function AyahList({
  ayahs,
  prefs,
  targetAyah,
  onSelectAyah,
  tafsirByAyah,
  onPlayFromAyah,
  surahName,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const idx = ayahs.findIndex((a) => a.numberInSurah === targetAyah);
    if (idx >= 0 && containerRef.current) {
      containerRef.current.scrollTop = idx * ROW_HEIGHT;
    }
  }, [targetAyah, ayahs]);

  const onScroll = useCallback(() => {
    if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
  }, []);

  const { start, end, offsetY, totalHeight } = useMemo(() => {
    const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(viewportH / ROW_HEIGHT) + OVERSCAN * 2;
    const endIdx = Math.min(ayahs.length, startIdx + visibleCount);
    return {
      start: startIdx,
      end: endIdx,
      offsetY: startIdx * ROW_HEIGHT,
      totalHeight: ayahs.length * ROW_HEIGHT,
    };
  }, [scrollTop, viewportH, ayahs.length]);

  const visible = ayahs.slice(start, end);

  const fontFamily =
    prefs.fontId === "amiri" ? "Amiri, serif" :
    prefs.fontId === "naskh" ? "Noto Naskh Arabic, serif" :
    "inherit";

  return (
    <section className={`quran-v2-ayah-section ui-card${prefs.readingMode ? " is-reading-mode" : ""}`} aria-label="آيات السورة">
      <h3 className="quran-v2-section-title">الآيات</h3>
      <div
        ref={containerRef}
        className="quran-v2-ayah-viewport"
        onScroll={onScroll}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visible.map((a) => (
              <AyahCard
                key={a.numberInSurah}
                ayah={a}
                active={a.numberInSurah === targetAyah}
                showNumber={prefs.showAyahNumbers}
                fontSize={prefs.fontScale}
                fontFamily={fontFamily}
                hideTashkeel={prefs.hideTashkeel}
                tafsir={tafsirByAyah?.get(a.numberInSurah)}
                onSelect={() => onSelectAyah(a.numberInSurah)}
                onPlay={() => onPlayFromAyah?.(a.numberInSurah)}
                surahName={surahName}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
