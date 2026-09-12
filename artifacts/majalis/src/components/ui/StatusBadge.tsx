import type { ReactNode } from "react";
import {
  publicLabelText,
  publicLabelTone,
  type BadgeTone,
  toPublicLabel,
} from "@/lib/label-display";

export type StatusBadgeProps = {
  /** نص ظاهر مباشرة، أو مفتاح تقني يُترجم عبر label-display */
  label: string;
  /** إن true يفترض أن label مفتاح تقني (blocked:… / ci …) */
  technical?: boolean;
  tone?: BadgeTone;
  soft?: boolean;
  large?: boolean;
  className?: string;
  /** للمستهلكين الداخليين: يظهر الاسم التقني في title فقط */
  showTechnicalTitle?: boolean;
  children?: ReactNode;
};

const TONE_CLASS: Record<BadgeTone, string> = {
  critical: "mj-badge--critical",
  warning: "mj-badge--warning",
  info: "mj-badge--info",
  ui: "mj-badge--ui",
  neutral: "mj-badge--neutral",
  accent: "mj-badge--accent",
};

const TONE_SOFT_CLASS: Record<BadgeTone, string> = {
  critical: "mj-badge--critical-soft",
  warning: "mj-badge--warning-soft",
  info: "mj-badge--info-soft",
  ui: "mj-badge--ui-soft",
  neutral: "mj-badge--neutral",
  accent: "mj-badge--accent",
};

/**
 * شارة حالة موحّدة — لا تعرض مفاتيح تقنية للمستخدم النهائي.
 */
export function StatusBadge({
  label,
  technical = false,
  tone,
  soft = false,
  large = false,
  className = "",
  showTechnicalTitle = true,
  children,
}: StatusBadgeProps) {
  const resolved = technical ? toPublicLabel(label) : null;
  const text = technical ? resolved!.publicLabel : String(label || "").trim();
  if (!text && !children) return null;

  const resolvedTone = tone ?? (technical ? resolved!.tone : publicLabelTone(label));
  const toneClass = soft ? TONE_SOFT_CLASS[resolvedTone] : TONE_CLASS[resolvedTone];
  const sizeClass = large || resolvedTone === "critical" ? "mj-badge--lg" : "";
  const title =
    showTechnicalTitle && technical && resolved
      ? resolved.technicalLabel
      : undefined;

  return (
    <span
      className={`mj-badge ${toneClass} ${sizeClass} ${className}`.trim()}
      role="status"
      title={title}
      data-technical-label={technical ? label : undefined}
    >
      {children ?? text}
    </span>
  );
}

/** صف شارات */
export function StatusBadgeRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mj-badge-row ${className}`.trim()}>{children}</div>;
}

/** Chip فلتر موحّد */
export function FilterChip({
  label,
  active = false,
  onClick,
  className = "",
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`mj-filter filter-chips__chip ${active ? "is-active" : ""} ${className}`.trim()}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="filter-chips__label">{label}</span>
    </button>
  );
}

export { publicLabelText, publicLabelTone, toPublicLabel };
