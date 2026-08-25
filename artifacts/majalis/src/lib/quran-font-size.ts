/**
 * Web port of RN QuranReader font-size controls:
 * default 20, step ±2, min 14, max 32 (Phase 6 reader range), lineHeight = fontSize * 1.5
 * maxFontSizeMultiplier ≈ 32/20 = 1.6 لقارئ الآيات؛ واجهة UI لها سقف منفصل 1.35.
 */

export const QURAN_FONT_MIN_PX = 14;
export const QURAN_FONT_MAX_PX = 32;
export const QURAN_FONT_STEP_PX = 2;
export const QURAN_FONT_DEFAULT_PX = 20;
export const QURAN_FONT_STORAGE_KEY = "userFontSize";
export const QURAN_FONT_LINE_HEIGHT_RATIO = 1.5;

/** سقف مضاعف حجم نظام الواجهة (مكافئ RN maxFontSizeMultiplier للـUI) */
export const UI_FONT_SCALE_MIN = 0.85;
export const UI_FONT_SCALE_MAX = 1.35;

export const READING_TEXT_MIN_PX = 14;
export const READING_TEXT_MAX_PX = 32;

export function clampQuranFontSize(n: number): number {
  if (!Number.isFinite(n)) return QURAN_FONT_DEFAULT_PX;
  const stepped = Math.round(n / QURAN_FONT_STEP_PX) * QURAN_FONT_STEP_PX;
  return Math.min(QURAN_FONT_MAX_PX, Math.max(QURAN_FONT_MIN_PX, stepped));
}

export function clampReadingTextSize(n: number): number {
  if (!Number.isFinite(n)) return 17;
  return Math.min(READING_TEXT_MAX_PX, Math.max(READING_TEXT_MIN_PX, Math.round(n)));
}

export function clampUiFontScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.min(UI_FONT_SCALE_MAX, Math.max(UI_FONT_SCALE_MIN, scale));
}

export function readStoredQuranFontSize(): number {
  try {
    if (typeof localStorage === "undefined") return QURAN_FONT_DEFAULT_PX;
    const raw = localStorage.getItem(QURAN_FONT_STORAGE_KEY);
    if (raw == null) return QURAN_FONT_DEFAULT_PX;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return QURAN_FONT_DEFAULT_PX;
    return clampQuranFontSize(parsed);
  } catch {
    return QURAN_FONT_DEFAULT_PX;
  }
}

export function persistQuranFontSize(size: number): number {
  const clamped = clampQuranFontSize(size);
  try {
    localStorage.setItem(QURAN_FONT_STORAGE_KEY, String(clamped));
  } catch {
    /* ignore */
  }
  return clamped;
}

/** RN: quranTextStyle = { fontSize, lineHeight: fontSize * 1.5 } */
export function quranTextStyle(fontSize: number): { fontSize: number; lineHeight: number } {
  const size = clampQuranFontSize(fontSize);
  return {
    fontSize: size,
    lineHeight: size * QURAN_FONT_LINE_HEIGHT_RATIO,
  };
}

export function canIncreaseFont(fontSize: number): boolean {
  return fontSize < QURAN_FONT_MAX_PX;
}

export function canDecreaseFont(fontSize: number): boolean {
  return fontSize > QURAN_FONT_MIN_PX;
}

export function nextIncreasedFont(fontSize: number): number {
  if (!canIncreaseFont(fontSize)) return fontSize;
  return clampQuranFontSize(fontSize + QURAN_FONT_STEP_PX);
}

export function nextDecreasedFont(fontSize: number): number {
  if (!canDecreaseFont(fontSize)) return fontSize;
  return clampQuranFontSize(fontSize - QURAN_FONT_STEP_PX);
}
