/**
 * قفل تنقّل خفيف — يمنع Double Push لنفس المسار دون تعطيل النقر الطبيعي.
 */

import { GESTURE_THRESHOLDS } from "./tokens";

let lastScreenNavAt = 0;
let lastScreenTarget = "";

const COOLDOWN_MS = 280;

export function shouldAllowScreenNavigation(target: string, now = Date.now()): boolean {
  if (target === lastScreenTarget && now - lastScreenNavAt < COOLDOWN_MS) {
    return false;
  }
  lastScreenNavAt = now;
  lastScreenTarget = target;
  return true;
}

export function resetNavLockForTests(): void {
  lastScreenNavAt = 0;
  lastScreenTarget = "";
}

export function edgeSwipeRegionPx(): number {
  return GESTURE_THRESHOLDS.edgeSwipeRegionPx;
}
