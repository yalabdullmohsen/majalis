/**
 * شبكة الوصول السريع للأقسام الأساسية على الرئيسية.
 */
import {
  BookMarked,
  BookOpen,
  Clock,
  GraduationCap,
  LayoutGrid,
  Scale,
} from "lucide-react";
import { FeatureCard } from "@/components/design-system";
import { IA_HOME_PRIMARY } from "@/lib/ia-final-structure";

const HOME_PRIMARY_ICONS = {
  "/quran-hub": BookMarked,
  "/lessons": GraduationCap,
  "/prayer-times": Clock,
  "/fiqh": Scale,
  "/adhkar": BookOpen,
  "/sections": LayoutGrid,
  "/more": LayoutGrid,
} as const;

const FEATURED_CATS = IA_HOME_PRIMARY.map((item) => ({
  ...item,
  Icon: HOME_PRIMARY_ICONS[item.href as keyof typeof HOME_PRIMARY_ICONS] ?? BookOpen,
}));

export function HomePrimaryPortals({
  title = "وصول سريع",
}: {
  title?: string;
}) {
  return (
    <section className="m2030-band home-primary-portals home-quick-access" aria-label={title}>
      <div className="m2030-band__head">
        <h2 className="m2030-band__title">{title}</h2>
      </div>
      <div className="ss-feature-grid home-quick-access__grid" data-cards-grid="1">
        {FEATURED_CATS.map(({ href, title: cardTitle, desc, Icon }) => (
          <FeatureCard
            key={href}
            href={href}
            title={cardTitle}
            description={desc}
            icon={<Icon size={20} strokeWidth={1.8} aria-hidden="true" />}
          />
        ))}
      </div>
    </section>
  );
}
