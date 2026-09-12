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

type PaneRole = "next" | "current" | "prev";

type PagerProps = {
  page: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  onTapEmpty?: () => void;
  onNavigateStart?: () => void;
  onNavigateCancel?: () => void;
  /** بداية سحب بصرية فقط — بلا setState ثقيل */
  onPanVisualStart?: () => void;
  /** pointerdown مقبول — telemetry فقط */
  onGestureArm?: () => void;
  ignoreSelector?: string;
  /**
   * رسم صفحة برقم ثابت — يُستدعى لكل من (page+1, page, page-1).
   * مفتاح اللوحة = رقم الصفحة حتى تنتقل شجرة React مع اللوحة بلا remount عند القلب.
   */
  renderPage?: (pageNumber: number, role: PaneRole) => ReactNode;
  /** @deprecated استخدم renderPage — توافق مع القارئ الأرشيفي */
  pageSlot?: ReactNode;
  /** @deprecated استخدم renderPage */
  nextPage?: ReactNode;
  /** @deprecated استخدم renderPage */
  prevPage?: ReactNode;
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
 * MushafPager — تقليب ثلاث لوحات بـ translate3d فقط.
 * ترتيب LTR: next | current | prev — سحب يمين (dx > 0) يكشف التالية.
 *
 * ثبات القفزة: مع `renderPage` يُستخدم `key={pageNumber}` على كل لوحة
 * حتى تُعاد استخدام شجرة الصفحة الظاهرة عند الالتزام بدل إعادة mount.
 */
export const MushafPager = forwardRef<HTMLDivElement, PagerProps>(function MushafPager(
  {
    page,
    onPageChange,
    disabled = false,
    onTapEmpty,
    onNavigateStart,
    onNavigateCancel,
    onPanVisualStart,
    onGestureArm,
    ignoreSelector = DEFAULT_IGNORE,
    renderPage,
    pageSlot,
    nextPage,
    prevPage,
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
    onNavigateCancel,
    onPanVisualStart,
    onGestureArm,
    ignoreSelector,
    shellRef,
  });

  const panes: Array<{ role: PaneRole; pageNumber: number }> = [
    { role: "next", pageNumber: page + 1 },
    { role: "current", pageNumber: page },
    { role: "prev", pageNumber: page - 1 },
  ];

  const useRecycle = typeof renderPage === "function";

  return (
    <div
      ref={(node) => {
        shellRef.current = node;
        assignRef(forwardedRef, node);
      }}
      className={className}
      data-testid={testId}
      data-total-pages={MUSHAF_PAGE_MAX}
      data-pager-recycle={useRecycle ? "1" : "0"}
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
        >
          {useRecycle
            ? panes.map(({ role, pageNumber }) => {
                const inRange =
                  pageNumber >= MUSHAF_PAGE_MIN && pageNumber <= MUSHAF_PAGE_MAX;
                return (
                  <div
                    key={pageNumber}
                    className="mm-pager__sheet nm-pager__sheet"
                    data-pane={role}
                    data-page={pageNumber}
                  >
                    {inRange ? (
                      renderPage!(pageNumber, role)
                    ) : (
                      <div className="nm-page-shell mm-page-shell" aria-hidden="true" />
                    )}
                  </div>
                );
              })
            : (
              <>
                <div className="mm-pager__sheet nm-pager__sheet" data-pane="next">
                  {nextPage ?? (
                    <div className="nm-page-shell mm-page-shell" aria-hidden="true" />
                  )}
                </div>
                <div className="mm-pager__sheet nm-pager__sheet" data-pane="current">
                  {pageSlot}
                </div>
                <div className="mm-pager__sheet nm-pager__sheet" data-pane="prev">
                  {prevPage ?? (
                    <div className="nm-page-shell mm-page-shell" aria-hidden="true" />
                  )}
                </div>
              </>
            )}
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
