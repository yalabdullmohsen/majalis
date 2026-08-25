import { useEffect } from "react";
import { useLocation } from "wouter";
import { recordNavigationPath, runPredictivePrewarm } from "@/lib/sovereign/navigation-prewarm";
import { recordRouteForPredictivePrewarm } from "@/lib/sovereign/predictive-prewarm-engine";

/** يسجّل المسار ويشغّل التسخين التنبؤي — بلا DOM. */
export function SovereignNavigationBridge() {
  const [location] = useLocation();
  useEffect(() => {
    recordNavigationPath(location);
    recordRouteForPredictivePrewarm(location);
    runPredictivePrewarm();
  }, [location]);
  return null;
}
