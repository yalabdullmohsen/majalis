import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  clampMushafPage,
  MUSHAF_PAGE_MAX,
  MUSHAF_PAGE_MIN,
} from "@/lib/quran-last-page";
import { haptics } from "@/lib/haptics";
import { MUSHAF_SETTLE_MS } from "@/features/mushaf-madinah/layout-bands";

/** عتبة السحب الأفقي — من أي مكان في الصفحة */
export const SWIPE_MIN_PX = 40;
export const SETTLE_MS = 250;
if (SETTLE_MS !== MUSHAF_SETTLE_MS) {
  throw new Error("SETTLE_MS must match layout-bands");
}

const FLICK_PX_PER_MS = 0.55;

export type MushafPagerApi = {
  trackRef: RefObject<HTMLDivElement | null>;
  scrollerRef: RefObject<HTMLDivElement | null>;
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
  onPointerCancel: () => void;
  go: (next: number) => void;
};

type Opts = {
  page: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  onTapEmpty?: () => void;
  onNavigateStart?: () => void;
  ignoreSelector: string;
  shellRef: RefObject<HTMLElement | null>;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true
  );
}

/**
 * تقليب مصحف RTL عبر translate3d فقط — ثلاث لوحات (تالية · حالية · سابقة).
 * سحب لليمين (dx > 0) = الصفحة التالية.
 */
export function useMushafPager({
  page,
  onPageChange,
  disabled = false,
  onTapEmpty,
  onNavigateStart,
  ignoreSelector,
  shellRef,
}: Opts): MushafPagerApi {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const panning = useRef(false);
  const locking = useRef(false);
  const dragDx = useRef(0);
  const widthRef = useRef(0);
  const pendingCommit = useRef<number | null>(null);
  const pageRef = useRef(page);
  pageRef.current = page;

  const measureWidth = useCallback(() => {
    const w = scrollerRef.current?.clientWidth || 0;
    if (w > 0) widthRef.current = w;
    return widthRef.current;
  }, []);

  const setTrackX = useCallback((x: number, animate: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    const ms = prefersReducedMotion() ? 0 : SETTLE_MS;
    track.style.transition =
      animate && ms > 0 ? `transform ${ms}ms cubic-bezier(0.22, 1, 0.36, 1)` : "none";
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  }, []);

  const baseX = useCallback(() => -measureWidth(), [measureWidth]);

  const resetToCurrent = useCallback(
    (animate: boolean) => {
      dragDx.current = 0;
      setTrackX(baseX(), animate);
    },
    [baseX, setTrackX],
  );

  const go = useCallback(
    (next: number) => {
      const clamped = clampMushafPage(next);
      if (clamped === pageRef.current) return;
      onNavigateStart?.();
      haptics.selection();
      onPageChange(clamped);
    },
    [onNavigateStart, onPageChange],
  );

  useLayoutEffect(() => {
    locking.current = false;
    pendingCommit.current = null;
    measureWidth();
    resetToCurrent(false);
  }, [page, measureWidth, resetToCurrent]);

  useEffect(() => {
    const onResize = () => {
      measureWidth();
      resetToCurrent(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureWidth, resetToCurrent]);

  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        go(pageRef.current + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(pageRef.current - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, go]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onEnd = (ev: TransitionEvent) => {
      if (ev.propertyName && ev.propertyName !== "transform") return;
      const commit = pendingCommit.current;
      if (commit == null) {
        locking.current = false;
        return;
      }
      pendingCommit.current = null;
      resetToCurrent(false);
      go(commit);
    };
    track.addEventListener("transitionend", onEnd);
    return () => track.removeEventListener("transitionend", onEnd);
  }, [go, resetToCurrent]);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (disabled || locking.current) {
      touchRef.current = null;
      return;
    }
    const t = e.target as HTMLElement;
    if (t.closest(ignoreSelector)) {
      touchRef.current = null;
      return;
    }
    panning.current = false;
    dragDx.current = 0;
    measureWidth();
    setTrackX(baseX(), false);
    touchRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const start = touchRef.current;
    if (!start || disabled || locking.current) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!panning.current) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        panning.current = true;
        scrollerRef.current?.classList.add("is-panning");
        onNavigateStart?.();
      } else {
        return;
      }
    }
    const w = widthRef.current || measureWidth();
    const pageNow = pageRef.current;
    let clamped = dx;
    if (pageNow >= MUSHAF_PAGE_MAX && dx > 0) clamped = dx * 0.25;
    if (pageNow <= MUSHAF_PAGE_MIN && dx < 0) clamped = dx * 0.25;
    dragDx.current = clamped;
    setTrackX(-w + clamped, false);
  };

  const finishGesture = (e?: ReactPointerEvent) => {
    const start = touchRef.current;
    touchRef.current = null;
    scrollerRef.current?.classList.remove("is-panning");
    if (!start || disabled) return;

    const clientX = e?.clientX ?? start.x;
    const clientY = e?.clientY ?? start.y;
    const dx = clientX - start.x;
    const dy = clientY - start.y;
    const dt = Math.max(1, Date.now() - start.t);
    const speed = Math.abs(dx) / dt;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const passSwipe = horizontal && Math.abs(dx) >= SWIPE_MIN_PX;
    const passFlick = horizontal && speed >= FLICK_PX_PER_MS && Math.abs(dx) >= SWIPE_MIN_PX * 0.7;
    const w = widthRef.current || measureWidth();
    const pageNow = pageRef.current;

    if (panning.current && (passSwipe || passFlick)) {
      if (dx > 0) {
        if (pageNow >= MUSHAF_PAGE_MAX) {
          locking.current = true;
          resetToCurrent(true);
          return;
        }
        locking.current = true;
        pendingCommit.current = pageNow + 1;
        setTrackX(0, true);
        return;
      }
      if (dx < 0) {
        if (pageNow <= MUSHAF_PAGE_MIN) {
          locking.current = true;
          resetToCurrent(true);
          return;
        }
        locking.current = true;
        pendingCommit.current = pageNow - 1;
        setTrackX(-2 * w, true);
        return;
      }
    }

    if (panning.current) {
      locking.current = true;
      resetToCurrent(true);
      return;
    }

    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const target = (e?.target as HTMLElement | undefined) ?? null;
      if (target?.closest(".nm-word, .nm-basmala, .mm-ayah-hit, .mm-basmala--qpc")) return;
      const rect = (shellRef.current ?? scrollerRef.current)?.getBoundingClientRect();
      if (!rect) {
        onTapEmpty?.();
        return;
      }
      const relX = (clientX - rect.left) / Math.max(1, rect.width);
      if (relX >= 0.85) {
        go(pageNow + 1);
        return;
      }
      if (relX <= 0.15) {
        go(pageNow - 1);
        return;
      }
      onTapEmpty?.();
    }
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    const t = e.target as HTMLElement;
    if (
      t.closest(
        ".nm-controls, .nm-verse-menu, .mm-controls, .mm-audio-dock, .mm-ayah-bar, .mm-page-edge, .mm-reciter-sheet, .mm-search-sheet, .ayah-action-sheet",
      )
    ) {
      touchRef.current = null;
      scrollerRef.current?.classList.remove("is-panning");
      return;
    }
    finishGesture(e);
  };

  const onPointerCancel = () => {
    touchRef.current = null;
    scrollerRef.current?.classList.remove("is-panning");
    if (panning.current) {
      locking.current = true;
      resetToCurrent(true);
    }
    panning.current = false;
  };

  return {
    trackRef,
    scrollerRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    go,
  };
}
