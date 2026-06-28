import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGame } from "@/lib/sin-jeem/context";
import { getMatchResult } from "@/lib/sin-jeem/engine";
import { saveMatchResult } from "@/lib/sin-jeem/storage";
import { playWinSound } from "@/lib/sin-jeem/sounds";
import { GameLayout } from "./components/GameLayout";
import { ScoreBoard } from "./components/ScoreBoard";
import { ConfettiOverlay } from "./components/ConfettiOverlay";

export default function SinJeemResultsPage() {
  const { session, endGame } = useGame();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!session) {
      setLocation("/sin-jeem");
      return;
    }
    if (session.phase !== "finished") {
      setLocation("/sin-jeem/play");
      return;
    }
    const result = getMatchResult(session);
    saveMatchResult(result, session.config.mode);
    playWinSound();
  }, [session, setLocation]);

  if (!session) return null;

  const result = getMatchResult(session);
  const mins = Math.floor(result.durationMs / 60000);
  const secs = Math.floor((result.durationMs % 60000) / 1000);

  return (
    <GameLayout>
      <ConfettiOverlay active={result.winner !== "draw"} />
      <div className="sj-results">
        <div className="sj-trophy">🏆</div>
        <p style={{ fontSize: "0.875rem", color: "var(--majalis-ink-soft)" }}>الفائز</p>
        <h2 className="sj-winner-name">{result.winnerName}</h2>
        <p style={{ color: "var(--majalis-brass-deep)", fontWeight: 700 }}>
          {result.winner === "draw" ? "تعادل!" : "المركز الأول"}
        </p>
      </div>

      <ScoreBoard session={session} highlightWinner />

      <div className="sj-stats" style={{ marginTop: "1.5rem" }}>
        <div className="sj-stat">
          <div className="sj-stat-value">{result.teamA.correct + result.teamB.correct}</div>
          <div className="sj-stat-label">إجابات صحيحة</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">{result.teamA.wrong + result.teamB.wrong}</div>
          <div className="sj-stat-label">أخطاء</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">{result.totalQuestions}</div>
          <div className="sj-stat-label">أسئلة</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">{mins}:{secs.toString().padStart(2, "0")}</div>
          <div className="sj-stat-label">الوقت</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.65rem", marginTop: "1.5rem" }}>
        <button
          type="button"
          className="sj-cta-primary"
          onClick={() => {
            endGame();
            setLocation("/sin-jeem/setup/team_vs_team");
          }}
        >
          🔄 لعب مرة أخرى
        </button>
        <Link href="/sin-jeem" style={{ textAlign: "center", padding: "0.75rem", color: "var(--majalis-emerald-deep)", fontWeight: 700 }}>
          العودة للرئيسية
        </Link>
      </div>
    </GameLayout>
  );
}
