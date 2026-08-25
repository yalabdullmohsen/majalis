import { useEffect } from "react";
import { useLocation } from "wouter";
import { recordNavigationPath, runPredictivePrewarm } from "@/lib/sovereign/navigation-prewarm";

/** يسجّل المسار ويشغّل التسخين التنبؤي — بلا DOM. */
export function SovereignNavigationBridge() {
  const [location] = useLocation();
  useEffect(() => {
    recordNavigationPath(location);
    runPredictivePrewarm();
  }, [location]);
  return null;
}
