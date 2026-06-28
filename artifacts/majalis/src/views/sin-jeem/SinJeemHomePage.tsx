import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { MODE_CARDS, GAME_TITLE } from "@/lib/sin-jeem/constants";
import { fetchGameStats, fetchLeaderboard, probeQuestionAnswerDb } from "@/lib/sin-jeem/supabase";
import type { GameStats, LeaderboardEntry } from "@/lib/sin-jeem/types";
import { QA_ROUTES } from "@/lib/question-answer/routes";
import { GameHero, GameLayout } from "./components/GameLayout";
import { DbActivationBanner } from "./components/DbActivationBanner";

export default function SinJeemHomePage() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<GameStats>({ questionCount: 0, categoryCount: 0, playerCount: 0, matchCount: 0 });
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [dbAvailable, setDbAvailable] = useState(true);
  const [dbLoading, setDbLoading] = useState(true);

  const refresh = useCallback(async () => {
    setDbLoading(true);
    const [health, nextStats, nextLeaders] = await Promise.all([
      probeQuestionAnswerDb(),
      fetchGameStats(),
      fetchLeaderboard(),
    ]);
    setDbAvailable(health.available);
    setStats(nextStats);
    setLeaders(nextLeaders);
    setDbLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <GameLayout>
      <GameHero />

      <DbActivationBanner dbAvailable={dbAvailable} loading={dbLoading} onRetry={() => void refresh()} />

      <button type="button" className="sj-cta-primary" onClick={() => setLocation(QA_ROUTES.setup("team_vs_team"))}>
        ⚡ ابدأ اللعبة
      </button>

      <div className="sj-stats">
        <div className="sj-stat">
          <div className="sj-stat-value">{stats.questionCount}</div>
          <div className="sj-stat-label">عدد الأسئلة</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">{stats.categoryCount}</div>
          <div className="sj-stat-label">عدد الفئات</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">{stats.playerCount || "—"}</div>
          <div className="sj-stat-label">عدد اللاعبين</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">{stats.matchCount}</div>
          <div className="sj-stat-label">مباريات</div>
        </div>
      </div>

      <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: "1.5rem 0 0.75rem", color: "var(--majalis-emerald-deep)" }}>
        أوضاع اللعب
      </h2>
      <div className="sj-modes">
        {MODE_CARDS.map((m) => (
          <button
            key={m.mode}
            type="button"
            className="sj-mode-card"
            style={{ background: m.gradient, border: "none", textAlign: "start" }}
            onClick={() => {
              if (m.mode === "quick") setLocation(`${QA_ROUTES.play}?mode=quick`);
              else if (m.mode === "daily") setLocation(`${QA_ROUTES.play}?mode=daily`);
              else if (m.mode === "tournament") setLocation(QA_ROUTES.tournament);
              else setLocation(QA_ROUTES.setup(m.mode));
            }}
          >
            <span className="sj-mode-icon">{m.icon}</span>
            <span className="sj-mode-title">{m.title}</span>
            <span className="sj-mode-desc">{m.desc}</span>
          </button>
        ))}
      </div>

      {leaders.length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--majalis-emerald-deep)" }}>🏆 أفضل اللاعبين</h2>
            <Link href={QA_ROUTES.leaderboard} style={{ fontSize: "0.8125rem", color: "var(--majalis-brass-deep)" }}>
              عرض الكل
            </Link>
          </div>
          {leaders.slice(0, 5).map((l, i) => (
            <div key={l.id} className="sj-leader-row">
              <span className={`sj-rank ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}`}>{l.rank}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{l.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--majalis-ink-soft)" }}>{l.wins} فوز · {l.games} لعبة</div>
              </div>
              <div style={{ fontWeight: 800, color: "var(--majalis-emerald-deep)" }}>{l.score}</div>
            </div>
          ))}
        </section>
      )}

      <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.75rem", color: "var(--majalis-ink-soft)" }}>
        {GAME_TITLE} — جزء من منصة مجالس العلم
      </p>
    </GameLayout>
  );
}
