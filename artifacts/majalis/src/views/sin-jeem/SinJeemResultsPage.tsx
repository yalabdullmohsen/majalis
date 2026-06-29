import { useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useGame } from "@/lib/sin-jeem/context";
import { getMatchResult } from "@/lib/sin-jeem/engine";
import { persistMatchResult } from "@/lib/sin-jeem/submit-result";
import { playWinSound } from "@/lib/sin-jeem/sounds";
import { QA_ROUTES } from "@/lib/question-answer/routes";
import { computeMatchXp, loadGameStats } from "@/lib/question-bank-v2/gamification";
import { resolveMainCategory, getMainCategory } from "@/lib/question-bank-v2/categories";
import { GameLayout } from "./components/GameLayout";
import { ScoreBoard } from "./components/ScoreBoard";
import { ConfettiOverlay } from "./components/ConfettiOverlay";

export default function SinJeemResultsPage() {
  const { session, endGame } = useGame();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!session) {
      setLocation(QA_ROUTES.home);
      return;
    }
    if (session.phase !== "finished") {
      setLocation(QA_ROUTES.play);
      return;
    }
    const result = getMatchResult(session);
    void persistMatchResult(result, session.config.mode, session.id);
    playWinSound();
  }, [session, setLocation]);

  const analysis = useMemo(() => {
    if (!session) return null;
    const correct = session.teamA.correct + session.teamB.correct;
    const wrong = session.teamA.wrong + session.teamB.wrong;
    const total = session.questions.length;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    const wrongItems = session.questions
      .map((q, i) => ({ q, round: session.rounds[i] }))
      .filter(({ round }) => round && round.isCorrect === false);
    const weakCats = [...new Set(wrongItems.map(({ q }) => resolveMainCategory(q.category_slug)))];
    const xp = computeMatchXp(correct, total);
    return { correct, wrong, total, pct, wrongItems, weakCats, xp };
  }, [session]);

  if (!session || !analysis) return null;

  const result = getMatchResult(session);
  const mins = Math.floor(result.durationMs / 60000);
  const secs = Math.floor((result.durationMs % 60000) / 1000);
  const stats = loadGameStats();

  return (
    <GameLayout>
      <ConfettiOverlay active={analysis.pct >= 60} />
      <div className="sj-results">
        <div className="sj-trophy">{analysis.pct >= 80 ? "🏆" : analysis.pct >= 50 ? "⭐" : "📚"}</div>
        <div className="sj-results-score">
          <div className="pct">{analysis.pct}%</div>
          <div className="grade">
            {analysis.correct} من {analysis.total} إجابة صحيحة
          </div>
        </div>
        {session.config.mode !== "solo" && (
          <>
            <p style={{ fontSize: "0.875rem", color: "var(--majalis-ink-soft)" }}>الفائز</p>
            <h2 className="sj-winner-name">{result.winnerName}</h2>
          </>
        )}
      </div>

      <ScoreBoard session={session} highlightWinner />

      <div className="sj-stats" style={{ marginTop: "1.5rem" }}>
        <div className="sj-stat">
          <div className="sj-stat-value">{analysis.correct}</div>
          <div className="sj-stat-label">صحيحة</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">{analysis.wrong}</div>
          <div className="sj-stat-label">خاطئة</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">{result.teamA.score + result.teamB.score}</div>
          <div className="sj-stat-label">النقاط</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">{mins}:{secs.toString().padStart(2, "0")}</div>
          <div className="sj-stat-label">الوقت</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">+{analysis.xp}</div>
          <div className="sj-stat-label">XP</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">Lv.{stats.level}</div>
          <div className="sj-stat-label">المستوى</div>
        </div>
      </div>

      {analysis.wrongItems.length > 0 && (
        <section style={{ marginTop: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>مراجعة الأخطاء</h3>
          {analysis.wrongItems.map(({ q }, idx) => (
            <div key={q.id} className="sj-review-card wrong">
              <strong>{idx + 1}. {q.question}</strong>
              <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                الإجابة الصحيحة: {q.options?.[q.correct_index ?? 0]}
              </p>
              {q.explanation && <p className="sj-explanation">{q.explanation}</p>}
              {q.source && <span className="sj-badge sj-badge--source">المصدر: {q.source}</span>}
              <Link href="/lessons" className="sj-lesson-link">
                ← استكشف دروس {getMainCategory(resolveMainCategory(q.category_slug))?.name_ar || "ذات الصلة"}
              </Link>
            </div>
          ))}
        </section>
      )}

      {analysis.weakCats.length > 0 && (
        <section style={{ marginTop: "1rem", padding: "1rem", background: "#f8faf9", borderRadius: "0.75rem" }}>
          <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.5rem" }}>اقتراحات لتحسين المستوى</h3>
          <ul style={{ margin: 0, paddingInlineStart: "1.25rem", fontSize: "0.875rem", lineHeight: 1.7 }}>
            {analysis.weakCats.map((slug) => (
              <li key={slug}>
                راجع قسم «{getMainCategory(slug)?.name_ar || slug}» — سيُعاد اختبارك فيه تلقائياً
              </li>
            ))}
          </ul>
        </section>
      )}

      <div style={{ display: "grid", gap: "0.65rem", marginTop: "1.5rem" }}>
        <button
          type="button"
          className="sj-cta-primary"
          onClick={() => {
            endGame();
            setLocation(QA_ROUTES.setup("team_vs_team"));
          }}
        >
          🔄 لعب مرة أخرى
        </button>
        <Link href={QA_ROUTES.home} style={{ textAlign: "center", padding: "0.75rem", color: "var(--majalis-emerald-deep)", fontWeight: 700 }}>
          العودة للرئيسية
        </Link>
      </div>
    </GameLayout>
  );
}
