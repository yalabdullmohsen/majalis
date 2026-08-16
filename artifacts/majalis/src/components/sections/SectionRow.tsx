import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import type { SectionDef } from "@/config/sections.registry";
import { cn } from "@/lib/utils";

type Props = {
  section: SectionDef;
  className?: string;
  onNavigate?: () => void;
};

/**
 * صف قائمة لمجموعة الحساب والإعدادات فقط.
 */
export function SectionRow({ section, className, onNavigate }: Props) {
  const Icon = section.icon;
  const label = `${section.label} — ${section.subtitle}`;

  return (
    <Link
      href={section.route}
      onClick={onNavigate}
      aria-label={label}
      className={cn(
        "flex min-h-11 items-center gap-3 border-b border-border px-4 py-3 text-foreground last:border-b-0",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mj-brand)]",
        "hover:bg-muted/40 active:bg-muted/60",
        className,
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-5 text-[var(--mj-brand)]" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{section.label}</span>
      <ChevronLeft className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
    </Link>
  );
}
