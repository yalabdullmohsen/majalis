import { useLocation } from "wouter";
import type { SectionDef } from "@/config/sections.registry";
import { prefetchRoute } from "@/lib/prefetch-route";
import { cn } from "@/lib/utils";
import {
  readSectionProgress,
  SectionCardFrame,
  useSectionCardPress,
} from "@/components/sections/SectionCardShared";

type Props = {
  section: SectionDef;
  className?: string;
  onNavigate?: () => void;
  /** تجاوز المسار (مثل المصحف بآخر موضع) */
  resolveRoute?: (section: SectionDef) => string;
  count?: string;
};

/**
 * مربع مميّز — الخلفية الخضراء ولون الحبر في صنف variant واحد فقط (.card--featured).
 * ممنوع تعيين لون الحبر أبيضًا عبر منفعة Tailwind منفصلة عن الخلفية.
 */
export function FeaturedSectionCard({ section, className, onNavigate, resolveRoute, count }: Props) {
  const [, setLocation] = useLocation();
  const Icon = section.icon;
  const aria = `${section.label} — ${section.subtitle}`;
  const href = () => resolveRoute?.(section) ?? section.route;
  const press = useSectionCardPress({
    id: section.id,
    label: section.label,
    route: href(),
    onPrefetch: () => prefetchRoute(href()),
    onOpen: () => {
      const next = href();
      const [path, hash] = next.split("#");
      if (path) setLocation(path);
      window.scrollTo(0, 0);
      if (hash) {
        window.setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 40);
      }
      onNavigate?.();
    },
  });

  return (
    <button
      type="button"
      dir="rtl"
      data-section-card="featured"
      data-section-id={section.id}
      aria-label={aria}
      className={cn("card--featured", className)}
      onPointerDown={press.onPointerDown}
      onPointerUp={press.onPointerUp}
      onPointerCancel={press.onPointerCancel}
      onClick={press.onClick}
    >
      <SectionCardFrame
        icon={<Icon strokeWidth={1.75} aria-hidden />}
        label={section.label}
        subtitle={section.subtitle}
        count={count}
        progress={readSectionProgress(section.id)}
        menuOpen={press.menuOpen}
        onCloseMenu={press.closeMenu}
        actions={press.actions}
      />
    </button>
  );
}
