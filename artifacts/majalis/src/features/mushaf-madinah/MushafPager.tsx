import {
  useCallback,
  useRef,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  clampMushafPage,
  MUSHAF_PAGE_MAX,
  MUSHAF_PAGE_MIN,
} from "@/lib/quran-last-page";

/** لا يُعدّ قلب صفحة إلا بسحب أفقي واضح */
export const SWIPE_MIN_PX = 45;

type PagerProps = {
  page: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  /** يُستدعى عند لمسة قصيرة بلا سحب (تبديل الشريط) */
  onTapEmpty?: () => void;
  /** عناصر يجب ألا تبدأ منها إيماءة القلب */
  ignoreSelector?: string;
  children: ReactNode;
  "data-testid"?: string;
} & Omit<
  HTMLAttributes<HTMLDivElement>,
  "onPointerDown" | "onPointerUp" | "onPointerCancel" | "children" | "data-testid"
>;

const DEFAULT_IGNORE =
  ".mm-controls, .mm-audio-dock, .mm-ayah-bar, .mm-ayah-hit, .mm-ayah-run, .mm-page-edge, .mm-reciter-sheet, .mm-search-sheet, .ayah-action-sheet";

/**
 * قلب صفحة خفيف: سحب RTL + نقر الحواف.
 * swipe left (dx سالب) → التالية · swipe right → السابقة.
 */
export function MushafPager({
  page,
  onPageChange,
  disabled = false,
  onTapEmpty,
  ignoreSelector = DEFAULT_IGNORE,
  children,
  className,
  "data-testid": testId = "mushaf-pager",
  ...rest
}: PagerProps) {
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

  const go = useCallback(
    (next: number) => {
      onPageChange(clampMushafPage(next));
    },
    [onPageChange],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) {
      touchRef.current = null;
      return;
    }
    const t = e.target as HTMLElement;
    if (t.closest(ignoreSelector)) {
      touchRef.current = null;
      return;
    }
    touchRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (
      t.closest(
        ".mm-controls, .mm-audio-dock, .mm-ayah-bar, .mm-page-edge, .mm-reciter-sheet, .mm-search-sheet, .ayah-action-sheet",
      )
    ) {
      touchRef.current = null;
      return;
    }
    const start = touchRef.current;
    touchRef.current = null;
    if (!start || disabled) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dt = Date.now() - start.t;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.2 && dt < 800) {
      // RTL: سحب الإصبع يمين→يسار (dx سالب) = الصفحة التالية
      if (dx < 0) go(page + 1);
      else go(page - 1);
      return;
    }
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      if (t.closest(".mm-ayah-hit, .mm-ayah-run")) return;
      onTapEmpty?.();
    }
  };

  return (
    <div
      {...rest}
      className={className}
      data-testid={testId}
      data-reduced-motion={reducedMotion ? "1" : "0"}
      data-page={page}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        touchRef.current = null;
      }}
    >
      {children}
      <button
        type="button"
        className="mm-page-edge mm-page-edge--next"
        aria-label="الصفحة التالية"
        disabled={disabled || page >= MUSHAF_PAGE_MAX}
        onClick={() => go(page + 1)}
      />
      <button
        type="button"
        className="mm-page-edge mm-page-edge--prev"
        aria-label="الصفحة السابقة"
        disabled={disabled || page <= MUSHAF_PAGE_MIN}
        onClick={() => go(page - 1)}
      />
      <span hidden data-min={MUSHAF_PAGE_MIN} data-swipe-min={SWIPE_MIN_PX} />
    </div>
  );
}
