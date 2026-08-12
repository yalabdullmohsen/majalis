/**
 * Selection → colored scientific highlight (فائدة) with optional note.
 * Attach around readable Arabic prose (tafsir, fawaid, books).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addTextHighlight,
  type HighlightColor,
  HIGHLIGHT_COLOR_LABEL,
} from "@/lib/text-highlights";
import "@/styles/components/text-highlight-capture.css";

type Props = {
  source: string;
  sourceId: string;
  sourceTitle: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
};

type Pop = {
  quote: string;
  x: number;
  y: number;
};

export function TextHighlightCapture({
  source,
  sourceId,
  sourceTitle,
  href,
  children,
  className = "",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pop, setPop] = useState<Pop | null>(null);
  const [note, setNote] = useState("");
  const [color, setColor] = useState<HighlightColor>("yellow");
  const [savedFlash, setSavedFlash] = useState(false);

  const clear = useCallback(() => {
    setPop(null);
    setNote("");
    setColor("yellow");
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const text = sel.toString().replace(/\s+/g, " ").trim();
      if (text.length < 8 || text.length > 2000) return;
      const range = sel.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) return;
      const rect = range.getBoundingClientRect();
      setPop({
        quote: text,
        x: Math.min(Math.max(rect.left + rect.width / 2, 16), window.innerWidth - 16),
        y: Math.max(rect.top - 8, 8),
      });
    };

    root.addEventListener("mouseup", onUp);
    root.addEventListener("touchend", onUp, { passive: true });
    return () => {
      root.removeEventListener("mouseup", onUp);
      root.removeEventListener("touchend", onUp);
    };
  }, []);

  useEffect(() => {
    if (!pop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clear();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pop, clear]);

  const save = () => {
    if (!pop) return;
    addTextHighlight({
      color,
      source,
      sourceId,
      sourceTitle,
      quote: pop.quote,
      note: note.trim(),
      href,
    });
    setSavedFlash(true);
    window.setTimeout(() => {
      setSavedFlash(false);
      clear();
      try {
        window.getSelection()?.removeAllRanges();
      } catch {
        /* ignore */
      }
    }, 700);
  };

  return (
    <div ref={rootRef} className={`thc-root ${className}`.trim()}>
      {children}
      {pop && (
        <div
          className="thc-pop"
          role="dialog"
          aria-label="حفظ تحديد كفائدة علمية"
          style={{ left: pop.x, top: pop.y }}
        >
          <p className="thc-pop__quote" dir="rtl" lang="ar">
            {pop.quote.slice(0, 120)}
            {pop.quote.length > 120 ? "…" : ""}
          </p>
          <div className="thc-pop__colors" role="group" aria-label="لون التحديد">
            {(["yellow", "green", "blue"] as HighlightColor[]).map((c) => (
              <button
                key={c}
                type="button"
                className={`thc-swatch thc-swatch--${c}${color === c ? " is-on" : ""}`}
                aria-pressed={color === c}
                aria-label={HIGHLIGHT_COLOR_LABEL[c]}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <textarea
            className="thc-pop__note"
            rows={2}
            dir="rtl"
            lang="ar"
            placeholder="فائدة علمية (اختياري)…"
            aria-label="فائدة علمية"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="thc-pop__actions">
            <button type="button" className="thc-btn thc-btn--ghost" onClick={clear}>
              إلغاء
            </button>
            <button type="button" className="thc-btn thc-btn--primary" onClick={save}>
              {savedFlash ? "✓ حُفظت" : "حفظ الفائدة"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
