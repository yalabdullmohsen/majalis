import { ChevronLeft, Moon, MoreHorizontal, Sun } from "lucide-react";
import { Link } from "wouter";
import { AppCard } from "@/components/home/start/AppCard";
import { AppSectionHeader } from "@/components/home/start/AppSectionHeader";

const ROWS = [
  { href: "/adhkar/morning", title: "أذكار الصباح", icon: Sun },
  { href: "/adhkar/evening", title: "أذكار المساء", icon: Moon },
  { href: "/adhkar", title: "المزيد", icon: MoreHorizontal },
] as const;

export function DhikrSummaryCard() {
  return (
    <AppCard className="mj-dhikr-summary" as="section" aria-label="الأذكار">
      <AppSectionHeader title="الأذكار" />
      <ul className="mj-dhikr-summary__list">
        {ROWS.map(({ href, title, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="mj-dhikr-summary__row">
              <span className="mj-dhikr-summary__icon" aria-hidden="true">
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span className="mj-dhikr-summary__label">{title}</span>
              <ChevronLeft size={16} className="mj-dhikr-summary__chev" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </AppCard>
  );
}
