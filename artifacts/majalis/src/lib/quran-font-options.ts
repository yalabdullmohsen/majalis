/**
 * Quran reader typeface cycle — web port of the RN sketch:
 * `FONT_OPTIONS = ['Amiri', 'Traditional Arabic', 'Scheherazade']` + `toggleFont`.
 * Mapped onto existing `QuranFontId` so Settings stay in sync.
 */
import type { QuranFontId } from "@/hooks/useQuranPreferences";

export type QuranFontOption = {
  id: QuranFontId;
  /** RN sketch display name */
  label: string;
  /** Short Arabic label for chips */
  labelAr: string;
  /** CSS font-family stack (loaded fonts + system fallbacks) */
  stack: string;
};

/** Cycle order matches the RN sketch. */
export const FONT_OPTIONS: readonly QuranFontOption[] = [
  {
    id: "amiri",
    label: "Amiri",
    labelAr: "أميري",
    stack: '"Amiri Quran", "Amiri", "Scheherazade New", serif',
  },
  {
    id: "naskh",
    label: "Traditional Arabic",
    labelAr: "نسخ",
    stack: '"Noto Naskh Arabic", "Traditional Arabic", "Arabic Typesetting", "Amiri", serif',
  },
  {
    id: "uthmani",
    label: "Scheherazade",
    labelAr: "شهرزاد",
    stack: '"Scheherazade New", "Scheherazade", "Amiri Quran", serif',
  },
] as const;

export function quranFontOption(fontId: QuranFontId): QuranFontOption {
  return FONT_OPTIONS.find((o) => o.id === fontId) ?? FONT_OPTIONS[0];
}

export function quranFontStack(fontId: QuranFontId): string {
  return quranFontOption(fontId).stack;
}

/** RN `toggleFont` — advance to the next option in FONT_OPTIONS. */
export function nextQuranFontId(current: QuranFontId): QuranFontId {
  const currentIndex = FONT_OPTIONS.findIndex((o) => o.id === current);
  const nextIndex = (currentIndex + 1) % FONT_OPTIONS.length;
  return FONT_OPTIONS[nextIndex].id;
}
