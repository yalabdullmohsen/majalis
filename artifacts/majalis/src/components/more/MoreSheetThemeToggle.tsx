import { Moon, Sun } from "lucide-react";
import { useThemePreference } from "@/components/ThemePreferenceProvider";

/** زر وضع نهاري/ليلي لترويسة شيت المزيد (خارج أسطح التنقّل المحظورة). */
export function MoreSheetThemeToggle() {
  const { resolvedTheme, toggleDark } = useThemePreference();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className="more-sheet-theme-btn"
      onClick={toggleDark}
      aria-label={
        isDark
          ? "الوضع الحالي: ليلي — التحويل إلى النهاري"
          : "الوضع الحالي: نهاري — التحويل إلى الليلي"
      }
      aria-pressed={isDark}
      title={isDark ? "وضع ليلي" : "وضع نهاري"}
      data-theme-toggle="1"
    >
      {isDark ? (
        <Moon size={18} strokeWidth={1.75} aria-hidden />
      ) : (
        <Sun size={18} strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}
