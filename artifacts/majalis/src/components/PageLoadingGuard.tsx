import { useEffect, useState, type ReactNode } from "react";
import { Empty, QaSkeleton } from "@/components/ui-common";
import { PAGE_LOAD_TIMEOUT_MS } from "@/lib/request-manager";

type PageLoadingGuardProps = {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: ReactNode;
  skeleton?: "list" | "search";
};

/**
 * Ensures any page section exits loading within PAGE_LOAD_TIMEOUT_MS.
 * Shows skeleton (not spinner), then error or empty state — never infinite loading.
 */
export function PageLoadingGuard({
  loading,
  error,
  empty,
  emptyText = "لا توجد بيانات حالياً",
  onRetry,
  children,
  skeleton = "list",
}: PageLoadingGuardProps) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const id = window.setTimeout(() => setTimedOut(true), PAGE_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [loading]);

  if (timedOut && loading) {
    return <Empty text={emptyText} />;
  }

  if (error) {
    return <Empty text={emptyText} />;
  }

  if (loading) {
    return skeleton === "search" ? <QaSkeleton count={5} /> : <QaSkeleton count={4} />;
  }

  if (empty) {
    return <Empty text={emptyText} />;
  }

  return <>{children}</>;
}
