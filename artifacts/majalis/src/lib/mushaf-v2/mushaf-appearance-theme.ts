/**
 * MushafAppearanceTheme — مظهر المصحف الذهبي الثابت فقط.
 * لا اختيار مستخدم · لا مظهر زمردي · لا يمس النص القرآني ولا Page Mapping ولا Geometry.
 *
 * MUSHAF_GOLD_APPEARANCE — هوية Accent الرسمية الوحيدة.
 */

/** قيمة data-attribute الثابتة */
export type MushafAccentAttr = "gold";

/**
 * @deprecated لا اختيار مظهر بعد الآن — القيمة الوحيدة GOLD للتوافق المؤقت مع المستدعين.
 */
export type MushafAppearanceTheme = "GOLD";

export const MUSHAF_GOLD_APPEARANCE = "GOLD" as const;

export const MUSHAF_APPEARANCE_THEME = {
  GOLD: "GOLD",
} as const satisfies Record<MushafAppearanceTheme, MushafAppearanceTheme>;

/** الافتراضي والوحيد */
export const MUSHAF_ACCENT_DEFAULT: MushafAppearanceTheme = "GOLD";

/**
 * مفتاح التخزين القديم (v1) — يُحذف مرة واحدة عند Migration.
 * لا يُكتب إليه بعد الآن.
 */
export const MUSHAF_ACCENT_STORAGE_KEY_LEGACY = "ssunnah-mushaf-accent-theme-v1";

/** Schema version لإعدادات المصحف (مظهر ثابت — لا قيمة Accent محفوظة) */
export const MUSHAF_SETTINGS_SCHEMA_VERSION_KEY = "ssunnah-mushaf-settings-schema-v2";
export const MUSHAF_SETTINGS_SCHEMA_VERSION = "2-gold-only";

/** ذهبي — Light */
export const mushafGoldPrimary = "#C9A82E" as const;
export const mushafGoldSecondary = "#B89620" as const;
export const mushafGoldMarkerNumber = "#5F4814" as const;
export const mushafGoldDarkPrimary = "#C4A030" as const;
export const mushafGoldDarkSecondary = "#A88618" as const;
export const mushafGoldDarkMarkerNumber = "#F0E2B8" as const;

export function themeToAccentAttr(_theme?: MushafAppearanceTheme): MushafAccentAttr {
  return "gold";
}

export function accentAttrToTheme(_attr?: string | null): MushafAppearanceTheme {
  return "GOLD";
}

/** أي قيمة قديمة تُتجاهل — النتيجة دائمًا GOLD */
export function parseMushafAppearanceTheme(_raw?: string | null): MushafAppearanceTheme {
  return "GOLD";
}

export function mushafAppearanceThemeLabel(_theme?: MushafAppearanceTheme): string {
  return "الذهبي";
}
