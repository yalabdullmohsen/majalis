import { useCallback, useEffect, useState } from "react";
import {
  beginPageReading,
  buildReadingAnalyticsPayload,
  endPageReading,
  exportReadingAnalyticsJson,
  loadReadingAnalytics,
  loadReadingAnalyticsAsync,
  pageHeatIntensity,
  type ReadingAnalyticsPeriodPayload,
  type ReadingAnalyticsStore,
} from "@/lib/reading-analytics";

/** Background reading analytics + heatmap — logic only. */
export function useReadingAnalytics(opts?: { autoLoad?: boolean }) {
  const [store, setStore] = useState<ReadingAnalyticsStore>(() => loadReadingAnalytics());
  const [weekly, setWeekly] = useState<ReadingAnalyticsPeriodPayload | null>(null);
  const [monthly, setMonthly] = useState<ReadingAnalyticsPeriodPayload | null>(null);

  const refresh = useCallback(() => {
    const s = loadReadingAnalytics();
    setStore(s);
    setWeekly(buildReadingAnalyticsPayload("week", new Date(), s));
    setMonthly(buildReadingAnalyticsPayload("month", new Date(), s));
  }, []);

  useEffect(() => {
    if (opts?.autoLoad === false) return;
    let cancelled = false;
    void loadReadingAnalyticsAsync().then((s) => {
      if (cancelled) return;
      setStore(s);
      setWeekly(buildReadingAnalyticsPayload("week", new Date(), s));
      setMonthly(buildReadingAnalyticsPayload("month", new Date(), s));
    });
    return () => {
      cancelled = true;
    };
  }, [opts?.autoLoad]);

  const beginPage = useCallback((page: number) => {
    beginPageReading(page);
  }, []);

  const endPage = useCallback(
    (page: number, completed = false) => {
      const cell = endPageReading(page, { completed });
      refresh();
      return cell;
    },
    [refresh],
  );

  const intensity = useCallback(
    (page: number) => pageHeatIntensity(page, store),
    [store],
  );

  const exportJson = useCallback(
    (period: "week" | "month" = "week") => exportReadingAnalyticsJson(period),
    [],
  );

  return { store, weekly, monthly, beginPage, endPage, intensity, exportJson, refresh };
}
