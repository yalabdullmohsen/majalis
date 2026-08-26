import { Suspense, useEffect, useState } from "react";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { useAchievementCheck } from "@/hooks/useAchievementCheck";

const AchievementToast = lazyWithRetry(
  () => import("@/components/AchievementToast").then((m) => ({ default: m.AchievementToast })),
  "AchievementToast",
);

function DeferredAchievementToasts() {
  const { newBadges, dismissBadges } = useAchievementCheck();
  if (newBadges.length === 0) return null;
  return (
    <Suspense fallback={null}>
      <AchievementToast badges={newBadges} onDismiss={dismissBadges} />
    </Suspense>
  );
}

/**
 * يؤجّل فحص الإنجازات حتى الخمول — يُبقي useAchievementCheck خارج حزمة الإقلاع.
 */
export function DeferredAchievementBoot() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setReady(true);
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(reveal, { timeout: 4500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(reveal, 2200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);
  if (!ready) return null;
  return <DeferredAchievementToasts />;
}

export default DeferredAchievementBoot;
