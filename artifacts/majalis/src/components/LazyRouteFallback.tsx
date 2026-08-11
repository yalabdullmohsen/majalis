import { useDeferredLoading } from "@/hooks/useDeferredLoading";
import { SkeletonCardGrid } from "@/components/ui-common";

/**
 * هيكل مسار كسول — يظهر بعد 200ms بلا نص تحميل ظاهر.
 */
export function LazyRouteFallback() {
  const show = useDeferredLoading(true);

  if (!show) return null;

  return (
    <div className="lrf-wrap lrf-wrap--skel" role="status" aria-busy="true" aria-label="تجهيز الصفحة">
      <SkeletonCardGrid count={6} />
    </div>
  );
}
