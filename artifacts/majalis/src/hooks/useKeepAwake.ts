/**
 * Web port of Expo `useKeepAwake()` — keeps the screen awake while the
 * reading component is mounted. Built on the Screen Wake Lock API via
 * {@link useWakeLock}; no-ops safely when the API is unavailable.
 *
 * Usage (same as RN):
 * ```ts
 * useKeepAwake();
 * ```
 */
import { useWakeLock } from "@/hooks/useWakeLock";

/**
 * @param enabled — defaults to `true` (RN `useKeepAwake()` while mounted).
 *                  Pass `false` to release without unmounting.
 */
export function useKeepAwake(enabled = true): void {
  useWakeLock(enabled);
}

export default useKeepAwake;
