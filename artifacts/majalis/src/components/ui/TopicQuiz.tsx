import { useState, useMemo } from "react";
import { Brain, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import {
  getQuestionsFor,
  resolveQuizSectionId,
  type AffinityQuizQuestion,
} from "@/lib/quiz-content-affinity";
import { recordQuizAttempt } from "@/lib/quiz-performance-service";
import { hapticNotify } from "@/lib/capacitor-utils";
import "@/styles/components/section-quiz.css";
import "@/styles/pages/misc-page-legacy.css";

interface QuizBodyProps {
  questions: AffinityQuizQuestion[];
  onRefresh: () => void;
}

function QuizBody({ questions, onRefresh }: QuizBodyProps) {
  const [revealed, setRevealed] = useState<boolean[]>(() => questions.map(() => false));
  const [scores, setScores] = useState<(boolean | null)[]>(() => questions.map(() => null));

  const reveal = (i: number) =>
    setRevealed((prev) => {
      const n = [...prev];
      n[i] = true;
      return n;
    });
  const mark = (i: number, correct: boolean) => {
    setScores((prev) => {
      const n = [...prev];
      n[i] = correct;
      return n;
    });
    void recordQuizAttempt(questions[i]!.sectionId, questions[i]!.id, correct, "section_quiz");
    void hapticNotify(correct ? "success" : "error");
  };

  const allDone = scores.every((s) => s !== null);
  const correctCount = scores.filter(Boolean).length;

  return (
    <div className="sq-body">
      {questions.map((q, i) => (
        <div
          key={q.id}
          className={`sq-card${scores[i] === true ? " sq-card--correct" : scores[i] === false ? " sq-card--wrong" : ""}`}
        >
          <p className="sq-question">
            {i + 1}. {q.q}
          </p>

          {!revealed[i] ? (
            <button type="button" className="sq-reveal-btn" onClick={() => reveal(i)}>
              اظهر الإجابة
            </button>
          ) : (
            <>
              <div className="sq-answer">
                <span className="sq-answer-label">الإجابة:</span>
                <span className="sq-answer-text">{q.a}</span>
              </div>
              {q.hint && <p className="sq-hint">💡 {q.hint}</p>}
              {scores[i] === null ? (
                <div className="sq-score-btns">
                  <button type="button" className="sq-btn sq-btn--correct" onClick={() => mark(i, true)}>
                    <CheckCircle2 size={15} aria-hidden="true" /> أجبت صح
                  </button>
                  <button type="button" className="sq-btn sq-btn--wrong" onClick={() => mark(i, false)}>
                    <XCircle size={15} aria-hidden="true" /> أجبت غلط
                  </button>
                </div>
              ) : (
                <span className={`sq-score-badge sq-score-badge--${scores[i] ? "correct" : "wrong"}`}>
                  {scores[i] ? "✓ صح" : "✗ غلط"}
                </span>
              )}
            </>
          )}
        </div>
      ))}

      {allDone && (
        <div className="sq-summary">
          <p className="sq-summary-score">
            {correctCount} / {questions.length} إجابة صحيحة
            {correctCount === questions.length && " 🎉"}
          </p>
          <button type="button" className="sq-refresh-btn" onClick={onRefresh}>
            <RotateCcw size={15} aria-hidden="true" /> أسئلة جديدة
          </button>
        </div>
      )}
    </div>
  );
}

export interface TopicQuizProps {
  /** معرّف القسم من sections.registry */
  sectionId?: string;
  /** مسار الصفحة — يُحل إلى sectionId عند غياب sectionId */
  route?: string;
  lessonId?: string;
  title?: string;
  count?: number;
}

/**
 * بطاقة «اختبر معلوماتك» الموحّدة — تُستدعى من SectionLobby وصفحات الدروس.
 * بلا أسئلة للكيان → null (لا fallback عام).
 */
export function TopicQuiz({
  sectionId,
  route,
  lessonId,
  title = "اختبر معلوماتك",
  count = 4,
}: TopicQuizProps) {
  const resolvedSectionId = useMemo(
    () => resolveQuizSectionId({ sectionId, route }),
    [sectionId, route],
  );
  const [seed, setSeed] = useState(0);
  const questions = useMemo(
    () =>
      resolvedSectionId
        ? getQuestionsFor({ sectionId: resolvedSectionId, lessonId, count })
        : [],
    [resolvedSectionId, lessonId, count, seed],
  );
  const [expanded, setExpanded] = useState(false);

  if (questions.length === 0) return null;

  const toggle = () =>
    setExpanded((e) => {
      if (!e) setSeed((s) => s + 1);
      return !e;
    });

  return (
    <section className="sq-section" dir="rtl" aria-label={title}>
      <div
        className="sq-header"
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle()}
      >
        <div className="sq-header-content">
          <Brain size={20} aria-hidden="true" />
          <h2 className="sq-title">{title}</h2>
        </div>
        <span className="sq-toggle" aria-hidden="true">
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <QuizBody key={seed} questions={questions} onRefresh={() => setSeed((s) => s + 1)} />
      )}
    </section>
  );
}
