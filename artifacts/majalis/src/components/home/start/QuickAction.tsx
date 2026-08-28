import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";

type Props = {
  href: string;
  title: string;
  icon: LucideIcon;
  className?: string;
};

export function QuickAction({ href, title, icon: Icon, className }: Props) {
  return (
    <Link href={href} className={["mj-quick-action", className].filter(Boolean).join(" ")}>
      <span className="mj-quick-action__icon" aria-hidden="true">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="mj-quick-action__label">{title}</span>
    </Link>
  );
}
