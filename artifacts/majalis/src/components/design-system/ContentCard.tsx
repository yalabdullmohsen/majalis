import type { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { AppCard } from "./AppCard";
import { BodyText, Caption, CardTitle } from "./text";

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
      {meta ? (
        <Caption as="p" className="ss-content-card__meta">
          {meta}
        </Caption>
      ) : null}
      <CardTitle className="ss-content-card__title">{title}</CardTitle>
      {excerpt ? (
        <BodyText className="ss-content-card__excerpt">{excerpt}</BodyText>
      ) : null}
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
