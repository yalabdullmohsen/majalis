/** Site typography — Cairo only (global). */
export type FontPreference = "default";

export const FONT_STORAGE_KEY = "majalis-font-preference";

export const FONT_OPTIONS: {
  id: FontPreference;
  label: string;
  description: string;
}[] = [
  { id: "default", label: "Cairo", description: "الخط الرسمي للمنصة" },
];

export function isFontPreference(value: string | null | undefined): value is FontPreference {
  return value === "default" || !value;
}

export function readFontPreference(): FontPreference {
  return "default";
}

export function writeFontPreference(_preference: FontPreference) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.font = "default";
}

export function applyFontPreference(_preference: FontPreference = "default") {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.font = "default";
}
