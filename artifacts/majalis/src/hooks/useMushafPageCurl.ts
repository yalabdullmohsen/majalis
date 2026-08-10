import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/**
 * لفّ صفحة بسيط: سحب 1:1، انزلاق + انحناء ≤10°، عتبة 18٪ أو 0.35px/ms.
 * transform/opacity فقط. prefers-reduced-motion → تلاشٍ 150ms.
 */
export type MushafCurlState = {
  /** −1…1 : موجب = لفّ نحو اليمين (تالية) */
  progress: number;
  active: boolean;
  settling: boolean;
  reducedMotion: boolean;
};

const COMMIT_FRAC = 0.18;
const VELOCITY_PX_MS = 0.35;
const AXIS_LOCK = 1.25;
const SETTLE_MS = 240;
const SNAP_BACK_MS = 160;
const FADE_MS = 150;

export function useMushafPageCurl(opts: {
  onNext: () => void;
  onPrev: () => void;
  disabled?: boolean;
  widthPx?: number;
}) {
  const { onNext, onPrev, disabled = false } = opts;
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startT = useRef(0);
  const lastX = useRef(0);
  const lastT = useRef(0);
  const pointerId = useRef<number | null>(null);
  const locked = useRef<"h" | "v" | null>(null);
  const widthRef = useRef(390);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);
  const [settling, setSettling] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if (opts.widthPx && opts.widthPx > 0) widthRef.current = opts.widthPx;
  }, [opts.widthPx]);

  const reset = useCallback(() => {
    startX.current = null;
    startY.current = null;
    pointerId.current = null;
    locked.current = null;
    setActive(false);
    setProgress(0);
    setSettling(false);
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (disabled || reducedMotion) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      startX.current = e.clientX;
      startY.current = e.clientY;
      startT.current = performance.now();
      lastX.current = e.clientX;
      lastT.current = startT.current;
      pointerId.current = e.pointerId;
      locked.current = null;
      setSettling(false);
      setActive(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [disabled, reducedMotion],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (disabled || reducedMotion || startX.current == null || pointerId.current !== e.pointerId) {
        return;
      }
      const dx = e.clientX - startX.current;
      const dy = e.clientY - (startY.current ?? e.clientY);
      if (!locked.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        locked.current = Math.abs(dy) > Math.abs(dx) * AXIS_LOCK ? "v" : "h";
        if (locked.current === "v") {
          reset();
          return;
        }
      }
      if (locked.current !== "h") return;
      e.preventDefault?.();
      lastX.current = e.clientX;
      lastT.current = performance.now();
      const w = Math.max(160, widthRef.current);
      /* تتبع 1:1 */
      const p = Math.max(-1, Math.min(1, dx / w));
      setProgress(p);
    },
    [disabled, reducedMotion, reset],
  );

  const finish = useCallback(
    (e: ReactPointerEvent) => {
      if (startX.current == null || pointerId.current !== e.pointerId) {
        reset();
        return;
      }
      if (locked.current === "v" || locked.current == null) {
        reset();
        return;
      }
      const dx = e.clientX - startX.current;
      const dt = Math.max(1, performance.now() - startT.current);
      const instDt = Math.max(1, performance.now() - lastT.current);
      const instV = (e.clientX - lastX.current) / instDt;
      const avgV = dx / dt;
      const w = Math.max(160, widthRef.current);
      const frac = Math.abs(dx) / w;
      const fast = Math.abs(instV) >= VELOCITY_PX_MS || Math.abs(avgV) >= VELOCITY_PX_MS;
      const commit = frac >= COMMIT_FRAC || (fast && frac >= 0.06);

      if (commit && dx > 0) {
        setSettling(true);
        setProgress(1);
        window.setTimeout(() => {
          onNext();
          reset();
        }, reducedMotion ? 0 : SETTLE_MS);
        return;
      }
      if (commit && dx < 0) {
        setSettling(true);
        setProgress(-1);
        window.setTimeout(() => {
          onPrev();
          reset();
        }, reducedMotion ? 0 : SETTLE_MS);
        return;
      }
      setSettling(true);
      setProgress(0);
      window.setTimeout(() => reset(), SNAP_BACK_MS);
    },
    [onNext, onPrev, reducedMotion, reset],
  );

  const onSimpleSwipeEnd = useCallback(
    (e: ReactPointerEvent) => {
      if (!reducedMotion || disabled || startX.current == null) return;
      const dx = e.clientX - startX.current;
      const w = Math.max(160, widthRef.current);
      if (Math.abs(dx) / w >= COMMIT_FRAC || Math.abs(dx) >= 48) {
        if (dx > 0) onNext();
        else onPrev();
      }
      reset();
    },
    [disabled, onNext, onPrev, reducedMotion, reset],
  );

  return {
    curl: { progress, active, settling, reducedMotion } satisfies MushafCurlState,
    curlHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: reducedMotion ? onSimpleSwipeEnd : finish,
      onPointerCancel: reset,
    },
    setCurlWidth: (w: number) => {
      if (w > 0) widthRef.current = w;
    },
    settleMs: SETTLE_MS,
    snapBackMs: SNAP_BACK_MS,
    fadeMs: FADE_MS,
  };
}
