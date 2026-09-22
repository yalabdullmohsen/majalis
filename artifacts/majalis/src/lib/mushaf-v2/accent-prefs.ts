/**
 * تفضيل Accent المصحف (زمردي / ذهبي) — محلي، بلا حساب.
 * data-mushaf-accent على .nm-root (أو html أثناء الإقلاع).
 */

import {
  MUSHAF_ACCENT_DEFAULT,
  MUSHAF_ACCENT_STORAGE_KEY,
  accentAttrToTheme,
  parseMushafAppearanceTheme,
  themeToAccentAttr,
  type MushafAppearanceTheme,
} from "./mushaf-appearance-theme";

export function loadMushafAccentTheme(): MushafAppearanceTheme {
  try {
    const raw = localStorage.getItem(MUSHAF_ACCENT_STORAGE_KEY);
    const parsed = parseMushafAppearanceTheme(raw);
    if (parsed) return parsed;
  } catch {
    /* ignore */
  }
  return MUSHAF_ACCENT_DEFAULT;
}

export function saveMushafAccentTheme(theme: MushafAppearanceTheme): void {
  try {
    localStorage.setItem(MUSHAF_ACCENT_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  applyMushafAccentTheme(theme);
}

/** يطبّق السمة فورًا دون إعادة تحميل */
export function applyMushafAccentTheme(
  theme: MushafAppearanceTheme = loadMushafAccentTheme(),
  root?: HTMLElement | null,
): void {
  const attr = themeToAccentAttr(theme);
  const targets: HTMLElement[] = [];
  if (root) targets.push(root);
  if (typeof document !== "undefined") {
    targets.push(document.documentElement);
    document.querySelectorAll<HTMLElement>(".nm-root").forEach((el) => targets.push(el));
  }
  for (const el of targets) {
    el.setAttribute("data-mushaf-accent", attr);
  }
}

export function readAccentThemeFromDom(root?: HTMLElement | null): MushafAppearanceTheme {
  const el =
    root ??
    (typeof document !== "undefined"
      ? document.querySelector<HTMLElement>(".nm-root") ?? document.documentElement
      : null);
  return accentAttrToTheme(el?.getAttribute("data-mushaf-accent"));
}
