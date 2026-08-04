import type { ReactNode } from "react";
import type { AsyncStatus } from "@/hooks/use-async-data";
import { IgdsEmptyState, IgdsErrorState, IgdsSkeleton } from "@/components/igds";
import { QaSkeleton, SearchSkeleton } from "@/components/ui-common";
import "@/styles/igds/components.css";

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
  return <IgdsSkeleton lines={3} />;
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
    return <IgdsErrorState description={errorText} onRetry={onRetry} />;
  }
  if (status === "empty") return <IgdsEmptyState description={emptyText} />;
  return <>{children}</>;
}
