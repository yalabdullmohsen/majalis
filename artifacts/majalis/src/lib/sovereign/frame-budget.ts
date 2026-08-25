/**
 * ميزانية إطار ثابتة 8ms — ProMotion / VRR.
 */
export const FRAME_BUDGET_MS = 8;

export type FrameBudgetResult<T> = {
  value: T;
  elapsedMs: number;
  exceeded: boolean;
};

export function measureFrameBudget<T>(fn: () => T): FrameBudgetResult<T> {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const value = fn();
  const elapsedMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
  return { value, elapsedMs, exceeded: elapsedMs > FRAME_BUDGET_MS };
}

/**
 * يؤجّل العمل الزائد عن الميزانية إلى الإطار التالي.
 */
export function deferPastFrameBudget(work: () => void, elapsedMs: number): void {
  if (elapsedMs <= FRAME_BUDGET_MS) {
    work();
    return;
  }
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(work);
    return;
  }
  setTimeout(work, 0);
}
