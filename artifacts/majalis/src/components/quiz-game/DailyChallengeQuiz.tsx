/**
 * تحدي يومي تفاعلي لسين جيم — سؤال واحد لليوم، 4 اختيارات، شرح، حفظ محلي.
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

type DayAnswer = {
  choice: string;
  categoryId: string;
  level: LevelId;
};

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
const BEST_KEY = "majalis-daily-challenge-best-v1";
const ANSWERED_KEY = "majalis-daily-challenge-answered-v1";

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
    const best = Number(localStorage.getItem(BEST_KEY) || 0);
    if (n > best) localStorage.setItem(BEST_KEY, String(n));
  } catch {
    /* ignore */
  }
}

function loadBestScore(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

function loadDayAnswer(): DayAnswer | null {
  try {
    const raw = localStorage.getItem(`${ANSWERED_KEY}:${getDayIndex()}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DayAnswer;
    if (!parsed?.choice || !parsed.categoryId || !parsed.level) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDayAnswer(answer: DayAnswer) {
  try {
    localStorage.setItem(`${ANSWERED_KEY}:${getDayIndex()}`, JSON.stringify(answer));
  } catch {
    /* ignore */
  }
}

function explainFor(q: QuizQuestion, ok: boolean): string {
  const hint = q.hint?.trim();
  if (hint) return hint;
  const src = (q as QuizQuestion & { source?: string }).source?.trim();
  if (ok && src) return `الإجابة الصحيحة وفق المصدر: ${src}`;
  if (ok) return "أحسنت — الإجابة صحيحة.";
  return `الإجابة الصحيحة: ${q.a}`;
}

export function DailyChallengeQuiz() {
  const saved = useMemo(() => loadDayAnswer(), []);
  const [categoryId, setCategoryId] = useState(saved?.categoryId ?? CATEGORY_PICK[0]?.id ?? "quran");
  const [level, setLevel] = useState<LevelId>(saved?.level ?? "easy");
  const [picked, setPicked] = useState<string | null>(saved?.choice ?? null);
  const [score, setScore] = useState(() => loadDayScore());
  const [best, setBest] = useState(() => loadBestScore());
  const locked = picked != null;

  const points = LEVELS.find((l) => l.id === level)?.points ?? 200;

  const pool = useMemo(() => {
    const cat = ALL_QUESTIONS[categoryId];
    if (!cat) return [] as QuizQuestion[];
    return cat[points] ?? [];
  }, [categoryId, points]);

  const question = useMemo(() => {
    if (pool.length === 0) return null;
    const list = seededShuffle(pool, daySeed(categoryId.length));
    return list[0] ?? null;
  }, [pool, categoryId]);

  const choices = useMemo(() => {
    if (!question) return [];
    return buildChoices(question, pool, daySeed(13 + points));
  }, [question, pool, points]);

  const answered = picked != null;
  const correct = answered && question ? picked === question.a : false;

  const onPick = useCallback(
    (choice: string) => {
      if (picked || !question) return;
      setPicked(choice);
      saveDayAnswer({ choice, categoryId, level });
      const ok = choice === question.a;
      void hapticNotify(ok ? "success" : "error");
      void recordQuizAttempt(categoryId, question.id, ok, "daily_challenge");
      if (ok) {
        setScore((s) => {
          const next = Math.max(s, Math.round(points / 100));
          saveDayScore(next);
          setBest((b) => Math.max(b, next));
          return next;
        });
      }
    },
    [picked, question, categoryId, level, points],
  );

  return (
    <section className="dcq" dir="rtl" aria-label="التحدي اليومي" data-testid="daily-challenge-quiz">
      <header className="dcq__head">
        <div>
          <h2 className="dcq__title">التحدي اليومي</h2>
          <p className="dcq__sub">سؤال واحد لليوم · أربعة اختيارات · نقاط فورية</p>
        </div>
        <p className="dcq__score" aria-live="polite">
          النقاط اليوم: <strong>{toArabicDigits(score)}</strong>
          {best > 0 ? (
            <>
              {" "}
              · أفضل يوم: <strong>{toArabicDigits(best)}</strong>
            </>
          ) : null}
        </p>
      </header>

      <div className="dcq__filters" role="group" aria-label="القسم">
        {CATEGORY_PICK.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`dcq__chip${categoryId === c.id ? " is-active" : ""}`}
            disabled={locked}
            onClick={() => setCategoryId(c.id)}
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
            disabled={locked}
            onClick={() => setLevel(l.id)}
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
              <p className="dcq__explain">{explainFor(question, correct)}</p>
              <p className="dcq__source">{sourceLabel(question)}</p>
              <p className="dcq__done-note">سؤال اليوم اكتمل — عُد غدًا لسؤال جديد.</p>
            </div>
          )}
        </article>
      )}
    </section>
  );
}
