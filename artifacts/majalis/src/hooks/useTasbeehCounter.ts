import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  appendTasbeehHistory,
  readEmbeddedCounter,
  todayKey,
  writeEmbeddedCounter,
  type TasbeehWird,
} from "@/lib/tasbeeh-storage";

type Options = {
  storageId: string;
  initialTarget: number;
  phrase?: string;
  wird?: TasbeehWird;
  onWirdChange?: (next: TasbeehWird) => void;
  onHistory?: () => void;
};

function hapticTick() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(12);
  }
}

export function useTasbeehCounter({ storageId, initialTarget, phrase, wird, onWirdChange, onHistory }: Options) {
  const [count, setCount] = useState(0);
  const [target, setTargetState] = useState(initialTarget);
  const [pulse, setPulse] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const undoStack = useRef<number[]>([]);
  const goalLogged = useRef(false);

  useEffect(() => {
    const saved = readEmbeddedCounter(storageId);
    setCount(saved.count);
    if (saved.target >= 0) setTargetState(saved.target);
    else setTargetState(initialTarget);
    undoStack.current = [];
    setCanUndo(false);
    goalLogged.current = false;
  }, [storageId, initialTarget]);

  const persist = useCallback(
    (nextCount: number, nextTarget: number) => {
      writeEmbeddedCounter(storageId, { count: nextCount, target: nextTarget });
    },
    [storageId],
  );

  const applyDelta = useCallback(
    (delta: number) => {
      if (delta === 0) return;
      setCount((prev) => {
        const next = Math.max(0, prev + delta);
        undoStack.current.push(prev);
        if (undoStack.current.length > 50) undoStack.current.shift();
        setCanUndo(true);
        persist(next, target);

        if (wird && onWirdChange && delta > 0) {
          const key = todayKey();
          const daily = { ...(wird.dailyHistory || {}) };
          daily[key] = (daily[key] || 0) + delta;
          const nextWird = {
            ...wird,
            count: next,
            target,
            lifetimeTotal: (wird.lifetimeTotal || 0) + delta,
            dailyHistory: daily,
            updatedAt: new Date().toISOString(),
          };
          queueMicrotask(() => onWirdChange(nextWird));
        }

        if (target > 0 && next >= target && !goalLogged.current) {
          goalLogged.current = true;
          appendTasbeehHistory({
            phrase: phrase || wird?.phrase || "ذكر",
            count: next,
            target,
            completedAt: new Date().toISOString(),
          });
          onHistory?.();
        }

        if (delta > 0) {
          setPulse(true);
          window.setTimeout(() => setPulse(false), 180);
          hapticTick();
        }
        return next;
      });
    },
    [persist, target, wird, onWirdChange, phrase, onHistory],
  );

  const increment = useCallback((delta = 1) => applyDelta(delta), [applyDelta]);
  const decrement = useCallback(() => applyDelta(-1), [applyDelta]);

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
    goalLogged.current = false;
    persist(0, target);
    if (wird && onWirdChange) {
      queueMicrotask(() => onWirdChange({ ...wird, count: 0, updatedAt: new Date().toISOString() }));
    }
  }, [persist, target, wird, onWirdChange]);

  const setTarget = useCallback(
    (value: number | "open") => {
      const safe = value === "open" || value === 0 ? 0 : Math.max(1, Math.round(value || 1));
      setTargetState(safe);
      goalLogged.current = false;
      persist(count, safe);
      if (wird && onWirdChange) {
        queueMicrotask(() => onWirdChange({ ...wird, target: safe, updatedAt: new Date().toISOString() }));
      }
    },
    [count, persist, wird, onWirdChange],
  );

  const progress = useMemo(() => {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((count / target) * 100));
  }, [count, target]);

  const goalReached = count >= target && target > 0;
  const isOpenMode = target <= 0;

  return {
    count,
    target,
    progress,
    goalReached,
    isOpenMode,
    pulse,
    increment,
    decrement,
    undo,
    reset,
    setTarget,
    canUndo,
  };
}

export default useTasbeehCounter;
