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
  count?: string;
};

function go(href: string, setLocation: (h: string) => void) {
  const [path, hash] = href.split("#");
  if (path) setLocation(path);
  window.scrollTo(0, 0);
  if (hash) {
    window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }
}

/**
 * بطاقة متوسطة محايدة (شبكة عمودين) — صف واحد مضغوط.
 */
export function SectionCard({ section, className, onNavigate, count }: Props) {
  const [, setLocation] = useLocation();
  const Icon = section.icon;
  const aria = `${section.label} — ${section.subtitle}`;
  const press = useSectionCardPress({
    id: section.id,
    label: section.label,
    route: section.route,
    onPrefetch: () => prefetchRoute(section.route),
    onOpen: () => {
      go(section.route, setLocation);
      onNavigate?.();
    },
  });

  return (
    <button
      type="button"
      dir="rtl"
      data-section-card="1"
      data-section-id={section.id}
      aria-label={aria}
      className={cn("card", className)}
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
