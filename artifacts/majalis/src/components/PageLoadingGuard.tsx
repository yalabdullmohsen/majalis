import { useEffect, useState, type ReactNode } from "react";
import { Empty, ErrorState, SkeletonCardGrid } from "@/components/ui-common";
import { useDeferredLoading } from "@/hooks/useDeferredLoading";
import { PAGE_LOAD_TIMEOUT_MS } from "@/lib/request-manager";

type PageLoadingGuardProps = {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  errorText?: string;
  onRetry?: () => void;
  children: ReactNode;
  skeleton?: "cards" | "list" | "search" | ReactNode;
  skeletonCount?: number;
  /** أبقِ المحتوى السابق ظاهرًا أثناء إعادة الجلب */
  keepPrevious?: boolean;
};

/**
 * هيكل تحميل مؤجّل + مهلة + خطأ صريح — بلا نص تحميل ظاهر.
 */
export function PageLoadingGuard({
  loading,
  error,
  empty,
  emptyText = "لا توجد بيانات حالياً",
  errorText = "تعذّر تحميل البيانات. حاول مجددًا.",
  onRetry,
  children,
  skeleton = "cards",
  skeletonCount = 6,
  keepPrevious = true,
}: PageLoadingGuardProps) {
  const [timedOut, setTimedOut] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const showSkeleton = useDeferredLoading(loading && !(keepPrevious && hasContent));

  useEffect(() => {
    if (!loading && !error && !empty) setHasContent(true);
  }, [loading, error, empty]);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const id = window.setTimeout(() => setTimedOut(true), PAGE_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [loading]);

  const renderSkeleton = () => {
    if (typeof skeleton !== "string") return skeleton;
    if (skeleton === "search" || skeleton === "list") {
      return <SkeletonCardGrid count={skeleton === "search" ? 5 : 4} />;
    }
    return <SkeletonCardGrid count={skeletonCount} />;
  };

  if (timedOut && loading) {
    return (
      <ErrorState
        text="انتهت مهلة التحميل. تحقق من الاتصال وحاول مجددًا."
        onRetry={onRetry}
      />
    );
  }

  if (error && !(loading && keepPrevious && hasContent)) {
    return (
      <ErrorState
        text={typeof error === "string" && error.trim() ? error : errorText}
        onRetry={onRetry}
      />
    );
  }

  if (loading && keepPrevious && hasContent) {
    return <>{children}</>;
  }

  if (loading) {
    if (!showSkeleton) return null;
    return <>{renderSkeleton()}</>;
  }

  if (empty) {
    return <Empty text={emptyText} />;
  }

  return <>{children}</>;
}
