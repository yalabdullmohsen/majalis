import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import {
  FEATURE_TOUR_REPLAY_EVENT,
  hasCompletedFeatureTour,
} from "@/lib/feature-tour-state";

const AppFeatureTour = lazy(() =>
  import("@/components/onboarding/AppFeatureTour").then((m) => ({ default: m.AppFeatureTour })),
);

const MIN_VISIBLE_MS = 900;
const MAX_VISIBLE_MS = 1500;

/**
 * يعرض جولة المزايا مرة واحدة بعد أول إقلاع، ويستجيب لطلب الإعادة من الإعدادات.
 * يُحمَّل كسولاً — خارج حزمة الإقلاع.
 */
export function AppFeatureTourGate() {
  const [open, setOpen] = useState(false);
  const [persistOnExit, setPersistOnExit] = useState(true);
  const armedRef = useRef(false);
  const paintAtRef = useRef<number | null>(null);

  const close = useCallback(() => setOpen(false), []);

  const tryAutoShow = useCallback(async () => {
    if (armedRef.current) return;
    const done = await hasCompletedFeatureTour();
    if (done) return;
    armedRef.current = true;
    setPersistOnExit(true);

    const startAt = paintAtRef.current ?? performance.now();
    const elapsed = performance.now() - startAt;
    const delay = Math.min(Math.max(MIN_VISIBLE_MS - elapsed, 0), MAX_VISIBLE_MS);
    window.setTimeout(() => setOpen(true), delay);
  }, []);

  useEffect(() => {
    const onPaint = () => {
      paintAtRef.current = performance.now();
    };
    window.addEventListener("mj:app-painted", onPaint, { once: true });

    const onStorageReady = () => {
      void tryAutoShow();
    };
    window.addEventListener("mj:feature-tour-storage-ready", onStorageReady);

    const onReplay = () => {
      setPersistOnExit(false);
      setOpen(true);
    };
    window.addEventListener(FEATURE_TOUR_REPLAY_EVENT, onReplay);

    // fallback: إن لم يُطلَق hydrate (ويب) أو تأخر
    const fallback = window.setTimeout(() => {
      void tryAutoShow();
    }, 3200);

    return () => {
      window.removeEventListener("mj:app-painted", onPaint);
      window.removeEventListener("mj:feature-tour-storage-ready", onStorageReady);
      window.removeEventListener(FEATURE_TOUR_REPLAY_EVENT, onReplay);
      window.clearTimeout(fallback);
    };
  }, [tryAutoShow]);

  if (!open) return null;

  return (
    <Suspense fallback={null}>
      <AppFeatureTour open={open} onClose={close} persistOnExit={persistOnExit} />
    </Suspense>
  );
}
