import { Link } from "wouter";
import { useCompare } from "./CompareContext";

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  if (compareList.length === 0) return null;

  return (
    <div dir="rtl" className="fixed bottom-0 right-0 left-0 z-30 bg-white dark:bg-gray-800
      border-t border-gray-200 dark:border-gray-700 shadow-xl px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0">
          المقارنة ({compareList.length}/4):
        </span>

        <div className="flex gap-2 flex-wrap flex-1">
          {compareList.map((u) => (
            <span key={u.slug}
              className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20
                text-emerald-800 dark:text-emerald-300 text-xs px-2 py-1 rounded-full">
              {u.name_ar.slice(0, 25)}{u.name_ar.length > 25 ? "…" : ""}
              <button type="button" onClick={() => removeFromCompare(u.slug)}
                className="text-emerald-600 hover:text-red-500 font-bold ml-0.5">×</button>
            </span>
          ))}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {compareList.length >= 2 && (
            <Link href="/universities/compare"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                rounded-xl font-medium transition-colors">
              قارن الآن ←
            </Link>
          )}
          <button type="button" onClick={clearCompare}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
            مسح الكل
          </button>
        </div>
      </div>
    </div>
  );
}
