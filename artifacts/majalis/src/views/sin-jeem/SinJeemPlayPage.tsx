import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/components/AuthProvider";
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
import { recordAnswerProgress } from "@/lib/sin-jeem/session-builder";
import type { LifelineType } from "@/lib/sin-jeem/types";
import {
  playCorrectSound,
  playScorePop,
  playWrongSound,
} from "@/lib/sin-jeem/sounds";
import { QA_ROUTES } from "@/lib/question-answer/routes";
import { SjIcon } from "@/components/sin-jeem/SjIcon";
import { GameLayout } from "./components/GameLayout";
import { ScoreBoard } from "./components/ScoreBoard";
import { TimerRing } from "./components/TimerRing";
import { QuestionCard } from "./components/QuestionCard";
import { LifelineBar } from "./components/LifelineBar";

export default function SinJeemPlayPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { session, updateSession, startGame, starting } = useGame();
  const [selected, setSelected] = useState<number | null>(null);
  const [, tick] = useState(0);
  const initialized = useRef(false);
  const recordedRounds = useRef(new Set<number>());

  const activeSession = session ?? loadSession();

  useEffect(() => {
    if (initialized.current || starting) return;
    const params = new URLSearchParams(search);
    const mode = params.get("mode");
    const stored = session ?? loadSession();
    if (!stored && mode === "quick") {
      void startGame(quickConfig()).then(() => {
        initialized.current = true;
      });
    } else if (!stored && mode === "daily") {
      void startGame(dailyConfig()).then(() => {
        initialized.current = true;
      });
    } else if (!stored) {
      setLocation(QA_ROUTES.home);
    } else if (!session && stored) {
      updateSession(stored);
      initialized.current = true;
    } else {
      initialized.current = true;
    }
  }, [session, search, startGame, updateSession, setLocation, starting]);

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

  const syncAnswerProgress = useCallback(
    (roundIndex: number, isCorrect: boolean | null, responseMs: number, questionId: string, categorySlug?: string, difficulty?: string) => {
      if (!user?.id || recordedRounds.current.has(roundIndex)) return;
      recordedRounds.current.add(roundIndex);
      void recordAnswerProgress({
        userId: user.id,
        questionId,
        isCorrect,
        responseMs,
        categorySlug,
        difficulty,
      });
    },
    [user?.id],
  );

  const handleSelect = useCallback(
    (index: number) => {
      if (!activeSession || activeSession.phase !== "playing") return;
      setSelected(index);
      const question = getCurrentQuestion(activeSession);
      const next = submitAnswer(activeSession, index);
      updateSession(next);
      const correct = index === (question?.correct_index ?? 0);
      if (correct) {
        playCorrectSound();
        playScorePop();
      } else {
        playWrongSound();
      }
      const lastRound = next.rounds[next.rounds.length - 1];
      if (question && lastRound) {
        syncAnswerProgress(
          next.rounds.length - 1,
          lastRound.isCorrect,
          lastRound.responseMs,
          question.id,
          question.category_slug,
          question.difficulty,
        );
      }
    },
    [activeSession, updateSession, syncAnswerProgress],
  );

  useEffect(() => {
    if (!activeSession || activeSession.phase !== "reveal") return;
    const lastRound = activeSession.rounds[activeSession.rounds.length - 1];
    const question = getCurrentQuestion(activeSession);
    if (!lastRound || !question || lastRound.selectedIndex !== null) return;
    if (recordedRounds.current.has(activeSession.rounds.length - 1)) return;
    syncAnswerProgress(
      activeSession.rounds.length - 1,
      null,
      lastRound.responseMs,
      question.id,
      question.category_slug,
      question.difficulty,
    );
  }, [activeSession, syncAnswerProgress]);

  const handleLifeline = (type: LifelineType) => {
    if (!activeSession) return;
    const next = useLifeline(activeSession, type);
    updateSession(next);
  };

  const handleContinue = () => {
    if (!activeSession) return;
    if (activeSession.phase === "finished") {
      setLocation(QA_ROUTES.results);
      return;
    }
    const next = nextQuestion(activeSession);
    updateSession(next);
    setSelected(null);
    if (next.phase === "finished") {
      setLocation(QA_ROUTES.results);
    }
  };

  if (!activeSession || starting) {
    return (
      <GameLayout>
        <p className="sj-loading-state">
          <span className="sj-pulse-dot" />
          جاري بناء جلستك الذكية…
        </p>
      </GameLayout>
    );
  }

  const question = getCurrentQuestion(activeSession);
  const remaining = getRemainingSeconds(activeSession);
  const lifelines = activeSession.activeSide === "a" ? activeSession.lifelinesA : activeSession.lifelinesB;
  const revealed = activeSession.phase === "reveal";

  return (
    <GameLayout>
      <div className="sj-question-meta">
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
        <button type="button" className="sj-cta-primary sj-btn-animate" style={{ marginTop: "1.25rem" }} onClick={handleContinue}>
          {activeSession.currentIndex + 1 >= activeSession.questions.length ? (
            <>
              عرض النتائج
              <SjIcon name="trophy" size={18} />
            </>
          ) : (
            <>
              السؤال التالي
              <SjIcon name="arrow-left" size={18} />
            </>
          )}
        </button>
      )}
    </GameLayout>
  );
}
