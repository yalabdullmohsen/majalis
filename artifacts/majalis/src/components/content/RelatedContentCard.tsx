import { Link } from "wouter";
import "@/styles/components/reading-section-card.css";

export type RelatedContentCardProps = {
  href: string;
  title: string;
  category?: string;
  summary?: string;
  className?: string;
};

/**
 * بطاقة «ذات صلة / اقرأ أيضًا» — تصنيف + عنوان + وصف + سهم دخول.
 */
export function RelatedContentCard({
  href,
  title,
  category,
  summary,
  className = "",
}: RelatedContentCardProps) {
  return (
    <Link href={href} className={`rcc${className ? ` ${className}` : ""}`}>
      {category ? <span className="rcc__cat">{category}</span> : null}
      <span className="rcc__title">{title}</span>
      {summary ? <span className="rcc__summary">{summary}</span> : null}
      <span className="rcc__arrow" aria-hidden="true">
        ←
      </span>
    </Link>
  );
}

type RelatedContentStackProps = {
  items: RelatedContentCardProps[];
  paddedForNav?: boolean;
  className?: string;
};

export function RelatedContentStack({
  items,
  paddedForNav = false,
  className = "",
}: RelatedContentStackProps) {
  if (!items.length) return null;
  return (
    <ul
      className={`rsc-stack${paddedForNav ? " rsc-stack--padded" : ""}${className ? ` ${className}` : ""}`}
    >
      {items.map((item) => (
        <li key={item.href}>
          <RelatedContentCard {...item} />
        </li>
      ))}
    </ul>
  );
}
