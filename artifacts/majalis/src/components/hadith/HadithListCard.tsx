import { memo, type ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import "@/styles/components/hadith-list-card.css";

export type HadithListCardProps = {
  /** رقم الحديث الظاهر */
  number: number | string;
  title: string;
  /** مقتطف المتن — يُعرض في سطرين–ثلاثة */
  preview: string;
  href?: string;
  meta?: ReactNode;
  read?: boolean;
  active?: boolean;
  className?: string;
  onClick?: () => void;
  "data-testid"?: string;
};

/**
 * بطاقة قائمة حديث مشتركة — عرض آمن داخل الحاوية، متن متعدد الأسطر، بلا nowrap.
 * تُستخدم في الأربعين النووية ومجموعات الحديث الأخرى.
 */
export const HadithListCard = memo(function HadithListCard({
  number,
  title,
  preview,
  href,
  meta,
  read = false,
  active = false,
  className,
  onClick,
  "data-testid": testId = "hadith-list-card",
}: HadithListCardProps) {
  const body = (
    <>
      <span className="hlc__num" aria-hidden="true">
        {number}
      </span>
      <span className="hlc__body">
        <span className="hlc__title">{title}</span>
        <span className="hlc__preview">{preview}</span>
        {meta ? <span className="hlc__meta">{meta}</span> : null}
      </span>
    </>
  );

  const cls = cn(
    "hlc",
    read && "hlc--read",
    active && "hlc--active",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        data-testid={testId}
        onClick={onClick}
        aria-label={`${title} — حديث ${number}`}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      data-testid={testId}
      onClick={onClick}
      aria-label={`${title} — حديث ${number}`}
    >
      {body}
    </button>
  );
});
