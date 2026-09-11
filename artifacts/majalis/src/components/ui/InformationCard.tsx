import type { ReactNode } from "react";
import { AlertTriangle, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import "@/styles/components/information-card.css";

export type InformationCardTone = "info" | "caution" | "neutral";

type Props = {
  title: string;
  children: ReactNode;
  tone?: InformationCardTone;
  icon?: LucideIcon;
  className?: string;
};

/**
 * بطاقة معلومات موحّدة — عنوان + أيقونة + نص مقروء بكثافة أعلى.
 * بديل لصناديق التنبيه القديمة (.mk-hero__note / intro-box).
 */
export function InformationCard({
  title,
  children,
  tone = "info",
  icon: IconProp,
  className,
}: Props) {
  const Icon = IconProp ?? (tone === "caution" ? AlertTriangle : Info);
  return (
    <aside
      className={cn("info-card soft-card soft-card--on-light", `info-card--${tone}`, className)}
      role="note"
      data-information-card="1"
    >
      <div className="info-card__head">
        <span className="info-card__icon" aria-hidden="true">
          <Icon size={18} strokeWidth={2} />
        </span>
        <h2 className="info-card__title">{title}</h2>
      </div>
      <div className="info-card__body">{children}</div>
    </aside>
  );
}
