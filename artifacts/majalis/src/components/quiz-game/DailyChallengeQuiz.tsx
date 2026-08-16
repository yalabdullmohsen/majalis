/**
 * تحدي يومي تفاعلي لسين جيم — سؤال واحد، 4 اختيارات، نقاط، مصدر إن وُجد.
 */
import { useCallback, useMemo, useState } from "react";
import {
  ALL_QUESTIONS,
  GAME_CATEGORIES,
  type PointValue,
  type QuizQuestion,
} from "@/data/islamicQuizData";
import { getDayIndex } from "@/lib/daily-content";
import { recordQuizAttempt } from "@/lib/quiz-performance-service";
import { hapticNotify } from "@/lib/capacitor-utils";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/components/daily-challenge-quiz.css";

type LevelId = "easy" | "medium" | "hard";

const LEVELS: { id: LevelId; label: string; points: PointValue }[] = [
  { id: "easy", label: "سهل", points: 200 },
  { id: "medium", label: "متوسط", points: 400 },
  { id: "hard", label: "صعب", points: 600 },
];

const CATEGORY_PICK = GAME_CATEGORIES.filter((c) =>
  ["quran", "sira", "anbiya", "fiqh", "hadith", "tarikh"].includes(c.id),
);

function daySeed(extra = 0): number {
  return getDayIndex() * 97 + extra;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildChoices(q: QuizQuestion, pool: QuizQuestion[], seed: number): string[] {
  const distractors = pool
    .filter((x) => x.id !== q.id && x.a.trim() !== q.a.trim())
    .map((x) => x.a);
  const unique = Array.from(new Set(distractors));
  const picked = seededShuffle(unique, seed).slice(0, 3);
  while (picked.length < 3) picked.push(`خيار ${picked.length + 2}`);
  return seededShuffle([q.a, ...picked], seed + 11);
}

function sourceLabel(q: QuizQuestion): string {
  const src = (q as QuizQuestion & { source?: string }).source?.trim();
  if (src) return src;
  return "قيد إضافة المصدر";
}

const SCORE_KEY = "majalis-daily-challenge-score-v1";

function loadDayScore(): number {
  try {
    const raw = localStorage.getItem(`${SCORE_KEY}:${getDayIndex()}`);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

function saveDayScore(n: number) {
  try {
    localStorage.setItem(`${SCORE_KEY}:${getDayIndex()}`, String(n));
  } catch {
    /* ignore */
  }
}

export function DailyChallengeQuiz() {
  const [categoryId, setCategoryId] = useState(CATEGORY_PICK[0]?.id ?? "quran");
  const [level, setLevel] = useState<LevelId>("easy");
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(() => loadDayScore());

  const points = LEVELS.find((l) => l.id === level)?.points ?? 200;

  const pool = useMemo(() => {
    const cat = ALL_QUESTIONS[categoryId];
    if (!cat) return [] as QuizQuestion[];
    return cat[points] ?? [];
  }, [categoryId, points]);

  const question = useMemo(() => {
    if (pool.length === 0) return null;
    const list = seededShuffle(pool, daySeed(round + categoryId.length));
    return list[0] ?? null;
  }, [pool, round, categoryId]);

  const choices = useMemo(() => {
    if (!question) return [];
    return buildChoices(question, pool, daySeed(round * 13 + points));
  }, [question, pool, round, points]);

  const answered = picked != null;
  const correct = answered && question ? picked === question.a : false;

  const onPick = useCallback(
    (choice: string) => {
      if (picked || !question) return;
      setPicked(choice);
      const ok = choice === question.a;
      void hapticNotify(ok ? "success" : "error");
      void recordQuizAttempt(categoryId, question.id, ok, "daily_challenge");
      if (ok) {
        setScore((s) => {
          const next = s + Math.round(points / 100);
          saveDayScore(next);
          return next;
        });
      }
    },
    [picked, question, categoryId, points],
  );

  const nextQuestion = () => {
    setPicked(null);
    setRound((r) => r + 1);
  };

  return (
    <section className="dcq" dir="rtl" aria-label="التحدي اليومي" data-testid="daily-challenge-quiz">
      <header className="dcq__head">
        <div>
          <h2 className="dcq__title">التحدي اليومي</h2>
          <p className="dcq__sub">سؤال واحد · أربعة اختيارات · نقاط فورية</p>
        </div>
        <p className="dcq__score" aria-live="polite">
          النقاط اليوم: <strong>{toArabicDigits(score)}</strong>
        </p>
      </header>

      <div className="dcq__filters" role="group" aria-label="القسم">
        {CATEGORY_PICK.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`dcq__chip${categoryId === c.id ? " is-active" : ""}`}
            onClick={() => {
              setCategoryId(c.id);
              setPicked(null);
              setRound((r) => r + 1);
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="dcq__filters" role="group" aria-label="المستوى">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`dcq__chip${level === l.id ? " is-active" : ""}`}
            onClick={() => {
              setLevel(l.id);
              setPicked(null);
              setRound((r) => r + 1);
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      {!question ? (
        <p className="dcq__empty">لا توجد أسئلة في هذا المستوى حاليًا.</p>
      ) : (
        <article className="dcq__card mj-card">
          <p className="dcq__question">{question.q}</p>
          <ul className="dcq__choices">
            {choices.map((c) => {
              let cls = "dcq__choice";
              if (answered) {
                if (c === question.a) cls += " is-correct";
                else if (c === picked) cls += " is-wrong";
              }
              return (
                <li key={c}>
                  <button
                    type="button"
                    className={cls}
                    disabled={answered}
                    onClick={() => onPick(c)}
                  >
                    {c}
                  </button>
                </li>
              );
            })}
          </ul>

          {answered && (
            <div className="dcq__feedback" role="status">
              <p className={correct ? "dcq__ok" : "dcq__bad"}>
                {correct ? "إجابة صحيحة" : "إجابة غير صحيحة"}
              </p>
              {question.hint ? <p className="dcq__explain">{question.hint}</p> : null}
              <p className="dcq__source">{sourceLabel(question)}</p>
              <button type="button" className="dcq__next" onClick={nextQuestion}>
                السؤال التالي
              </button>
            </div>
          )}
        </article>
      )}
    </section>
  );
}
