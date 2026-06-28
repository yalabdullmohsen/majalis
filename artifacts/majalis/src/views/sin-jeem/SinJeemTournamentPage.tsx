import { useState } from "react";
import { useLocation } from "wouter";
import { useGame } from "@/lib/sin-jeem/context";
import { DEFAULT_CONFIG } from "@/lib/sin-jeem/constants";
import { GameHero, GameLayout } from "./components/GameLayout";

type Round = "quarter" | "semi" | "final";

const BRACKET: { round: Round; label: string; pairs: [string, string][] }[] = [
  {
    round: "quarter",
    label: "ربع النهائي",
    pairs: [
      ["الفريق 1", "الفريق 2"],
      ["الفريق 3", "الفريق 4"],
      ["الفريق 5", "الفريق 6"],
      ["الفريق 7", "الفريق 8"],
    ],
  },
  { round: "semi", label: "نصف النهائي", pairs: [["؟", "؟"], ["؟", "؟"]] },
  { round: "final", label: "النهائي", pairs: [["؟", "؟"]] },
];

export default function SinJeemTournamentPage() {
  const [, setLocation] = useLocation();
  const { startGame } = useGame();
  const [activeRound, setActiveRound] = useState<Round>("quarter");

  const startMatch = (teamA: string, teamB: string) => {
    startGame({
      ...DEFAULT_CONFIG,
      mode: "tournament",
      teamAName: teamA,
      teamBName: teamB,
      questionCount: 8,
      timerSeconds: 30,
    });
    setLocation("/sin-jeem/play");
  };

  const bracket = BRACKET.find((b) => b.round === activeRound)!;

  return (
    <GameLayout>
      <GameHero />
      <h2 style={{ textAlign: "center", fontWeight: 800, marginBottom: "1rem" }}>🏆 البطولة</h2>

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {BRACKET.map((b) => (
          <button
            key={b.round}
            type="button"
            className="sj-badge"
            style={{
              padding: "0.45rem 0.85rem",
              cursor: "pointer",
              background: activeRound === b.round ? "var(--majalis-emerald-deep)" : undefined,
              color: activeRound === b.round ? "#fff" : undefined,
            }}
            onClick={() => setActiveRound(b.round)}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {bracket.pairs.map(([a, b], i) => (
          <div
            key={i}
            className="sj-question-card"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}
          >
            <div>
              <strong>{a}</strong>
              <span style={{ margin: "0 0.5rem", color: "var(--majalis-brass-deep)" }}>VS</span>
              <strong>{b}</strong>
            </div>
            {a !== "؟" && (
              <button type="button" className="sj-cta-primary" style={{ width: "auto", padding: "0.5rem 1rem", fontSize: "0.875rem" }} onClick={() => startMatch(a, b)}>
                العب
              </button>
            )}
          </div>
        ))}
      </div>

      <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--majalis-ink-soft)" }}>
        اربح المباراة لتتقدم للجولة التالية
      </p>
    </GameLayout>
  );
}
