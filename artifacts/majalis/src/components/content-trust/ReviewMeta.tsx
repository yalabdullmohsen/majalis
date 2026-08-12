/**
 * عرض تاريخ التحديث واسم المراجع — ملف جديد فقط.
 * لا يُدمج قبل اكتمال أعمال الواجهة.
 *
 * لا تُعرض اسم مراجع إن لم يُملأ بشرياً (لا قيم مولَّدة).
 */

export type ReviewMetaProps = {
  lastUpdatedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  editorialReviewStatus?: "unreviewed" | "reviewed" | "needs_rereview" | null;
  className?: string;
};

function formatIsoDate(iso: string): string {
  // عرض تقويمي محايد؛ تنسيق الواجهة النهائي عند الدمج
  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ReviewMeta({
  lastUpdatedAt,
  reviewedBy,
  reviewedAt,
  editorialReviewStatus,
  className,
}: ReviewMetaProps) {
  const parts: string[] = [];
  if (lastUpdatedAt) {
    parts.push(`آخر تحديث: ${formatIsoDate(lastUpdatedAt)}`);
  }
  if (reviewedBy && reviewedBy.trim()) {
    parts.push(`المراجع: ${reviewedBy.trim()}`);
    if (reviewedAt) parts.push(`تاريخ المراجعة: ${formatIsoDate(reviewedAt)}`);
  } else if (editorialReviewStatus === "unreviewed") {
    parts.push("لم يُراجع تحريرياً بعد");
  }

  if (parts.length === 0) return null;

  return (
    <p
      className={["ct-review-meta", className].filter(Boolean).join(" ")}
      data-editorial-review={editorialReviewStatus ?? ""}
    >
      {parts.join(" · ")}
    </p>
  );
}

export default ReviewMeta;
