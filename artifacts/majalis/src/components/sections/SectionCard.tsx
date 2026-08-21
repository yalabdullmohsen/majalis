import { useLocation } from "wouter";
import type { SectionDef } from "@/config/sections.registry";
import { prefetchRoute } from "@/lib/prefetch-route";
import { cn } from "@/lib/utils";

type Props = {
  section: SectionDef;
  className?: string;
  onNavigate?: () => void;
};

function go(href: string, setLocation: (h: string) => void) {
  const [path, hash] = href.split("#");
  if (path) setLocation(path);
  window.scrollTo(0, 0);
  if (hash) {
    window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "auto", block: "nearest" });
    }, 40);
  }
}

/**
 * بطاقة متوسطة محايدة (شبكة عمودين) — بلا تدرّج أخضر.
 */
export function SectionCard({ section, className, onNavigate }: Props) {
  const [, setLocation] = useLocation();
  const Icon = section.icon;
  const aria = `${section.label} — ${section.subtitle}`;

  return (
    <button
      type="button"
      dir="rtl"
      data-section-card="1"
      data-section-id={section.id}
      aria-label={aria}
      className={cn("card", className)}
      onPointerDown={() => prefetchRoute(section.route)}
      onClick={() => {
        go(section.route, setLocation);
        onNavigate?.();
      }}
    >
      <span className="card__icon" aria-hidden>
        <Icon strokeWidth={1.75} aria-hidden />
      </span>
      <span className="card__label">{section.label}</span>
      <span className="card__subtitle">{section.subtitle}</span>
    </button>
  );
}
