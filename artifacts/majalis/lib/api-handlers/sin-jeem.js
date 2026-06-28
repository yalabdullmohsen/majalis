import { sendJson } from "../api/_http.mjs";
import { getEnvConfig } from "../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { requireAdminAccess } from "../../lib/admin-auth.mjs";
import { parseCsvQuestions, parseJsonQuestions, questionsToCsv, contentHash as importHash } from "../../lib/sin-jeem-import.mjs";
import { getProductionQuestionBank, getCategorySeedList } from "../../lib/question-answer-bank.mjs";
import { getGenerationDashboard, runDailyGeneration } from "../../lib/question-generation/pipeline.mjs";

const USED_HASHES = new Set();
const RATE_LIMIT = new Map();
const MAX_SCORE_PER_QUESTION = 50;
const MAX_QUESTIONS_PER_MATCH = 50;
const MAX_DURATION_MS = 3_600_000;

function hashText(t) {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return String(h);
}

function clientKey(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function rateLimit(key, max = 30, windowMs = 60_000) {
  const now = Date.now();
  const bucket = RATE_LIMIT.get(key) || { count: 0, reset: now + windowMs };
  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + windowMs;
  }
  bucket.count += 1;
  RATE_LIMIT.set(key, bucket);
  return bucket.count <= max;
}

function periodKey(period) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  if (period === "day") return `${y}-${m}-${d}`;
  if (period === "month") return `${y}-${m}`;
  if (period === "week") {
    const jan1 = new Date(Date.UTC(y, 0, 1));
    const week = Math.ceil(((now - jan1) / 86400000 + jan1.getUTCDay() + 1) / 7);
    return `${y}-W${String(week).padStart(2, "0")}`;
  }
  return "all";
}

function validateMatchPayload(body) {
  const teamAScore = Number(body.team_a_score);
  const teamBScore = Number(body.team_b_score);
  const totalQuestions = Number(body.total_questions);
  const durationMs = Number(body.duration_ms);
  const teamAName = String(body.team_a_name || "").trim().slice(0, 80);
  const teamBName = body.team_b_name ? String(body.team_b_name).trim().slice(0, 80) : null;

  if (!teamAName) return { ok: false, error: "invalid_team_a" };
  if (!Number.isFinite(teamAScore) || teamAScore < 0) return { ok: false, error: "invalid_score_a" };
  if (!Number.isFinite(teamBScore) || teamBScore < 0) return { ok: false, error: "invalid_score_b" };
  if (!Number.isFinite(totalQuestions) || totalQuestions < 1 || totalQuestions > MAX_QUESTIONS_PER_MATCH) {
    return { ok: false, error: "invalid_question_count" };
  }
  if (!Number.isFinite(durationMs) || durationMs < 1000 || durationMs > MAX_DURATION_MS) {
    return { ok: false, error: "invalid_duration" };
  }

  const maxAllowed = totalQuestions * MAX_SCORE_PER_QUESTION;
  if (teamAScore > maxAllowed || teamBScore > maxAllowed) {
    return { ok: false, error: "score_exceeds_cap" };
  }

  const teamACorrect = Number(body.team_a_correct) || 0;
  const teamBCorrect = Number(body.team_b_correct) || 0;
  if (teamACorrect > totalQuestions || teamBCorrect > totalQuestions) {
    return { ok: false, error: "correct_count_invalid" };
  }

  const mode = String(body.mode || "team_vs_team").slice(0, 32);
  const minScoreFromCorrect = 0;
  const maxScoreFromCorrect = totalQuestions * MAX_SCORE_PER_QUESTION;
  if (teamAScore < minScoreFromCorrect || teamBScore < minScoreFromCorrect) {
    return { ok: false, error: "score_below_min" };
  }
  if (teamACorrect + (Number(body.team_a_wrong) || 0) > totalQuestions) {
    return { ok: false, error: "team_a_stats_invalid" };
  }
  if (teamBCorrect + (Number(body.team_b_wrong) || 0) > totalQuestions) {
    return { ok: false, error: "team_b_stats_invalid" };
  }
  void maxScoreFromCorrect;

  return {
    ok: true,
    data: {
      sessionId: String(body.session_id || "").slice(0, 64),
      mode,
      teamAName,
      teamBName,
      teamAScore,
      teamBScore,
      teamACorrect,
      teamBCorrect,
      teamAWrong: Number(body.team_a_wrong) || 0,
      teamBWrong: Number(body.team_b_wrong) || 0,
      totalQuestions,
      durationMs,
      winner: body.winner,
    },
  };
}

