/**
 * تقليب صفحة مصحف (RTL) — انزلاق أفقي بسيط:
 * - عتبة ٢٨٪ / ٠٫٥٥px/ms · settle 250ms · ارتداد ١٦٠ms
 * - سحب يسار→يمين = التالية (SPEC)
 * - نقر: يمين = التالية · يسار = السابقة · وسط = إظهار/إخفاء الشريط
 */
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export type MushafFlipState = {
  /** −1…1 : موجب = سحب لليمين (تالية) — للقراءة بعد السكون */
  progress: number;
  active: boolean;
  settling: boolean;
  reducedMotion: boolean;
  peeling: boolean;
};

const COMMIT_FRAC = 0.28;
const VELOCITY_PX_MS = 0.55;
const AXIS_LOCK = 1.2;
const SETTLE_MS = 250;
const SNAP_BACK_MS = 160;
const FADE_MS = 150;
const TAP_MAX_MS = 300;
const TAP_MAX_PX = 14;
/** نصف الشاشة: يمين = التالية · يسار = السابقة */
export const FLIP_EDGE_FRAC = 0.5;
/** نطاق الوسط لإظهار/إخفاء الشريط — بقية العرض للنقر التالي/السابق */
const CENTER_TAP_FRAC = 0.18;

function applyFlipVars(el: HTMLElement | null, progress: number) {
  if (!el) return;
  const abs = Math.abs(progress);
  el.style.setProperty("--mpv-flip", String(progress));
  el.style.setProperty("--mpv-flip-abs", String(abs));
  el.dataset.flipProgress = progress.toFixed(3);
}

