import { useEffect, useState } from "react";
import { ErrorState, QaSkeleton } from "@/components/ui-common";
import { PAGE_LOAD_TIMEOUT_MS } from "@/lib/request-manager";

/** Suspense fallback that never hangs — skeleton then error with retry. */
export function LazyRouteFallback() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setTimedOut(true), PAGE_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (timedOut) {
    return (
      <ErrorState
        text="تعذر تحميل هذه الصفحة في الوقت المحدد. حاول مجدداً أو حدّث المتصفح."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return <QaSkeleton count={4} />;
}
