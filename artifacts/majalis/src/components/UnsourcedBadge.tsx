import { SHOW_UNSOURCED_BADGE } from "@/lib/content-flags";

type Props = {
  status?: string | null;
  className?: string;
};

/** وسم ظاهر للسجلات بلا تخريج مسمّى — لا يخفي المحتوى */
export function UnsourcedBadge({ status, className }: Props) {
  if (!SHOW_UNSOURCED_BADGE) return null;
  if (status !== "unsourced") return null;
  return (
    <span
      className={className ? `unsourced-badge ${className}` : "unsourced-badge"}
      title="لا يوجد تخريج أو مرجع مسمّى لهذا السجل"
    >
      بلا تخريج
    </span>
  );
}
