import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { QA_ROUTES } from "@/lib/question-answer/routes";
import { recordAnswer } from "@/lib/question-bank-v2/user-progress";
import { recordGameXp } from "@/lib/question-bank-v2/gamification";
import { resolveMainCategory } from "@/lib/question-bank-v2/categories";
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
  const [reviewMode, setReviewMode] = useState(false);
  const [, tick] = useState(0);
  const initialized = useRef(false);
  const streakRef = useRef(0);

  const activeSession = session ?? loadSession();

  const progressPct = useMemo(() => {
    if (!activeSession) return 0;
    return Math.round(((activeSession.currentIndex + (activeSession.phase === "reveal" ? 1 : 0)) / activeSession.questions.length) * 100);
  }, [activeSession]);

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
      setLocation(QA_ROUTES.home);
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
      const q = getCurrentQuestion(activeSession);
      const correct = index === (q?.correct_index ?? 0);
      if (q) {
        recordAnswer(q.id, resolveMainCategory(q.category_slug), correct);
        recordGameXp(correct, streakRef.current);
        streakRef.current = correct ? streakRef.current + 1 : 0;
      }
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
    const isLast = activeSession.currentIndex + 1 >= activeSession.questions.length;
    if (isLast && activeSession.phase === "reveal" && !reviewMode) {
      setReviewMode(true);
      return;
    }
    if (activeSession.phase === "finished" || (isLast && reviewMode)) {
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

  if (!activeSession) return null;

  const question = getCurrentQuestion(activeSession);
  const remaining = getRemainingSeconds(activeSession);
  const lifelines = activeSession.activeSide === "a" ? activeSession.lifelinesA : activeSession.lifelinesB;
  const revealed = activeSession.phase === "reveal";

  if (reviewMode) {
    return (
      <GameLayout>
        <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>مراجعة الإجابات قبل الإرسال</h2>
        {activeSession.questions.map((q, i) => {
          const round = activeSession.rounds[i];
          const ok = round?.isCorrect === true;
          return (
            <div key={q.id} className={`sj-review-card ${ok ? "correct" : "wrong"}`}>
              <strong>{i + 1}. {q.question}</strong>
              <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                {ok ? "✓ صحيح" : "✗ خطأ"}
                {!ok && q.options && (
                  <> — الإجابة الصحيحة: {q.options[q.correct_index ?? 0]}</>
                )}
              </p>
              {q.explanation && <p className="sj-explanation">{q.explanation}</p>}
            </div>
          );
        })}
        <button type="button" className="sj-cta-primary" onClick={() => setLocation(QA_ROUTES.results)}>
          تأكيد وعرض النتائج 🏆
        </button>
      </GameLayout>
    );
  }

  return (
    <GameLayout>
      <div className="sj-progress-wrap">
        <div className="sj-progress-label">
          <span>التقدم</span>
          <span>{activeSession.currentIndex + 1} / {activeSession.questions.length}</span>
        </div>
        <div className="sj-progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="sj-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {activeSession.config.mode !== "solo" && (
        <div style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--majalis-ink-soft)", marginBottom: "0.5rem" }}>
          دور {activeSession.activeSide === "a" ? activeSession.teamA.name : activeSession.teamB.name}
        </div>
      )}

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

      {revealed && question?.explanation && (
        <p className="sj-explanation">{question.explanation}</p>
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
          {activeSession.currentIndex + 1 >= activeSession.questions.length ? "مراجعة الإجابات 📋" : "السؤال التالي →"}
        </button>
      )}
    </GameLayout>
  );
}
