/**
 * Player progress, smart sessions, achievements — server-side (Supabase).
 */
import { buildSmartSession, adjustAdaptiveDifficulty } from "./sin-jeem-session-builder.mjs";
import { getProductionQuestionBank } from "./question-answer-bank.mjs";

const TITLES = [
  { minXp: 0, title: "طالب علم" },
  { minXp: 100, title: "متعلم نشيط" },
  { minXp: 500, title: "طالب متميز" },
  { minXp: 2000, title: "عالم مجتهد" },
  { minXp: 5000, title: "فقيه المجلس" },
];

function titleForXp(xp) {
  let t = TITLES[0].title;
  for (const row of TITLES) {
    if (xp >= row.minXp) t = row.title;
  }
  return t;
}

function levelForXp(xp) {
  return Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1);
}

function normalizeQuestion(row) {
  return {
    id: String(row.id),
    question: row.question,
    question_type: row.question_type || "multiple_choice",
    options: row.options,
    correct_index: row.correct_index,
    correct_answer: row.correct_answer,
    explanation: row.explanation,
    difficulty: row.difficulty || "متوسط",
    category_slug: row.subcategory_slug || row.category_slug || "",
    category_name: row.category_name,
    subcategory_slug: row.subcategory_slug,
    image_url: row.image_url,
    audio_url: row.audio_url,
    video_url: row.video_url,
    points: row.points,
  };
}

export async function fetchQuestionPool(admin, { limit = 2000 } = {}) {
  if (admin) {
    try {
      const { data, error } = await admin
        .from("sin_jeem_questions")
        .select(
          "id, question, question_type, options, correct_index, difficulty, subcategory_slug, explanation, points, image_url",
        )
        .eq("status", "published")
        .limit(limit);
      if (!error && data?.length) {
        return { pool: data.map(normalizeQuestion), source: "supabase" };
      }
    } catch {
      /* fall through */
    }
  }
  const bank = getProductionQuestionBank();
  return { pool: bank.map(normalizeQuestion), source: "bank_file" };
}

