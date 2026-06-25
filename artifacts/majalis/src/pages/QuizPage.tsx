import { useEffect, useMemo, useState } from "react";
import { getQuizQuestions } from "@/lib/supabase";
import { DEMO_QUIZ_QUESTIONS, type QuizQuestion } from "@/lib/quiz-seed";
import { isQuizAnswerCorrect, shuffleQuizQuestions } from "@/lib/quiz-utils";
import { demoNoticeText } from "@/lib/demo-content";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty, Chip, DemoNotice } from "@/components/ui-common";

type Phase = "setup" | "playing" | "done";

const QUESTION_COUNTS = [5, 10, 15, 20] as const;

function uniqueSections(items: QuizQuestion[]) {
  return [...new Set(items.map((q) => q.section))];
}

export default function QuizPage() {
  const [pool, setPool] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [section, setSection] = useState("الكل");
  const [count, setCount] = useState<number>(10);
  const [phase, setPhase] = useState<Phase>("setup");
  const [deck, setDeck] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    getQuizQuestions().then(({ data, error }) => {
      if (error || data.length === 0) {
        setPool(DEMO_QUIZ_QUESTIONS);
        setUsingDemo(true);
      } else {
        setPool(data);
        setUsingDemo(false);
      }
      setLoading(false);
    });
  }, []);

  const sections = useMemo(() => ["الكل", ...uniqueSections(pool)], [pool]);

  const filteredPool = useMemo(() => {
    if (section === "الكل") return pool;
    return pool.filter((q) => q.section === section);
  }, [pool, section]);

  const maxCount = filteredPool.length;
  const effectiveCount = Math.min(count, maxCount);

  const startQuiz = () => {
    if (filteredPool.length === 0) return;
    const picked = shuffleQuizQuestions(filteredPool).slice(0, effectiveCount);
    setDeck(picked);
    setIndex(0);
    setInput("");
    setRevealed(false);
    setScore(0);
    setPhase("playing");
  };

  const checkAnswer = () => {
    if (revealed || !deck[index]) return;
    const ok = isQuizAnswerCorrect(input, deck[index].answer);
    setCorrect(ok);
    if (ok) setScore((s) => s + 1);
    setRevealed(true);
  };

  const nextQuestion = () => {
    if (index + 1 >= deck.length) {
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setInput("");
    setRevealed(false);
    setCorrect(false);
  };

  const reset = () => {
    setPhase("setup");
    setDeck([]);
    setIndex(0);
    setInput("");
    setRevealed(false);
    setScore(0);
  };

  const current = deck[index];
  const progress = deck.length ? ((index + (revealed ? 1 : 0)) / deck.length) * 100 : 0;

  if (loading) return <Loading />;

  return (
    <div className="page-shell narrow">
      <PageHeader
        eyebrow="اختبر معلوماتك"
        title="المسابقات الشرعية"
        subtitle="أسئلة تعليمية في الأنبياء والصحابة والسيرة والأحكام والصالحين — اختر القسم وابدأ."
      />

      {usingDemo && <DemoNotice text={demoNoticeText("المسابقات")} />}

      {phase === "setup" && (
        <>
          <div className="page-chip-row">
            {sections.map((s) => (
              <Chip key={s} active={section === s} onClick={() => setSection(s)}>{s}</Chip>
            ))}
          </div>

          <p className="page-meta" style={{ marginBottom: "0.75rem" }}>
            {filteredPool.length} سؤال متاح{section !== "الكل" ? ` في «${section}»` : ""}
          </p>

          <div className="page-chip-row compact">
            {QUESTION_COUNTS.filter((n) => n <= maxCount).map((n) => (
              <Chip key={n} active={count === n} onClick={() => setCount(n)}>{n} أسئلة</Chip>
            ))}
            {maxCount > 20 && (
              <Chip active={count >= maxCount} onClick={() => setCount(maxCount)}>الكل ({maxCount})</Chip>
            )}
          </div>

          {filteredPool.length === 0 ? (
            <Empty text="لا توجد أسئلة في هذا القسم." />
          ) : (
            <button
              type="button"
              onClick={startQuiz}
              className="page-action-btn"
              style={{ width: "100%", marginTop: "1.5rem", padding: "0.875rem", fontSize: "1rem" }}
            >
              ابدأ المسابقة ({effectiveCount} {effectiveCount === 1 ? "سؤال" : "أسئلة"})
            </button>
          )}
        </>
      )}

      {phase === "playing" && current && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ height: 8, borderRadius: 999, background: C.line, overflow: "hidden", marginBottom: "1.25rem" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: C.emerald, transition: "width 0.25s ease" }} />
          </div>

          <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginBottom: "0.5rem" }}>
            السؤال {index + 1} من {deck.length} · {current.section} / {current.category}
          </p>

          <div style={{ padding: "1.25rem", borderRadius: "0.75rem", border: `1px solid ${C.line}`, background: C.panel, marginBottom: "1rem" }}>
            <p style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep, lineHeight: 1.8 }}>
              {current.question}
            </p>
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (revealed ? nextQuestion() : checkAnswer())}
            disabled={revealed}
            placeholder="اكتب إجابتك..."
            className="page-search-input full"
            style={{ marginBottom: "0.75rem" }}
          />

          {!revealed ? (
            <button type="button" onClick={checkAnswer} disabled={!input.trim()} className="page-action-btn" style={{ width: "100%" }}>
              تحقق من الإجابة
            </button>
          ) : (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div style={{
                padding: "1rem",
                borderRadius: "0.5rem",
                background: correct ? "#D1FAE5" : "#FEE2E2",
                border: `1px solid ${correct ? C.emerald : "#fca5a5"}`,
                color: correct ? C.emeraldDeep : "#991B1B",
                fontWeight: 600,
              }}>
                {correct ? "إجابة صحيحة — بارك الله فيك!" : `الإجابة الصحيحة: ${current.answer}`}
              </div>
              <button type="button" onClick={nextQuestion} className="page-action-btn" style={{ width: "100%" }}>
                {index + 1 >= deck.length ? "عرض النتيجة" : "السؤال التالي ←"}
              </button>
            </div>
          )}

          <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.8125rem", color: C.inkSoft }}>
            النتيجة الحالية: {score} / {index + (revealed ? 1 : 0)}
          </p>
        </div>
      )}

      {phase === "done" && (
        <div style={{ textAlign: "center", marginTop: "2rem", padding: "2rem 1rem", borderRadius: "1rem", border: `1px solid ${C.line}`, background: C.panel }}>
          
          <h2 style={{ margin: "0 0 0.5rem", color: C.emeraldDeep }}>انتهت المسابقة</h2>
          <p style={{ fontSize: "2rem", fontWeight: 700, color: C.emerald, margin: "0.5rem 0 1.5rem" }}>
            {score} / {deck.length}
          </p>
          <p style={{ color: C.inkSoft, marginBottom: "1.5rem" }}>
            {score === deck.length
              ? "ممتاز! إجاباتك كلها صحيحة."
              : score >= deck.length * 0.7
                ? "أحسنت! استمر في المراجعة."
                : "لا بأس — راجع الأسئلة وحاول مجدداً."}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={startQuiz} className="page-action-btn">إعادة نفس المسابقة</button>
            <button type="button" onClick={reset} className="page-toggle-btn">← إعدادات جديدة</button>
          </div>
        </div>
      )}
    </div>
  );
}
