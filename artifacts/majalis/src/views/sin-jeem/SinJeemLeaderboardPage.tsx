import { useEffect, useState } from "react";
import { fetchLeaderboard } from "@/lib/sin-jeem/supabase";
import { loadHistory } from "@/lib/sin-jeem/storage";
import type { LeaderboardEntry } from "@/lib/sin-jeem/types";
import { GameHero, GameLayout } from "./components/GameLayout";

export default function SinJeemLeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const history = loadHistory();

  useEffect(() => {
    fetchLeaderboard().then(setLeaders);
  }, []);

  const teamScores = new Map<string, number>();
  for (const h of history) {
    teamScores.set(h.teamA.name, (teamScores.get(h.teamA.name) || 0) + h.teamA.score);
    if (h.teamB.name) teamScores.set(h.teamB.name, (teamScores.get(h.teamB.name) || 0) + h.teamB.score);
  }
  const topTeams = [...teamScores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <GameLayout>
      <GameHero />
      <h2 style={{ fontWeight: 800, marginBottom: "1rem", color: "var(--majalis-emerald-deep)" }}>🏆 أفضل اللاعبين</h2>
      {leaders.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--majalis-ink-soft)" }}>العب مباراة لتظهر في لوحة الشرف!</p>
      ) : (
        leaders.map((l, i) => (
          <div key={l.id} className="sj-leader-row">
            <span className={`sj-rank ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}`}>{l.rank}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{l.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--majalis-ink-soft)" }}>{l.wins} فوز من {l.games}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--majalis-emerald-deep)" }}>{l.score}</div>
          </div>
        ))
      )}

      {topTeams.length > 0 && (
        <>
          <h2 style={{ fontWeight: 800, margin: "2rem 0 1rem", color: "var(--majalis-emerald-deep)" }}>👥 أفضل الفرق</h2>
          {topTeams.map(([name, score], i) => (
            <div key={name} className="sj-leader-row">
              <span className="sj-rank">{i + 1}</span>
              <div style={{ flex: 1, fontWeight: 700 }}>{name}</div>
              <div style={{ fontWeight: 800, color: "var(--majalis-brass-deep)" }}>{score}</div>
            </div>
          ))}
        </>
      )}
    </GameLayout>
  );
}
