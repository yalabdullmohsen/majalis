import {
  forwardRef,
  useRef,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN } from "@/lib/quran-last-page";
import { useMushafPager, SWIPE_MIN_PX, SETTLE_MS } from "./useMushafPager";

export { SWIPE_MIN_PX, SETTLE_MS };

const DEFAULT_IGNORE =
  ".nm-controls, .nm-verse-menu, .mm-controls, .mm-audio-dock, .mm-ayah-bar, .mm-page-edge, .mm-reciter-sheet, .mm-search-sheet, .ayah-action-sheet, input, textarea, select, button";

type PagerProps = {
  page: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  onTapEmpty?: () => void;
  onNavigateStart?: () => void;
  ignoreSelector?: string;
  pageSlot: ReactNode;
  prevPage?: ReactNode;
  nextPage?: ReactNode;
  children?: ReactNode;
  "data-testid"?: string;
} & Omit<
  HTMLAttributes<HTMLDivElement>,
  "onPointerDown" | "onPointerUp" | "onPointerCancel" | "onPointerMove" | "children" | "data-testid"
>;

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(value);
  else ref.current = value;
}

/**
 * MushafPager — تقليب ثلاث لوحات بـ translate3d فقط (بلا scroll-snap / scale / fade).
 * ترتيب اللوحات LTR: next | current | prev — سحب يمين (dx > 0) يكشف التالية.
 */
export const MushafPager = forwardRef<HTMLDivElement, PagerProps>(function MushafPager(
  {
    page,
    onPageChange,
    disabled = false,
    onTapEmpty,
    onNavigateStart,
    ignoreSelector = DEFAULT_IGNORE,
    pageSlot,
    prevPage,
    nextPage,
    children,
    className,
    "data-testid": testId = "mushaf-pager",
    ...rest
  },
  forwardedRef,
) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  const {
    trackRef,
    scrollerRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    go,
  } = useMushafPager({
    page,
    onPageChange,
    disabled,
    onTapEmpty,
    onNavigateStart,
    ignoreSelector,
    shellRef,
  });

  return (
    <div
      ref={(node) => {
        shellRef.current = node;
        assignRef(forwardedRef, node);
      }}
      className={className}
      data-testid={testId}
      data-total-pages={MUSHAF_PAGE_MAX}
      dir="rtl"
      onPointerDown={onPointerDown as (e: ReactPointerEvent<HTMLDivElement>) => void}
      onPointerMove={onPointerMove as (e: ReactPointerEvent<HTMLDivElement>) => void}
      onPointerUp={onPointerUp as (e: ReactPointerEvent<HTMLDivElement>) => void}
      onPointerCancel={onPointerCancel}
      {...rest}
    >
      <div ref={scrollerRef} className="mm-pager-scroller nm-pager-scroller" data-snap="x">
        <div
          ref={trackRef}
          className="mm-pager-track nm-pager-track"
          data-testid="mushaf-pager-track"
          style={{ transform: "translate3d(-33.333333%, 0, 0)" }}
        >
          <div className="mm-pager__sheet nm-pager__sheet" data-pane="next">
            {nextPage ?? <div className="nm-page-shell mm-page-shell" aria-hidden="true" />}
          </div>
          <div className="mm-pager__sheet nm-pager__sheet" data-pane="current">
            {pageSlot}
          </div>
          <div className="mm-pager__sheet nm-pager__sheet" data-pane="prev">
            {prevPage ?? <div className="nm-page-shell mm-page-shell" aria-hidden="true" />}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="mm-page-edge mm-page-edge--next"
        aria-label="الصفحة التالية"
        disabled={disabled || page >= MUSHAF_PAGE_MAX}
        onClick={(e) => {
          e.stopPropagation();
          go(page + 1);
        }}
      />
      <button
        type="button"
        className="mm-page-edge mm-page-edge--prev"
        aria-label="الصفحة السابقة"
        disabled={disabled || page <= MUSHAF_PAGE_MIN}
        onClick={(e) => {
          e.stopPropagation();
          go(page - 1);
        }}
      />
      {children}
    </div>
  );
});
