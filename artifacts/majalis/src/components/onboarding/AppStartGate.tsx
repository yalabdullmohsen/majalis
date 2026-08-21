import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { hasSeenOnboarding, markOnboardingSeen } from "@/lib/onboarding-state";
import { AppStartView } from "./AppStartView";

/**
 * يعرض شاشة البدء مرة واحدة بعد أول إقلاع.
 * لا يطلب صلاحيات. يُعاد الفحص بعد hydrate التخزين الأصلي.
 */
export function AppStartGate() {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(() => !hasSeenOnboarding());

  const sync = useCallback(() => {
    if (hasSeenOnboarding()) setOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mj:feature-tour-storage-ready", sync);
    sync();
    return () => window.removeEventListener("mj:feature-tour-storage-ready", sync);
  }, [sync]);

  const onStart = useCallback(() => {
    markOnboardingSeen();
    setOpen(false);
    if (location !== "/") navigate("/");
  }, [location, navigate]);

  if (!open) return null;
  return <AppStartView onStart={onStart} />;
}
