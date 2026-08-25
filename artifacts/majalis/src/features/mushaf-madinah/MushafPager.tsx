import {
  useCallback,
  useEffect,
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
import { MUSHAF_SETTLE_MS } from "./layout-bands";

/** عتبة السحب الأفقي — من أي مكان في الصفحة */
export const SWIPE_MIN_PX = 40;
export const SETTLE_MS = 250;
if (SETTLE_MS !== MUSHAF_SETTLE_MS) {
  throw new Error("SETTLE_MS must match layout-bands");
}
const FLICK_PX_PER_MS = 0.5;

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

const DEFAULT_IGNORE =
  ".mm-controls, .mm-audio-dock, .mm-ayah-bar, .mm-page-edge, .mm-reciter-sheet, .mm-search-sheet, .ayah-action-sheet, input, textarea, select, button";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
}

/**
 * قلب صفحة RTL: شريط أفقي مع scroll-snap، سحب لليمين = التالية.
 * ثلاث لوحات في DOM فقط (تالية · حالية · سابقة) من أصل TOTAL_QURAN_PAGES=604.
 * بلا لف ثلاثي الأبعاد. إكمال الانتقال ≤ 250ms.
 */
export function MushafPager({
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
}: PagerProps) {
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const panning = useRef(false);
  const locking = useRef(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const settledPageRef = useRef(page);
  const timersRef = useRef<Set<number>>(new Set());

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current.clear();
    };
  }, []);

  const go = useCallback(
    (next: number) => {
      const clamped = clampMushafPage(next);
      if (clamped === page) return;
      onNavigateStart?.();
      onPageChange(clamped);
    },
    [onNavigateStart, onPageChange, page],
  );

  const snapToIndex = useCallback((index: 0 | 1 | 2, animate: boolean) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const from = el.scrollLeft;
    const to = index * w;
    if (!animate || prefersReducedMotion() || Math.abs(to - from) < 1) {
      el.scrollLeft = to;
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / SETTLE_MS);
      const eased = 1 - (1 - p) ** 3;
      el.scrollLeft = from + (to - from) * eased;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const prevPage = settledPageRef.current;
    settledPageRef.current = page;
    const diff = page - prevPage;

    locking.current = true;

    // فرق صفحة واحدة (مجاورة): اللوحة التي أصبحت "تالية"/"سابقة" بعد
    // التحديث (index 0/2) تعرض بالضبط محتوى الصفحة القديمة — إعادة
    // التموضع الفورية إليها لا تُحدث أي قفزة بصرية مرئية، ثم الانزلاق
    // منها إلى المنتصف يُظهر تبديلاً اتجاهياً صحيحاً بدل قفزة فورية.
    // فروق أكبر (٢+ صفحة) لا توفّرها اللوحات الثلاث بصريًا — تبقى فورية.
    if (Math.abs(diff) === 1) {
      const fromIndex = diff > 0 ? 2 : 0;
      snapToIndex(fromIndex, false);
      requestAnimationFrame(() => snapToIndex(1, true));
    } else {
      snapToIndex(1, false);
    }

    const id = scheduleTimer(() => {
      locking.current = false;
    }, SETTLE_MS + 40);
    return () => window.clearTimeout(id);
  }, [page, snapToIndex, scheduleTimer]);

  /** أسهم لوحة المفاتيح — نفس منطق الحواف: يمين = تالٍ · يسار = سابق (مصحف ورقي). */
  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        go(page + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(page - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, go, page]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onResize = () => {
      locking.current = true;
      snapToIndex(1, false);
      scheduleTimer(() => {
        locking.current = false;
      }, 40);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [snapToIndex, scheduleTimer]);

  const commitFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || locking.current || disabled) return;
    const w = el.clientWidth || 1;
    const i = Math.round(el.scrollLeft / w);
    if (i === 0 && page < MUSHAF_PAGE_MAX) {
      locking.current = true;
      go(page + 1);
      return;
    }
    if (i === 2 && page > MUSHAF_PAGE_MIN) {
      locking.current = true;
      go(page - 1);
      return;
    }
    snapToIndex(1, true);
  }, [disabled, go, page, snapToIndex]);

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
    panning.current = false;
    touchRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = touchRef.current;
    if (!start || disabled) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      panning.current = true;
      scrollerRef.current?.classList.add("is-panning");
      onNavigateStart?.();
    }
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
    scrollerRef.current?.classList.remove("is-panning");
    if (!start || disabled) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dt = Math.max(1, Date.now() - start.t);
    const speed = Math.abs(dx) / dt;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const passSwipe = horizontal && Math.abs(dx) >= SWIPE_MIN_PX;
    const passFlick = horizontal && speed >= FLICK_PX_PER_MS && Math.abs(dx) >= SWIPE_MIN_PX;

    if (passSwipe || passFlick) {
      locking.current = true;
      if (dx > 0) {
        if (page >= MUSHAF_PAGE_MAX) {
          snapToIndex(1, true);
          scheduleTimer(() => {
            locking.current = false;
          }, SETTLE_MS + 40);
          return;
        }
        snapToIndex(0, true);
        scheduleTimer(() => go(page + 1), SETTLE_MS);
      } else {
        if (page <= MUSHAF_PAGE_MIN) {
          snapToIndex(1, true);
          scheduleTimer(() => {
            locking.current = false;
          }, SETTLE_MS + 40);
          return;
        }
        snapToIndex(2, true);
        scheduleTimer(() => go(page - 1), SETTLE_MS);
      }
      return;
    }

    if (panning.current) {
      commitFromScroll();
      return;
    }

    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      if (t.closest(".mm-ayah-hit, .mm-basmala--qpc")) return;
      const rect = (shellRef.current ?? e.currentTarget).getBoundingClientRect();
      const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
      if (relX >= 0.85) {
        go(page + 1);
        return;
      }
      if (relX <= 0.15) {
        go(page - 1);
        return;
      }
      onTapEmpty?.();
    }
  };

  return (
    <div
      ref={shellRef}
      className={className}
      data-testid={testId}
      data-total-pages={MUSHAF_PAGE_MAX}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        touchRef.current = null;
        commitFromScroll();
      }}
      {...rest}
    >
      <div
        ref={scrollerRef}
        className="mm-pager-scroller"
        data-snap="x"
        onScroll={() => {
          if (panning.current) onNavigateStart?.();
        }}
      >
        <div className="mm-pager__sheet" data-pane="next">
          {nextPage ?? <div className="mm-page-shell" aria-hidden="true" />}
        </div>
        <div className="mm-pager__sheet" data-pane="current">
          {pageSlot}
        </div>
        <div className="mm-pager__sheet" data-pane="prev">
          {prevPage ?? <div className="mm-page-shell" aria-hidden="true" />}
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
}
