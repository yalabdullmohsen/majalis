import { useEffect, useState } from "react";
import { requestFetch } from "@/lib/request-manager";
import { periodLabel, type LeaderboardPeriod } from "@/lib/sin-jeem/leaderboard-service";
import type { LeaderboardEntry } from "@/lib/sin-jeem/types";
import { SjIcon } from "@/components/sin-jeem/SjIcon";
import { GameHero, GameLayout } from "./components/GameLayout";

const PERIODS: LeaderboardPeriod[] = ["day", "week", "month", "all"];

type BoardTab = "players" | "teams" | "accuracy" | "speed";

function LeaderList({ title, icon, items, unit }: { title: string; icon: string; items: LeaderboardEntry[]; unit?: string }) {
  return (
    <>
      <h2 className="sj-board-title">
        <SjIcon name={icon} size={18} />
        {title}
      </h2>
      {items.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--majalis-ink-soft)" }}>لا توجد نتائج بعد — العب مباراة!</p>
      ) : (
        items.map((l, i) => (
          <div key={`${l.id}-${i}`} className="sj-leader-row sj-animate-in">
            <span className={`sj-rank ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}`}>{l.rank}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{l.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--majalis-ink-soft)" }}>{l.wins} فوز من {l.games}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--majalis-emerald-deep)" }}>
              {l.score}{unit || ""}
            </div>
          </div>
        ))
      )}
    </>
  );
}

export default function SinJeemLeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [tab, setTab] = useState<BoardTab>("players");
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [teams, setTeams] = useState<LeaderboardEntry[]>([]);
  const [accuracy, setAccuracy] = useState<LeaderboardEntry[]>([]);
  const [speed, setSpeed] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    requestFetch(`/api/question-answer?action=leaderboard&period=${period}&scope=global`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        setPlayers(data.players || []);
        setTeams(data.teams || []);
        setAccuracy(data.accuracy || []);
        setSpeed(data.speed || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  const tabs: { key: BoardTab; label: string; icon: string }[] = [
    { key: "players", label: "اللاعبون", icon: "trophy" },
    { key: "teams", label: "الفرق", icon: "users" },
    { key: "accuracy", label: "الدقة", icon: "target" },
    { key: "speed", label: "السرعة", icon: "zap" },
  ];

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

      <div className="sj-period-tabs" style={{ marginTop: "0.5rem" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`sj-period-tab${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <SjIcon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="sj-loading-state"><span className="sj-pulse-dot" /> جاري التحميل...</p>
      ) : (
        <>
          {tab === "players" && <LeaderList title="أفضل اللاعبين" icon="trophy" items={players} />}
          {tab === "teams" && <LeaderList title="أفضل الفرق" icon="users" items={teams} />}
          {tab === "accuracy" && <LeaderList title="لوحة الدقة" icon="target" items={accuracy} unit="%" />}
          {tab === "speed" && <LeaderList title="أسرع المفكرين" icon="zap" items={speed} unit="ms" />}
        </>
      )}
    </GameLayout>
  );
}
