import { Link } from "wouter";
import type { University } from "@/lib/universities-service";
import { ACCREDITATION_LABELS, ACCREDITATION_COLOR } from "@/lib/universities-service";
import { useCompare } from "./CompareContext";

interface Props {
  university: University;
  compact?:   boolean;
}

export function UniversityCard({ university: u, compact = false }: Props) {
  const { isInCompare, addToCompare, removeFromCompare, canAdd } = useCompare();
  const inCompare = isInCompare(u.slug);

  const programs = u.university_programs?.filter((p) => p.is_active) ?? [];
  const degrees  = [...new Set(programs.map((p) => p.degree_level))];
  const modes    = [...new Set(programs.map((p) => p.study_mode))];
  const hasScholarship = programs.some((p) => p.has_scholarship);
  const accColor = ACCREDITATION_COLOR[u.accreditation_status] || "#9ca3af";

  return (
    <div dir="rtl" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
      rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">

      {/* رأس البطاقة */}
      <div className="bg-gradient-to-l from-emerald-700 to-emerald-500 px-4 py-3 flex items-center gap-3">
        {u.logo_url ? (
          <img src={u.logo_url} alt={u.name_ar} className="w-10 h-10 rounded-full bg-white object-contain" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold">
            {u.name_ar[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-sm leading-snug line-clamp-2">{u.name_ar}</p>
          {u.name_en && <p className="text-emerald-100 text-xs truncate">{u.name_en}</p>}
        </div>
      </div>

      {/* محتوى */}
      <div className="p-4 flex-1 space-y-3">
        {/* الموقع */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span>📍</span>
          <span>{u.city ? `${u.city}، ` : ""}{u.country}</span>
          {u.is_verified && (
            <span className="mr-auto bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400
              px-1.5 py-0.5 rounded text-xs font-medium">✓ موثقة</span>
          )}
        </div>

        {/* الاعتماد */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accColor }} />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {ACCREDITATION_LABELS[u.accreditation_status]}
          </span>
        </div>

        {!compact && u.about && (
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
            {u.about}
          </p>
        )}

        {/* الدرجات */}
        {degrees.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {degrees.map((d) => (
              <span key={d} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700
                dark:text-blue-400 px-2 py-0.5 rounded-full">
                {d}
              </span>
            ))}
          </div>
        )}

        {/* أنماط الدراسة */}
        <div className="flex flex-wrap gap-1">
          {modes.map((m) => (
            <span key={m} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600
              dark:text-gray-300 px-2 py-0.5 rounded-full">
              {m}
            </span>
          ))}
          {hasScholarship && (
            <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700
              dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
              🎓 منح متاحة
            </span>
          )}
        </div>

        {/* آخر تحديث */}
        <p className="text-xs text-gray-300 dark:text-gray-600">
          آخر تحديث: {new Date(u.last_updated_at).toLocaleDateString("ar-SA")}
        </p>
      </div>

      {/* أزرار */}
      <div className="px-4 pb-4 flex gap-2">
        <Link href={`/universities/${u.slug}`}
          className="flex-1 text-center py-2 text-sm bg-emerald-600 hover:bg-emerald-700
            text-white rounded-xl font-medium transition-colors">
          عرض التفاصيل
        </Link>

        <button
          type="button"
          title={inCompare ? "إزالة من المقارنة" : canAdd ? "أضف للمقارنة" : "تعبأت المقارنة (4)"}
          onClick={() => inCompare ? removeFromCompare(u.slug) : addToCompare(u)}
          className={`px-3 py-2 text-sm rounded-xl transition-colors font-medium ${
            inCompare
              ? "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
              : canAdd
                ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                : "bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
          }`}
          disabled={!inCompare && !canAdd}
        >
          {inCompare ? "✓ مقارنة" : "⇔"}
        </button>
      </div>
    </div>
  );
}
