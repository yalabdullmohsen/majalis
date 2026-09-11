import { memo, useLayoutEffect, useRef, useState } from "react";
import { clearTextMeasureCache, getCachedTextBands, type TextBand } from "@/lib/text-layout-geometry";
import {
  useMushafAyahPlayingKey,
  useMushafAyahSelectedKey,
} from "@/features/mushaf-madinah/mushaf-ayah-sync-store";

type Props = {
  container: HTMLElement | null;
  /** لا تقيس أثناء السحب/الانتقال */
  enabled?: boolean;
};

const LINE_TOL_PX = 4;
const BAND_PAD_X = 1;
const BAND_PAD_Y = 0;
/** سقف ارتفاع الشريط — يمنع مستطيلات سطرية ضخمة من line-box العثماني */
const MAX_BAND_EM = 1.2;

function collectBands(root: HTMLElement, verseKey: string): TextBand[] {
  const scrollLeft = root.scrollLeft;
  const scrollTop = root.scrollTop;
  const fontPx =
    Number.parseFloat(getComputedStyle(root).fontSize || "24") || 24;
  const maxH = Math.max(14, fontPx * MAX_BAND_EM);
  const cacheKey = `nm-sel|${verseKey}|${root.clientWidth}|${root.clientHeight}|${Math.round(maxH)}`;
  return getCachedTextBands(cacheKey, scrollLeft, scrollTop, () => {
    const nodes = root.querySelectorAll<HTMLElement>(
      `[data-verse="${CSS.escape(verseKey)}"]`,
    );
    const origin = root.getBoundingClientRect();
    const raw: TextBand[] = [];
    nodes.forEach((node) => {
      const rects = node.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i]!;
        if (r.width < 1 || r.height < 1) continue;
        const h = Math.min(r.height, maxH);
        const yPad = Math.max(0, (r.height - h) / 2);
        raw.push({
          left: r.left - origin.left + scrollLeft - BAND_PAD_X,
          top: r.top - origin.top + scrollTop + yPad - BAND_PAD_Y,
          width: r.width + BAND_PAD_X * 2,
          height: h + BAND_PAD_Y * 2,
        });
      }
    });
    raw.sort((a, b) => a.top - b.top || a.left - b.left);
    const lines: TextBand[] = [];
    for (const box of raw) {
      const line = lines.find((l) => Math.abs(l.top - box.top) <= LINE_TOL_PX);
      if (!line) {
        lines.push({ ...box });
        continue;
      }
      const right = Math.max(line.left + line.width, box.left + box.width);
      const left = Math.min(line.left, box.left);
      line.left = left;
      line.width = right - left;
      line.top = Math.min(line.top, box.top);
      line.height = Math.min(maxH, Math.max(line.height, box.height));
    }
    return lines;
  });
}

/**
 * تحديد آية كاملة بشرائط سطرية متصلة — بلا خلفية على كل كلمة.
 */
export const AyahSelectionOverlay = memo(function AyahSelectionOverlay({
  container,
  enabled = true,
}: Props) {
  const selectedKey = useMushafAyahSelectedKey();
  const playingKey = useMushafAyahPlayingKey();
  const [selected, setSelected] = useState<TextBand[]>([]);
  const [playing, setPlaying] = useState<TextBand[]>([]);
  const rafRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!container || !enabled) {
      clearTextMeasureCache();
      setSelected([]);
      setPlaying([]);
      return;
    }

    const measureNow = () => {
      rafRef.current = null;
      setSelected(selectedKey ? collectBands(container, selectedKey) : []);
      setPlaying(
        playingKey && playingKey !== selectedKey
          ? collectBands(container, playingKey)
          : [],
      );
    };

    const schedule = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(measureNow);
    };

    /* أعد القياس بعد تبديل الصفحة/الخط دون الاعتماد على كاش قديم */
    clearTextMeasureCache();
    measureNow();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    ro?.observe(container);
    window.addEventListener("resize", schedule);

    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      ro?.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [container, enabled, playingKey, selectedKey]);

  useLayoutEffect(() => {
    return () => {
      if (!container) clearTextMeasureCache();
    };
  }, [container]);

  if (!selected.length && !playing.length) return null;

  return (
    <div className="nm-ayah-sel" data-testid="ayah-selection-overlay" aria-hidden="true">
      {playing.map((b, i) => (
        <span
          key={`play-${playingKey}-${i}-${Math.round(b.left)}-${Math.round(b.top)}`}
          className="nm-ayah-sel__band nm-ayah-sel__band--playing"
          style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
        />
      ))}
      {selected.map((b, i) => (
        <span
          key={`sel-${selectedKey}-${i}-${Math.round(b.left)}-${Math.round(b.top)}`}
          className="nm-ayah-sel__band nm-ayah-sel__band--selected"
          style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
        />
      ))}
    </div>
  );
});
