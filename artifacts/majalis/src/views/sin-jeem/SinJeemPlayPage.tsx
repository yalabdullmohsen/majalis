import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useGame } from "@/lib/sin-jeem/context";
import {
  getCurrentQuestion,
  getRemainingSeconds,
  isTimerExpired,
  nextQuestion,
  submitAnswer,
  timeoutQuestion,
  useLifeline,
  quickConfig,
  dailyConfig,
} from "@/lib/sin-jeem/engine";
import type { LifelineType } from "@/lib/sin-jeem/types";
import {
  playCorrectSound,
  playLoseSound,
  playScorePop,
  playWrongSound,
} from "@/lib/sin-jeem/sounds";
import { GameLayout } from "./components/GameLayout";
import { ScoreBoard } from "./components/ScoreBoard";
import { TimerRing } from "./components/TimerRing";
import { QuestionCard } from "./components/QuestionCard";
import { LifelineBar } from "./components/LifelineBar";

export default function SinJeemPlayPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { session, updateSession, startGame } = useGame();
  const [selected, setSelected] = useState<number | null>(null);
  const [, tick] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    const params = new URLSearchParams(search);
    const mode = params.get("mode");
    if (!session && mode === "quick") {
      startGame(quickConfig());
      initialized.current = true;
    } else if (!session && mode === "daily") {
      startGame(dailyConfig());
      initialized.current = true;
    } else if (!session) {
      setLocation("/sin-jeem");
    } else {
      initialized.current = true;
    }
  }, [session, search, startGame, setLocation]);

  useEffect(() => {
    if (!session || session.phase !== "playing" || session.timerFrozen) return;
    const id = window.setInterval(() => tick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [session?.phase, session?.timerFrozen, session?.currentIndex, session?.timerStartedAt]);

  useEffect(() => {
    if (!session || session.phase !== "playing" || session.timerFrozen) return;
    if (isTimerExpired(session)) {
      updateSession(timeoutQuestion(session));
      playWrongSound();
    }
  }, [session, updateSession, tick]);

  const handleSelect = useCallback(
    (index: number) => {
      if (!session || session.phase !== "playing") return;
      setSelected(index);
      const next = submitAnswer(session, index);
      updateSession(next);
      const correct = index === (getCurrentQuestion(session)?.correct_index ?? 0);
      if (correct) {
        playCorrectSound();
        playScorePop();
      } else {
        playWrongSound();
      }
    },
    [session, updateSession],
  );

  const handleLifeline = (type: LifelineType) => {
    if (!session) return;
    const next = useLifeline(session, type);
    updateSession(next);
  };

  const handleContinue = () => {
    if (!session) return;
    if (session.phase === "finished") {
      setLocation("/sin-jeem/results");
      return;
    }
    const next = nextQuestion(session);
    updateSession(next);
    setSelected(null);
    if (next.phase === "finished") {
      setLocation("/sin-jeem/results");
    }
  };

  if (!session) return null;

  const question = getCurrentQuestion(session);
  const remaining = getRemainingSeconds(session);
  const lifelines = session.activeSide === "a" ? session.lifelinesA : session.lifelinesB;
  const revealed = session.phase === "reveal";

  return (
    <GameLayout>
      <div style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--majalis-ink-soft)", marginBottom: "0.5rem" }}>
        سؤال {session.currentIndex + 1} / {session.questions.length}
        {session.config.mode !== "solo" && (
          <> · دور {session.activeSide === "a" ? session.teamA.name : session.teamB.name}</>
        )}
      </div>

      <ScoreBoard session={session} />

      {session.phase === "playing" && (
        <TimerRing total={session.config.timerSeconds} remaining={remaining} frozen={session.timerFrozen} />
      )}

      {question && (
        <QuestionCard
          question={question}
          selectedIndex={selected}
          hiddenOptions={session.hiddenOptions}
          revealed={revealed}
          onSelect={handleSelect}
          disabled={revealed}
        />
      )}

      {session.phase === "playing" && (
        <LifelineBar
          available={lifelines}
          onUse={handleLifeline}
          disabled={selected !== null}
        />
      )}

      {revealed && (
        <button type="button" className="sj-cta-primary" style={{ marginTop: "1.25rem" }} onClick={handleContinue}>
          {session.currentIndex + 1 >= session.questions.length ? "عرض النتائج 🏆" : "السؤال التالي →"}
        </button>
      )}
    </GameLayout>
  );
}
