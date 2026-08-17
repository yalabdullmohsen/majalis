import { useCallback, useEffect, useState, type RefObject } from "react";

type HighlightRect = {
  top: number;
  right: number;
  width: number;
  height: number;
};

type Props = {
  pageRef: RefObject<HTMLElement | null>;
  verseKey: string | null;
};

function lineKey(el: Element): string {
  const line = el.closest(".mm-ayah-line, .mm-basmala, .mm-slot");
  return line ? `l-${line.getAttribute("data-slot") ?? ""}-${[...line.parentElement?.children ?? []].indexOf(line)}` : `w-${el.getAttribute("data-key") ?? ""}`;
}

function measure(page: HTMLElement, verseKey: string): HighlightRect[] {
  const pageRect = page.getBoundingClientRect();
  const words = [...page.querySelectorAll<HTMLElement>(`[data-verse="${CSS.escape(verseKey)}"]`)];
  if (words.length === 0) return [];

  const groups = new Map<string, HTMLElement[]>();
  for (const word of words) {
    const key = lineKey(word);
    const list = groups.get(key) ?? [];
    list.push(word);
    groups.set(key, list);
  }

  const rects: HighlightRect[] = [];
  for (const lineWords of groups.values()) {
    const first = lineWords[0]!.getBoundingClientRect();
    const last = lineWords[lineWords.length - 1]!.getBoundingClientRect();
    const width = Math.abs(first.right - last.left);
    if (width < 1) continue;
    rects.push({
      top: Math.min(first.top, last.top) - pageRect.top,
      right: pageRect.right - Math.max(first.right, last.right),
      width,
      height: Math.max(first.height, last.height),
    });
  }
  return rects;
}

/** طبقة تظليل متصلة خلف النص — مستطيل واحد لكل سطر، بلا إزاحة للكلمات. */
export function MushafAyahHighlight({ pageRef, verseKey }: Props) {
  const [rects, setRects] = useState<HighlightRect[]>([]);

  const refresh = useCallback(() => {
    const page = pageRef.current;
    if (!page || !verseKey) {
      setRects([]);
      return;
    }
    setRects(measure(page, verseKey));
  }, [pageRef, verseKey]);

  useEffect(() => {
    let raf = 0;
    raf = requestAnimationFrame(() => {
      refresh();
    });
    const page = pageRef.current;
    const ro = new ResizeObserver(() => {
      raf = requestAnimationFrame(refresh);
    });
    if (page) ro.observe(page);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [pageRef, refresh, verseKey]);

  if (!verseKey || rects.length === 0) return null;

  return (
    <div className="mm-ayah-highlight" aria-hidden="true">
      {rects.map((r, i) => (
        <span
          key={`${verseKey}-${i}`}
          className="mm-ayah-highlight__rect"
          style={{
            top: r.top,
            right: r.right,
            width: r.width,
            height: r.height,
          }}
        />
      ))}
    </div>
  );
}
