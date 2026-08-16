import { Link } from "wouter";
import type { SectionDef } from "@/config/sections.registry";
import { cn } from "@/lib/utils";

type Props = {
  section: SectionDef;
  className?: string;
  onNavigate?: () => void;
};

/**
 * مربع كبير مميّز — الخلفية الخضراء المتدرّجة حصرية لهذا المكوّن.
 */
export function FeaturedSectionCard({ section, className, onNavigate }: Props) {
  const Icon = section.icon;
  const label = `${section.label} — ${section.subtitle}`;

  return (
    <Link
      href={section.route}
      onClick={onNavigate}
      aria-label={label}
      className={cn(
        "group flex h-full min-h-11 flex-col gap-3 rounded-2xl p-4 text-white",
        "bg-gradient-to-br from-[var(--mj-brand)] to-[var(--mj-brand-deep,var(--mj-brand))]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        "transition-transform active:scale-[0.98]",
        className,
      )}
    >
      <Icon className="size-6 shrink-0 text-white" strokeWidth={1.75} aria-hidden />
        <div className="mt-auto flex min-w-0 flex-col gap-2">
          <span className="truncate text-base font-semibold leading-tight text-white">
            {section.label}
          </span>
          <span className="line-clamp-2 text-sm leading-snug text-white/90 [overflow-wrap:anywhere]">
            {section.subtitle}
          </span>
        </div>
    </Link>
  );
}
