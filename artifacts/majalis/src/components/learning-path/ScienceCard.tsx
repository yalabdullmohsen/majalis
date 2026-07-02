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
        className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
        style={{ borderTop: `3px solid ${science.color}` }}
      >
        {/* خلفية زخرفية */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
          style={{ background: `radial-gradient(circle at 70% 20%, ${science.color}, transparent 60%)` }}
        />

        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0 leading-none mt-0.5">{science.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug mb-1">
              {science.name}
            </h3>
            {science.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {science.description}
              </p>
            )}
          </div>
        </div>

        {totalBooks > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>{progressCount} / {totalBooks} كتاب</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: science.color }}
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-end">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            استعرض المسار ←
          </span>
        </div>
      </div>
    </Link>
  );
}
