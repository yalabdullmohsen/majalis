/**
 * MushafAppearanceProvider — يثبّت المظهر الذهبي مرة واحدة عند الإقلاع.
 * لا حالة متعددة · لا setTheme · لا اختيار مستخدم.
 */
import { useLayoutEffect, type ReactNode } from "react";
import { applyMushafAccentTheme, migrateMushafAccentStorageOnce } from "./accent-prefs";
import type { MushafAccentAttr, MushafAppearanceTheme } from "./mushaf-appearance-theme";

export type MushafAppearanceContextValue = {
  theme: MushafAppearanceTheme;
  accentAttr: MushafAccentAttr;
  label: string;
  /** لا-op — المظهر ثابت */
  setTheme: (theme: MushafAppearanceTheme) => void;
};

/** غلاف يثبت الذهب قبل paint ويمسح مفتاح Accent القديم */
export function MushafAppearanceProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    migrateMushafAccentStorageOnce();
    applyMushafAccentTheme("GOLD");
  }, []);
  return children;
}

const FIXED: MushafAppearanceContextValue = {
  theme: "GOLD",
  accentAttr: "gold",
  label: "الذهبي",
  setTheme: () => {
    /* مظهر ثابت — تجاهل */
  },
};

/** توافق: يعيد القيم الذهبية الثابتة دائمًا */
export function useMushafAppearance(): MushafAppearanceContextValue {
  return FIXED;
}

export function useMushafAppearanceOptional(): MushafAppearanceContextValue {
  return FIXED;
}
