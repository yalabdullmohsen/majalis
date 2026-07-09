import { BookOpen, BookMarked, FlaskConical, GraduationCap, Landmark, Moon, ScrollText, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import type { LPScience } from "@/lib/learning-path-service";

const SCIENCE_ICON_MAP: Record<string, LucideIcon> = {
  BookOpen, BookMarked, FlaskConical, GraduationCap, Landmark, Moon, ScrollText, Star,
};
function ScienceIconEl({ name }: { name: string }) {
  const I = SCIENCE_ICON_MAP[name];
  if (I) return <I size={28} strokeWidth={1.5} />;
  return <span>{name}</span>;
}

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
        className="group relative sc-card p-5 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
        style={{ "--sc-color": science.color } as React.CSSProperties}
      >
        {/* خلفية زخرفية */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none sc-card__glow" />

        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0 leading-none mt-0.5"><ScienceIconEl name={science.icon} /></span>
          <div className="flex-1 min-w-0">
            <h3 className="sc-card__title">{science.name}</h3>
            {science.description && (
              <p className="sc-card__desc">{science.description}</p>
            )}
          </div>
        </div>

        {totalBooks > 0 && (
          <div className="mt-4">
            <div className="sc-card__progress-row">
              <span>{progressCount} / {totalBooks} كتاب</span>
              <span>{pct}%</span>
            </div>
            <div className="sc-card__prog-track">
              <div
                className="h-full rounded-full transition-all duration-500 sc-card__prog"
                style={{ "--sc-prog-w": `${pct}%` } as React.CSSProperties}
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-end">
          <span className="sc-card__cta">استعرض المسار ←</span>
        </div>
      </div>
    </Link>
  );
}
