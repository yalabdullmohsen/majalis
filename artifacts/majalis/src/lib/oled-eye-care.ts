/**
 * True-Black OLED & Eye-Care Reading Logic — runtime tokens + optional
 * document dataset/CSS variables. Does NOT edit Tailwind/CSS source files.
 */

import { resolveTheme, readThemePreference } from "@/lib/theme-preference";

export type OledEyeCareMode = "off" | "oled-black" | "eye-care" | "oled-eye-care";

export type OledEyeCareTokens = {
  mode: OledEyeCareMode;
  /** True black for OLED pixels */
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  /** Warmth 0–1 (higher = more amber / less blue) */
  warmth: number;
  /** Suggested theme-color meta */
  themeColor: string;
  /** Reduce motion / brightness hints for long sessions */
  preferReducedBlueLight: boolean;
};

export type OledEyeCarePrefs = {
  mode: OledEyeCareMode;
  /** Auto-enable during Quran/Azkar reading when site theme is dark */
  autoDuringReading: boolean;
  sessionActive: boolean;
};

const LS_KEY = "majalis-oled-eye-care-v1";
const DATA_ATTR = "oledEyeCare";

const DEFAULT_PREFS: OledEyeCarePrefs = {
  mode: "off",
  autoDuringReading: true,
  sessionActive: false,
};

export function loadOledEyeCarePrefs(): OledEyeCarePrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<OledEyeCarePrefs>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveOledEyeCarePrefs(prefs: OledEyeCarePrefs): OledEyeCarePrefs {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
  return prefs;
}

/** Compute color tokens for the active mode (pure). */
export function resolveOledEyeCareTokens(mode: OledEyeCareMode): OledEyeCareTokens {
  switch (mode) {
    case "oled-black":
      return {
        mode,
        background: "#000000",
        surface: "#000000",
        text: "#F2F2F2",
        mutedText: "#A3A3A3",
        warmth: 0,
        themeColor: "#000000",
        preferReducedBlueLight: false,
      };
    case "eye-care":
      return {
        mode,
        background: "#1A1612",
        surface: "#221E18",
        text: "#F0E6D2",
        mutedText: "#C4B59A",
        warmth: 0.72,
        themeColor: "#1A1612",
        preferReducedBlueLight: true,
      };
    case "oled-eye-care":
      return {
        mode,
        background: "#000000",
        surface: "#0A0908",
        text: "#EDE3CF",
        mutedText: "#B8A88C",
        warmth: 0.85,
        themeColor: "#000000",
        preferReducedBlueLight: true,
      };
    default:
      return {
        mode: "off",
        background: "",
        surface: "",
        text: "",
        mutedText: "",
        warmth: 0,
        themeColor: "",
        preferReducedBlueLight: false,
      };
  }
}

/**
 * Apply runtime CSS variables + dataset on <html>.
 * No stylesheet edits — variables are available for future/opt-in consumers.
 */
export function applyOledEyeCare(mode: OledEyeCareMode): OledEyeCareTokens {
  const tokens = resolveOledEyeCareTokens(mode);
  if (typeof document === "undefined") return tokens;

  const root = document.documentElement;
  if (mode === "off") {
    delete root.dataset[DATA_ATTR];
    root.style.removeProperty("--oled-bg");
    root.style.removeProperty("--oled-surface");
    root.style.removeProperty("--oled-text");
    root.style.removeProperty("--oled-muted");
    root.style.removeProperty("--oled-warmth");
    return tokens;
  }

  root.dataset[DATA_ATTR] = mode;
  root.style.setProperty("--oled-bg", tokens.background);
  root.style.setProperty("--oled-surface", tokens.surface);
  root.style.setProperty("--oled-text", tokens.text);
  root.style.setProperty("--oled-muted", tokens.mutedText);
  root.style.setProperty("--oled-warmth", String(tokens.warmth));

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && tokens.themeColor) meta.setAttribute("content", tokens.themeColor);

  return tokens;
}

/**
 * Dynamic canvas background fill for custom mushaf/canvas renderers.
 * Returns false if canvas context unavailable.
 */
export function paintOledCanvasBackground(
  canvas: HTMLCanvasElement,
  mode: OledEyeCareMode = loadOledEyeCarePrefs().mode,
): boolean {
  try {
    const tokens = resolveOledEyeCareTokens(mode);
    if (mode === "off" || !tokens.background) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.save();
    ctx.fillStyle = tokens.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    return true;
  } catch {
    return false;
  }
}

/**
 * Suggested text fill for canvas ayah rendering under eye-care modes.
 */
export function resolveOledCanvasTextColor(mode: OledEyeCareMode): string | null {
  const tokens = resolveOledEyeCareTokens(mode);
  return mode === "off" ? null : tokens.text;
}

/** Begin a long reading session — auto-picks OLED mode when dark theme is on. */
export function beginReadingEyeCareSession(
  preferred: OledEyeCareMode = "oled-eye-care",
): OledEyeCarePrefs {
  const prefs = loadOledEyeCarePrefs();
  const siteDark = resolveTheme(readThemePreference()) === "dark";
  let mode = prefs.mode;
  if (prefs.autoDuringReading && siteDark && (mode === "off" || !mode)) {
    mode = preferred;
  }
  const next: OledEyeCarePrefs = { ...prefs, mode, sessionActive: true };
  saveOledEyeCarePrefs(next);
  applyOledEyeCare(next.mode);
  return next;
}

export function endReadingEyeCareSession(): OledEyeCarePrefs {
  const prefs = loadOledEyeCarePrefs();
  const next: OledEyeCarePrefs = { ...prefs, sessionActive: false };
  // Keep mode if user explicitly chose it; only clear applied vars if still "off"
  saveOledEyeCarePrefs(next);
  applyOledEyeCare(next.mode);
  return next;
}

export function setOledEyeCareMode(mode: OledEyeCareMode): OledEyeCarePrefs {
  const next = saveOledEyeCarePrefs({ ...loadOledEyeCarePrefs(), mode });
  applyOledEyeCare(mode);
  return next;
}
