import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { MODE_CARDS, GAME_TITLE } from "@/lib/sin-jeem/constants";
import { fetchGameStats, fetchLeaderboard } from "@/lib/sin-jeem/supabase";
import { loadHistory } from "@/lib/sin-jeem/storage";
import type { GameStats, LeaderboardEntry } from "@/lib/sin-jeem/types";
import { GameHero, GameLayout } from "./components/GameLayout";

export default function SinJeemHomePage() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<GameStats>({ questionCount: 0, categoryCount: 0, playerCount: 0, matchCount: 0 });
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const history = loadHistory().slice(0, 3);

  useEffect(() => {
    fetchGameStats().then(setStats);
    fetchLeaderboard().then(setLeaders);
  }, []);

  return (
    <GameLayout>
      <GameHero />

      <button type="button" className="sj-cta-primary" onClick={() => setLocation("/sin-jeem/setup/team_vs_team")}>
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
              if (m.mode === "quick") setLocation("/sin-jeem/play?mode=quick");
              else if (m.mode === "daily") setLocation("/sin-jeem/play?mode=daily");
              else if (m.mode === "tournament") setLocation("/sin-jeem/tournament");
              else setLocation(`/sin-jeem/setup/${m.mode}`);
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
            <Link href="/sin-jeem/leaderboard" style={{ fontSize: "0.8125rem", color: "var(--majalis-brass-deep)" }}>
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

      {history.length > 0 && (
        <section style={{ marginTop: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.65rem", color: "var(--majalis-emerald-deep)" }}>📋 آخر النتائج</h2>
          {history.map((h, i) => (
            <div key={i} className="sj-leader-row">
              <span>{h.winnerName}</span>
              <span style={{ marginInlineStart: "auto", fontWeight: 700 }}>{h.teamA.score} — {h.teamB.score}</span>
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
