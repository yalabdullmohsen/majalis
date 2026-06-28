import { useEffect, useState } from "react";
import { fetchLeaderboardByPeriod, periodLabel, type LeaderboardPeriod } from "@/lib/sin-jeem/leaderboard-service";
import type { LeaderboardEntry } from "@/lib/sin-jeem/types";
import { GameHero, GameLayout } from "./components/GameLayout";

const PERIODS: LeaderboardPeriod[] = ["day", "week", "month", "all"];

function LeaderList({ title, items }: { title: string; items: LeaderboardEntry[] }) {
  return (
    <>
      <h2 style={{ fontWeight: 800, margin: "1.5rem 0 1rem", color: "var(--majalis-emerald-deep)" }}>{title}</h2>
      {items.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--majalis-ink-soft)" }}>لا توجد نتائج بعد — العب مباراة!</p>
      ) : (
        items.map((l, i) => (
          <div key={`${l.id}-${i}`} className="sj-leader-row">
            <span className={`sj-rank ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}`}>{l.rank}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{l.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--majalis-ink-soft)" }}>{l.wins} فوز من {l.games}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--majalis-emerald-deep)" }}>{l.score}</div>
          </div>
        ))
      )}
    </>
  );
}

export default function SinJeemLeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [teams, setTeams] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboardByPeriod(period).then((snap) => {
      setPlayers(snap.players);
      setTeams(snap.teams);
      setLoading(false);
    });
  }, [period]);

  return (
    <GameLayout>
      <GameHero />
      <div className="sj-period-tabs" role="tablist" aria-label="فترة لوحة الشرف">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            className={`sj-period-tab${period === p ? " active" : ""}`}
            onClick={() => setPeriod(p)}
          >
            {periodLabel(p)}
          </button>
        ))}
      </div>
      {loading ? (
        <p style={{ textAlign: "center", color: "var(--majalis-ink-soft)" }}>جاري التحميل...</p>
      ) : (
        <>
          <LeaderList title="🏆 أفضل اللاعبين" items={players} />
          <LeaderList title="👥 أفضل الفرق" items={teams} />
        </>
      )}
    </GameLayout>
  );
}
