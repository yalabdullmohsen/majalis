import { Link } from "wouter";
import type { LPLevel, LPProgress } from "@/lib/learning-path-service";

interface Props {
  levels: LPLevel[];
  _scienceSlug?: string;
  progress: LPProgress[];
}

export function LevelTimeline({ levels, progress }: Props) {
  const progressMap = new Map(progress.map((p) => [p.book_id, p]));

  return (
    <div className="relative">
      {/* الخط الرأسي */}
      <div className="absolute right-6 top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-700 hidden md:block" />

      <div className="space-y-8">
        {levels.map((level, idx) => {
          const levelBooks = level.books ?? [];
          const completed = levelBooks.filter((b) => progressMap.get(b.id)?.status === "completed").length;
          const inProgress = levelBooks.filter((b) => progressMap.get(b.id)?.status === "in_progress").length;
          const pct = levelBooks.length > 0 ? Math.round((completed / levelBooks.length) * 100) : 0;
          const isUnlocked = idx === 0 || (() => {
            const prev = levels[idx - 1];
            const prevBooks = prev?.books ?? [];
            const prevCompleted = prevBooks.filter((b) => progressMap.get(b.id)?.status === "completed").length;
            return prevCompleted > 0;
          })();

          return (
            <div key={level.id} className="flex gap-4 md:gap-6">
              {/* نقطة الـ timeline */}
              <div className="flex-shrink-0 w-12 flex flex-col items-center relative z-10 hidden md:flex">
                <div
                  className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm mt-1"
                  style={{
                    background: completed === levelBooks.length && levelBooks.length > 0
                      ? level.color
                      : inProgress > 0
                      ? `${level.color}88`
                      : "#e5e7eb",
                  }}
                />
              </div>

              {/* بطاقة المستوى */}
              <div className="flex-1">
                <div
                  className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: isUnlocked ? `${level.color}40` : "#e5e7eb" }}
                >
                  {/* رأس المستوى */}
                  <div
                    className="px-5 py-3 flex items-center justify-between"
                    style={{ background: isUnlocked ? `${level.color}12` : "#f9fafb" }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                        style={{ background: isUnlocked ? level.color : "#9ca3af" }}
                      >
                        المستوى {idx + 1}
                      </span>
                      <h3 className="font-bold text-gray-800 dark:text-white">{level.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {levelBooks.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {completed}/{levelBooks.length}
                          {pct > 0 && ` (${pct}%)`}
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="text-gray-400 text-sm">🔒</span>
                      )}
                    </div>
                  </div>

                  {/* شريط التقدم */}
                  {levelBooks.length > 0 && (
                    <div className="h-1 bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: level.color }}
                      />
                    </div>
                  )}

                  {/* قائمة الكتب */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {levelBooks.length === 0 ? (
                      <p className="text-sm text-gray-400 col-span-2 text-center py-4">
                        لا توجد كتب في هذا المستوى بعد
                      </p>
                    ) : (
                      levelBooks.map((book) => {
                        const prog = progressMap.get(book.id);
                        const status = prog?.status ?? "not_started";
                        return (
                          <Link key={book.id} href={`/learning-path/book/${book.id}`}>
                            <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all cursor-pointer group">
                              <StatusDot status={status} color={level.color} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                  {book.title}
                                </p>
                                {book.author && (
                                  <p className="text-xs text-gray-400 mt-0.5">{book.author}</p>
                                )}
                                <div className="flex gap-2 mt-1">
                                  {book.estimated_hours > 0 && (
                                    <span className="text-xs text-gray-400">⏱ {book.estimated_hours}س</span>
                                  )}
                                  {book.pages_count > 0 && (
                                    <span className="text-xs text-gray-400">📄 {book.pages_count}ص</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusDot({ status, color }: { status: string; color: string }) {
  if (status === "completed") {
    return (
      <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs mt-0.5"
        style={{ background: color }}>✓</span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5"
        style={{ borderColor: color, background: `${color}22` }} />
    );
  }
  return (
    <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-200 dark:border-gray-600 mt-0.5" />
  );
}
