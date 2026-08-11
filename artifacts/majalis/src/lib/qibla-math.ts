/**
 * Qibla / compass math — pure client-side (Kaaba + low-pass heading).
 * Kaaba: 21.4225°N, 39.8262°E (WGS84).
 */

export const KAABA_LAT = 21.4225;
export const KAABA_LON = 39.8262;

/** Alignment snap tolerance (degrees). */
export const QIBLA_ALIGN_TOLERANCE_DEG = 2.5;

/** Show calibration UI when compass accuracy exceeds this (degrees). */
export const QIBLA_ACCURACY_WARN_DEG = 15;

export type DeviceOrientationLike = {
  alpha: number | null;
  absolute?: boolean;
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
};

/** Shortest signed angular delta in (−180, 180]. */
export function shortestAngleDelta(fromDeg: number, toDeg: number): number {
  return ((toDeg - fromDeg + 540) % 360) - 180;
}

/** Absolute angular distance [0, 180]. */
export function angularDistance(a: number, b: number): number {
  return Math.abs(shortestAngleDelta(a, b));
}

/**
 * Qibla bearing from observer to Kaaba (degrees clockwise from true north).
 * Same spherical formula as adhan's `Qibla()`.
 */
export function qiblaBearing(lat: number, lon: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δλ = ((KAABA_LON - lon) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Great-circle distance to Kaaba in km. */
export function distanceToKaabaKm(lat: number, lon: number): number {
  const R = 6371;
  const dφ = ((KAABA_LAT - lat) * Math.PI) / 180;
  const dλ = ((KAABA_LON - lon) * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const a =
    Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Extract compass heading (0–360, degrees from magnetic/true north, clockwise).
 * iOS: prefer `webkitCompassHeading`. Android absolute: `360 - alpha`.
 */
export function extractCompassHeading(ev: DeviceOrientationLike): number | null {
  const webkit = ev.webkitCompassHeading;
  if (typeof webkit === "number" && Number.isFinite(webkit)) {
    return ((webkit % 360) + 360) % 360;
  }
  if (ev.alpha == null || !Number.isFinite(ev.alpha)) return null;
  // DeviceOrientation alpha increases counter-clockwise from north when absolute.
  return ((360 - ev.alpha) % 360 + 360) % 360;
}

/** Compass accuracy in degrees when the platform reports it; otherwise null. */
export function extractCompassAccuracy(ev: DeviceOrientationLike): number | null {
  const acc = ev.webkitCompassAccuracy;
  if (typeof acc === "number" && Number.isFinite(acc) && acc >= 0) return acc;
  return null;
}

/**
 * Circular low-pass filter — dampens magnetometer jitter without lagging snaps.
 * @param alpha blend factor in (0, 1]; lower = smoother (default 0.18).
 */
export function lowPassHeading(
  prev: number | null,
  next: number,
  alpha = 0.18,
): number {
  if (prev == null || !Number.isFinite(prev)) return next;
  const a = Math.min(1, Math.max(0.01, alpha));
  const delta = shortestAngleDelta(prev, next);
  return ((prev + a * delta) % 360 + 360) % 360;
}

export function isQiblaAligned(
  bearing: number,
  heading: number,
  toleranceDeg = QIBLA_ALIGN_TOLERANCE_DEG,
): boolean {
  return angularDistance(bearing, heading) <= toleranceDeg;
}
