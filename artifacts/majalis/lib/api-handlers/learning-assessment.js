/**
 * GET  /api/learning-assessment?assessment_id=<uuid>
 *   يُرجع أسئلة تقييم مُعتمَدة (is_approved=true) بلا حقل الإجابة الصحيحة
 *   إطلاقًا — التصحيح يتم من طرف الخادم فقط في POST أدناه.
 *
 * POST /api/learning-assessment
 *   body: { assessmentId, learningItemId?, answers: { [questionId]: answer } }
 *   يصحّح الإجابات من طرف الخادم عبر عميل service-role (لا يمكن للعميل رؤية
 *   correct_answer إطلاقًا)، يحسب score_pct، يكتب صفًا في assessment_attempts،
 *   وإن نجح ويوجد learningItemId يكتب أيضًا حدث إنجاز (item_completion_events)
 *   بنوع دليل assessment_pass — هذا هو المسار الوحيد الذي يُنشئ أحداث من نوع
 *   assessment_pass، فلا يمكن لعميل التلاعب بها مباشرة (RLS على
 *   assessment_questions تمنع القراءة المباشرة أصلًا، وRLS على
 *   item_completion_events تسمح بإدراج المستخدم لنفسه فقط لكن هذا المسار هو
 *   الوحيد الذي "يعرف" أن الإجابات صحيحة فعلًا).
 */
import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { createClient } from "@supabase/supabase-js";

function extractBearer(req) {
  const h = req.headers?.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

function userClient(token) {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireUser(req) {
  const token = extractBearer(req);
  if (!token) return { user: null, error: "مطلوب تسجيل الدخول" };
  const client = userClient(token);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return { user: null, error: "جلسة غير صالحة" };
  return { user, error: null };
}

/** يقارن إجابة مستخدم بإجابة صحيحة حسب نوع السؤال. مُصدَّرة للاختبار المباشر
 *  (lib/__tests__/learning-assessment-grading.test.mjs) — منطق التصحيح
 *  الحقيقي بلا أي اعتماد على قاعدة بيانات أو شبكة. */
export function isAnswerCorrect(questionType, correctAnswer, userAnswer) {
  if (userAnswer === undefined || userAnswer === null) return false;
  switch (questionType) {
    case "mcq":
    case "true_false":
      return String(userAnswer).trim() === String(correctAnswer?.value ?? correctAnswer).trim();
    case "ordering":
    case "matching":
      return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    case "short_answer": {
      const norm = (s) => String(s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
      const accepted = Array.isArray(correctAnswer?.accepted) ? correctAnswer.accepted : [correctAnswer?.value ?? correctAnswer];
      return accepted.some((a) => norm(a) === norm(userAnswer));
    }
    default:
      // مقالية (essay): لا تصحيح آلي، تحتاج مراجعة يدوية — لا تُحتسَب صحيحة تلقائيًا
      return false;
  }
}

export default async function learningAssessmentHandler(req, res) {
  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  if (req.method === "GET") {
    const { user, error: authErr } = await requireUser(req);
    if (authErr) return sendJson(res, 401, { ok: false, error: authErr });

    const assessmentId = req.query?.assessment_id;
    if (!assessmentId) return sendJson(res, 400, { ok: false, error: "assessment_id مطلوب" });

    const { data: assessment, error: aErr } = await admin
      .from("assessments")
      .select("id, title, pass_percentage, max_attempts, status")
      .eq("id", assessmentId)
      .eq("status", "published")
      .maybeSingle();
    if (aErr || !assessment) return sendJson(res, 404, { ok: false, error: "التقييم غير موجود أو غير منشور" });

    const { data: questions, error: qErr } = await admin
      .from("assessment_questions")
      .select("id, question_type, question_text, options, points, sort_order")
      .eq("assessment_id", assessmentId)
      .eq("is_approved", true)
      .order("sort_order");
    if (qErr) return sendJson(res, 500, { ok: false, error: qErr.message });

    const { count: attemptCount } = await admin
      .from("assessment_attempts")
      .select("id", { count: "exact", head: true })
      .eq("assessment_id", assessmentId)
      .eq("user_id", user.id);

    return sendJson(res, 200, {
      ok: true,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        passPercentage: assessment.pass_percentage,
        maxAttempts: assessment.max_attempts,
      },
      questions: (questions || []).map((q) => ({
        id: q.id,
        questionType: q.question_type,
        questionText: q.question_text,
        options: q.options,
        points: q.points,
      })),
      attemptsUsed: attemptCount || 0,
    });
  }

  if (req.method === "POST") {
    const { user, error: authErr } = await requireUser(req);
    if (authErr) return sendJson(res, 401, { ok: false, error: authErr });

    const { assessmentId, learningItemId, answers } = req.body || {};
    if (!assessmentId || !answers || typeof answers !== "object") {
      return sendJson(res, 400, { ok: false, error: "assessmentId وanswers مطلوبان" });
    }

    const { data: assessment, error: aErr } = await admin
      .from("assessments")
      .select("id, pass_percentage, max_attempts, status")
      .eq("id", assessmentId)
      .eq("status", "published")
      .maybeSingle();
    if (aErr || !assessment) return sendJson(res, 404, { ok: false, error: "التقييم غير موجود أو غير منشور" });

    if (assessment.max_attempts) {
      const { count } = await admin
        .from("assessment_attempts")
        .select("id", { count: "exact", head: true })
        .eq("assessment_id", assessmentId)
        .eq("user_id", user.id);
      if ((count || 0) >= assessment.max_attempts) {
        return sendJson(res, 403, { ok: false, error: "استنفدت عدد المحاولات المسموح بها لهذا التقييم" });
      }
    }

    const { data: questions, error: qErr } = await admin
      .from("assessment_questions")
      .select("id, question_type, correct_answer, points")
      .eq("assessment_id", assessmentId)
      .eq("is_approved", true);
    if (qErr) return sendJson(res, 500, { ok: false, error: qErr.message });
    if (!questions || questions.length === 0) {
      return sendJson(res, 409, { ok: false, error: "لا أسئلة معتمدة لهذا التقييم بعد" });
    }

    const totalPoints = questions.reduce((s, q) => s + Number(q.points), 0);
    let earnedPoints = 0;
    const results = {};
    for (const q of questions) {
      const correct = isAnswerCorrect(q.question_type, q.correct_answer, answers[q.id]);
      if (correct) earnedPoints += Number(q.points);
      results[q.id] = correct;
    }
    const scorePct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 10000) / 100 : 0;
    const passed = scorePct >= assessment.pass_percentage;

    const { error: insErr } = await admin.from("assessment_attempts").insert({
      user_id: user.id,
      assessment_id: assessmentId,
      answers,
      score_pct: scorePct,
      passed,
      submitted_at: new Date().toISOString(),
    });
    if (insErr) return sendJson(res, 500, { ok: false, error: insErr.message });

    if (passed && learningItemId) {
      await admin.from("item_completion_events").insert({
        user_id: user.id,
        learning_item_id: learningItemId,
        event_type: "completed",
        evidence_type: "assessment_pass",
        evidence_value: scorePct,
      });
    }

    return sendJson(res, 200, { ok: true, scorePct, passed, passPercentage: assessment.pass_percentage, results });
  }

  return sendJson(res, 405, { ok: false, error: "الطريقة غير مدعومة" });
}
