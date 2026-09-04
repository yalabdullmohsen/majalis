import type { ReactNode } from "react";
import type { AsyncStatus } from "@/hooks/use-async-data";
import { Empty, ErrorState, QaSkeleton, SearchSkeleton } from "@/components/ui-common";
import "@/styles/components/async-data-error.css";

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

export function AsyncDataView({
  status,
  error,
  onRetry,
  emptyText = "لا توجد نتائج الآن. جرّب تعديل البحث أو الفلتر، أو عد لاحقًا.",
  errorText = "تعذّر تحميل البيانات مؤقتًا. أعد المحاولة.",
  skeleton = "list",
  children,
}: AsyncDataViewProps) {
  if (status === "loading") return <Skeleton variant={skeleton} />;
  if (status === "error") {
    const text = typeof error === "string" && error.trim() ? error : errorText;
    return <ErrorState text={text} onRetry={onRetry} />;
  }
  if (status === "empty") return <Empty text={emptyText} />;
  return <>{children}</>;
}
