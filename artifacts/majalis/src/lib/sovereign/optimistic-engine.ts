/**
 * محرك تفاؤلي — تأكيد واجهة فوري (<8ms) ثم استمرار الحفظ في الخلفية.
 */
import { afterNextPaint, yieldToMain } from "@/lib/yield-to-main";

export const OPTIMISTIC_UI_BUDGET_MS = 8;

export type OptimisticAction<T> = {
  /** تحديث متزامن للواجهة — يجب أن يكون خفيفًا */
  apply: () => T;
  /** حفظ/شبكة — يُؤجَّل بعد الرسم */
  persist: (snapshot: T) => Promise<void> | void;
  rollback?: (snapshot: T) => void;
};

export type OptimisticResult<T> = {
  snapshot: T;
  elapsedMs: number;
};

/**
 * ينفّذ apply فورًا، يرسم، ثم persist بلا حظر الخيط الرئيسي.
 */
export async function runOptimisticAction<T>(action: OptimisticAction<T>): Promise<OptimisticResult<T>> {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const snapshot = action.apply();
  const elapsedApply = (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;

  if (elapsedApply > OPTIMISTIC_UI_BUDGET_MS && typeof console !== "undefined") {
    console.warn(`[sovereign] optimistic apply exceeded ${OPTIMISTIC_UI_BUDGET_MS}ms (${elapsedApply.toFixed(1)}ms)`);
  }

  await afterNextPaint();
  void yieldToMain().then(async () => {
    try {
      await action.persist(snapshot);
    } catch {
      action.rollback?.(snapshot);
    }
  });

  return {
    snapshot,
    elapsedMs: elapsedApply,
  };
}
