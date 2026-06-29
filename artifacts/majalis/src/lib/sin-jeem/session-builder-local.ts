/**
 * Client-side mirror of smart session builder (guest fallback + offline).
 * Uses same algorithm as lib/sin-jeem-session-builder.mjs
 */
import { getAllSinJeemQuestions } from "./questions-bank";
import type { MatchConfig, SinJeemQuestion } from "./types";
import type { QuestionHistoryRow, SessionBuildMeta } from "./session-builder";

const DIFFICULTY_ORDER = ["مبتدئ", "سهل", "متوسط", "متقدم", "خبير"] as const;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function difficultyIndex(d?: string) {
  const i = DIFFICULTY_ORDER.indexOf((d || "متوسط") as (typeof DIFFICULTY_ORDER)[number]);
  return i >= 0 ? i : 2;
}

function shuffleOptions(q: SinJeemQuestion): SinJeemQuestion {
  if (!q.options?.length || q.correct_index == null) return q;
  const indexed = q.options.map((opt, i) => ({ opt, i }));
  const shuffled = shuffle(indexed);
  const newCorrect = shuffled.findIndex((x) => x.i === q.correct_index);
  return { ...q, options: shuffled.map((x) => x.opt), correct_index: newCorrect };
}

export function buildSmartSessionLocal(
  config: MatchConfig,
  history: QuestionHistoryRow[],
  adaptiveDifficulty = "متوسط",
  cycleNumber = 0,
): { questions: SinJeemQuestion[]; meta: Omit<SessionBuildMeta, "source"> } {
  const pool = getAllSinJeemQuestions();
  const historyMap = new Map(history.map((h) => [h.question_id, h]));
  const targetCount = config.questionCount || 10;
  const categoryFilter = config.categorySlugs?.length ? new Set(config.categorySlugs) : null;

  let eligible = pool.filter((q) => {
    if (!q?.id || !q?.question?.trim()) return false;
    if (categoryFilter && !categoryFilter.has(q.category_slug || "")) return false;
    return true;
  });

  const targetDiff = config.difficulty !== "متوسط" ? config.difficulty : adaptiveDifficulty;
  const diffFiltered = eligible.filter((q) => q.difficulty === targetDiff);
  if (diffFiltered.length >= Math.min(targetCount, 5)) eligible = diffFiltered;

  const now = Date.now();
  const seenIds = new Set(historyMap.keys());
  const neverSeen = eligible.filter((q) => !seenIds.has(q.id) || (historyMap.get(q.id)?.attempts || 0) === 0);
  const allSeen = neverSeen.length === 0 && eligible.length > 0 && eligible.every((q) => seenIds.has(q.id));

  const picked: SinJeemQuestion[] = [];
  const usedIds = new Set<string>();

  const add = (q: SinJeemQuestion) => {
    if (picked.length >= targetCount || usedIds.has(q.id)) return;
    usedIds.add(q.id);
    picked.push(q);
  };

  if (allSeen) {
    const incorrectCooldown = eligible.filter((q) => {
      const h = historyMap.get(q.id);
      if (!h || !(h.wrong_count || 0)) return false;
      const last = h.last_shown_at ? new Date(h.last_shown_at).getTime() : 0;
      return now - last >= COOLDOWN_MS;
    });
    const weak = eligible.filter((q) => {
      const h = historyMap.get(q.id);
      return h && (h.mastery_level || 0) <= 2 && (h.attempts || 0) > 0;
    });
    const review = eligible.filter((q) => (historyMap.get(q.id)?.mastery_level || 0) >= 3);
    const slots = {
      weak: Math.max(0, Math.round(targetCount * 0.3)),
      review: Math.max(0, Math.round(targetCount * 0.2)),
    };
    let n = slots.weak;
    for (const q of shuffle(incorrectCooldown.length ? incorrectCooldown : weak)) {
      add(q);
      if (--n <= 0) break;
    }
    n = slots.review;
    for (const q of shuffle(review)) add(q);
    const sorted = shuffle(
      [...eligible].sort((a, b) => {
        const ha = historyMap.get(a.id);
        const hb = historyMap.get(b.id);
        return (ha?.mastery_level ?? 0) - (hb?.mastery_level ?? 0);
      }),
    );
    for (const q of sorted) add(q);
  } else {
    for (const q of shuffle(neverSeen)) add(q);
  }

  return {
    questions: shuffle(picked.slice(0, targetCount)).map(shuffleOptions),
    meta: {
      adaptiveDifficulty: targetDiff,
      cycleNumber: allSeen ? cycleNumber + 1 : cycleNumber,
      allSeen,
    },
  };
}

export function verifySessionNoRepeat(
  sessionIds: string[],
  priorSeenIds: string[],
  poolSize: number,
): boolean {
  const seen = new Set(priorSeenIds);
  if (new Set(sessionIds).size !== sessionIds.length) return false;
  if (seen.size < poolSize) return sessionIds.every((id) => !seen.has(id));
  return true;
}
