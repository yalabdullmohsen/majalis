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

/** عتبة السحب — ٢٥٪ من العرض أو مسافة دنيا */
export const SWIPE_MIN_PX = 45;
const SWIPE_RATIO = 0.25;
const FLICK_PX_PER_MS = 0.5;
const SETTLE_MS = 380;

type PagerProps = {
  page: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  onTapEmpty?: () => void;
  ignoreSelector?: string;
  children: ReactNode;
  "data-testid"?: string;
} & Omit<
  HTMLAttributes<HTMLDivElement>,
  "onPointerDown" | "onPointerUp" | "onPointerCancel" | "onPointerMove" | "children" | "data-testid"
>;

const DEFAULT_IGNORE =
  ".mm-controls, .mm-audio-dock, .mm-ayah-bar, .mm-ayah-hit, .mm-ayah-run, .mm-page-edge, .mm-reciter-sheet, .mm-search-sheet, .ayah-action-sheet, .mm-basmala--qpc";

/**
 * قلب صفحة RTL: سحب لليمين = التالية · سحب لليسار = السابقة.
 * الحافة اليمنى ١٥٪ = التالية · اليسرى = السابقة.
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
  const dragRef = useRef(0);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

  const go = useCallback(
    (next: number) => {
      onPageChange(clampMushafPage(next));
    },
    [onPageChange],
  );

  const setDrag = (dx: number) => {
    dragRef.current = dx;
    const el = shellRef.current?.querySelector<HTMLElement>(".mm-page-shell");
    if (!el) return;
    if (reducedMotion) {
      el.style.transform = "";
      el.style.opacity = String(Math.max(0.55, 1 - Math.abs(dx) / (window.innerWidth || 390)));
      return;
    }
    const w = window.innerWidth || 390;
    const p = Math.max(-1, Math.min(1, dx / w));
    const depth = 1 - Math.abs(p) * 0.045;
    el.style.transform = `translate3d(${dx * 0.94}px, 0, 0) scale(${depth}) rotateY(${p * -11}deg)`;
    el.style.opacity = String(Math.max(0.72, 1 - Math.abs(p) * 0.22));
    el.style.boxShadow = `${p * -14}px 0 32px color-mix(in srgb, #5c4a28 ${Math.abs(p) * 22}%, transparent)`;
    el.style.transformOrigin = "50% 50%";
    el.style.willChange = "transform, opacity";
  };

  const clearDrag = (animate: boolean) => {
    const el = shellRef.current?.querySelector<HTMLElement>(".mm-page-shell");
    if (!el) return;
    if (animate) {
      el.style.transition = `transform ${SETTLE_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity ${SETTLE_MS}ms ease, box-shadow ${SETTLE_MS}ms ease`;
    }
    el.style.transform = "";
    el.style.opacity = "";
    el.style.boxShadow = "";
    el.style.willChange = "";
    window.setTimeout(() => {
      if (el) el.style.transition = "";
    }, SETTLE_MS + 40);
    dragRef.current = 0;
  };

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
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = touchRef.current;
    if (!start || disabled) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
    setDrag(dx);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (
      t.closest(
        ".mm-controls, .mm-audio-dock, .mm-ayah-bar, .mm-page-edge, .mm-reciter-sheet, .mm-search-sheet, .ayah-action-sheet",
      )
    ) {
      touchRef.current = null;
      clearDrag(false);
      return;
    }
    const start = touchRef.current;
    touchRef.current = null;
    if (!start || disabled) {
      clearDrag(false);
      return;
    }

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dt = Math.max(1, Date.now() - start.t);
    const w = window.innerWidth || 390;
    const speed = Math.abs(dx) / dt;
    const passRatio = Math.abs(dx) >= w * SWIPE_RATIO;
    const passFlick = speed >= FLICK_PX_PER_MS && Math.abs(dx) >= SWIPE_MIN_PX;
    const horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;

    if (horizontal && (passRatio || passFlick)) {
      // RTL مصحف: سحب لليمين (dx>0) = التالية · لليسار = السابقة
      clearDrag(true);
      if (dx > 0) go(page + 1);
      else go(page - 1);
      return;
    }

    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      if (t.closest(".mm-ayah-hit, .mm-ayah-run, .mm-basmala--qpc")) {
        clearDrag(false);
        return;
      }
      const rect = (shellRef.current ?? e.currentTarget).getBoundingClientRect();
      const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
      // يمين الشاشة (في LTR coords = نهاية العرض) = التالية في المصحف
      if (relX >= 0.85) {
        clearDrag(false);
        go(page + 1);
        return;
      }
      if (relX <= 0.15) {
        clearDrag(false);
        go(page - 1);
        return;
      }
      onTapEmpty?.();
    }
    clearDrag(true);
  };

  return (
    <div
      ref={shellRef}
      className={className}
      data-testid={testId}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        touchRef.current = null;
        clearDrag(true);
      }}
      {...rest}
    >
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
}
