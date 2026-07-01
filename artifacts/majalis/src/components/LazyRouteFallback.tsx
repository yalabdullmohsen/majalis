import { useEffect, useState } from "react";
import { QaSkeleton } from "@/components/ui-common";
import { PAGE_LOAD_TIMEOUT_MS } from "@/lib/request-manager";

/** Suspense fallback — shows skeleton while loading, silently retries on timeout. */
export function LazyRouteFallback() {
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setRetries((n) => n + 1), PAGE_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [retries]);

  return <QaSkeleton count={4} />;
}
