import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";

type Props = {
  href: string;
  title: string;
  description: string;
  countLabel?: string;
  Icon: LucideIcon;
  cta?: string;
  className?: string;
};

/** بطاقة دخول قسم حديثي: عنوان + وصف + عدد + أيقونة + CTA */
export function HadithEntryCard({
  href,
  title,
  description,
  countLabel,
  Icon,
  cta = "افتح",
  className = "",
}: Props) {
  return (
    <Link href={href} className={`hdl-entry-card ${className}`.trim()}>
      <span className="hdl-entry-card__icon" aria-hidden="true">
        <Icon size={20} strokeWidth={2} />
      </span>
      <span>
        <h3 className="hdl-entry-card__title">{title}</h3>
        <p className="hdl-entry-card__desc">{description}</p>
        {countLabel ? <p className="hdl-entry-card__count">{countLabel}</p> : null}
      </span>
      <span className="hdl-entry-card__cta">{cta}</span>
    </Link>
  );
}
