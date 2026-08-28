import { useLayoutEffect, useRef, useState } from "react";
import { shouldThrottleUiRender } from "@/lib/power-saver-engine";
import { clearTextMeasureCache, getCachedTextBands, type TextBand } from "@/lib/text-layout-geometry";

type Props = {
  container: HTMLElement | null;
  verseKey: string | null;
  playingKey?: string | null;
};

const LINE_TOL_PX = 6;

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
          left: r.left - origin.left + scrollLeft,
          top: r.top - origin.top + scrollTop,
          width: r.width,
          height: r.height,
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
 * طبقة تظليل آية: شريط واحد لكل سطر عبر دمج getClientRects مع تخزين قياس مؤقت.
 * طبقة GPU منفصلة — بلا إعادة رسم شجرة الكلمات.
 */
export function MushafAyahHighlight({ container, verseKey, playingKey = null }: Props) {
  const [selected, setSelected] = useState<TextBand[]>([]);
  const [playing, setPlaying] = useState<TextBand[]>([]);
  const rafRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!container) {
      setSelected([]);
      setPlaying([]);
      return;
    }

    const measureNow = () => {
      rafRef.current = null;
      /* التحديد يجب أن يظهر فورًا حتى في وضع التوفير */
      setSelected(verseKey ? collectBands(container, verseKey) : []);
      if (shouldThrottleUiRender() && !verseKey) {
        setPlaying([]);
        return;
      }
      setPlaying(playingKey && playingKey !== verseKey ? collectBands(container, playingKey) : []);
    };

    const scheduleMeasure = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(measureNow);
    };

    scheduleMeasure();
    const onScroll = () => scheduleMeasure();
    container.addEventListener("scroll", onScroll, { passive: true });

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleMeasure) : null;
    ro?.observe(container);
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      container.removeEventListener("scroll", onScroll);
      ro?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [container, verseKey, playingKey]);

  useLayoutEffect(() => {
    return () => {
      if (!container) clearTextMeasureCache();
    };
  }, [container]);

  if (!selected.length && !playing.length) return null;

  return (
    <div className="mm-ayah-hl" data-testid="mushaf-ayah-highlight" aria-hidden="true">
      {playing.map((b, i) => (
        <span
          key={`p-${playingKey ?? "x"}-${i}-${Math.round(b.left)}-${Math.round(b.top)}`}
          className="mm-ayah-hl__band is-playing"
          style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
        />
      ))}
      {selected.map((b, i) => (
        <span
          key={`s-${verseKey ?? "x"}-${i}-${Math.round(b.left)}-${Math.round(b.top)}`}
          className="mm-ayah-hl__band is-selected"
          style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
        />
      ))}
    </div>
  );
}