async function upsertLeaderboardEntry(admin, { entityType, displayName, teamName, score, period, matchId }) {
  const pKey = periodKey(period);
  const { data: existing } = await admin
    .from("sin_jeem_leaderboard_entries")
    .select("id, score, games, wins")
    .eq("entity_type", entityType)
    .eq("display_name", displayName)
    .eq("period", period)
    .eq("period_key", pKey)
    .maybeSingle();

  const win = score > 0;
  if (existing) {
    await admin
      .from("sin_jeem_leaderboard_entries")
      .update({
        score: existing.score + score,
        games: (existing.games || 0) + 1,
        wins: (existing.wins || 0) + (win ? 1 : 0),
        team_name: teamName,
        match_id: matchId,
        verified: true,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await admin.from("sin_jeem_leaderboard_entries").insert({
      entity_type: entityType,
      display_name: displayName,
      team_name: teamName,
      score,
      games: 1,
      wins: win ? 1 : 0,
      period,
      period_key: pKey,
      match_id: matchId,
      verified: true,
    });
  }
}

async function fetchLeaderboard(admin, period) {
  const pKey = periodKey(period);
  const { data } = await admin
    .from("sin_jeem_leaderboard_entries")
    .select("*")
    .eq("period", period)
    .eq("period_key", pKey)
    .order("score", { ascending: false })
    .limit(50);

  const rows = data || [];
  const players = rows
    .filter((r) => r.entity_type === "player")
    .map((r, i) => ({
      id: r.id,
      name: r.display_name,
      score: r.score,
      games: r.games,
      wins: r.wins,
      rank: i + 1,
    }));

  const teams = rows
    .filter((r) => r.entity_type === "team")
    .map((r, i) => ({
      id: r.id,
      name: r.display_name,
      score: r.score,
      games: r.games,
      wins: r.wins,
      rank: i + 1,
    }));

  return { players, teams };
}

async function fetchSourceContent(source) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  if (source === "fawaid") {
    const { data } = await admin.from("fawaid").select("text,author_name").eq("status", "approved").limit(30);
    return (data || []).map((r) => r.text).filter(Boolean);
  }
  if (source === "lessons") {
    const { data } = await admin.from("lessons").select("title,description").limit(30);
    return (data || []).map((r) => `${r.title}: ${r.description || ""}`.trim());
  }
  if (source === "qa") {
    const { data } = await admin.from("qa_questions").select("question,answer").limit(30);
    return (data || []).map((r) => `س: ${r.question} ج: ${r.answer}`);
  }
  if (source === "mutoon") {
    const { data } = await admin.from("mutoon_texts").select("name,summary").limit(20);
    return (data || []).map((r) => `${r.name}: ${r.summary || ""}`);
  }
  if (source === "books") {
    const { data } = await admin.from("books").select("title,description").limit(20);
    return (data || []).map((r) => `${r.title}: ${r.description || ""}`.trim()).filter(Boolean);
  }
  if (source === "articles") {
    const { data } = await admin.from("articles").select("title,summary,body").limit(20);
    return (data || []).map((r) => `${r.title}: ${r.summary || r.body || ""}`.trim()).filter(Boolean);
  }
  return [];
}

function leaderboardEntityType(mode, side) {
  if (mode === "team_vs_team") return "team";
  if (mode === "player_vs_player") return "player";
  if (mode === "solo" || mode === "daily" || mode === "quick") return "player";
  if (mode === "tournament") return side === "a" ? "team" : "player";
  return "player";
}

async function writeAudit(admin, { questionId, action, actorId, payload }) {
  try {
    await admin.from("sin_jeem_question_audit").insert({
      question_id: questionId,
      action,
      actor_id: actorId || null,
      payload: payload || null,
    });
  } catch {
    /* audit table may not exist yet */
  }
}

async function adminListQuestions(admin, query = {}) {
  let q = admin.from("sin_jeem_questions").select("*").order("updated_at", { ascending: false }).limit(500);
  if (query.status) q = q.eq("review_status", query.status);
  if (query.type) q = q.eq("question_type", query.type);
  if (query.difficulty) q = q.eq("difficulty", query.difficulty);
  if (query.search) q = q.ilike("question", `%${query.search.slice(0, 80)}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

async function adminBulkReview(admin, ids, status, actorId) {
  const { error } = await admin
    .from("sin_jeem_questions")
    .update({ review_status: status, status: status === "approved" ? "published" : "draft", updated_by: actorId })
    .in("id", ids);
  if (error) throw new Error(error.message);
  for (const id of ids) {
    await writeAudit(admin, { questionId: id, action: status, actorId, payload: { bulk: true } });
  }
  return ids.length;
}

async function adminImportQuestions(admin, rows, actorId) {
  const { data: existing } = await admin.from("sin_jeem_questions").select("content_hash, question");
  const seen = new Set((existing || []).map((r) => r.content_hash || hashText(r.question)));
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const h = importHash(row.question);
    if (seen.has(h)) {
      skipped++;
      continue;
    }
    seen.add(h);
    const { error } = await admin.from("sin_jeem_questions").insert({
      question: row.question,
      question_type: row.question_type || "multiple_choice",
      options: row.options || [],
      correct_index: row.correct_index ?? 0,
      explanation: row.explanation,
      difficulty: row.difficulty || "متوسط",
      keywords: row.keywords || [],
      subcategory_slug: row.subcategory_slug,
      source: row.source,
      status: "published",
      review_status: "approved",
      content_hash: h,
      created_by: actorId,
    });
    if (error) throw new Error(error.message);
    inserted++;
  }
  return { inserted, skipped };
}

async function generateFromOpenAI(content, difficulty) {
  const { openaiKey } = getEnvConfig();
  if (!openaiKey) return null;

  const prompt = `أنشئ سؤالاً islamic MCQ بالعربية من المحتوى التالي. أعد JSON فقط:
{"question":"...","options":["...","...","...","..."],"correct_index":0,"explanation":"...","difficulty":"${difficulty}","keywords":["..."],"source":"..."}
المحتوى: ${content.slice(0, 800)}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

async function generateOffline(content, difficulty) {
  const snippet = content.slice(0, 120);
  const h = hashText(snippet);
  if (USED_HASHES.has(h)) return null;
  USED_HASHES.add(h);

  const admin = getSupabaseAdmin();
  const existing = new Set();
  if (admin) {
    const { data } = await admin.from("sin_jeem_questions").select("question").limit(1000);
    for (const row of data || []) existing.add(row.question);
  }

  const question = `ما المقصود بالعبارة التالية؟ «${snippet.slice(0, 60)}...»`;
  if (existing.has(question)) return null;

  return {
    question,
    options: [snippet.slice(0, 40), "لا علاقة", "تفسير خاطئ", "غير ذلك"],
    correct_index: 0,
    explanation: `مستخرج من: ${snippet.slice(0, 80)}`,
    difficulty,
    keywords: ["auto", "offline"],
    question_type: "multiple_choice",
    source: "مولّد تلقائي",
  };
}

export default async function handler(req, res, opts = {}) {
  const serviceName = opts.serviceName || "question-answer";
  const action = req.query?.action || req.body?.action || "health";
  const ip = clientKey(req);

  if (!rateLimit(`sin-jeem:${ip}`, 60, 60_000)) {
    sendJson(res, 429, { ok: false, error: "rate_limited" });
    return;
  }

  if (action === "health") {
    sendJson(res, 200, { ok: true, service: serviceName, legacy: "sin-jeem" });
    return;
  }

  if (action === "categories") {
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        const { data, error } = await admin
          .from("sin_jeem_categories")
          .select("id, slug, name_ar, icon, parent_slug, sort_order")
          .eq("status", "published")
          .order("sort_order", { ascending: true });
        if (!error && data?.length) {
          sendJson(res, 200, { ok: true, categories: data, source: "supabase" });
          return;
        }
      } catch {
        /* fall through */
      }
    }
    sendJson(res, 200, {
      ok: true,
      categories: getCategorySeedList().map((c) => ({
        slug: c.slug,
        name_ar: c.name_ar,
        icon: c.icon,
        parent_slug: c.parent_slug || null,
        sort_order: c.sort_order,
      })),
      source: "seed_file",
    });
    return;
  }

  if (action === "questions") {
    const limit = Math.min(Number(req.query?.limit) || 200, 500);
    const difficulty = req.query?.difficulty;
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        let q = admin
          .from("sin_jeem_questions")
          .select("id, question, question_type, options, correct_index, difficulty, category_id, subcategory_slug, explanation, points, image_url")
          .eq("status", "published")
          .limit(limit);
        if (difficulty) q = q.eq("difficulty", difficulty);
        const { data, error, count } = await q;
        if (!error && data?.length) {
          sendJson(res, 200, { ok: true, questions: data, count: data.length, source: "supabase" });
          return;
        }
        if (error?.code !== "PGRST205" && error?.code !== "42P01") {
          /* empty table — use fallback */
        }
      } catch {
        /* fall through */
      }
    }
    let bank = getProductionQuestionBank();
    if (difficulty) bank = bank.filter((q) => q.difficulty === difficulty);
    sendJson(res, 200, {
      ok: true,
      questions: bank.slice(0, limit),
      count: Math.min(bank.length, limit),
      source: "bank_file",
      totalAvailable: bank.length,
    });
    return;
  }

  if (action === "daily_challenge") {
    const bank = getProductionQuestionBank();
    const dayIndex = Math.floor(Date.now() / 86_400_000) % bank.length;
    const question = bank[dayIndex];
    sendJson(res, 200, {
      ok: true,
      question,
      dayKey: new Date().toISOString().slice(0, 10),
      source: bank.length >= 500 ? "bank_file" : "fallback",
    });
    return;
  }

  if (action === "leaderboard") {
    const period = req.query?.period || "all";
    const admin = getSupabaseAdmin();
    if (!admin) {
      sendJson(res, 200, { ok: true, players: [], teams: [] });
      return;
    }
    try {
      const board = await fetchLeaderboard(admin, period);
      sendJson(res, 200, { ok: true, ...board });
    } catch {
      sendJson(res, 200, { ok: true, players: [], teams: [] });
    }
    return;
  }

  if (action === "submit_match") {
    const validated = validateMatchPayload(req.body || {});
    if (!validated.ok) {
      sendJson(res, 400, { ok: false, error: validated.error });
      return;
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      sendJson(res, 503, { ok: false, error: "database_unavailable" });
      return;
    }

    const d = validated.data;
    const winnerSide =
      d.winner === "a" || d.winner === "solo" ? "a" : d.winner === "b" ? "b" : "draw";

    const { data: match, error: matchErr } = await admin
      .from("sin_jeem_matches")
      .insert({
        mode: d.mode,
        team_a_name: d.teamAName,
        team_b_name: d.teamBName,
        question_count: d.totalQuestions,
        team_a_score: d.teamAScore,
        team_b_score: d.teamBScore,
        winner_side: winnerSide,
        status: "completed",
        config: { session_id: d.sessionId, duration_ms: d.durationMs },
        started_at: new Date(Date.now() - d.durationMs).toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (matchErr || !match) {
      sendJson(res, 500, { ok: false, error: "match_insert_failed" });
      return;
    }

    const periods = ["day", "week", "month", "all"];
    const entityA = leaderboardEntityType(d.mode, "a");
    const entityB = leaderboardEntityType(d.mode, "b");
    for (const period of periods) {
      await upsertLeaderboardEntry(admin, {
        entityType: entityA,
        displayName: d.teamAName,
        teamName: d.teamBName,
        score: d.teamAScore,
        period,
        matchId: match.id,
      });
      if (d.teamBName) {
        await upsertLeaderboardEntry(admin, {
          entityType: entityB,
          displayName: d.teamBName,
          teamName: d.teamBName,
          score: d.teamBScore,
          period,
          matchId: match.id,
        });
      }
    }

    sendJson(res, 200, { ok: true, match_id: match.id });
    return;
  }

  if (action === "generate") {
    const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
    if (!auth?.ok) return;

    if (!rateLimit(`sin-jeem-gen:${ip}`, 10, 60_000)) {
      sendJson(res, 429, { ok: false, error: "generate_rate_limited" });
      return;
    }

    const source = req.body?.source || "fawaid";
    const difficulty = req.body?.difficulty || "متوسط";
    const contents = await fetchSourceContent(source);
    const pick = contents[Math.floor(Math.random() * contents.length)] || "الصلاة ركن من أركان الإسلام";

    let question = await generateFromOpenAI(pick, difficulty);
    if (!question) question = await generateOffline(pick, difficulty);

    if (!question) {
      sendJson(res, 503, { ok: false, error: "duplicate_or_no_content" });
      return;
    }

    const confidence = question.correct_index != null ? 0.85 : 0.5;
    const reviewStatus = confidence < 0.75 ? "pending" : "approved";

    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.from("sin_jeem_ai_generations").insert({
          source_type: source,
          prompt_hash: hashText(pick),
          status: reviewStatus === "pending" ? "pending" : "approved",
          raw_response: question,
        });
        if (reviewStatus === "approved") {
          const contentHash = hashText(question.question);
          await admin.from("sin_jeem_questions").insert({
            question: question.question,
            question_type: question.question_type || "multiple_choice",
            options: question.options,
            correct_index: question.correct_index,
            explanation: question.explanation,
            difficulty: question.difficulty || difficulty,
            keywords: question.keywords || [],
            status: "published",
            source_type: source,
            content_hash: contentHash,
          });
        }
      } catch {
        /* table may not exist yet */
      }
    }

    sendJson(res, 200, { ok: true, question, review_status: reviewStatus });
    return;
  }

  const adminActions = [
    "admin_questions",
    "admin_export",
    "admin_import",
    "admin_bulk_approve",
    "admin_bulk_reject",
    "admin_bulk_delete",
    "admin_audit",
    "generation_dashboard",
    "generation_reports",
    "generation_run",
  ];
  if (adminActions.includes(action)) {
    const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
    if (!auth?.ok) return;

    const admin = getSupabaseAdmin();
    if (!admin) {
      sendJson(res, 503, { ok: false, error: "database_unavailable" });
      return;
    }

    const actorId = auth.user?.id || null;

    if (action === "admin_questions") {
      try {
        const rows = await adminListQuestions(admin, {
          status: req.query?.status || req.body?.status,
          type: req.query?.type || req.body?.type,
          difficulty: req.query?.difficulty || req.body?.difficulty,
          search: req.query?.search || req.body?.search,
        });
        sendJson(res, 200, { ok: true, questions: rows });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return;
    }

    if (action === "admin_export") {
      const format = req.query?.format || req.body?.format || "json";
      try {
        const rows = await adminListQuestions(admin, req.query || req.body || {});
        if (format === "csv") {
          sendJson(res, 200, { ok: true, format: "csv", content: questionsToCsv(rows) });
        } else {
          sendJson(res, 200, { ok: true, format: "json", questions: rows });
        }
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return;
    }

    if (action === "admin_import") {
      const body = req.body || {};
      const format = body.format || "json";
      try {
        let rows = [];
        if (format === "csv") rows = parseCsvQuestions(body.content || "");
        else if (format === "json") rows = parseJsonQuestions(body.content || body.questions || []);
        else if (Array.isArray(body.questions)) rows = body.questions;
        const result = await adminImportQuestions(admin, rows, actorId);
        sendJson(res, 200, { ok: true, ...result });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return;
    }

    const ids = req.body?.ids || [];
    if (!Array.isArray(ids) || !ids.length) {
      sendJson(res, 400, { ok: false, error: "ids_required" });
      return;
    }

    if (action === "admin_bulk_approve") {
      try {
        const n = await adminBulkReview(admin, ids, "approved", actorId);
        sendJson(res, 200, { ok: true, updated: n });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return;
    }

    if (action === "admin_bulk_reject") {
      try {
        const n = await adminBulkReview(admin, ids, "rejected", actorId);
        sendJson(res, 200, { ok: true, updated: n });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return;
    }

    if (action === "admin_bulk_delete") {
      try {
        for (const id of ids) {
          await writeAudit(admin, { questionId: id, action: "delete", actorId, payload: { bulk: true } });
        }
        const { error } = await admin.from("sin_jeem_questions").delete().in("id", ids);
        if (error) throw new Error(error.message);
        sendJson(res, 200, { ok: true, deleted: ids.length });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return;
    }

    if (action === "admin_audit") {
      const questionId = req.query?.question_id || req.body?.question_id;
      let q = admin.from("sin_jeem_question_audit").select("*").order("created_at", { ascending: false }).limit(100);
      if (questionId) q = q.eq("question_id", questionId);
      const { data, error } = await q;
      if (error) {
        sendJson(res, 500, { ok: false, error: error.message });
        return;
      }
      sendJson(res, 200, { ok: true, audit: data || [] });
      return;
    }

    if (action === "generation_dashboard") {
      try {
        const dashboard = await getGenerationDashboard(admin);
        sendJson(res, 200, dashboard);
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return;
    }

    if (action === "generation_reports") {
      const limit = Math.min(Number(req.query?.limit) || 30, 90);
      try {
        const { data, error } = await admin
          .from("daily_generation_reports")
          .select("*")
          .order("day_key", { ascending: false })
          .limit(limit);
        if (error) throw new Error(error.message);
        sendJson(res, 200, { ok: true, reports: data || [] });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return;
    }

    if (action === "generation_run") {
      if (!rateLimit(`qgen-run:${ip}`, 3, 300_000)) {
        sendJson(res, 429, { ok: false, error: "generation_rate_limited" });
        return;
      }
      try {
        const force = req.body?.force === true || req.query?.force === "1";
        const result = await runDailyGeneration({ force });
        sendJson(res, result.ok ? 200 : 500, result);
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err.message });
      }
      return;
    }
  }

  sendJson(res, 400, { ok: false, error: "unknown_action" });
}
