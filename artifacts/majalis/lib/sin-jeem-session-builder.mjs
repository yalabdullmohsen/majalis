/**
 * Smart session builder — zero-repeat, adaptive, 40/30/20/10 mix.
 */

const DIFFICULTY_ORDER = ["مبتدئ", "سهل", "متوسط", "متقدم", "خبير"];
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function difficultyIndex(d) {
  const i = DIFFICULTY_ORDER.indexOf(d || "متوسط");
  return i >= 0 ? i : 2;
}

export function adjustAdaptiveDifficulty(current, recentAccuracy) {
  const idx = difficultyIndex(current);
  if (recentAccuracy >= 0.85 && idx < DIFFICULTY_ORDER.length - 1) {
    return DIFFICULTY_ORDER[idx + 1];
  }
  if (recentAccuracy <= 0.45 && idx > 0) {
    return DIFFICULTY_ORDER[idx - 1];
  }
  return current || "متوسط";
}

export function shuffleQuestionOptions(q) {
  if (!q.options?.length || q.correct_index == null) return q;
  const indexed = q.options.map((opt, i) => ({ opt, i }));
  const shuffled = shuffle(indexed);
  const newCorrect = shuffled.findIndex((x) => x.i === q.correct_index);
  return {
    ...q,
    options: shuffled.map((x) => x.opt),
    correct_index: newCorrect,
  };
}

function computeRecentAccuracy(history) {
  if (!history?.length) return 0.5;
  const recent = history.slice(-20);
  let correct = 0;
  let total = 0;
  for (const h of recent) {
    correct += h.correct_count || 0;
    total += h.attempts || 0;
  }
  return total > 0 ? correct / total : 0.5;
}

export function buildSmartSession({ pool, history, config, adaptiveDifficulty = "متوسط", cycleNumber = 0 }) {
  const historyMap = new Map((history || []).map((h) => [h.question_id, h]));
  const targetCount = config.questionCount || 10;
  const categoryFilter = config.categorySlugs?.length ? new Set(config.categorySlugs) : null;

  let eligible = pool.filter((q) => {
    if (!q?.id || !q?.question?.trim()) return false;
    if (categoryFilter && !categoryFilter.has(q.category_slug || "")) return false;
    return true;
  });

  const targetDiff = config.difficulty !== "متوسط" ? config.difficulty : adaptiveDifficulty;
  const diffFiltered = eligible.filter((q) => q.difficulty === targetDiff);
  if (diffFiltered.length >= Math.min(targetCount, 5)) {
    eligible = diffFiltered;
  }

  const now = Date.now();
  const seenIds = new Set([...historyMap.keys()]);

  const neverSeen = eligible.filter((q) => !seenIds.has(q.id) || (historyMap.get(q.id)?.attempts || 0) === 0);
  const incorrectCooldown = eligible.filter((q) => {
    const h = historyMap.get(q.id);
    if (!h || (h.wrong_count || 0) === 0) return false;
    const last = h.last_shown_at ? new Date(h.last_shown_at).getTime() : 0;
    return now - last >= COOLDOWN_MS;
  });
  const weakTopics = eligible.filter((q) => {
    const h = historyMap.get(q.id);
    return h && (h.mastery_level || 0) <= 2 && (h.attempts || 0) > 0;
  });
  const challenge = eligible.filter((q) => difficultyIndex(q.difficulty) >= difficultyIndex(targetDiff) + 1);
  const review = eligible.filter((q) => {
    const h = historyMap.get(q.id);
    return h && (h.mastery_level || 0) >= 3;
  });

  const allSeen = neverSeen.length === 0 && eligible.length > 0 && eligible.every((q) => seenIds.has(q.id));
  const recyclingPool = allSeen
    ? shuffle(
        [...eligible].sort((a, b) => {
          const ha = historyMap.get(a.id);
          const hb = historyMap.get(b.id);
          const ma = ha?.mastery_level ?? 0;
          const mb = hb?.mastery_level ?? 0;
          if (ma !== mb) return ma - mb;
          const ta = ha?.last_shown_at ? new Date(ha.last_shown_at).getTime() : 0;
          const tb = hb?.last_shown_at ? new Date(hb.last_shown_at).getTime() : 0;
          return ta - tb;
        }),
      )
    : [];

  const slots = {
    new: Math.max(1, Math.round(targetCount * 0.4)),
    weak: Math.max(0, Math.round(targetCount * 0.3)),
    review: Math.max(0, Math.round(targetCount * 0.2)),
    challenge: Math.max(0, targetCount - Math.round(targetCount * 0.4) - Math.round(targetCount * 0.3) - Math.round(targetCount * 0.2)),
  };

  const picked = [];
  const usedIds = new Set();

  function takeFrom(source, n) {
    for (const q of shuffle(source)) {
      if (picked.length >= targetCount) break;
      if (usedIds.has(q.id)) continue;
      usedIds.add(q.id);
      picked.push(q);
      n--;
      if (n <= 0) break;
    }
  }

  if (allSeen) {
    takeFrom(incorrectCooldown, slots.weak);
    takeFrom(weakTopics, slots.weak);
    takeFrom(review, slots.review);
    takeFrom(challenge, slots.challenge);
    for (const q of recyclingPool) {
      if (picked.length >= targetCount) break;
      if (usedIds.has(q.id)) continue;
      usedIds.add(q.id);
      picked.push(q);
    }
    for (const q of shuffle(eligible)) {
      if (picked.length >= targetCount) break;
      if (usedIds.has(q.id)) continue;
      usedIds.add(q.id);
      picked.push(q);
    }
  } else {
    // First cycle: never repeat — only unseen questions
    for (const q of shuffle(neverSeen)) {
      if (picked.length >= targetCount) break;
      if (usedIds.has(q.id)) continue;
      usedIds.add(q.id);
      picked.push(q);
    }
  }

  const final = shuffle(picked.slice(0, targetCount)).map(shuffleQuestionOptions);

  return {
    questions: final,
    meta: {
      adaptiveDifficulty: adjustAdaptiveDifficulty(targetDiff, computeRecentAccuracy(history)),
      cycleNumber: allSeen ? cycleNumber + 1 : cycleNumber,
      allSeen,
      mix: slots,
    },
  };
}

export function verifyNoPrematureRepeat(sessionIds, priorSeenIds, poolSize) {
  const seen = new Set(priorSeenIds);
  const uniqueInSession = new Set(sessionIds);
  if (uniqueInSession.size !== sessionIds.length) return false;
  if (seen.size < poolSize) {
    return sessionIds.every((id) => !seen.has(id));
  }
  return true;
}
