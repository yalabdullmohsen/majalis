import { Link } from "wouter";
import type { FiqhLessonHit } from "@/lib/fiqh-books";
import { FiqhIssueCard } from "@/components/fiqh/FiqhIssueCard";

type Props = {
  issues: FiqhLessonHit[];
  title?: string;
  className?: string;
};

export function FiqhRelatedIssues({
  issues,
  title = "مسائل مرتبطة",
  className,
}: Props) {
  if (!issues.length) return null;

  return (
    <section className={className} aria-labelledby="fiqh-related-title">
      <h2 id="fiqh-related-title" className="fiqh-related__title">
        {title}
      </h2>
      <div className="fiqh-related__grid">
        {issues.map((hit) => (
          <FiqhIssueCard key={hit.lesson.id} hit={hit} />
        ))}
      </div>
      <p className="fiqh-related__more">
        <Link href="/fiqh">عرض كل أبواب الفقه</Link>
      </p>
    </section>
  );
}
