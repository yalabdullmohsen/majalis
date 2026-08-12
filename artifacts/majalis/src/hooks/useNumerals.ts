import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { formatNumerals } from "@/lib/numerals";

/** يُعيد دالة fmt(value) تنسّق الأرقام وفق تفضيل المستخدم الحالي (عربي/إنجليزي). */
export function useNumerals() {
  const { preferences } = useUserPreferences();
  return (value: string | number) => formatNumerals(value, preferences.numeralSystem);
}
