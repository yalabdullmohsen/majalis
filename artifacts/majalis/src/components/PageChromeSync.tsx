/**
 * يزامن PageChrome مع مسار wouter والوضع (فاتح/داكن).
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { applyPageChrome } from "@/lib/apply-page-chrome";
import { useThemePreference } from "@/components/ThemePreferenceProvider";

export function usePageChromeSync() {
  const [location] = useLocation();
  const { resolvedTheme } = useThemePreference();

  useEffect(() => {
    void applyPageChrome({ pathname: location, resolvedTheme });
  }, [location, resolvedTheme]);
}

/** مكوّن بلا UI — يُوضع داخل Router + ThemePreferenceProvider */
export function PageChromeSync() {
  usePageChromeSync();
  return null;
}
