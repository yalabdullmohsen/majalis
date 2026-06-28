import { TEAM_COLORS } from "@/lib/sin-jeem/constants";
import type { GameSession } from "@/lib/sin-jeem/types";

interface ScoreBoardProps {
  session: GameSession;
  highlightWinner?: boolean;
}

export function ScoreBoard({ session, highlightWinner }: ScoreBoardProps) {
  const { teamA, teamB, activeSide, config } = session;
  const solo = config.mode === "solo";

  return (
    <div className="sj-scoreboard">
      <div
        className={`sj-team-score ${activeSide === "a" && session.phase === "playing" ? "active" : ""} ${highlightWinner && teamA.score >= teamB.score ? "winner" : ""}`}
        style={{ "--team-color": TEAM_COLORS.a.primary, "--team-glow": TEAM_COLORS.a.glow } as React.CSSProperties}
      >
        <div className="sj-team-name">{teamA.name}</div>
        <div className={`sj-team-points ${session.phase === "reveal" ? "sj-score-pop" : ""}`}>{teamA.score}</div>
        <div style={{ fontSize: "0.6875rem", color: "var(--majalis-ink-soft)" }}>
          ✓{teamA.correct} ✗{teamA.wrong}
        </div>
      </div>

      {!solo && (
        <>
          <div className="sj-vs">VS</div>
          <div
            className={`sj-team-score ${activeSide === "b" && session.phase === "playing" ? "active" : ""} ${highlightWinner && teamB.score > teamA.score ? "winner" : ""}`}
            style={{ "--team-color": TEAM_COLORS.b.primary, "--team-glow": TEAM_COLORS.b.glow } as React.CSSProperties}
          >
            <div className="sj-team-name">{teamB.name}</div>
            <div className="sj-team-points">{teamB.score}</div>
            <div style={{ fontSize: "0.6875rem", color: "var(--majalis-ink-soft)" }}>
              ✓{teamB.correct} ✗{teamB.wrong}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
