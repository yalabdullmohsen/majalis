import type { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { AppCard } from "./AppCard";

export type ContentCardProps = {
  href?: string;
  title: string;
  meta?: string;
  excerpt?: string;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
};

/** بطاقة محتوى (درس/مقال/نتيجة بحث) — عنوان + مقتطف + مصدر. */
export function ContentCard({ href, title, meta, excerpt, footer, className, children }: ContentCardProps) {
  const body = (
    <AppCard
      as="article"
      className={cn("ss-content-card", href && "ss-content-card--link", className)}
      data-content-card="1"
    >
      {meta ? <p className="ss-content-card__meta">{meta}</p> : null}
      <h3 className="ss-content-card__title">{title}</h3>
      {excerpt ? <p className="ss-content-card__excerpt">{excerpt}</p> : null}
      {children}
      {footer ? <div className="ss-content-card__footer">{footer}</div> : null}
    </AppCard>
  );

  if (!href) return body;
  return (
    <Link href={href} className="ss-content-card__anchor mj-pressable" aria-label={title}>
      {body}
    </Link>
  );
}
