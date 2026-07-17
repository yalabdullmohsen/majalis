import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  readEmbeddedCounter,
  todayKey,
  writeEmbeddedCounter,
  type TasbeehWird,
} from "@/lib/tasbeeh-storage";
import { hapticTap, hapticNotify, isNative } from "@/lib/capacitor-utils";

type Options = {
  storageId: string;
  initialTarget: number;
  /** When true, persist daily/lifetime stats on a full Wird object */
  wird?: TasbeehWird;
  onWirdChange?: (next: TasbeehWird) => void;
};

/**
 * navigator.vibrate() غير مدعوم إطلاقًا على iOS (Safari أو WKWebView داخل
 * تطبيق Capacitor الأصلي) — فمستخدمو iOS، رغم كونهم غالبية مستخدمي عدّاد
 * التسبيح التفاعلي، لا يشعرون بأي اهتزاز إطلاقًا. نستخدم Haptics الأصلي
 * حين نعمل داخل تطبيق iOS/Android الأصلي، ونتراجع لـvibrate على الويب.
 */
function hapticTick() {
  if (isNative) { hapticTap("light"); return; }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(12);
  }
}

export function useTasbeehCounter({ storageId, initialTarget, wird, onWirdChange }: Options) {
  const [count, setCount] = useState(0);
  const [target, setTargetState] = useState(initialTarget);
  const [pulse, setPulse] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const undoStack = useRef<number[]>([]);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current); }, []);

  useEffect(() => {
    const saved = readEmbeddedCounter(storageId);
    setCount(saved.count);
    if (saved.target > 0) setTargetState(saved.target);
    else setTargetState(initialTarget);
    undoStack.current = [];
    setCanUndo(false);
  }, [storageId, initialTarget]);

  const persist = useCallback(
    (nextCount: number, nextTarget: number) => {
      writeEmbeddedCounter(storageId, { count: nextCount, target: nextTarget });
    },
    [storageId],
  );

  const increment = useCallback(
    (delta = 1) => {
      setCount((prev) => {
        const next = prev + delta;
        undoStack.current.push(prev);
        if (undoStack.current.length > 50) undoStack.current.shift();
        setCanUndo(true);
        persist(next, target);

        if (wird && onWirdChange) {
          const key = todayKey();
          const daily = { ...(wird.dailyHistory || {}) };
          daily[key] = (daily[key] || 0) + delta;
          onWirdChange({
            ...wird,
            count: next,
            target,
            lifetimeTotal: (wird.lifetimeTotal || 0) + delta,
            dailyHistory: daily,
            updatedAt: new Date().toISOString(),
          });
        }

        if (target > 0 && prev < target && next >= target) {
          hapticNotify("success");
        } else {
          hapticTick();
        }
        return next;
      });
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      setPulse(true);
      pulseTimerRef.current = setTimeout(() => setPulse(false), 180);
    },
    [persist, target, wird, onWirdChange],
  );

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (prev === undefined) return;
    setCount(prev);
    setCanUndo(undoStack.current.length > 0);
    persist(prev, target);
  }, [persist, target]);

  const reset = useCallback(() => {
    undoStack.current = [];
    setCanUndo(false);
    setCount(0);
    persist(0, target);
    if (wird && onWirdChange) {
      onWirdChange({ ...wird, count: 0, updatedAt: new Date().toISOString() });
    }
  }, [persist, target, wird, onWirdChange]);

  const setTarget = useCallback(
    (value: number) => {
      const safe = Math.max(1, Math.round(value || 1));
      setTargetState(safe);
      persist(count, safe);
      if (wird && onWirdChange) {
        onWirdChange({ ...wird, target: safe, updatedAt: new Date().toISOString() });
      }
    },
    [count, persist, wird, onWirdChange],
  );

  const progress = useMemo(() => {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((count / target) * 100));
  }, [count, target]);

  const goalReached = count >= target && target > 0;

  return {
    count,
    target,
    progress,
    goalReached,
    pulse,
    increment,
    undo,
    reset,
    setTarget,
    canUndo,
  };
}
