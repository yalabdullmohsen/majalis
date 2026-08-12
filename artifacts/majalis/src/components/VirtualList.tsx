/**
 * قائمة افتراضية خفيفة — ترسم نوافذ العرض فقط (بدون مكتبات خارجية).
 * مناسبة لفهرس السور ونتائج البحث وقوائم الكتب الطويلة.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import "@/styles/components/virtual-list.css";

export type VirtualListHandle = {
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  getScrollElement: () => HTMLElement | null;
};

export type VirtualListProps<T> = {
  items: T[];
  /** ارتفاع تقديري للصف (px) — يُستخدم للحساب قبل القياس الفعلي */
  estimateSize?: number;
  overscan?: number;
  className?: string;
  style?: CSSProperties;
  getItemKey?: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  as?: "div" | "ol" | "ul";
  role?: string;
  "aria-label"?: string;
  /** عتبة التفعيل — دونها تُرسم القائمة كاملة (114 سورة صغيرة لا تحتاج نوافذ) */
  virtualizeAbove?: number;
};

function VirtualListInner<T>(
  {
    items,
    estimateSize = 64,
    overscan = 6,
    className,
    style,
    getItemKey,
    renderItem,
    as = "div",
    role,
    "aria-label": ariaLabel,
    virtualizeAbove = 24,
  }: VirtualListProps<T>,
  ref: React.ForwardedRef<VirtualListHandle>,
) {
  const parentRef = useRef<HTMLElement | null>(null);
  const sizeCache = useRef(new Map<number, number>());
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(480);

  const virtualize = items.length > virtualizeAbove;

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index: number, behavior: ScrollBehavior = "smooth") => {
        const el = parentRef.current;
        if (!el) return;
        const clamped = Math.max(0, Math.min(items.length - 1, index));
        let top = 0;
        for (let i = 0; i < clamped; i++) {
          top += sizeCache.current.get(i) ?? estimateSize;
        }
        el.scrollTo({ top, behavior });
      },
      getScrollElement: () => parentRef.current,
    }),
    [items.length, estimateSize],
  );

  useEffect(() => {
    const el = parentRef.current;
    if (!el || !virtualize) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => setViewportH(el.clientHeight || 480))
      : null;
    setViewportH(el.clientHeight || 480);
    el.addEventListener("scroll", onScroll, { passive: true });
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro?.disconnect();
    };
  }, [virtualize, items.length]);

  const offsets = useMemo(() => {
    const arr = new Array<number>(items.length + 1);
    arr[0] = 0;
    for (let i = 0; i < items.length; i++) {
      arr[i + 1] = arr[i]! + (sizeCache.current.get(i) ?? estimateSize);
    }
    return arr;
  }, [items.length, estimateSize, scrollTop, viewportH]);

  const totalHeight = offsets[items.length] ?? 0;

  let start = 0;
  while (start < items.length && (offsets[start + 1] ?? 0) < scrollTop) start++;
  start = Math.max(0, start - overscan);

  let end = start;
  const bottom = scrollTop + viewportH;
  while (end < items.length && (offsets[end] ?? 0) < bottom) end++;
  end = Math.min(items.length, end + overscan);

  const measure = useCallback((index: number, node: HTMLElement | null) => {
    if (!node) return;
    const h = node.getBoundingClientRect().height;
    if (!Number.isFinite(h) || h <= 0) return;
    const prev = sizeCache.current.get(index);
    if (prev != null && Math.abs(prev - h) < 1) return;
    sizeCache.current.set(index, h);
  }, []);

  const listLike = as === "ol" || as === "ul";
  const Tag = virtualize ? "div" : as;
  const RowTag = !virtualize && listLike ? "li" : "div";
  const cls = ["vlist", className].filter(Boolean).join(" ");
  const listRole = role ?? (listLike ? "list" : undefined);

  if (!virtualize) {
    return (
      <Tag
        ref={parentRef as never}
        className={cls}
        style={style}
        role={listRole}
        aria-label={ariaLabel}
      >
        {items.map((item, index) => (
          <RowTag
            key={getItemKey ? getItemKey(item, index) : index}
            className="vlist__row"
            data-index={index}
            role={listLike ? "listitem" : undefined}
          >
            {renderItem(item, index)}
          </RowTag>
        ))}
      </Tag>
    );
  }

  const slice: ReactNode[] = [];
  for (let i = start; i < end; i++) {
    const item = items[i]!;
    const top = offsets[i] ?? i * estimateSize;
    slice.push(
      <div
        key={getItemKey ? getItemKey(item, i) : i}
        className="vlist__row vlist__row--abs"
        data-index={i}
        role={listLike ? "listitem" : undefined}
        style={{ transform: `translateY(${top}px)` }}
        ref={(node: HTMLElement | null) => measure(i, node)}
      >
        {renderItem(item, i)}
      </div>,
    );
  }

  return (
    <div
      ref={parentRef as never}
      className={`${cls} vlist--virtual`}
      style={style}
      role={listRole}
      aria-label={ariaLabel}
    >
      <div className="vlist__spacer" style={{ height: totalHeight }} aria-hidden="true" />
      {slice}
    </div>
  );
}

export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.Ref<VirtualListHandle> },
) => ReturnType<typeof VirtualListInner>;
