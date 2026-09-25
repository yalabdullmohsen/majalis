import { Link } from "wouter";
import { toArabicDigits } from "@/lib/utils";
import type { DarsSection } from "@/lib/dars-types";

type Props = {
  section: DarsSection;
  index: number;
  href: string;
};

export function CategoryCard({ section, index, href }: Props) {
  return (
    <Link href={href} className="kc-category-card" data-testid="kc-category-card">
      <p className="kc-category-card__kicker">الباب {toArabicDigits(index + 1)}</p>
      <h2 className="kc-category-card__title">{section.title}</h2>
      <p className="kc-category-card__meta">
        {toArabicDigits(section.lessons.length)} موضوعًا
      </p>
      <span className="kc-category-card__cta">فتح الباب</span>
    </Link>
  );
}
