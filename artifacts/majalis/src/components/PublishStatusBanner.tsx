import type { PublishStatus } from "@/lib/publish-policy";
import { PUBLISH_STATUS_LABELS } from "@/lib/publish-policy";

const TONE: Record<Exclude<PublishStatus, "published" | "blocked">, string> = {
  partial: "info",
  pending_review: "caution",
  incomplete: "info",
};

/**
 * شريط حالة النشر — يظهر عند partial / pending_review / incomplete.
 * لا يُستخدم لـ published أو blocked.
 */
export function PublishStatusBanner({
  status,
  className = "",
}: {
  status: PublishStatus;
  className?: string;
}) {
  if (status === "published" || status === "blocked") return null;
  const tone = TONE[status];
  return (
    <aside
      className={`publish-status-banner publish-status-banner--${tone} ${className}`.trim()}
      role="note"
      dir="rtl"
      data-publish-status={status}
    >
      <strong>{status === "pending_review" ? "قيد المراجعة الشرعية" : "قيد الإكمال"}</strong>
      <span>{PUBLISH_STATUS_LABELS[status]}</span>
    </aside>
  );
}
