import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Props<T> = {
  items: T[];
  itemHeight: number;
  overscan?: number;
  className?: string;
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string;
};

function VirtualListInner<T>({
  items,
  itemHeight,
  overscan = 4,
  className = "",
  renderItem,
  getKey,
}: Props<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(480);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height || 480);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onScroll = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(height / itemHeight) + overscan * 2;
  const end = Math.min(items.length, start + visibleCount);

  const slice = useMemo(() => items.slice(start, end), [items, start, end]);

  return (
    <div
      ref={rootRef}
      className={`ds-virtual-list ${className}`.trim()}
      onScroll={onScroll}
      role="list"
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {slice.map((item, i) => {
          const index = start + i;
          return (
            <div
              key={getKey(item, index)}
              className="ds-virtual-list__item"
              style={{ position: "absolute", top: index * itemHeight, left: 0, right: 0, height: itemHeight }}
              role="listitem"
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;
