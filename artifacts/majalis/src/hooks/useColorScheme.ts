/**
 * Web port of React Native `useColorScheme()`.
 * Returns `"light"` | `"dark"` from `prefers-color-scheme`, and updates live
 * when the OS/browser theme changes. Returns `null` before first paint on SSR.
 */

import { useEffect, useState } from "react";

export type ColorSchemeName = "light" | "dark";

function readSystemColorScheme(): ColorSchemeName {
  try {
    if (typeof window === "undefined" || !window.matchMedia) return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

/**
 * RN: `const deviceTheme = useColorScheme(); // 'light' | 'dark'`
 */
export function useColorScheme(): ColorSchemeName | null {
  const [scheme, setScheme] = useState<ColorSchemeName | null>(() =>
    typeof window === "undefined" ? null : readSystemColorScheme(),
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setScheme("light");
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setScheme(mq.matches ? "dark" : "light");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return scheme;
}

export default useColorScheme;
