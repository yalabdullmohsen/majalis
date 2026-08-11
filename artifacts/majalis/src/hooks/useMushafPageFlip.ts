/**
 * تقليب مصحف حقيقي (RTL):
 * - سحب يمينًا = التالية · يسارًا = السابقة
 * - نقر الحافة اليسرى = تالية · اليمنى = سابقة · الوسط = تبديل أدوات القراءة
 * تتبع 1:1 + عتبة اكتمال + ظل/انحناء عبر CSS (`--mpv-flip`).
 */
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export type MushafFlipState = {
  /** −1…1 : موجب = تقليب نحو اليمين (تالية) */
  progress: number;
  active: boolean;
  settling: boolean;
  reducedMotion: boolean;
  /** رفع زاوية أثناء السحب */
  peeling: boolean;
};

const COMMIT_FRAC = 0.16;
const VELOCITY_PX_MS = 0.32;
const AXIS_LOCK = 1.2;
const SETTLE_MS = 320;
const SNAP_BACK_MS = 180;
const FADE_MS = 150;
const TAP_MAX_MS = 320;
const TAP_MAX_PX = 12;
/** نسبة عرض منطقة النقر على الحافة */
export const FLIP_EDGE_FRAC = 0.16;

export function useMushafPageFlip(opts: {
  onNext: () => void;
  onPrev: () => void;
  /** نقر الوسط — إظهار/إخفاء أدوات القراءة */
  onCenterTap?: () => void;
  disabled?: boolean;
  widthPx?: number;
}) {
  const { onNext, onPrev, onCenterTap, disabled = false } = opts;
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startT = useRef(0);
  const lastX = useRef(0);
  const lastT = useRef(0);
  const pointerId = useRef<number | null>(null);
  const locked = useRef<"h" | "v" | null>(null);
  const widthRef = useRef(390);
  const stageLeftRef = useRef(0);
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

  const reset = useCallback(() => {
    startX.current = null;
    startY.current = null;
    pointerId.current = null;
    locked.current = null;
    setActive(false);
    setProgress(0);
    setSettling(false);
    setPeeling(false);
  }, []);

  const classifyTap = useCallback((clientX: number): "next" | "prev" | "center" => {
    const w = Math.max(160, widthRef.current);
    const rel = clientX - stageLeftRef.current;
    const edge = w * FLIP_EDGE_FRAC;
    if (rel <= edge) return "next";
    if (rel >= w - edge) return "prev";
    return "center";
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (disabled) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const target = e.target as HTMLElement | null;
      /* لا تبدأ تقليبًا من عناصر تفاعلية داخل الصفحة (آية/زر) */
      if (target?.closest?.("button, a, [role='button'], [data-ayah-hit], .mf2-ayah-group")) {
        return;
      }
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      stageLeftRef.current = rect.left;
      widthRef.current = rect.width || widthRef.current;
      startX.current = e.clientX;
      startY.current = e.clientY;
      startT.current = performance.now();
      lastX.current = e.clientX;
      lastT.current = startT.current;
      pointerId.current = e.pointerId;
      locked.current = null;
      setSettling(false);
      setPeeling(true);
      setActive(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
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
          reset();
          return;
        }
      }
      if (locked.current !== "h") return;
      e.preventDefault?.();
      lastX.current = e.clientX;
      lastT.current = performance.now();
      const w = Math.max(160, widthRef.current);
      setProgress(Math.max(-1, Math.min(1, dx / w)));
    },
    [disabled, reducedMotion, reset],
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

      /* نقرة قصيرة — مناطق الحافة/الوسط */
      if (locked.current !== "h" && moved <= TAP_MAX_PX && dt <= TAP_MAX_MS) {
        const zone = classifyTap(startX.current);
        reset();
        if (zone === "next") onNext();
        else if (zone === "prev") onPrev();
        else onCenterTap?.();
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

      if (commit && dx > 0) {
        setSettling(true);
        setProgress(1);
        window.setTimeout(() => {
          onNext();
          reset();
        }, SETTLE_MS);
        return;
      }
      if (commit && dx < 0) {
        setSettling(true);
        setProgress(-1);
        window.setTimeout(() => {
          onPrev();
          reset();
        }, SETTLE_MS);
        return;
      }
      setSettling(true);
      setProgress(0);
      window.setTimeout(() => reset(), SNAP_BACK_MS);
    },
    [classifyTap, onCenterTap, onNext, onPrev, reducedMotion, reset],
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
