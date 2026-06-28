/**
 * AI extractors for benefits, quiz questions, and lesson notes.
 * Extracts ONLY from source text — never fabricates religious content.
 */

import { ASSISTANT_MODEL } from "../api/anthropic-config.mjs";

const SAFETY_RULES = `ممنوع منعاً باتاً:
- inventing hadith text or attributions
- inventing fatwas or legal rulings
- creating disputed fiqh positions as certain answers
- attributing quotes to scholars not in the source

مسموح فقط: استخراج من النص المصدر المقدم.`;

async function callAnthropic(system, userContent) {
  const apiKey = String(process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) return null;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ASSISTANT_MODEL,
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const text = data?.content?.[0]?.text || "";
  const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function extractBenefitsFromSource({ title, body, sourceUrl, sourceName, scholar }) {
  const text = String(body || "").trim();
  if (text.length < 40) return { benefits: [], confidence: 0, needs_review: true };

  const system = `${SAFETY_RULES}

استخرج 1-5 فوائد مختصرة ومفيدة من نص الدرس/المقال.
كل فائدة: 20-180 حرف، واضحة، غير مكررة، مرتبطة بالمصدر.
أعد JSON فقط:
[{"text": "...", "quality_score": 0-100}]`;

  const userContent = [
    `المصدر: ${sourceName || "—"}`,
    `الرابط: ${sourceUrl || "—"}`,
    scholar ? `الشيخ: ${scholar}` : "",
    `العنوان: ${title || ""}`,
    "",
    text.slice(0, 5000),
  ].join("\n");

  const parsed = await callAnthropic(system, userContent);
  if (!Array.isArray(parsed)) {
    return fallbackBenefits(text, sourceName);
  }

  const benefits = parsed
    .filter((b) => b?.text?.trim()?.length >= 15)
    .map((b) => ({
      text: String(b.text).trim().slice(0, 250),
      quality_score: Math.min(100, Math.max(0, Number(b.quality_score) || 75)),
      source_url: sourceUrl,
      author_name: scholar || sourceName,
    }));

  return {
    benefits,
    confidence: benefits.length ? 80 : 40,
    needs_review: benefits.length === 0,
  };
}

function fallbackBenefits(text, sourceName) {
  const sentences = text
    .split(/[.۔!\?؟\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 200);
  const benefits = sentences.slice(0, 3).map((s) => ({
    text: s,
    quality_score: 65,
    author_name: sourceName,
  }));
  return { benefits, confidence: 55, needs_review: benefits.length === 0 };
}

export async function extractQuizFromSource({ title, body, sourceUrl, sourceName, category }) {
  const text = String(body || "").trim();
  if (text.length < 80) return { questions: [], confidence: 0, needs_review: true };

  const system = `${SAFETY_RULES}

ولّد 1-3 أسئلة اختيار من متعدد (4 خيارات) من محتوى المصدر فقط.
تجنب المسائل الخلافية. الإجابة الصحيحة يجب أن تكون واضحة من النص.
أعد JSON:
[{"question": "...", "options": ["أ","ب","ج","د"], "correct_index": 0, "difficulty": "سهل|متوسط|صعب", "category": "..."}]`;

  const userContent = [
    `المصدر: ${sourceName || "—"}`,
    `الرابط: ${sourceUrl || "—"}`,
    `التصنيف: ${category || "عام"}`,
    `العنوان: ${title || ""}`,
    "",
    text.slice(0, 5000),
  ].join("\n");

  const parsed = await callAnthropic(system, userContent);
  if (!Array.isArray(parsed)) return { questions: [], confidence: 0, needs_review: true };

  const questions = parsed
    .filter((q) => q?.question && Array.isArray(q.options) && q.options.length >= 2)
    .map((q) => ({
      question: String(q.question).trim(),
      options: q.options.map((o) => String(o).trim()).slice(0, 4),
      correct_index: Math.min(q.options.length - 1, Math.max(0, Number(q.correct_index) || 0)),
      difficulty: q.difficulty || "متوسط",
      category: q.category || category || "عام",
      source_url: sourceUrl,
      source_name: sourceName,
    }));

  return { questions, confidence: questions.length ? 85 : 40, needs_review: questions.length === 0 };
}

export async function extractLessonNotes({ title, body, sourceUrl, sourceName, scholar, category }) {
  const text = String(body || "").trim();
  if (text.length < 50) return { notes: null, confidence: 0, needs_review: true };

  const system = `${SAFETY_RULES}

أنشئ ملاحظات منظمة للدرس من النص فقط.
أعد JSON:
{
  "main_points": ["..."],
  "subtopics": ["..."],
  "practical": ["..."],
  "quotes": [{"text": "...", "attribution": "..."}],
  "follow_up": [{"title": "...", "type": "lesson|article|topic"}],
  "confidence": 0-100
}
الاقتباسات: فقط ما ورد صراحة في النص مع نسبته.`;

  const userContent = [
    `المصدر: ${sourceName || "—"}`,
    `الرابط: ${sourceUrl || "—"}`,
    scholar ? `الشيخ: ${scholar}` : "",
    `التصنيف: ${category || ""}`,
    `العنوان: ${title || ""}`,
    "",
    text.slice(0, 6000),
  ].join("\n");

  const parsed = await callAnthropic(system, userContent);
  if (!parsed || typeof parsed !== "object") {
    return fallbackNotes(text);
  }

  return {
    notes: {
      main_points: (parsed.main_points || []).slice(0, 8),
      subtopics: (parsed.subtopics || []).slice(0, 8),
      practical: (parsed.practical || []).slice(0, 6),
      quotes: (parsed.quotes || []).slice(0, 5),
      follow_up: (parsed.follow_up || []).slice(0, 5),
    },
    confidence: Number(parsed.confidence) || 75,
    needs_review: !parsed.main_points?.length,
  };
}

function fallbackNotes(text) {
  const sentences = text.split(/[.۔!\?؟\n]+/).map((s) => s.trim()).filter((s) => s.length >= 20);
  return {
    notes: {
      main_points: sentences.slice(0, 5),
      subtopics: [],
      practical: [],
      quotes: [],
      follow_up: [],
    },
    confidence: 50,
    needs_review: sentences.length === 0,
  };
}

export async function enrichSheikhBio({ name, lessonTitles, categories, lessonCount }) {
  if (!name || !lessonCount) return { bio: null, specializations: [], confidence: 0 };

  const system = `أنت محلل محتوى علمي. من قائمة عناوين الدروس فقط، اكتب:
- bio: سيرة مختصرة (≤300 حرف) بدون inventing credentials أو titles
- specializations: قائمة تصنيفات من المحتوى الفعلي

ممنوع inventing شهادات أو مناصب. أعد JSON: {"bio": "...", "specializations": ["..."], "confidence": 0-100}`;

  const userContent = [
    `الاسم: ${name}`,
    `عدد الدروس: ${lessonCount}`,
    `التصنيفات: ${(categories || []).join("، ")}`,
    "عناوين الدروس:",
    ...(lessonTitles || []).slice(0, 15).map((t) => `- ${t}`),
  ].join("\n");

  const parsed = await callAnthropic(system, userContent);
  if (!parsed) {
    const specs = [...new Set(categories || [])].slice(0, 5);
    return {
      bio: lessonCount > 0 ? `عالم يقدّم دروسًا في ${specs.join(" و") || "العلوم الشرعية"}.` : null,
      specializations: specs,
      confidence: 45,
    };
  }

  return {
    bio: parsed.bio ? String(parsed.bio).slice(0, 400) : null,
    specializations: (parsed.specializations || categories || []).slice(0, 6),
    confidence: Number(parsed.confidence) || 70,
  };
}
