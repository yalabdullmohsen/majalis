import { Link } from "wouter";
import { Flag } from "lucide-react";

/** رابط موحّد للإبلاغ عن خطأ في المحتوى الشرعي */
export function ContentReportLink({
  context,
  className = "mj-content-report",
}: {
  context?: string;
  className?: string;
}) {
  const q = context ? `?topic=${encodeURIComponent(context)}` : "?topic=report";
  return (
    <p className={className}>
      <Link href={`/contact${q}`} className="mj-content-report__link">
        <Flag size={14} strokeWidth={2} aria-hidden="true" />
        بلّغ عن خطأ في المحتوى
      </Link>
    </p>
  );
}
