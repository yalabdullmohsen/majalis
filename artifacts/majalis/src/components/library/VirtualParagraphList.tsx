"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  paragraphs: string[];
  className?: string;
};

/** Windowed paragraph list for long chapters. */
export function VirtualParagraphList({ paragraphs, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(560);
  const estimateHeight = 72;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight || 560));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (el) setScrollTop(el.scrollTop);
  }, []);

  const count = paragraphs.length;
  const overscan = 3;
  const start = Math.max(0, Math.floor(scrollTop / estimateHeight) - overscan);
  const visible = Math.ceil(viewportHeight / estimateHeight) + overscan * 2;
  const end = Math.min(count, start + visible);
  const totalHeight = count * estimateHeight;
  const offsetY = start * estimateHeight;

  const renderRow = (index: number): ReactNode => (
    <p key={index} className="lib-chapter__para">{paragraphs[index]}</p>
  );

  return (
    <div
      ref={containerRef}
      className={`lib-virtual-list ${className}`.trim()}
      onScroll={onScroll}
      role="article"
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {Array.from({ length: end - start }, (_, i) => renderRow(start + i))}
        </div>
      </div>
    </div>
  );
}

export default VirtualParagraphList;
