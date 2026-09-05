import { useEffect, useState, type ReactNode } from "react";
import { Empty, ErrorState, SkeletonCardGrid } from "@/components/ui-common";
import { useDeferredLoading } from "@/hooks/useDeferredLoading";
import { PAGE_LOAD_TIMEOUT_MS } from "@/lib/request-manager";
import { EMPTY, STATUS } from "@/lib/ui-copy";
import { shouldSuppressBootErrors } from "@/lib/app-shell-stability";

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
  emptyText = EMPTY.data,
  errorText = STATUS.loadError,
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
    // سجّل المهلة دائمًا؛ العرض يُكبح عبر shouldSuppressBootErrors عند الرسم
    // حتى لا يُفقد تنبيه الفشل الحقيقي بعد انتهاء نافذة الإقلاع
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

  const suppressBootError = shouldSuppressBootErrors();

  if (timedOut && loading && !suppressBootError) {
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    return (
      <ErrorState
        text={
          offline
            ? "أنت غير متصل بالإنترنت. اتصل بالشبكة ثم أعد المحاولة."
            : "التحميل يستغرق وقتًا أطول من المعتاد. أعد المحاولة أو انتظر قليلًا."
        }
        onRetry={onRetry}
      />
    );
  }

  // أثناء الإقلاع أو إعادة المحاولة: أبقِ الهيكل — لا شاشة خطأ كاذبة
  if (error && suppressBootError) {
    if (loading || !hasContent) {
      if (!showSkeleton && loading) return null;
      return <>{renderSkeleton()}</>;
    }
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
