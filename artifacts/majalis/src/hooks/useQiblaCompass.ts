import { useCallback, useEffect, useRef, useState } from "react";
import {
  extractCompassAccuracy,
  extractCompassHeading,
  isQiblaAligned,
  lowPassHeading,
  QIBLA_ACCURACY_WARN_DEG,
  type DeviceOrientationLike,
} from "@/lib/qibla-math";

type OrientationPermissionState = "unknown" | "needed" | "granted" | "denied";

export type UseQiblaCompassResult = {
  heading: number | null;
  accuracy: number | null;
  needsCalibration: boolean;
  permission: OrientationPermissionState;
  requestPermission: () => Promise<void>;
  aligned: boolean;
};

function hasIosOrientationPermission(): boolean {
  return (
    typeof (
      DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    ).requestPermission === "function"
  );
}

/**
 * Smooth compass heading from DeviceOrientation / AbsoluteOrientationSensor.
 * Triggers haptic once when entering Qibla alignment (±2.5°).
 */
export function useQiblaCompass(bearing: number | null): UseQiblaCompassResult {
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permission, setPermission] = useState<OrientationPermissionState>(() =>
    typeof window === "undefined"
      ? "unknown"
      : hasIosOrientationPermission()
        ? "needed"
        : "granted",
  );
  const smoothRef = useRef<number | null>(null);
  const alignedRef = useRef(false);
  const [aligned, setAligned] = useState(false);

  const applySample = useCallback(
    (ev: DeviceOrientationLike) => {
      const raw = extractCompassHeading(ev);
      if (raw == null) return;
      const smoothed = lowPassHeading(smoothRef.current, raw, 0.18);
      smoothRef.current = smoothed;
      setHeading(smoothed);

      const acc = extractCompassAccuracy(ev);
      if (acc != null) setAccuracy(acc);

      if (bearing == null) return;
      const nowAligned = isQiblaAligned(bearing, smoothed);
      if (nowAligned && !alignedRef.current) {
        alignedRef.current = true;
        setAligned(true);
        try {
          if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
            navigator.vibrate(100);
          }
        } catch {
          /* ignore */
        }
      } else if (!nowAligned && alignedRef.current) {
        alignedRef.current = false;
        setAligned(false);
      }
    },
    [bearing],
  );

  useEffect(() => {
    if (permission !== "granted") return;

    const onOrient = (e: Event) => {
      applySample(e as DeviceOrientationEvent & DeviceOrientationLike);
    };

    // Prefer absolute events when the platform fires them (Android); iOS uses webkit heading.
    window.addEventListener("deviceorientationabsolute", onOrient, true);
    window.addEventListener("deviceorientation", onOrient, true);

    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrient, true);
      window.removeEventListener("deviceorientation", onOrient, true);
    };
  }, [permission, applySample]);

  const requestPermission = useCallback(async () => {
    try {
      const fn = (
        DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      ).requestPermission;
      if (!fn) {
        setPermission("granted");
        return;
      }
      const res = await fn();
      setPermission(res === "granted" ? "granted" : "denied");
    } catch {
      setPermission("denied");
    }
  }, []);

  const needsCalibration =
    accuracy != null && accuracy > QIBLA_ACCURACY_WARN_DEG;

  return {
    heading,
    accuracy,
    needsCalibration,
    permission,
    requestPermission,
    aligned,
  };
}
