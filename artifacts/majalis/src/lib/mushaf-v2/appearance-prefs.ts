/**
 * تفضيلات مظهر المصحف — فاتح/داكن/نظام، دون تغيير تخطيط النص العثماني.
 */

const KEY = "ssunnah-mushaf-appearance-v1";

export type MushafAppearanceMode = "system" | "light" | "night";
export type MushafAppearanceResolved = "light" | "night";

export function loadMushafAppearanceMode(): MushafAppearanceMode {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "light" || raw === "night" || raw === "system") return raw;
  } catch {
    /* ignore */
  }
  return "system";
}

export function saveMushafAppearanceMode(mode: MushafAppearanceMode): void {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
  applyMushafAppearanceMode(mode);
}

export function resolveMushafAppearance(mode: MushafAppearanceMode): MushafAppearanceResolved {
  if (mode === "night") return "night";
  if (mode === "light") return "light";
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

/** يطبّق data-mushaf-appearance على الجذر دون لمس النص القرآني + يزامن Status Bar. */
export function applyMushafAppearanceMode(mode: MushafAppearanceMode, root?: HTMLElement | null): void {
  const el = root ?? (typeof document !== "undefined" ? document.documentElement : null);
  if (!el) return;
  const resolved = resolveMushafAppearance(mode);
  el.setAttribute("data-mushaf-appearance", resolved);
  syncStatusBarChrome(resolved);
}
