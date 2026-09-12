export {
  MOTION_DURATION_MS,
  MOTION_EASING,
  MOTION_SPRING,
  GESTURE_THRESHOLDS,
  HAPTIC_POLICY,
  FRAME_BUDGET_MS,
  type HapticToken,
  type InteractionState,
} from "./tokens";
export {
  isInFlight,
  runSingleFlight,
  runSingleFlightSync,
  resetSingleFlightForTests,
} from "./single-flight";
export {
  shouldAllowScreenNavigation,
  resetNavLockForTests,
  edgeSwipeRegionPx,
} from "./nav-lock";
export { markInteraction, measureInteraction, type InteractionMark } from "./perf-marks";
