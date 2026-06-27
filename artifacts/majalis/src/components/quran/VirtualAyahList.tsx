import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  count: number;
  estimateHeight?: number;
  renderRow: (index: number) => ReactNode;
  className?: string;
};

/** Lightweight windowed list for long surahs — avoids rendering 200+ ayahs at once. */
export function VirtualAyahList({ count, estimateHeight = 88, renderRow, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(640);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight || 640));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (el) setScrollTop(el.scrollTop);
  }, []);

  const overscan = 4;
  const start = Math.max(0, Math.floor(scrollTop / estimateHeight) - overscan);
  const visible = Math.ceil(viewportHeight / estimateHeight) + overscan * 2;
  const end = Math.min(count, start + visible);

  const totalHeight = count * estimateHeight;
  const offsetY = start * estimateHeight;

  return (
    <div
      ref={containerRef}
      className={`quran-virtual-list ${className}`.trim()}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {Array.from({ length: end - start }, (_, i) => renderRow(start + i))}
        </div>
      </div>
    </div>
  );
}
