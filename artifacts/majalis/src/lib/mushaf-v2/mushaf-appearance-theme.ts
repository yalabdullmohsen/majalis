/**
 * MushafAppearanceTheme — عقد مظهر المصحف (Accent فقط).
 * لا يمس النص القرآني ولا Page Mapping ولا Geometry.
 *
 * القيم: EMERALD | GOLD
 * التطبيق عبر data-mushaf-accent على .nm-root
 */

export type MushafAppearanceTheme = "EMERALD" | "GOLD";

/** قيمة data-attribute (kebab) */
export type MushafAccentAttr = "emerald" | "gold";

export const MUSHAF_APPEARANCE_THEME = {
  EMERALD: "EMERALD",
  GOLD: "GOLD",
} as const satisfies Record<MushafAppearanceTheme, MushafAppearanceTheme>;

export const MUSHAF_ACCENT_DEFAULT: MushafAppearanceTheme = "EMERALD";

export const MUSHAF_ACCENT_STORAGE_KEY = "ssunnah-mushaf-accent-theme-v1";

/** زمردي — Light */
export const mushafEmeraldPrimary = "#0E7A6B" as const;
export const mushafEmeraldSecondary = "#0A5C52" as const;
export const mushafEmeraldMarkerNumber = "#F7F3E8" as const;
export const mushafEmeraldMetaBorder = "#0E7A6B" as const;

/** زمردي — Night (هادئ بلا توهج) */
export const mushafEmeraldDarkPrimary = "#2A9B88" as const;
export const mushafEmeraldDarkSecondary = "#1E7A6C" as const;
export const mushafEmeraldDarkMarkerNumber = "#F0F7F4" as const;

/** ذهبي — من توكنات المطبعي (تُعرَّف في mushaf-warm-yellow-tokens) */
export const mushafGoldPrimary = "#C9A82E" as const;
export const mushafGoldSecondary = "#B89620" as const;
export const mushafGoldMarkerNumber = "#5F4814" as const;
export const mushafGoldDarkPrimary = "#C4A030" as const;
export const mushafGoldDarkSecondary = "#A88618" as const;
export const mushafGoldDarkMarkerNumber = "#F0E2B8" as const;

export function themeToAccentAttr(theme: MushafAppearanceTheme): MushafAccentAttr {
  return theme === "GOLD" ? "gold" : "emerald";
}

export function accentAttrToTheme(attr: string | null | undefined): MushafAppearanceTheme {
  if (attr === "gold") return "GOLD";
  return "EMERALD";
}

export function parseMushafAppearanceTheme(raw: string | null | undefined): MushafAppearanceTheme | null {
  if (!raw) return null;
  const v = raw.trim().toUpperCase();
  if (v === "EMERALD" || v === "GREEN" || v === "TURQUOISE" || v === "OPENING") return "EMERALD";
  if (v === "GOLD" || v === "YELLOW" || v === "PRINTED") return "GOLD";
  if (raw === "emerald" || raw === "green") return "EMERALD";
  if (raw === "gold") return "GOLD";
  return null;
}

export function mushafAppearanceThemeLabel(theme: MushafAppearanceTheme): string {
  return theme === "GOLD" ? "الذهبي" : "الزمردي";
}
