import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import "@/styles/knowledge-experience.css";

export type UnifiedFilterOption = {
  id: string;
  label: string;
  active?: boolean;
  onSelect: () => void;
};

type UnifiedFilterBarProps = {
  /** الفلاتر الأساسية الظاهرة دائمًا (2–4) */
  primary: UnifiedFilterOption[];
  /** عدد الفلاتر الإضافية النشطة داخل الورقة */
  moreActiveCount?: number;
  onOpenMore?: () => void;
  moreLabel?: string;
  trailing?: ReactNode;
  className?: string;
};

/**
 * فلاتر موحّدة: أساسيات ظاهرة + زر «المزيد» يفتح FilterBottomSheet.
 */
export function UnifiedPrimaryFilters({
  primary,
  moreActiveCount = 0,
  onOpenMore,
  moreLabel = "المزيد",
  trailing,
  className,
}: UnifiedFilterBarProps) {
  return (
    <div className={cn("kx-filter-row", className)} role="toolbar" aria-label="تصفية">
      {primary.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={cn("mj-filter-chip", opt.active && "is-active")}
          aria-pressed={Boolean(opt.active)}
          onClick={opt.onSelect}
        >
          {opt.label}
        </button>
      ))}
      {onOpenMore ? (
        <button type="button" className="kx-filter-row__more" onClick={onOpenMore}>
          {moreLabel}
          {moreActiveCount > 0 ? ` (${moreActiveCount})` : ""}
        </button>
      ) : null}
      {trailing}
    </div>
  );
}
