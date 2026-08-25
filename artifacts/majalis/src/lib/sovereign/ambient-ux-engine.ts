/**
 * Dynamic Ambient UX — تباين/وزن/إضاءة حسب الوقت والبطارية والضوء المحيط.
 */
import { getCachedPrayerTimes } from "@/lib/prayer-times";
import { scheduleNonCriticalWork } from "@/lib/power-saver-engine";

export type AmbientPhase = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha" | "night" | "day";

export type AmbientComfort = "bright" | "balanced" | "soft" | "dim";

export type AmbientUxSnapshot = {
  phase: AmbientPhase;
  comfort: AmbientComfort;
  contrastBoost: number;
  fontWeightDelta: number;
  dimCurve: number;
  at: number;
};

const FLAG = "__majalis_ambient_ux__";

function inferPhaseFromPrayerTimes(nowMin: number): AmbientPhase {
  const cached = getCachedPrayerTimes();
  const prayers = cached?.prayers;
  if (!prayers?.length) return nowMin >= 20 * 60 || nowMin < 5 * 60 ? "night" : "day";
  const byKey = (k: string) => prayers.find((p) => p.key === k)?.minutes ?? null;
  const fajr = byKey("Fajr");
  const dhuhr = byKey("Dhuhr");
  const asr = byKey("Asr");
  const maghrib = byKey("Maghrib");
  const isha = byKey("Isha");
  if (fajr != null && nowMin >= fajr && (dhuhr == null || nowMin < dhuhr)) return "fajr";
  if (dhuhr != null && nowMin >= dhuhr && (asr == null || nowMin < asr)) return "dhuhr";
  if (asr != null && nowMin >= asr && (maghrib == null || nowMin < maghrib)) return "asr";
  if (maghrib != null && nowMin >= maghrib && (isha == null || nowMin < isha)) return "maghrib";
  if (isha != null && nowMin >= isha) return "isha";
  return "night";
}

async function readBatteryComfort(): Promise<AmbientComfort | null> {
  try {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{ level: number; charging: boolean }>;
    };
    if (!nav.getBattery) return null;
    const bat = await nav.getBattery();
    if (bat.charging) return "balanced";
    if (bat.level < 0.15) return "dim";
    if (bat.level < 0.35) return "soft";
    return null;
  } catch {
    return null;
  }
}

function readAmbientLightComfort(): AmbientComfort | null {
  try {
    const ALS = (window as Window & { AmbientLightSensor?: new () => { illuminance: number; addEventListener: (t: string, fn: () => void) => void } }).AmbientLightSensor;
    if (!ALS) return null;
    return null;
  } catch {
    return null;
  }
}

function applySnapshot(snap: AmbientUxSnapshot): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.ambientPhase = snap.phase;
  root.dataset.ambientComfort = snap.comfort;
  root.style.setProperty("--mj-ambient-contrast", String(snap.contrastBoost));
  root.style.setProperty("--mj-ambient-weight-delta", String(snap.fontWeightDelta));
  root.style.setProperty("--mj-ambient-dim", String(snap.dimCurve));
}

export async function computeAmbientUx(): Promise<AmbientUxSnapshot> {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const phase = inferPhaseFromPrayerTimes(nowMin);
  let comfort: AmbientComfort = phase === "isha" || phase === "fajr" || phase === "night" ? "soft" : "balanced";
  const batComfort = await readBatteryComfort();
  if (batComfort) comfort = batComfort;
  void readAmbientLightComfort();

  let contrastBoost = comfort === "dim" ? 1.08 : comfort === "soft" ? 1.04 : 1;
  const fontWeightDelta = comfort === "dim" ? 50 : comfort === "soft" ? 25 : 0;
  let dimCurve = comfort === "dim" ? 0.88 : comfort === "soft" ? 0.94 : 1;

  if (phase === "isha" || phase === "maghrib") {
    contrastBoost += 0.03;
    dimCurve = Math.min(dimCurve, 0.92);
  }

  return {
    phase,
    comfort,
    contrastBoost,
    fontWeightDelta,
    dimCurve,
    at: Date.now(),
  };
}

export function startAmbientUxEngine(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[FLAG]) return;
  w[FLAG] = true;

  const tick = () => {
    void computeAmbientUx().then(applySnapshot).catch(() => undefined);
  };

  tick();
  scheduleNonCriticalWork(tick);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });
  window.setInterval(tick, 5 * 60_000);
}

export function resetAmbientUxForTests(): void {
  if (typeof window === "undefined") return;
  delete (window as unknown as Record<string, unknown>)[FLAG];
}
