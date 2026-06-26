/**
 * AI post-lesson assistant — summaries and review questions (metadata only).
 * Does NOT generate religious rulings or attribute quotes without sources.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getPathBySlug, getModulesForPath } from "./paths-seed.mjs";
import { suggestNextModule } from "./progress.mjs";

export async function generateLessonInsights(admin, { pathSlug, moduleId, moduleTitle, userId }) {
  const path = getPathBySlug(pathSlug);
  const modules = getModulesForPath(pathSlug);
  const mod = modules.find((m) => m.id === moduleId);

  const summary = `ملخص ${moduleTitle || mod?.title || "الدرس"}: راجع النقاط الأساسية في مسار ${path?.title || pathSlug} وتأكد من فهم المفاهيم قبل الانتقال للدرس التالي.`;

  const keyPoints = [
    `تعريف ${path?.title || "المسار"} وأهميته`,
    "المراجع الشرعية المعتمدة",
    "التطبيق العملي للمتعلم",
  ];

  const reviewQuestions = [
    { question: `ما أهم ما تعلمته في ${moduleTitle}?`, type: "text" },
    { question: `${path?.title} من العلوم الشرعية`, type: "true_false", answer: true },
    { question: `اذكر مصدرًا واحدًا لـ ${path?.title}`, type: "text" },
  ];

  const nextMod = suggestNextModule(pathSlug, { modules: { [pathSlug]: {} } });
  const suggestedNext = nextMod ? [{ title: nextMod.title, module_id: nextMod.id, type: nextMod.module_type }] : [];

  const suggestedBooks = [{ title: `كتاب ${path?.title}`, type: "book" }];
  const suggestedCourses = [{ title: `دورة ${path?.title}`, type: "course" }];

  const result = {
    summary,
    key_points: keyPoints,
    review_questions: reviewQuestions,
    suggested_next: suggestedNext,
    suggested_books: suggestedBooks,
    suggested_courses: suggestedCourses,
    disclaimer: "هذه اقتراحات تعليمية — لا تُعتبر فتاوى أو أحكامًا شرعية.",
  };

  if (admin && userId && !userId.startsWith("guest-")) {
    try {
      await admin.from("learning_ai_summaries").insert({
        user_id: userId,
        module_id: moduleId,
        summary,
        key_points: keyPoints,
        review_questions: reviewQuestions,
        suggested_next: suggestedNext,
        suggested_books: suggestedBooks,
        suggested_courses: suggestedCourses,
      });
    } catch {
      /* fallback */
    }
  }

  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  if (hasOpenAI && moduleTitle) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "أنت مساعد تعليمي إسلامي. لخّص الدروس واقترح أسئلة مراجعة فقط. لا تُصدر فتاوى ولا تنسب أقوالًا دون مصدر. أجب JSON: {summary, key_points[], review_questions[]}",
            },
            { role: "user", content: `درس: ${moduleTitle} في مسار ${path?.title}` },
          ],
          response_format: { type: "json_object" },
          max_tokens: 500,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}");
        if (parsed.summary) result.summary = parsed.summary;
        if (parsed.key_points?.length) result.key_points = parsed.key_points;
        if (parsed.review_questions?.length) result.review_questions = parsed.review_questions;
        result.ai_enhanced = true;
      }
    } catch {
      /* use template fallback */
    }
  }

  return { ok: true, ...result };
}
