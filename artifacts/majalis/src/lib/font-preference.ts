/** Site-wide font: Cairo only — no alternate font families permitted. */
export type FontPreference = "default";

export const FONT_STORAGE_KEY = "majalis-font-preference";

export const FONT_OPTIONS: {
  id: FontPreference;
  label: string;
  description: string;
}[] = [
  { id: "default", label: "Cairo", description: "الخط الرسمي للمنصة — Cairo" },
];

export function isFontPreference(value: string | null | undefined): value is FontPreference {
  return value === "default";
}

export function readFontPreference(): FontPreference {
  return "default";
}

export function writeFontPreference(_preference: FontPreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FONT_STORAGE_KEY, "default");
  document.documentElement.dataset.font = "default";
}

export function applyFontPreference(_preference: FontPreference = "default") {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.font = "default";
}
