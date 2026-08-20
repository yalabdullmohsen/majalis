/**
 * يربط wouter بـ navigation-intent — يُركَّب مرة واحدة في App.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { bindNavigation } from "@/lib/navigation-intent";

export function NavigationBinder() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    bindNavigation((path, opts) => setLocation(path, opts));
    return () => bindNavigation(() => {});
  }, [setLocation]);
  return null;
}
