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
import { loadSession } from "@/lib/sin-jeem/storage";
import type { LifelineType } from "@/lib/sin-jeem/types";
import {
  playCorrectSound,
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

  const activeSession = session ?? loadSession();

  useEffect(() => {
    if (initialized.current) return;
    const params = new URLSearchParams(search);
    const mode = params.get("mode");
    const stored = session ?? loadSession();
    if (!stored && mode === "quick") {
      startGame(quickConfig());
      initialized.current = true;
    } else if (!stored && mode === "daily") {
      startGame(dailyConfig());
      initialized.current = true;
    } else if (!stored) {
      setLocation("/sin-jeem");
    } else if (!session && stored) {
      updateSession(stored);
      initialized.current = true;
    } else {
      initialized.current = true;
    }
  }, [session, search, startGame, updateSession, setLocation]);

  useEffect(() => {
    if (!activeSession || activeSession.phase !== "playing" || activeSession.timerFrozen) return;
    const id = window.setInterval(() => tick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [activeSession?.phase, activeSession?.timerFrozen, activeSession?.currentIndex, activeSession?.timerStartedAt]);

  useEffect(() => {
    if (!activeSession || activeSession.phase !== "playing" || activeSession.timerFrozen) return;
    if (isTimerExpired(activeSession)) {
      updateSession(timeoutQuestion(activeSession));
      playWrongSound();
    }
  }, [activeSession, updateSession, tick]);

  const handleSelect = useCallback(
    (index: number) => {
      if (!activeSession || activeSession.phase !== "playing") return;
      setSelected(index);
      const next = submitAnswer(activeSession, index);
      updateSession(next);
      const correct = index === (getCurrentQuestion(activeSession)?.correct_index ?? 0);
      if (correct) {
        playCorrectSound();
        playScorePop();
      } else {
        playWrongSound();
      }
    },
    [activeSession, updateSession],
  );

  const handleLifeline = (type: LifelineType) => {
    if (!activeSession) return;
    const next = useLifeline(activeSession, type);
    updateSession(next);
  };

  const handleContinue = () => {
    if (!activeSession) return;
    if (activeSession.phase === "finished") {
      setLocation("/sin-jeem/results");
      return;
    }
    const next = nextQuestion(activeSession);
    updateSession(next);
    setSelected(null);
    if (next.phase === "finished") {
      setLocation("/sin-jeem/results");
    }
  };

  if (!activeSession) return null;

  const question = getCurrentQuestion(activeSession);
  const remaining = getRemainingSeconds(activeSession);
  const lifelines = activeSession.activeSide === "a" ? activeSession.lifelinesA : activeSession.lifelinesB;
  const revealed = activeSession.phase === "reveal";

  return (
    <GameLayout>
      <div style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--majalis-ink-soft)", marginBottom: "0.5rem" }}>
        سؤال {activeSession.currentIndex + 1} / {activeSession.questions.length}
        {activeSession.config.mode !== "solo" && (
          <> · دور {activeSession.activeSide === "a" ? activeSession.teamA.name : activeSession.teamB.name}</>
        )}
      </div>

      <ScoreBoard session={activeSession} />

      {activeSession.phase === "playing" && (
        <TimerRing total={activeSession.config.timerSeconds} remaining={remaining} frozen={activeSession.timerFrozen} />
      )}

      {question ? (
        <QuestionCard
          question={question}
          selectedIndex={selected}
          hiddenOptions={activeSession.hiddenOptions}
          revealed={revealed}
          onSelect={handleSelect}
          disabled={revealed}
        />
      ) : (
        <p style={{ textAlign: "center", color: "var(--majalis-ink-soft)", marginTop: "1rem" }}>
          لا توجد أسئلة متاحة — ارجع للصفحة الرئيسية وابدأ من جديد.
        </p>
      )}

      {activeSession.phase === "playing" && (
        <LifelineBar
          available={lifelines}
          onUse={handleLifeline}
          disabled={selected !== null}
        />
      )}

      {revealed && (
        <button type="button" className="sj-cta-primary" style={{ marginTop: "1.25rem" }} onClick={handleContinue}>
          {activeSession.currentIndex + 1 >= activeSession.questions.length ? "عرض النتائج 🏆" : "السؤال التالي →"}
        </button>
      )}
    </GameLayout>
  );
}
