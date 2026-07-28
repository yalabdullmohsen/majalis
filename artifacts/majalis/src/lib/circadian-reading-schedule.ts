/**
 * Circadian Reading Schedule & Lighting Logic.
 * Monitors local time and adjusts client-side reading contrast / blue-light
 * filtering via runtime CSS variables (no Tailwind/CSS source edits).
 */

import { resolveTimeOfDay, type TimeOfDay } from "@/lib/daily-context";
import {
  applyOledEyeCare,
  loadOledEyeCarePrefs,
  resolveOledEyeCareTokens,
  saveOledEyeCarePrefs,
  type OledEyeCareMode,
  type OledEyeCareTokens,
} from "@/lib/oled-eye-care";

export type CircadianPhase =
  | "day"
  | "evening"
  | "late_night"
  | "pre_dawn";

export type CircadianLightingState = {
  phase: CircadianPhase;
  timeOfDay: TimeOfDay;
  /** Suggested OLED/eye-care mode */
  suggestedMode: OledEyeCareMode;
  /** Contrast boost 0–1 (higher = stronger text/bg separation) */
  contrastBoost: number;
  /** Blue-light filter strength 0–1 */
  blueFilter: number;
  /** Applied tokens after sync */
  tokens: OledEyeCareTokens;
  autoApplied: boolean;
  updatedAt: string;
};

export type CircadianPrefs = {
  enabled: boolean;
  /** Auto-apply eye-care during late_night / pre_dawn */
  autoApply: boolean;
  /** Manual override — skips auto until cleared */
  overrideMode: OledEyeCareMode | null;
};

const LS_KEY = "majalis-circadian-reading-v1";
const DATA_PHASE = "circadianPhase";

const DEFAULT_PREFS: CircadianPrefs = {
  enabled: true,
  autoApply: true,
  overrideMode: null,
};

export function loadCircadianPrefs(): CircadianPrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<CircadianPrefs>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveCircadianPrefs(prefs: CircadianPrefs): CircadianPrefs {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
  return prefs;
}

export function resolveCircadianPhase(now: Date = new Date()): CircadianPhase {
  const hour = now.getHours() + now.getMinutes() / 60;
  if (hour >= 4 && hour < 5.5) return "pre_dawn";
  if (hour >= 21.5 || hour < 4) return "late_night";
  if (hour >= 17.5 && hour < 21.5) return "evening";
  return "day";
}

export function suggestModeForPhase(phase: CircadianPhase): OledEyeCareMode {
  switch (phase) {
    case "pre_dawn":
      return "oled-eye-care";
    case "late_night":
      return "eye-care";
    case "evening":
      return "oled-black";
    default:
      return "off";
  }
}

export function contrastBoostForPhase(phase: CircadianPhase): number {
  switch (phase) {
    case "late_night":
      return 0.55;
    case "pre_dawn":
      return 0.7;
    case "evening":
      return 0.35;
    default:
      return 0.1;
  }
}

export function blueFilterForPhase(phase: CircadianPhase): number {
  switch (phase) {
    case "late_night":
      return 0.75;
    case "pre_dawn":
      return 0.85;
    case "evening":
      return 0.4;
    default:
      return 0;
  }
}

/**
 * Apply circadian CSS vars on <html> without touching Tailwind source.
 * Variables: --circadian-contrast, --circadian-blue-filter, --circadian-warmth
 */
export function applyCircadianCssVars(state: CircadianLightingState): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset[DATA_PHASE] = state.phase;
  root.style.setProperty("--circadian-contrast", String(state.contrastBoost));
  root.style.setProperty("--circadian-blue-filter", String(state.blueFilter));
  root.style.setProperty("--circadian-warmth", String(state.tokens.warmth));
  if (state.blueFilter > 0.5) {
    root.style.setProperty(
      "--circadian-filter",
      `sepia(${(state.blueFilter * 0.35).toFixed(2)}) saturate(${(1 - state.blueFilter * 0.25).toFixed(2)})`,
    );
  } else {
    root.style.removeProperty("--circadian-filter");
  }
}

export function clearCircadianCssVars(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  delete root.dataset[DATA_PHASE];
  root.style.removeProperty("--circadian-contrast");
  root.style.removeProperty("--circadian-blue-filter");
  root.style.removeProperty("--circadian-warmth");
  root.style.removeProperty("--circadian-filter");
}

/**
 * Compute + optionally apply circadian lighting for `now`.
 * Reuses OLED eye-care tokens for consistency with prior modules.
 */
export function syncCircadianLighting(
  opts?: { now?: Date; apply?: boolean; prefs?: CircadianPrefs },
): CircadianLightingState {
  const now = opts?.now ?? new Date();
  const prefs = opts?.prefs ?? loadCircadianPrefs();
  const phase = resolveCircadianPhase(now);
  const hour = now.getHours() + now.getMinutes() / 60;
  const timeOfDay = resolveTimeOfDay(hour);
  const suggestedMode = prefs.overrideMode ?? suggestModeForPhase(phase);
  const contrastBoost = contrastBoostForPhase(phase);
  const blueFilter = blueFilterForPhase(phase);

  let tokens = resolveOledEyeCareTokens(suggestedMode);
  let autoApplied = false;

  if (opts?.apply !== false && prefs.enabled) {
    applyCircadianCssVars({
      phase,
      timeOfDay,
      suggestedMode,
      contrastBoost,
      blueFilter,
      tokens,
      autoApplied: false,
      updatedAt: now.toISOString(),
    });

    if (prefs.autoApply && (phase === "late_night" || phase === "pre_dawn")) {
      const oledPrefs = loadOledEyeCarePrefs();
      if (oledPrefs.autoDuringReading || oledPrefs.sessionActive) {
        tokens = applyOledEyeCare(suggestedMode);
        saveOledEyeCarePrefs({ ...oledPrefs, mode: suggestedMode });
        autoApplied = true;
      } else {
        // Still expose vars; don't force OLED mode if user never opted in
        tokens = resolveOledEyeCareTokens(suggestedMode);
      }
    }
  }

  return {
    phase,
    timeOfDay,
    suggestedMode,
    contrastBoost,
    blueFilter,
    tokens,
    autoApplied,
    updatedAt: now.toISOString(),
  };
}

/** Background tick — call from interval/hook. Returns state. */
export function tickCircadianSchedule(now?: Date): CircadianLightingState {
  return syncCircadianLighting({ now, apply: true });
}
