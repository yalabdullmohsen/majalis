/**
 * Part 21 — Hook helpers for CLS-stable async content (logic-only).
 */

import { useCallback, useRef, useState } from "react";
import {
  clsBeginLoad,
  clsCommit,
  clsDisplayValue,
  clsFail,
  createClsReserveSlot,
  type ClsReserveSlot,
} from "@/lib/cls-layout-reserve";

export function useClsReservedContent<T>(initial: T | null = null) {
  const [slot, setSlot] = useState<ClsReserveSlot<T>>(() => createClsReserveSlot(initial));
  const genRef = useRef(0);

  const begin = useCallback(() => {
    setSlot((prev) => {
      const next = clsBeginLoad(prev);
      genRef.current = next.generation;
      return next;
    });
    return () => genRef.current;
  }, []);

  const commit = useCallback((value: T) => {
    const gen = genRef.current;
    setSlot((prev) => clsCommit(prev, value, gen));
  }, []);

  const fail = useCallback(() => {
    const gen = genRef.current;
    setSlot((prev) => clsFail(prev, gen));
  }, []);

  return {
    slot,
    display: clsDisplayValue(slot),
    loading: slot.loading,
    error: slot.error,
    begin,
    commit,
    fail,
  };
}
