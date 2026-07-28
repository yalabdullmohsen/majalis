/**
 * Quran Focus Mode — state layer for highlighting the active ayah
 * while marking surrounding ayahs as dimmed. No CSS; consumers apply styles.
 */

export type QuranFocusAyahRef = {
  surah: number;
  ayah: number;
};

export type QuranFocusState = {
  enabled: boolean;
  /** Active (focused) ayah */
  focus: QuranFocusAyahRef | null;
  /** How many ayahs on each side stay "near" (semi-visible) */
  nearRadius: number;
};

export type QuranFocusAyahRole = "focus" | "near" | "dimmed" | "normal";

export type QuranFocusAyahPresentation = {
  role: QuranFocusAyahRole;
  /** Suggested opacity 0–1 (logic hint only — no CSS applied here) */
  opacityHint: number;
  isFocused: boolean;
  isDimmed: boolean;
};

const LS_KEY = "majalis-quran-focus-mode-v1";

const DEFAULT_STATE: QuranFocusState = {
  enabled: false,
  focus: null,
  nearRadius: 1,
};

export function loadFocusModeState(): QuranFocusState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<QuranFocusState>;
    return {
      enabled: Boolean(parsed.enabled),
      focus: parsed.focus?.surah && parsed.focus?.ayah
        ? { surah: Number(parsed.focus.surah), ayah: Number(parsed.focus.ayah) }
        : null,
      nearRadius: Math.max(0, Math.min(5, Number(parsed.nearRadius) || 1)),
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveFocusModeState(state: QuranFocusState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

/** Pure: classify an ayah relative to current focus state. */
export function resolveAyahFocusRole(
  surah: number,
  ayah: number,
  state: QuranFocusState,
): QuranFocusAyahPresentation {
  if (!state.enabled || !state.focus) {
    return { role: "normal", opacityHint: 1, isFocused: false, isDimmed: false };
  }
  if (state.focus.surah !== surah) {
    return { role: "dimmed", opacityHint: 0.28, isFocused: false, isDimmed: true };
  }
  if (ayah === state.focus.ayah) {
    return { role: "focus", opacityHint: 1, isFocused: true, isDimmed: false };
  }
  const dist = Math.abs(ayah - state.focus.ayah);
  if (dist <= state.nearRadius) {
    return { role: "near", opacityHint: 0.72, isFocused: false, isDimmed: false };
  }
  return { role: "dimmed", opacityHint: 0.28, isFocused: false, isDimmed: true };
}

export function enableFocusOnAyah(
  surah: number,
  ayah: number,
  nearRadius = 1,
): QuranFocusState {
  const next: QuranFocusState = {
    enabled: true,
    focus: { surah, ayah },
    nearRadius: Math.max(0, Math.min(5, nearRadius)),
  };
  saveFocusModeState(next);
  return next;
}

export function clearFocusMode(): QuranFocusState {
  const next: QuranFocusState = { ...DEFAULT_STATE };
  saveFocusModeState(next);
  return next;
}

export function setFocusNearRadius(radius: number): QuranFocusState {
  const cur = loadFocusModeState();
  const next = { ...cur, nearRadius: Math.max(0, Math.min(5, Math.floor(radius))) };
  saveFocusModeState(next);
  return next;
}
