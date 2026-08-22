import { useLayoutEffect, useState } from "react";

type Band = { left: number; top: number; width: number; height: number };
type Props = {
  container: HTMLElement | null;
  verseKey: string | null;
  playingKey?: string | null;
};

const LINE_TOL_PX = 6;

function collectBands(root: HTMLElement, verseKey: string): Band[] {
  const nodes = root.querySelectorAll<HTMLElement>(
    `[data-verse="${CSS.escape(verseKey)}"]:not([data-type="end"])`,
  );
  const origin = root.getBoundingClientRect();
  const raw: Band[] = [];
  nodes.forEach((node) => {
    const rects = node.getClientRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i]!;
      if (r.width < 1 || r.height < 1) continue;
      raw.push({
        left: r.left - origin.left + root.scrollLeft,
        top: r.top - origin.top + root.scrollTop,
        width: r.width,
        height: r.height,
      });
    }
  });
  raw.sort((a, b) => a.top - b.top || a.left - b.left);
  const lines: Band[] = [];
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
}

/**
 * طبقة تظليل آية: شريط واحد لكل سطر عبر دمج getClientRects.
 * لا تلوّن الكلمات ولا علامة الآية.
 */
export function MushafAyahHighlight({ container, verseKey, playingKey = null }: Props) {
  const [selected, setSelected] = useState<Band[]>([]);
  const [playing, setPlaying] = useState<Band[]>([]);

  useLayoutEffect(() => {
    if (!container) {
      setSelected([]);
      setPlaying([]);
      return;
    }
    const measure = () => {
      setSelected(verseKey ? collectBands(container, verseKey) : []);
      setPlaying(playingKey && playingKey !== verseKey ? collectBands(container, playingKey) : []);
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(container);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [container, verseKey, playingKey]);

  if (!selected.length && !playing.length) return null;

  return (
    <div className="mm-ayah-hl" data-testid="mushaf-ayah-highlight" aria-hidden="true">
      {playing.map((b, i) => (
        <span
          key={`p-${i}`}
          className="mm-ayah-hl__band is-playing"
          style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
        />
      ))}
      {selected.map((b, i) => (
        <span
          key={`s-${i}`}
          className="mm-ayah-hl__band is-selected"
          style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
        />
      ))}
    </div>
  );
}
