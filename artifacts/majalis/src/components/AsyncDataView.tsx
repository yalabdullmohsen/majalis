import type { ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import type { AsyncStatus } from "@/hooks/use-async-data";
import { Empty, QaSkeleton, SearchSkeleton } from "@/components/ui-common";

type SkeletonVariant = "list" | "search" | "spinner";

type AsyncDataViewProps = {
  status: AsyncStatus;
  error: string | null;
  onRetry?: () => void;
  emptyText?: string;
  errorText?: string;
  skeleton?: SkeletonVariant;
  children: ReactNode;
};

function Skeleton({ variant }: { variant: SkeletonVariant }) {
  if (variant === "search") return <SearchSkeleton />;
  if (variant === "list") return <QaSkeleton count={5} />;
  return (
    <div className="ds-empty" role="status" aria-live="polite" aria-busy="true">
      <div className="ds-skeleton adv-skel-line1" />
      <div className="ds-skeleton adv-skel-line2" />
      <div className="ds-skeleton adv-skel-line3" />
    </div>
  );
}

function ErrorState({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="adv-error-state" role="alert" aria-live="assertive" dir="rtl">
      <AlertTriangle size={28} strokeWidth={1.5} className="adv-error-state__icon" aria-hidden="true" />
      <p className="adv-error-state__msg">{text}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="adv-error-state__retry"
          aria-label="إعادة المحاولة"
        >
          <RefreshCw size={14} aria-hidden="true" />
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export function AsyncDataView({
  status,
  error: _error,
  onRetry,
  emptyText = "لا توجد بيانات حالياً",
  errorText = "حدث خطأ أثناء التحميل، يرجى المحاولة مجدداً.",
  skeleton = "list",
  children,
}: AsyncDataViewProps) {
  if (status === "loading") return <Skeleton variant={skeleton} />;
  if (status === "error") {
    return <ErrorState text={errorText} onRetry={onRetry} />;
  }
  if (status === "empty") return <Empty text={emptyText} />;
  return <>{children}</>;
}
