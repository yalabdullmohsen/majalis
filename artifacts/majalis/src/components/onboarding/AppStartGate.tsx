import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  hasSeenOnboarding,
  markOnboardingSeen,
  shouldSkipAppStartForPath,
} from "@/lib/onboarding-state";
import { AppStartView } from "./AppStartView";

/**
 * يعرض شاشة البدء مرة واحدة بعد أول إقلاع على المسارات العامة فقط.
 * الروابط العميقة تتخطى العرض دون وسم «شوهدت». لا يطلب صلاحيات.
 */
export function AppStartGate() {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(
    () => !shouldSkipAppStartForPath(location) && !hasSeenOnboarding(),
  );

  useEffect(() => {
    if (hasSeenOnboarding() || shouldSkipAppStartForPath(location)) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [location]);

  useEffect(() => {
    const sync = () => {
      if (hasSeenOnboarding() || shouldSkipAppStartForPath(location)) setOpen(false);
    };
    window.addEventListener("mj:feature-tour-storage-ready", sync);
    sync();
    return () => window.removeEventListener("mj:feature-tour-storage-ready", sync);
  }, [location]);

  const onStart = useCallback(() => {
    markOnboardingSeen();
    setOpen(false);
    if (location !== "/") navigate("/");
  }, [location, navigate]);

  if (!open) return null;
  return <AppStartView onStart={onStart} />;
}
