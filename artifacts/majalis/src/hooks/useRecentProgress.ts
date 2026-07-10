import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { fetchRecentProgress, type ProgressRow } from "@/lib/user-progress-service";

export function useRecentProgress(limit = 6) {
  const { user, isLoggedIn } = useAuth();
  const [items, setItems] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) { setItems([]); return; }
    setLoading(true);
    fetchRecentProgress(user.id, limit)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [isLoggedIn, user?.id, limit]);

  return { items, loading };
}
