/**
 * أنواع فواصل المصحف المتقدمة — ألوان هادئة، بلا تغطية للنص.
 */
export type MushafBookmarkKind =
  | "wird"
  | "hifz"
  | "review"
  | "tadabbur"
  | "lesson"
  | "custom";

export type MushafWirdSlot = "morning" | "evening" | "any";

export type BookmarkKindMeta = {
  id: MushafBookmarkKind;
  label: string;
  /** لون CSS هادئ */
  color: string;
  /** لون داكن للثيم الليلي */
  colorDark: string;
};

export const MUSHAF_BOOKMARK_KINDS: readonly BookmarkKindMeta[] = [
  { id: "wird", label: "ورد يومي", color: "#3d6a96", colorDark: "#7aa3c9" },
  { id: "hifz", label: "حفظ", color: "#2f6b4f", colorDark: "#6fad8c" },
  { id: "review", label: "مراجعة", color: "#b06a32", colorDark: "#d4a06a" },
  { id: "tadabbur", label: "تدبر", color: "#5c4f7a", colorDark: "#a094c0" },
  { id: "lesson", label: "درس", color: "#9a7a2e", colorDark: "#d0b56a" },
  { id: "custom", label: "مخصص", color: "#5c564c", colorDark: "#b0a898" },
] as const;

export const BOOKMARK_KIND_IDS = MUSHAF_BOOKMARK_KINDS.map((k) => k.id);

export function isMushafBookmarkKind(v: unknown): v is MushafBookmarkKind {
  return typeof v === "string" && (BOOKMARK_KIND_IDS as readonly string[]).includes(v);
}

export function getBookmarkKindMeta(kind: MushafBookmarkKind): BookmarkKindMeta {
  return MUSHAF_BOOKMARK_KINDS.find((k) => k.id === kind) ?? MUSHAF_BOOKMARK_KINDS[5]!;
}

export function resolveBookmarkColor(
  kind: MushafBookmarkKind,
  customColor?: string | null,
  dark = false,
): string {
  if (kind === "custom" && customColor && /^#[0-9a-fA-F]{6}$/.test(customColor)) {
    return customColor;
  }
  const meta = getBookmarkKindMeta(kind);
  return dark ? meta.colorDark : meta.color;
}
