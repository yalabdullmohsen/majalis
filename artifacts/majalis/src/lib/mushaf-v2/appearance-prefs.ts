/**
 * تفضيلات وضع عرض المصحف فقط — SYSTEM / LIGHT / DARK.
 * لا يغيّر Theme التطبيق العامة ولا تخطيط النص العثماني.
 */

const KEY = "ssunnah-mushaf-appearance-v1";
const LEGACY_THEME_CHOICE_KEY = "majlisilm.mushaf.theme-choice";
const LEGACY_THEME_KEY = "majlisilm.mushaf.theme";

/** القيم المحفوظة فقط */
export type MushafAppearanceMode = "SYSTEM" | "LIGHT" | "DARK";
export type MushafAppearanceResolved = "light" | "night";

export const MUSHAF_APPEARANCE_CHANGE_EVENT = "ssunnah:mushaf-appearance-change";

export const MUSHAF_DISPLAY_MODE_OPTIONS: ReadonlyArray<{
  id: MushafAppearanceMode;
  label: string;
  description: string;
}> = [
  { id: "SYSTEM", label: "تلقائي", description: "يتبع إعداد النظام" },
  { id: "LIGHT", label: "نهاري", description: "ورق عاجي دائمًا" },
  { id: "DARK", label: "ليلي", description: "عرض ليلي دائمًا" },
];

function normalizeMode(raw: string | null | undefined): MushafAppearanceMode | null {
  if (!raw) return null;
  const v = raw.trim();
  if (v === "SYSTEM" || v === "system" || v === "auto") return "SYSTEM";
  if (v === "LIGHT" || v === "light" || v === "paper" || v === "sepia") return "LIGHT";
  if (v === "DARK" || v === "dark" || v === "night" || v === "oled") return "DARK";
  return null;
}

export function parseMushafAppearanceMode(raw?: string | null): MushafAppearanceMode {
  return normalizeMode(raw) ?? "SYSTEM";
}

export function loadMushafAppearanceMode(): MushafAppearanceMode {
  try {
    const primary = normalizeMode(localStorage.getItem(KEY));
    if (primary) return primary;
    const legacy =
      normalizeMode(localStorage.getItem(LEGACY_THEME_CHOICE_KEY)) ??
      normalizeMode(localStorage.getItem(LEGACY_THEME_KEY));
    if (legacy) {
      saveMushafAppearanceMode(legacy);
      return legacy;
    }
  } catch {
    /* ignore */
  }
  return "SYSTEM";
}

export function saveMushafAppearanceMode(mode: MushafAppearanceMode): void {
  const next = parseMushafAppearanceMode(mode);
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  applyMushafAppearanceMode(next);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent(MUSHAF_APPEARANCE_CHANGE_EVENT, { detail: { mode: next } }),
      );
    } catch {
      /* ignore */
    }
  }
}

export function resolveMushafAppearance(mode: MushafAppearanceMode): MushafAppearanceResolved {
  if (mode === "DARK") return "night";
  if (mode === "LIGHT") return "light";
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "night"
    : "light";
}

function syncStatusBarChrome(resolved: MushafAppearanceResolved): void {
  if (typeof window === "undefined") return;
  void import("@/lib/apply-page-chrome")
    .then(({ applyMushafThemeChrome }) =>
      applyMushafThemeChrome(resolved === "night" ? "night" : "paper"),
    )
    .catch(() => {
      /* ignore */
    });
}

/** يطبّق data-mushaf-appearance على html و.nm-root دون لمس Theme التطبيق. */
export function applyMushafAppearanceMode(
  mode: MushafAppearanceMode,
  root?: HTMLElement | null,
): void {
  if (typeof document === "undefined") return;
  const resolved = resolveMushafAppearance(parseMushafAppearanceMode(mode));
  const html = document.documentElement;
  html.setAttribute("data-mushaf-appearance", resolved);
  const targets: HTMLElement[] = [];
  if (root) targets.push(root);
  document.querySelectorAll<HTMLElement>(".nm-root").forEach((el) => targets.push(el));
  for (const el of targets) {
    el.setAttribute("data-mushaf-appearance", resolved);
  }
  syncStatusBarChrome(resolved);
}
