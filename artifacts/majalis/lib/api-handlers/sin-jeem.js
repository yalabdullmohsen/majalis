import { sendJson } from "../api/_http.mjs";
import { getEnvConfig } from "../../env-config.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";

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

  return {
    ok: true,
    data: {
      sessionId: String(body.session_id || "").slice(0, 64),
      mode: String(body.mode || "team_vs_team").slice(0, 32),
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
  return [];
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

export default async function handler(req, res) {
  const action = req.query?.action || req.body?.action || "health";
  const ip = clientKey(req);

  if (!rateLimit(`sin-jeem:${ip}`, 60, 60_000)) {
    sendJson(res, 429, { ok: false, error: "rate_limited" });
    return;
  }

  if (action === "health") {
    sendJson(res, 200, { ok: true, service: "sin-jeem" });
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
    for (const period of periods) {
      await upsertLeaderboardEntry(admin, {
        entityType: "player",
        displayName: d.teamAName,
        teamName: d.teamBName,
        score: d.teamAScore,
        period,
        matchId: match.id,
      });
      if (d.teamBName) {
        await upsertLeaderboardEntry(admin, {
          entityType: "team",
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

  sendJson(res, 400, { ok: false, error: "unknown_action" });
}