export function useMushafPageFlip(opts: {
  onNext: () => void;
  onPrev: () => void;
  onCenterTap?: () => void;
  /** يُستدعى عند بدء سحب أفقي ناجح (لإخفاء الشريط أثناء القراءة) */
  onFlipStart?: () => void;
  disabled?: boolean;
  widthPx?: number;
}) {
  const { onNext, onPrev, disabled = false } = opts;
  const onCenterTapRef = useRef(opts.onCenterTap);
  const onFlipStartRef = useRef(opts.onFlipStart);
  onCenterTapRef.current = opts.onCenterTap;
  onFlipStartRef.current = opts.onFlipStart;

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startT = useRef(0);
  const lastX = useRef(0);
  const lastT = useRef(0);
  const pointerId = useRef<number | null>(null);
  const locked = useRef<"h" | "v" | null>(null);
  const widthRef = useRef(390);
  const stageLeftRef = useRef(0);
  const stageElRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0);
  const rafRef = useRef(0);
  const pendingProgress = useRef<number | null>(null);
  const flipStartSent = useRef(false);

  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);
  const [settling, setSettling] = useState(false);
  const [peeling, setPeeling] = useState(false);
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

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const flushProgress = useCallback(() => {
    rafRef.current = 0;
    const p = pendingProgress.current;
    if (p == null) return;
    pendingProgress.current = null;
    progressRef.current = p;
    applyFlipVars(stageElRef.current, p);
  }, []);

  const setProgressVisual = useCallback(
    (p: number, commitState = false) => {
      const clamped = Math.max(-1, Math.min(1, p));
      pendingProgress.current = clamped;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(flushProgress);
      }
      if (commitState) setProgress(clamped);
    },
    [flushProgress],
  );

  const reset = useCallback(() => {
    startX.current = null;
    startY.current = null;
    pointerId.current = null;
    locked.current = null;
    flipStartSent.current = false;
    pendingProgress.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    progressRef.current = 0;
    applyFlipVars(stageElRef.current, 0);
    stageElRef.current?.classList.remove("mpv-flip-stage--dragging");
    stageElRef.current?.style.removeProperty("will-change");
    setActive(false);
    setProgress(0);
    setSettling(false);
    setPeeling(false);
  }, []);

  /** يمين = التالية · يسار = السابقة */
  const classifyTap = useCallback((clientX: number): "next" | "prev" => {
    const w = Math.max(160, widthRef.current);
    const rel = clientX - stageLeftRef.current;
    /* يمين = التالية · يسار = السابقة */
    return rel >= w / 2 ? "next" : "prev";
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (disabled) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("button, a, [role='button'], [data-verse], .mfl-hit__ayah, .mf2-ayah-group, .aas-sheet, .aas-panel, .mpv-toolbar, .mpv-page-rail")) {
        return;
      }
      const stage = e.currentTarget as HTMLElement;
      stageElRef.current = stage;
      const rect = stage.getBoundingClientRect();
      stageLeftRef.current = rect.left;
      widthRef.current = rect.width || widthRef.current;
      startX.current = e.clientX;
      startY.current = e.clientY;
      startT.current = performance.now();
      lastX.current = e.clientX;
      lastT.current = startT.current;
      pointerId.current = e.pointerId;
      locked.current = null;
      flipStartSent.current = false;
      setSettling(false);
      setPeeling(true);
      setActive(true);
      stage.classList.add("mpv-flip-stage--dragging");
      stage.style.willChange = "transform";
      applyFlipVars(stage, 0);
      try {
        stage.setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [disabled],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (disabled || startX.current == null || pointerId.current !== e.pointerId) return;
      if (reducedMotion) return;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - (startY.current ?? e.clientY);
      if (!locked.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        locked.current = Math.abs(dy) > Math.abs(dx) * AXIS_LOCK ? "v" : "h";
        if (locked.current === "v") {
          /* تمرير للأعلى القصير → إظهار الشريط */
          if (dy < -28) onCenterTapRef.current?.();
          reset();
          return;
        }
        if (locked.current === "h" && !flipStartSent.current) {
          flipStartSent.current = true;
          onFlipStartRef.current?.();
        }
      }
      if (locked.current !== "h") return;
      e.preventDefault?.();
      lastX.current = e.clientX;
      lastT.current = performance.now();
      const w = Math.max(160, widthRef.current);
      setProgressVisual(dx / w, false);
    },
    [disabled, reducedMotion, reset, setProgressVisual],
  );

  const finish = useCallback(
    (e: ReactPointerEvent) => {
      if (startX.current == null || pointerId.current !== e.pointerId) {
        reset();
        return;
      }
      const dx = e.clientX - startX.current;
      const dy = e.clientY - (startY.current ?? e.clientY);
      const dt = Math.max(1, performance.now() - startT.current);
      const moved = Math.hypot(dx, dy);

      if (locked.current !== "h" && moved <= TAP_MAX_PX && dt <= TAP_MAX_MS) {
        const tapX = startX.current;
        const w = Math.max(160, widthRef.current);
        const rel = tapX - stageLeftRef.current;
        const centerBand = w * CENTER_TAP_FRAC;
        const mid = w / 2;
        const isCenter = rel > mid - centerBand / 2 && rel < mid + centerBand / 2;
        const zone = classifyTap(tapX);
        reset();
        if (isCenter) {
          onCenterTapRef.current?.();
          return;
        }
        if (zone === "next") onNext();
        else onPrev();
        return;
      }

      if (locked.current === "v" || locked.current == null) {
        reset();
        return;
      }

      if (reducedMotion) {
        const w = Math.max(160, widthRef.current);
        if (Math.abs(dx) / w >= COMMIT_FRAC || Math.abs(dx) >= 48) {
          if (dx > 0) onNext();
          else onPrev();
        }
        reset();
        return;
      }

      const instDt = Math.max(1, performance.now() - lastT.current);
      const instV = (e.clientX - lastX.current) / instDt;
      const avgV = dx / dt;
      const w = Math.max(160, widthRef.current);
      const frac = Math.abs(dx) / w;
      const fast = Math.abs(instV) >= VELOCITY_PX_MS || Math.abs(avgV) >= VELOCITY_PX_MS;
      const commit = frac >= COMMIT_FRAC || (fast && frac >= 0.05);

      stageElRef.current?.classList.remove("mpv-flip-stage--dragging");

      if (commit && dx > 0) {
        setSettling(true);
        setProgressVisual(1, true);
        window.setTimeout(() => {
          onNext();
          reset();
        }, SETTLE_MS);
        return;
      }
      if (commit && dx < 0) {
        setSettling(true);
        setProgressVisual(-1, true);
        window.setTimeout(() => {
          onPrev();
          reset();
        }, SETTLE_MS);
        return;
      }
      setSettling(true);
      setProgressVisual(0, true);
      window.setTimeout(() => reset(), SNAP_BACK_MS);
    },
    [classifyTap, onNext, onPrev, reducedMotion, reset, setProgressVisual],
  );

  return {
    flip: { progress, active, settling, reducedMotion, peeling } satisfies MushafFlipState,
    flipHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: reset,
    },
    setFlipWidth: (w: number) => {
      if (w > 0) widthRef.current = w;
    },
    settleMs: SETTLE_MS,
    snapBackMs: SNAP_BACK_MS,
    fadeMs: FADE_MS,
    edgeFrac: FLIP_EDGE_FRAC,
  };
}
