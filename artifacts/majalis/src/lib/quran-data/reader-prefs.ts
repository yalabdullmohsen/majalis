/**
 * تفضيلات قارئ التفسير/الترجمة في شيت الآية — localStorage.
 */

import {
  DEFAULT_MUSHAF_TAFSIR_EDITION,
  resolveMushafTafsirEditionId,
} from "@/lib/quran-data/tafsir-editions";
import {
  DEFAULT_MUSHAF_TRANSLATION_EDITION,
  resolveMushafTranslationEditionId,
} from "@/lib/quran-data/translation-editions";

export const TAFSIR_EDITION_KEY = "majalis-mushaf-tafsir-edition-v1";
export const TAFSIR_FONT_SCALE_KEY = "majalis-mushaf-tafsir-font-scale-v1";
export const TRANSLATION_ENABLED_KEY = "majalis-mushaf-translation-on-v1";
export const TRANSLATION_EDITION_KEY = "majalis-mushaf-translation-edition-v1";

/** مقاييس خط التفسير المسموحة */
export const TAFSIR_FONT_SCALES = [0.9, 1, 1.15, 1.3] as const;
export type TafsirFontScale = (typeof TAFSIR_FONT_SCALES)[number];
export const DEFAULT_TAFSIR_FONT_SCALE: TafsirFontScale = 1;

function readLocal(key: string): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function readStoredTafsirEdition(): string {
  return resolveMushafTafsirEditionId(readLocal(TAFSIR_EDITION_KEY));
}

export function persistTafsirEdition(id: string): void {
  writeLocal(TAFSIR_EDITION_KEY, resolveMushafTafsirEditionId(id));
}

export function readStoredTafsirFontScale(): TafsirFontScale {
  const raw = readLocal(TAFSIR_FONT_SCALE_KEY);
  const n = raw != null ? Number(raw) : NaN;
  if (TAFSIR_FONT_SCALES.includes(n as TafsirFontScale)) return n as TafsirFontScale;
  return DEFAULT_TAFSIR_FONT_SCALE;
}

export function persistTafsirFontScale(scale: TafsirFontScale): void {
  writeLocal(TAFSIR_FONT_SCALE_KEY, String(scale));
}

export function readStoredTranslationEnabled(): boolean {
  const raw = readLocal(TRANSLATION_ENABLED_KEY);
  return raw === "1" || raw === "true";
}

export function persistTranslationEnabled(on: boolean): void {
  writeLocal(TRANSLATION_ENABLED_KEY, on ? "1" : "0");
}

export function readStoredTranslationEdition(): string {
  return resolveMushafTranslationEditionId(readLocal(TRANSLATION_EDITION_KEY));
}

export function persistTranslationEdition(id: string): void {
  writeLocal(TRANSLATION_EDITION_KEY, resolveMushafTranslationEditionId(id));
}

export { DEFAULT_MUSHAF_TAFSIR_EDITION, DEFAULT_MUSHAF_TRANSLATION_EDITION };
