/**
 * مستمع زر الرجوع الأصلي (Capacitor) — تسجيل واحد مع cleanup.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { isAndroid, isNative } from "@/lib/capacitor-utils";
import { goBackOrFallback } from "@/lib/navigation-back";

export function NativeBackButtonListener() {
  const [location] = useLocation();

  useEffect(() => {
    if (!isNative || !isAndroid) return;

    let remove: (() => void) | undefined;
    let cancelled = false;

    void import("@capacitor/app").then(({ App: CapApp }) => {
      if (cancelled) return;
      const handle = CapApp.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          goBackOrFallback(location);
        } else {
          const confirmExit = window.confirm("هل تريد الخروج من التطبيق؟");
          if (confirmExit) void CapApp.exitApp();
        }
      });
      remove = () => void handle.then((h) => h.remove());
    }).catch(() => {});

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [location]);

  return null;
}
