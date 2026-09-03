import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  CompactSectionHeader,
  SectionIntroHeader,
  type CompactSectionStat,
} from "@/components/ui/CompactSectionHeader";

export { CompactSectionHeader, SectionIntroHeader };
export type { CompactSectionStat };

/** توافق خلفي مع الواجهة القديمة titleAr/subtitleAr. */
export function SectionHeader({
  titleAr,
  subtitleAr,
  title,
  description,
  icon,
  stats,
  eyebrow,
  actions,
  className,
  titleId,
}: {
  titleAr?: string;
  subtitleAr?: string;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  stats?: CompactSectionStat[];
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
  titleId?: string;
}) {
  return (
    <CompactSectionHeader
      title={title ?? titleAr ?? ""}
      description={description ?? subtitleAr}
      icon={icon}
      stats={stats}
      eyebrow={eyebrow}
      actions={actions}
      className={className}
      titleId={titleId}
    />
  );
}
