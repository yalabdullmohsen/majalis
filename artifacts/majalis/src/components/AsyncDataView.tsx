import type { ReactNode } from "react";
import type { AsyncStatus } from "@/hooks/use-async-data";
import { Empty, QaSkeleton, SearchSkeleton } from "@/components/ui-common";

type SkeletonVariant = "list" | "search" | "spinner";

type AsyncDataViewProps = {
  status: AsyncStatus;
  error: string | null;
  onRetry?: () => void;
  emptyText?: string;
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

export function AsyncDataView({
  status,
  error: _error,
  onRetry: _onRetry,
  emptyText = "لا توجد بيانات حالياً",
  skeleton = "list",
  children,
}: AsyncDataViewProps) {
  if (status === "loading") return <Skeleton variant={skeleton} />;
  if (status === "error") {
    return <Empty text={emptyText} />;
  }
  if (status === "empty") return <Empty text={emptyText} />;
  return <>{children}</>;
}
