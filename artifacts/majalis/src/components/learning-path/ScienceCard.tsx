import { Link } from "wouter";
import type { LPScience } from "@/lib/learning-path-service";

interface Props {
  science: LPScience;
  progressCount?: number;
  totalBooks?: number;
}

export function ScienceCard({ science, progressCount = 0, totalBooks = 0 }: Props) {
  const pct = totalBooks > 0 ? Math.round((progressCount / totalBooks) * 100) : 0;

  return (
    <Link href={`/learning-path/${science.slug}`}>
      <div
        className="group relative bg-[var(--majalis-panel)] rounded-2xl border border-[var(--majalis-line)] p-5 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden sc-card"
        style={{ "--sc-color": science.color } as React.CSSProperties}
      >
        {/* خلفية زخرفية */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none sc-card__glow" />

        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0 leading-none mt-0.5">{science.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[var(--majalis-ink)] text-base leading-snug mb-1">
              {science.name}
            </h3>
            {science.description && (
              <p className="text-xs text-[var(--majalis-ink-soft)] line-clamp-2 leading-relaxed">
                {science.description}
              </p>
            )}
          </div>
        </div>

        {totalBooks > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-[var(--majalis-ink-soft)] mb-1">
              <span>{progressCount} / {totalBooks} كتاب</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-[var(--majalis-parchment-deep)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 sc-card__prog"
                style={{ "--sc-prog-w": `${pct}%` } as React.CSSProperties}
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-end">
          <span className="text-xs font-medium text-[var(--majalis-ink-soft)] opacity-70 group-hover:text-[var(--majalis-emerald)] group-hover:opacity-100 transition-colors">
            استعرض المسار ←
          </span>
        </div>
      </div>
    </Link>
  );
}
