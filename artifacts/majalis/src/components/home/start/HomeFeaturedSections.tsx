import { BookMarked, BookOpen, GraduationCap, RotateCw, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IA_HOME_PRIMARY } from "@/lib/ia-final-structure";
import { AppCard } from "@/components/home/start/AppCard";
import { AppSectionHeader } from "@/components/home/start/AppSectionHeader";
import { QuickAction } from "@/components/home/start/QuickAction";

const ICONS: Record<string, LucideIcon> = {
  "/quran-hub": BookOpen,
  "/lessons": GraduationCap,
  "/fiqh": Scale,
  "/adhkar": RotateCw,
  "/library": BookMarked,
};

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
          <QuickAction
            key={item.href}
            href={item.href}
            title={item.title.replace(" والدورات", "").replace(" والأحكام", "").replace(" اليومية", "")}
            icon={ICONS[item.href] ?? BookOpen}
          />
        ))}
      </div>
    </AppCard>
  );
}
