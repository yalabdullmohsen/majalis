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
      <div
        className="ds-skeleton"
        style={{ width: "100%", maxWidth: "28rem", height: "0.75rem", margin: "0 auto 0.5rem" }}
      />
      <div
        className="ds-skeleton"
        style={{ width: "100%", maxWidth: "20rem", height: "0.75rem", margin: "0 auto 0.5rem" }}
      />
      <div
        className="ds-skeleton"
        style={{ width: "100%", maxWidth: "24rem", height: "0.75rem", margin: "0 auto" }}
      />
    </div>
  );
}

export function AsyncDataView({
  status,
  error,
  onRetry,
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
