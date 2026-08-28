import { Link } from "wouter";
import { IA_HOME_PRIMARY } from "@/lib/ia-final-structure";
import { AppCard } from "@/components/home/start/AppCard";
import { AppSectionHeader } from "@/components/home/start/AppSectionHeader";

/** أقسام بارزة — مشتقة من IA_HOME_PRIMARY مع استبدال «المزيد» بالمكتبة */
export const HOME_START_FEATURED = [
  ...IA_HOME_PRIMARY.filter((s) => s.href !== "/prayer-times" && s.href !== "/more"),
  { href: "/library", title: "المكتبة", desc: "كتب ومؤلفات علمية" },
] as const;

export function HomeFeaturedSections() {
  return (
    <AppCard className="mj-home-featured" as="section" aria-label="أقسام بارزة">
      <AppSectionHeader title="استكشف" />
      <div className="mj-home-featured__grid">
        {HOME_START_FEATURED.map((item) => (
          <Link key={item.href} href={item.href} className="mj-quick-action">
            <span className="mj-quick-action__label">
              {item.title.replace(" والدورات", "").replace(" والأحكام", "").replace(" اليومية", "")}
            </span>
          </Link>
        ))}
      </div>
    </AppCard>
  );
}
