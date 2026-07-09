import { FileText, Lock } from "lucide-react";
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
      <div className="lt-spine" />

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

          const dotBg = completed === levelBooks.length && levelBooks.length > 0
            ? level.color
            : inProgress > 0
            ? `${level.color}88`
            : "var(--majalis-line)";

          return (
            <div key={level.id} className="flex gap-4 md:gap-6">
              {/* نقطة الـ timeline */}
              <div className="flex-shrink-0 w-12 flex flex-col items-center relative z-10 hidden md:flex">
                <div
                  className="w-5 h-5 rounded-full border-2 border-[var(--majalis-panel)] shadow-sm mt-1 lt-dot"
                  style={{ "--lt-dot-bg": dotBg } as React.CSSProperties}
                />
              </div>

              {/* بطاقة المستوى */}
              <div className="flex-1">
                <div
                  className="rounded-2xl border overflow-hidden lt-level-card"
                  style={{ "--lt-border": isUnlocked ? `${level.color}40` : "var(--majalis-line)" } as React.CSSProperties}
                >
                  {/* رأس المستوى */}
                  <div
                    className="px-5 py-3 flex items-center justify-between lt-level-head"
                    style={{ "--lt-head-bg": isUnlocked ? `${level.color}12` : "var(--majalis-parchment)" } as React.CSSProperties}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white lt-badge"
                        style={{ "--lt-badge-bg": isUnlocked ? level.color : "var(--majalis-ink-soft)" } as React.CSSProperties}
                      >
                        المستوى {idx + 1}
                      </span>
                      <h3 className="lt-level-name">{level.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {levelBooks.length > 0 && (
                        <span className="lt-level-count">
                          {completed}/{levelBooks.length}
                          {pct > 0 && ` (${pct}%)`}
                        </span>
                      )}
                      {!isUnlocked && (
                        <Lock size={14} className="lt-level-count opacity-60" />
                      )}
                    </div>
                  </div>

                  {/* شريط التقدم */}
                  {levelBooks.length > 0 && (
                    <div className="lt-prog-track">
                      <div
                        className="h-full transition-all duration-500 lt-prog-fill"
                        style={{ "--lt-prog-w": `${pct}%`, "--lt-color": level.color } as React.CSSProperties}
                      />
                    </div>
                  )}

                  {/* قائمة الكتب */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {levelBooks.length === 0 ? (
                      <p className="lt-empty">لا توجد كتب في هذا المستوى بعد</p>
                    ) : (
                      levelBooks.map((book) => {
                        const prog = progressMap.get(book.id);
                        const status = prog?.status ?? "not_started";
                        return (
                          <Link key={book.id} href={`/learning-path/book/${book.id}`}>
                            <div className="lt-book-item">
                              <StatusDot status={status} color={level.color} />
                              <div className="flex-1 min-w-0">
                                <p className="lt-book-title">{book.title}</p>
                                {book.author && (
                                  <p className="lt-book-author">{book.author}</p>
                                )}
                                <div className="flex gap-2 mt-1">
                                  {book.estimated_hours > 0 && (
                                    <span className="lt-book-meta">⏱ {book.estimated_hours}س</span>
                                  )}
                                  {book.pages_count > 0 && (
                                    <span className="lt-book-meta"><FileText size={11} className="inline ml-0.5" />{book.pages_count}ص</span>
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
      <span
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs mt-0.5 lt-status-done"
        style={{ "--lt-color": color } as React.CSSProperties}
      >✓</span>
    );
  }
  if (status === "in_progress") {
    return (
      <span
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 lt-status-progress"
        style={{ "--lt-color": color } as React.CSSProperties}
      />
    );
  }
  return <span className="lt-status-empty" />;
}
