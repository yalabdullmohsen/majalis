import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { useFontPreference } from "@/components/FontPreferenceProvider";

/** Shared reading typography from Settings → إعدادات القراءة */
export function useReadingStyles() {
  const { preferences } = useUserPreferences();
  const { preference: fontPreference } = useFontPreference();

  const lineHeight =
    preferences.readingSpacing === "ضيق" ? 1.65 : preferences.readingSpacing === "متوسط" ? 1.85 : 2.15;

  return {
    fontSize: `${preferences.readingTextSize}px`,
    lineHeight,
    fontFamily: fontPreference,
    quietMode: preferences.readingMode,
  };
}
