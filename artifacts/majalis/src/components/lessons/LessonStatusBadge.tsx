import type { ReactNode } from "react";

type Variant = "live" | "soon" | "ongoing" | "pending" | "archived" | "women" | "neutral";

const VARIANT_CLASS: Record<Variant, string> = {
  live: "lesson-status-badge--live",
  soon: "lesson-status-badge--soon",
  ongoing: "lesson-status-badge--ongoing",
  pending: "lesson-status-badge--pending",
  archived: "lesson-status-badge--archived",
  women: "lesson-status-badge--women",
  neutral: "lesson-status-badge--neutral",
};

type Props = {
  label: string;
  variant?: Variant;
  className?: string;
};

export function LessonStatusBadge({ label, variant = "neutral", className = "" }: Props) {
  const text = String(label || "").trim();
  if (!text) return null;
  return (
    <span className={`lesson-status-badge ${VARIANT_CLASS[variant]} ${className}`.trim()} role="status">
      {text}
    </span>
  );
}

export function resolveStatusVariant(label: string): Variant {
  if (label === "جارٍ الآن" || label === "الآن" || label === "مستمر") return "live";
  if (label === "منتهٍ" || label === "انتهى") return "archived";
  if (label === "الوقت قيد التأكيد") return "pending";
  if (label.startsWith("بعد")) return "soon";
  return "neutral";
}

export function WomenAttendanceBadge({ note }: { note?: string }) {
  if (!note?.trim()) return null;
  return <LessonStatusBadge label="مكان للنساء" variant="women" />;
}

export function LessonBadgeRow({ children }: { children: ReactNode }) {
  return <div className="lesson-status-badge-row">{children}</div>;
}
