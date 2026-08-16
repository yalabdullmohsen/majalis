import { Link } from "wouter";
import type { SectionDef } from "@/config/sections.registry";
import { cn } from "@/lib/utils";

type Props = {
  section: SectionDef;
  className?: string;
  onNavigate?: () => void;
};

/**
 * بطاقة متوسطة محايدة (شبكة عمودين) — بلا تدرّج أخضر.
 */
export function SectionCard({ section, className, onNavigate }: Props) {
  const Icon = section.icon;
  const label = `${section.label} — ${section.subtitle}`;

  return (
    <Link
      href={section.route}
      onClick={onNavigate}
      aria-label={label}
      className={cn(
        "flex h-full min-h-11 flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mj-brand)]",
        "transition-colors hover:bg-muted/40 active:scale-[0.98]",
        className,
      )}
    >
      <Icon
        className="size-6 shrink-0 text-[var(--mj-brand)]"
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="mt-auto flex min-w-0 flex-col gap-2">
        <span className="truncate text-sm font-semibold leading-tight text-foreground">
          {section.label}
        </span>
        <span className="line-clamp-2 text-xs leading-snug text-muted-foreground [overflow-wrap:anywhere]">
          {section.subtitle}
        </span>
      </div>
    </Link>
  );
}
