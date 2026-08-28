import { memo, useLayoutEffect, useRef, useState } from "react";
import { shouldThrottleUiRender } from "@/lib/power-saver-engine";
import { clearTextMeasureCache, getCachedTextBands, type TextBand } from "@/lib/text-layout-geometry";
import { useMushafAyahPlayingKey } from "./mushaf-ayah-sync-store";

type Props = {
  container: HTMLElement | null;
};

const LINE_TOL_PX = 6;
const BAND_PAD_X = 3;
const BAND_PAD_Y = 2;

function collectBands(root: HTMLElement, verseKey: string): TextBand[] {
  const scrollLeft = root.scrollLeft;
  const scrollTop = root.scrollTop;
  const cacheKey = `${verseKey}|${root.clientWidth}|${root.clientHeight}`;
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
        raw.push({
          left: r.left - origin.left + scrollLeft - BAND_PAD_X,
          top: r.top - origin.top + scrollTop - BAND_PAD_Y,
          width: r.width + BAND_PAD_X * 2,
          height: r.height + BAND_PAD_Y * 2,
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
      line.height = Math.max(line.height, box.height);
    }
    return lines;
  });
}

/**
 * طبقة تظليل للتلاوة الجارية فقط (getClientRects).
 * تحديد الآية يعتمد على class على الكلمات عبر sync-store — بلا إعادة رسم الصفحة.
 */
export const MushafAyahHighlight = memo(function MushafAyahHighlight({ container }: Props) {
  const playingKey = useMushafAyahPlayingKey();
  const [playing, setPlaying] = useState<TextBand[]>([]);
  const rafRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!container) {
      setPlaying([]);
      return;
    }

    const measureNow = () => {
      rafRef.current = null;
      if (shouldThrottleUiRender() && !playingKey) {
        setPlaying([]);
        return;
      }
      /* التحديد عبر CSS على الكلمات؛ الشريط أثناء التلاوة فقط */
      setPlaying(playingKey ? collectBands(container, playingKey) : []);
    };

    const scheduleMeasure = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(measureNow);
    };

    measureNow();
    scheduleMeasure();

    const scrollRoot = container.closest<HTMLElement>(".mm-page-shell") ?? container;
    const onScroll = () => scheduleMeasure();
    scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("scroll", onScroll, { passive: true });

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleMeasure) : null;
    ro?.observe(container);
    if (scrollRoot !== container) ro?.observe(scrollRoot);
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      scrollRoot.removeEventListener("scroll", onScroll);
      container.removeEventListener("scroll", onScroll);
      ro?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [container, playingKey]);

  useLayoutEffect(() => {
    return () => {
      if (!container) clearTextMeasureCache();
    };
  }, [container]);

  if (!playing.length) return null;

  return (
    <div className="mm-ayah-hl" data-testid="mushaf-ayah-highlight" aria-hidden="true">
      {playing.map((b, i) => (
        <span
          key={`p-${playingKey ?? "x"}-${i}-${Math.round(b.left)}-${Math.round(b.top)}`}
          className="mm-ayah-hl__band is-playing"
          style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
        />
      ))}
    </div>
  );
});
