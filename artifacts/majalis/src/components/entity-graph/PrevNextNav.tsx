import { Link } from "wouter";
import type { LinkedItem } from "@/lib/entity-graph";
import { prefetchHref } from "@/lib/entity-graph";

export function PrevNextNav({
  prev,
  next,
}: {
  prev: LinkedItem | null;
  next: LinkedItem | null;
}) {
  if (!prev && !next) return null;
  return (
    <nav className="ek-prevnext" aria-label="التنقل بين العناصر">
      {prev ? (
        <Link
          href={prev.href}
          className="ek-prevnext__link ek-prevnext__link--prev"
          onMouseEnter={() => prefetchHref(prev.href)}
        >
          <span className="ek-prevnext__label">السابق</span>
          <span className="ek-prevnext__title">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="ek-prevnext__link ek-prevnext__link--next"
          onMouseEnter={() => prefetchHref(next.href)}
        >
          <span className="ek-prevnext__label">التالي</span>
          <span className="ek-prevnext__title">{next.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}
