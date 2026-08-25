import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { fetchRecentProgress, type ProgressRow } from "@/lib/user-progress-service";
import { getContinueReadingEntries } from "@/lib/continue-reading";
import { loadLastPageSync } from "@/lib/quran-last-page";

/** بذرة محلية فورية — تُعرض قبل سحابة التقدّم (SWR). */
export function localProgressSeed(limit = 6): ProgressRow[] {
  const rows: ProgressRow[] = [];
  const page = loadLastPageSync();
  if (page != null) {
    rows.push({
      id: `local-mushaf-${page}`,
      user_id: "",
      content_type: "quran",
      content_id: String(page),
      content_title: `المصحف — صفحة ${page}`,
      content_url: `/mushaf?page=${page}`,
      progress_pct: Math.round((page / 604) * 100),
      last_position: { item_index: page },
      updated_at: new Date().toISOString(),
    });
  }
  for (const e of getContinueReadingEntries(limit)) {
    if (e.section === "mushaf" && page != null) continue;
    rows.push({
      id: `local-${e.section}`,
      user_id: "",
      content_type: e.section === "lessons" ? "lesson" : "quran",
      content_id: e.route,
      content_title: e.title,
      content_url: e.route,
      progress_pct: 0,
      last_position: {},
      updated_at: new Date(e.timestamp).toISOString(),
    });
  }
  return rows.slice(0, limit);
}

export function useRecentProgress(limit = 6) {
  const { user, isLoggedIn } = useAuth();
  const [items, setItems] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    const seed = localProgressSeed(limit);
    if (seed.length > 0) {
      setItems(seed);
      setLoading(false);
    } else {
      setLoading(true);
    }
    let cancelled = false;
    fetchRecentProgress(user.id, limit)
      .then((cloud) => {
        if (cancelled) return;
        setItems(cloud.length > 0 ? cloud : seed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user?.id, limit]);

  return { items, loading };
}
