import { Link } from "wouter";
import { AppCard } from "@/components/home/start/AppCard";
import { AppSectionHeader } from "@/components/home/start/AppSectionHeader";

const ROWS = [
  { href: "/adhkar/morning", title: "أذكار الصباح" },
  { href: "/adhkar/evening", title: "أذكار المساء" },
  { href: "/adhkar", title: "المزيد" },
] as const;

export function DhikrSummaryCard() {
  return (
    <AppCard className="mj-dhikr-summary" as="section" aria-label="الأذكار">
      <AppSectionHeader title="الأذكار" />
      <ul className="mj-dhikr-summary__list">
        {ROWS.map(({ href, title }) => (
          <li key={href}>
            <Link href={href} className="mj-dhikr-summary__row">
              <span className="mj-dhikr-summary__label">{title}</span>
              <span className="mj-dhikr-summary__chev" aria-hidden="true">
                ←
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AppCard>
  );
}
