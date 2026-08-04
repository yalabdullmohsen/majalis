import type { ReactNode } from "react";
import { Link } from "wouter";

type Props = {
  title?: string;
  description?: string;
  children?: ReactNode;
  href?: string;
  className?: string;
};

export function IgdsCard({ title, description, children, href, className }: Props) {
  const body = (
    <>
      {title ? <h3 className="igds-card__title">{title}</h3> : null}
      {description ? <p className="igds-card__desc">{description}</p> : null}
      {children}
    </>
  );
  const cn = ["igds-card", className].filter(Boolean).join(" ");
  if (href) {
    return (
      <Link href={href} className={cn}>
        {body}
      </Link>
    );
  }
  return <div className={cn}>{body}</div>;
}
