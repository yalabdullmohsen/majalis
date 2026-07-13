import { Link } from "wouter";
import type { LPLevel, LPProgress } from "@/lib/learning-path-service";

interface Props {
  levels: LPLevel[];
  _scienceSlug?: string;
  progress: LPProgress[];
  onStartBook?: (bookId: string) => void;
  onOpenQuiz?: (bookId: string, bookTitle: string) => void;
}

export function LevelTimeline({ levels, progress, onStartBook, onOpenQuiz }: Props) {
  const progressMap = new Map(progress.map((p) => [p.book_id, p]));
  const staticMode = !!(onStartBook && onOpenQuiz);

  return (
    <div className="level-timeline">
      {/* Vertical track line */}
      <div className="level-timeline__track" aria-hidden="true" />

      <div className="level-timeline__list">
        {levels.map((level, idx) => {
          const levelBooks = level.books ?? [];
          const completed  = levelBooks.filter((b) => progressMap.get(b.id)?.status === "completed").length;
          const inProgress = levelBooks.filter((b) => progressMap.get(b.id)?.status === "in_progress").length;
          const pct        = levelBooks.length > 0 ? Math.round((completed / levelBooks.length) * 100) : 0;
          const isUnlocked = idx === 0 || (() => {
            const prev      = levels[idx - 1];
            const prevBooks = prev?.books ?? [];
            return prevBooks.filter((b) => progressMap.get(b.id)?.status === "completed").length > 0;
          })();

          const dotColor = completed === levelBooks.length && levelBooks.length > 0
            ? level.color
            : inProgress > 0
            ? `${level.color}88`
            : "var(--mindmap-line, #d6cdb8)";

          return (
            <div key={level.id} className="level-timeline__item">
              {/* Dot */}
              <div className="level-timeline__dot-col" aria-hidden="true">
                <div
                  className={`level-timeline__dot${completed === levelBooks.length && levelBooks.length > 0 ? " level-timeline__dot--complete" : inProgress > 0 ? " level-timeline__dot--progress" : ""}`}
                  style={{ background: dotColor }}
                />
              </div>

              {/* Card */}
              <div
                className={`level-timeline__card${!isUnlocked ? " level-timeline__card--locked" : ""}`}
                style={{ borderColor: isUnlocked ? `${level.color}38` : "var(--mindmap-line, #d6cdb8)" }}
              >
                {/* Header */}
                <div
                  className="level-timeline__card-head"
                  style={{ background: isUnlocked ? `${level.color}0e` : "var(--mindmap-surface-alt, #f3ede0)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        padding: "0.2rem 0.6rem",
                        borderRadius: "1rem",
                        color: "#fff",
                        background: isUnlocked ? level.color : "var(--mindmap-ink-muted, #8a7d6a)",
                      }}
                    >
                      المستوى {idx + 1}
                    </span>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: "0.9rem", color: "var(--mindmap-ink, #1c1810)" }}>
                      {level.name}
                    </h3>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                    {levelBooks.length > 0 && (
                      <span style={{ fontSize: "0.72rem", color: "var(--mindmap-ink-muted, #8a7d6a)", fontVariantNumeric: "tabular-nums" }}>
                        {completed}/{levelBooks.length}{pct > 0 ? ` (${pct}%)` : ""}
                      </span>
                    )}
                    {!isUnlocked && <span aria-label="مقفل" style={{ fontSize: "0.9rem" }}>🔒</span>}
                  </div>
                </div>

                {/* Progress bar */}
                {levelBooks.length > 0 && (
                  <div className="level-timeline__progress-bar" aria-hidden="true">
                    <div
                      className="level-timeline__progress-fill"
                      style={{ width: `${pct}%`, background: level.color }}
                    />
                  </div>
                )}

                {/* Books */}
                <div className="level-timeline__books">
                  {levelBooks.length === 0 ? (
                    <p style={{ fontSize: "0.82rem", color: "var(--mindmap-ink-muted, #8a7d6a)", textAlign: "center", padding: "1rem 0", gridColumn: "1 / -1", margin: 0 }}>
                      لا توجد كتب في هذا المستوى بعد
                    </p>
                  ) : (
                    levelBooks.map((book) => {
                      const prog   = progressMap.get(book.id);
                      const status = prog?.status ?? "not_started";

                      if (staticMode) {
                        return (
                          <div
                            key={book.id}
                            className="level-timeline__book"
                            style={{ borderRight: `3px solid ${level.color}` }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                              <StatusDot status={status} color={level.color} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: "0 0 0.2rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--mindmap-ink, #1c1810)", lineHeight: 1.4 }}>
                                  {book.title}
                                </p>
                                {book.author && (
                                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--mindmap-ink-muted, #8a7d6a)" }}>{book.author}</p>
                                )}
                                <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.2rem" }}>
                                  {book.estimated_hours > 0 && (
                                    <span style={{ fontSize: "0.72rem", color: "var(--mindmap-ink-muted, #8a7d6a)" }}>⏱ {book.estimated_hours}س</span>
                                  )}
                                  {book.pages_count > 0 && (
                                    <span style={{ fontSize: "0.72rem", color: "var(--mindmap-ink-muted, #8a7d6a)" }}>📄 {book.pages_count}ص</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              {status === "not_started" && (
                                <button
                                  type="button"
                                  onClick={() => onStartBook!(book.id)}
                                  style={{
                                    flex: 1,
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    padding: "0.4rem 0.5rem",
                                    borderRadius: "0.45rem",
                                    border: `1px solid ${level.color}66`,
                                    color: level.color,
                                    background: "transparent",
                                    cursor: "pointer",
                                    transition: "background 0.15s",
                                  }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${level.color}14`; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                                >
                                  ▶ ابدأ القراءة
                                </button>
                              )}
                              {status === "in_progress" && (
                                <button
                                  type="button"
                                  onClick={() => onOpenQuiz!(book.id, book.title)}
                                  style={{
                                    flex: 1,
                                    fontSize: "0.75rem",
                                    fontWeight: 800,
                                    padding: "0.4rem 0.5rem",
                                    borderRadius: "0.45rem",
                                    border: "none",
                                    color: "#fff",
                                    background: level.color,
                                    cursor: "pointer",
                                  }}
                                >
                                  📝 اختبر نفسك
                                </button>
                              )}
                              {status === "completed" && (
                                <span style={{
                                  flex: 1,
                                  textAlign: "center",
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                  padding: "0.4rem 0.5rem",
                                  borderRadius: "0.45rem",
                                  background: `${level.color}18`,
                                  color: level.color,
                                }}>
                                  ✓ اجتزت المقرر
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Navigable mode
                      return (
                        <Link key={book.id} href={`/learning-path/book/${book.id}`} style={{ textDecoration: "none" }}>
                          <div
                            className="level-timeline__book"
                            style={{
                              borderRight: `3px solid ${level.color}`,
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLDivElement).style.borderColor = level.color;
                              (e.currentTarget as HTMLDivElement).style.background = `${level.color}0a`;
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLDivElement).style.borderColor = "";
                              (e.currentTarget as HTMLDivElement).style.background = "";
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                              <StatusDot status={status} color={level.color} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: "0 0 0.15rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--mindmap-ink, #1c1810)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                                  {book.title}
                                </p>
                                {book.author && (
                                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--mindmap-ink-muted, #8a7d6a)" }}>{book.author}</p>
                                )}
                                <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.2rem" }}>
                                  {book.estimated_hours > 0 && (
                                    <span style={{ fontSize: "0.72rem", color: "var(--mindmap-ink-muted, #8a7d6a)" }}>⏱ {book.estimated_hours}س</span>
                                  )}
                                  {book.pages_count > 0 && (
                                    <span style={{ fontSize: "0.72rem", color: "var(--mindmap-ink-muted, #8a7d6a)" }}>📄 {book.pages_count}ص</span>
                                  )}
                                </div>
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
        style={{
          flexShrink: 0,
          width: "1.2rem",
          height: "1.2rem",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: "0.65rem",
          fontWeight: 800,
          marginTop: "0.1rem",
          background: color,
        }}
        aria-label="مكتمل"
      >
        ✓
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span
        style={{
          flexShrink: 0,
          width: "1.2rem",
          height: "1.2rem",
          borderRadius: "50%",
          border: `2px solid ${color}`,
          background: `${color}22`,
          marginTop: "0.1rem",
        }}
        aria-label="قيد التقدم"
      />
    );
  }
  return (
    <span
      style={{
        flexShrink: 0,
        width: "1.2rem",
        height: "1.2rem",
        borderRadius: "50%",
        border: "2px solid var(--mindmap-line, #d6cdb8)",
        marginTop: "0.1rem",
      }}
      aria-label="لم يبدأ"
    />
  );
}
