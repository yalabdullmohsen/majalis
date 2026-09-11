import type { ReactNode } from "react";
import type { AsyncStatus } from "@/hooks/use-async-data";
import { Empty, ErrorState, QaSkeleton, SearchSkeleton } from "@/components/ui-common";
import { EMPTY, STATUS } from "@/lib/ui-copy";
import "@/styles/components/async-data-error.css";

type SkeletonVariant = "list" | "search" | "spinner";

type AsyncDataViewProps = {
  status: AsyncStatus;
  error: string | null;
  onRetry?: () => void;
  emptyText?: string;
  errorText?: string;
  skeleton?: SkeletonVariant;
  /**
   * أبقِ المحتوى الظاهر أثناء التحميل (بذرة/نتائج سابقة) بدل هيكل كامل.
   * يُفعَّل عادةً عندما status !== "loading" لأن الصفحة حسبت status بنفسها،
   * أو مع contentBusy لتحديث خلفي صامت.
   */
  keepContentWhileLoading?: boolean;
  contentBusy?: boolean;
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

export function AsyncDataView({
  status,
  error,
  onRetry,
  emptyText = EMPTY.search,
  errorText = STATUS.loadError,
  skeleton = "list",
  keepContentWhileLoading = false,
  contentBusy = false,
  children,
}: AsyncDataViewProps) {
  if ((status === "loading" || status === "retrying") && !keepContentWhileLoading) {
    return <Skeleton variant={skeleton} />;
  }
  if (status === "offline" && !keepContentWhileLoading) {
    return <ErrorState text={STATUS.networkError} onRetry={onRetry} />;
  }
  if (status === "error" && !keepContentWhileLoading) {
    const text = typeof error === "string" && error.trim() ? error : errorText;
    return <ErrorState text={text} onRetry={onRetry} />;
  }
  if (status === "empty") {
    return <Empty text={emptyText} title={EMPTY.generic} />;
  }
  return (
    <div
      className="async-data-view__content"
      aria-busy={contentBusy || status === "loading" || status === "retrying" || undefined}
    >
      {children}
    </div>
  );
}