export async function fetchUserHistory(admin, userId) {
  if (!admin || !userId) return [];
  try {
    const { data } = await admin
      .from("sin_jeem_player_question_stats")
      .select("*")
      .eq("user_id", userId)
      .limit(5000);
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchOrCreateProfile(admin, userId, displayName) {
  if (!admin || !userId) return null;
  try {
    const { data: existing } = await admin
      .from("sin_jeem_player_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) return existing;

    const { data: created, error } = await admin
      .from("sin_jeem_player_profiles")
      .insert({
        user_id: userId,
        display_name: displayName || null,
      })
      .select("*")
      .single();
    if (error) return null;
    return created;
  } catch {
    return null;
  }
}

export async function getPlayerProgress(admin, userId) {
  const profile = await fetchOrCreateProfile(admin, userId);
  if (!profile) return { ok: false, error: "profile_unavailable" };

  let achievements = [];
  let categoryMastery = [];
  try {
    if (profile.player_id) {
      const { data: earned } = await admin
        .from("sin_jeem_player_achievements")
        .select("earned_at, achievement_id")
        .eq("player_id", profile.player_id);
      if (earned?.length) {
        const ids = earned.map((e) => e.achievement_id);
        const { data: defs } = await admin.from("sin_jeem_achievements").select("id, slug, name_ar, icon").in("id", ids);
        const defMap = new Map((defs || []).map((d) => [d.id, d]));
        achievements = earned.map((e) => {
          const d = defMap.get(e.achievement_id);
          return {
            slug: d?.slug,
            name_ar: d?.name_ar,
            icon: d?.icon,
            earned_at: e.earned_at,
          };
        });
      }
    }
    const { data: cats } = await admin
      .from("sin_jeem_category_mastery")
      .select("*")
      .eq("user_id", userId);
    categoryMastery = cats || [];
  } catch {
    /* tables may not exist yet */
  }

  return {
    ok: true,
    profile: {
      xp: profile.xp,
      level: profile.level,
      title: profile.title,
      completion_pct: Number(profile.completion_pct),
      mastery_score: Number(profile.mastery_score),
      accuracy_pct: Number(profile.accuracy_pct),
      avg_response_ms: profile.avg_response_ms,
      knowledge_rating: Number(profile.knowledge_rating),
      adaptive_difficulty: profile.adaptive_difficulty,
      daily_streak: profile.daily_streak,
      weekly_streak: profile.weekly_streak,
      monthly_streak: profile.monthly_streak,
      win_streak: profile.win_streak,
      questions_seen_total: profile.questions_seen_total,
      cycle_number: profile.cycle_number,
    },
    achievements,
    categoryMastery,
  };
}

async function ensurePlayerId(admin, userId, displayName) {
  const profile = await fetchOrCreateProfile(admin, userId, displayName);
  if (!profile) return null;
  if (profile.player_id) return { profile, playerId: profile.player_id };

  try {
    const { data: player, error } = await admin
      .from("sin_jeem_players")
      .insert({ display_name: displayName || profile.display_name || "لاعب" })
      .select("id")
      .single();
    if (error || !player) return { profile, playerId: null };
    await admin.from("sin_jeem_player_profiles").update({ player_id: player.id }).eq("user_id", userId);
    return { profile: { ...profile, player_id: player.id }, playerId: player.id };
  } catch {
    return { profile, playerId: null };
  }
}

function updateStreaks(profile, today) {
  const last = profile.last_played_date ? String(profile.last_played_date).slice(0, 10) : null;
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);

  let daily = profile.daily_streak || 0;
  if (last === today) {
    /* same day — keep */
  } else if (last === yStr) {
    daily += 1;
  } else {
    daily = 1;
  }

  return {
    daily_streak: daily,
    weekly_streak: daily >= 7 ? Math.floor(daily / 7) : profile.weekly_streak || 0,
    monthly_streak: daily >= 30 ? Math.floor(daily / 30) : profile.monthly_streak || 0,
    last_played_date: today,
  };
}

export async function buildSessionForUser(admin, userId, config) {
  const { pool, source } = await fetchQuestionPool(admin);
  const history = await fetchUserHistory(admin, userId);
  const profile = await fetchOrCreateProfile(admin, userId);
  const adaptiveDifficulty = profile?.adaptive_difficulty || config?.difficulty || "متوسط";
  const cycleNumber = profile?.cycle_number || 0;

  const result = buildSmartSession({
    pool,
    history,
    config: config || { questionCount: 10, difficulty: "متوسط", categorySlugs: [] },
    adaptiveDifficulty,
    cycleNumber,
  });

  if (profile && result.meta.allSeen) {
    try {
      await admin
        .from("sin_jeem_player_profiles")
        .update({ cycle_number: result.meta.cycleNumber, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    } catch {
      /* non-blocking */
    }
  }

  return {
    ok: true,
    questions: result.questions,
    meta: { ...result.meta, source: "api" },
    poolSource: source,
  };
}

export async function recordAnswerProgress(admin, payload) {
  const { userId, questionId, isCorrect, responseMs = 0, difficulty, categorySlug } = payload;
  if (!admin || !userId || !questionId) return { ok: false, error: "invalid_payload" };

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const { data: existing } = await admin
    .from("sin_jeem_player_question_stats")
    .select("*")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .maybeSingle();

  const attempts = (existing?.attempts || 0) + 1;
  const correctCount = (existing?.correct_count || 0) + (isCorrect === true ? 1 : 0);
  const wrongCount = (existing?.wrong_count || 0) + (isCorrect === false ? 1 : 0);
  const skipCount = (existing?.skip_count || 0) + (isCorrect === null ? 1 : 0);
  const prevAvg = existing?.avg_response_ms || 0;
  const avgResponseMs =
    responseMs > 0 ? Math.round((prevAvg * (attempts - 1) + responseMs) / attempts) : prevAvg;

  let mastery = existing?.mastery_level || 0;
  if (isCorrect === true) mastery = Math.min(5, mastery + 1);
  else if (isCorrect === false) mastery = Math.max(0, mastery - 1);

  const statsRow = {
    user_id: userId,
    question_id: questionId,
    first_shown_at: existing?.first_shown_at || now,
    last_shown_at: now,
    attempts,
    correct_count: correctCount,
    wrong_count: wrongCount,
    skip_count: skipCount,
    avg_response_ms: avgResponseMs,
    difficulty_reached: difficulty || existing?.difficulty_reached || "متوسط",
    mastery_level: mastery,
    cycle_seen: existing?.cycle_seen || 1,
  };

  await admin.from("sin_jeem_player_question_stats").upsert(statsRow, { onConflict: "user_id,question_id" });

  const { profile, playerId } = (await ensurePlayerId(admin, userId)) || {};
  if (!profile) return { ok: true, xpGained: 0 };

  const xpGain = isCorrect === true ? 12 : isCorrect === false ? 3 : 1;
  const newXp = (profile.xp || 0) + xpGain;
  const isNewQuestion = !existing;
  const totalSeen = (profile.questions_seen_total || 0) + (isNewQuestion ? 1 : 0);

  const { pool } = await fetchQuestionPool(admin);
  const completionPct = pool.length > 0 ? Math.min(100, (totalSeen / pool.length) * 100) : 0;

  const allStats = await fetchUserHistory(admin, userId);
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalMs = 0;
  let totalAtt = 0;
  let masterySum = 0;
  for (const s of allStats) {
    totalCorrect += s.correct_count || 0;
    totalWrong += s.wrong_count || 0;
    totalAtt += s.attempts || 0;
    totalMs += (s.avg_response_ms || 0) * (s.attempts || 0);
    masterySum += s.mastery_level || 0;
  }
  const accuracyPct = totalAtt > 0 ? (totalCorrect / totalAtt) * 100 : 0;
  const avgMs = totalAtt > 0 ? Math.round(totalMs / totalAtt) : 0;
  const masteryScore = allStats.length > 0 ? (masterySum / allStats.length) * 20 : 0;

  let knowledgeRating = Number(profile.knowledge_rating) || 1000;
  if (isCorrect === true) knowledgeRating += 8;
  else if (isCorrect === false) knowledgeRating -= 5;
  knowledgeRating = Math.max(800, Math.min(2200, knowledgeRating));

  const recentAcc = totalAtt > 0 ? totalCorrect / totalAtt : 0.5;
  const newAdaptive = adjustAdaptiveDifficulty(profile.adaptive_difficulty, recentAcc);
  const streaks = updateStreaks(profile, today);

  const updatedProfile = {
    xp: newXp,
    level: levelForXp(newXp),
    title: titleForXp(newXp),
    completion_pct: Math.round(completionPct * 100) / 100,
    mastery_score: Math.round(masteryScore * 100) / 100,
    accuracy_pct: Math.round(accuracyPct * 100) / 100,
    avg_response_ms: avgMs,
    knowledge_rating: knowledgeRating,
    adaptive_difficulty: newAdaptive,
    questions_seen_total: totalSeen,
    updated_at: now,
    ...streaks,
  };

  await admin.from("sin_jeem_player_profiles").update(updatedProfile).eq("user_id", userId);

  if (categorySlug) {
    try {
      const catTotal = pool.filter((q) => (q.category_slug || "").includes(categorySlug.split("-")[0])).length || 1;
      const catSeen = allStats.filter((s) => {
        const q = pool.find((p) => p.id === s.question_id);
        return q && (q.category_slug || "").includes(categorySlug.split("-")[0]);
      }).length;
      await admin.from("sin_jeem_category_mastery").upsert(
        {
          user_id: userId,
          category_slug: categorySlug.split("-")[0],
          questions_seen: catSeen,
          questions_total: catTotal,
          completion_pct: Math.min(100, (catSeen / catTotal) * 100),
          mastery_score: masteryScore,
          updated_at: now,
        },
        { onConflict: "user_id,category_slug" },
      );
    } catch {
      /* non-blocking */
    }
  }

  const unlocked = playerId
    ? await checkAndUnlockAchievements(admin, playerId, {
        ...profile,
        ...updatedProfile,
        totalCorrect,
        totalWrong,
        avgMs,
        perfectRound: false,
      })
    : [];

  return { ok: true, xpGained: xpGain, profile: updatedProfile, unlocked };
}

export async function checkAndUnlockAchievements(admin, playerId, stats) {
  if (!admin || !playerId) return [];
  const unlocked = [];

  try {
    const { data: allAch } = await admin.from("sin_jeem_achievements").select("id, slug, points_required");
    const { data: earned } = await admin
      .from("sin_jeem_player_achievements")
      .select("achievement_id")
      .eq("player_id", playerId);
    const earnedSet = new Set((earned || []).map((e) => e.achievement_id));

    const rules = [
      { slug: "first_question", test: () => (stats.totalCorrect || 0) + (stats.totalWrong || 0) >= 1 },
      { slug: "ten_correct", test: () => (stats.totalCorrect || 0) >= 10 },
      { slug: "hundred_correct", test: () => (stats.totalCorrect || 0) >= 100 },
      { slug: "thousand_correct", test: () => (stats.totalCorrect || 0) >= 1000 },
      { slug: "streak_7", test: () => (stats.daily_streak || 0) >= 7 },
      { slug: "streak_30", test: () => (stats.daily_streak || 0) >= 30 },
      { slug: "fast_thinker", test: () => (stats.avgMs || stats.avg_response_ms || 9999) < 5000 },
    ];

    for (const ach of allAch || []) {
      if (earnedSet.has(ach.id)) continue;
      const rule = rules.find((r) => r.slug === ach.slug);
      if (rule?.test()) {
        await admin.from("sin_jeem_player_achievements").insert({
          player_id: playerId,
          achievement_id: ach.id,
        });
        unlocked.push(ach.slug);
      } else if (!rule && ach.points_required > 0 && (stats.totalCorrect || 0) >= ach.points_required) {
        await admin.from("sin_jeem_player_achievements").insert({
          player_id: playerId,
          achievement_id: ach.id,
        });
        unlocked.push(ach.slug);
      }
    }
  } catch {
    /* achievements table may not exist */
  }

  return unlocked;
}

export async function recordMatchAchievements(admin, userId, matchStats) {
  const { playerId } = (await ensurePlayerId(admin, userId)) || {};
  if (!playerId) return [];
  return checkAndUnlockAchievements(admin, playerId, matchStats);
}
