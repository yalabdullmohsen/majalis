import { sendJson, endEmpty } from "../api/_http.mjs";
import {
  FOUNDER_SYSTEM_NOTE,
  resolveFounderQuestion,
} from "../../lib/assistant-founder.mjs";
import {
  runReasoningQuery,
  looksLikeIslamicKnowledgeQuery,
} from "../../lib/reasoning-engine/answer.mjs";
import {
  ISLAMIC_SYSTEM_PROMPT,
  buildGroundedPayload,
  buildInsufficientSourcesPayload,
  buildScholarRedirectAnswer,
  classifyIslamicQuery,
  shouldBlockUnsourcedIslamicFallback,
} from "../../lib/islamic-answer-guardrails.mjs";

export const maxDuration = 30;

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const ASSISTANT_MODEL = "claude-haiku-4-5-20251001";

const FAILURE_MESSAGE = "تعذر تشغيل المساعد الآن، حاول لاحقًا.";

// ─── ردود ثابتة ذكية للأسئلة العامة ─────────────────────────────────────────

const GREETING_RX = /^(السلام|وعليكم|أهلا|أهلًا|مرحبا|مرحبًا|هلا|هلاً|صباح|مساء|كيف حالك|بسم الله)/i;
const IDENTITY_RX = /(من أنت|ما أنت|عرّف نفسك|من أنا أتحدث|ما دورك|قدرات|ماذا تستطيع|مهامك|وظيفتك)/;
const PLATFORM_RX = /(موقع|منصة|مجلس|كيف أستخدم|ميزات|خدمات|أقسام|ماذا يوجد|محتويات|ماذا تقدم)/;
const HELP_RX = /(مساعدة|help|كيف أبدأ|من أين|دليل|تعليمات)/;
const THANKS_RX = /(شكر|جزاك الله|بارك الله|أحسنت|جيد|ممتاز|رائع)/;

const STATIC_RESPONSES = [
  {
    test: GREETING_RX,
    answer:
      "وعليكم السلام ورحمة الله وبركاته، أهلاً بك في المساعد العلمي لمنصة المجلس العلمي. " +
      "يسعدني مساعدتك في أسئلتك الشرعية والعلمية. اكتب سؤالك وسأجيب من المصادر الموثقة.",
  },
  {
    test: THANKS_RX,
    answer:
      "بارك الله فيك وجزاك خيراً. إن كان لديك سؤال آخر فأنا هنا لمساعدتك.",
  },
  {
    test: IDENTITY_RX,
    answer:
      "أنا المساعد العلمي لمنصة المجلس العلمي. أهتم بـ:\n" +
      "• الإجابة على الأسئلة الشرعية والعلمية من المصادر الموثقة\n" +
      "• إرشادك إلى محتوى المنصة (دروس، فتاوى، أحكام، أحاديث...)\n" +
      "• توضيح المسائل الفقهية العامة مع الإشارة لأهل العلم\n\n" +
      "ملاحظة: لا أُصدر فتاوى شخصية — للفتوى الخاصة راجع عالمًا مختصًا.",
  },
  {
    test: PLATFORM_RX,
    answer:
      "المجلس العلمي منصة إسلامية متكاملة تضم:\n" +
      "📚 الدروس والمحاضرات — دروس المشايخ في مختلف العلوم الشرعية\n" +
      "📖 المصحف الشريف — قراءة وبحث في القرآن الكريم\n" +
      "🤲 الأذكار والأدعية — أذكار الصباح والمساء وسائر السنن\n" +
      "⚖️ الأحكام الشرعية — مكتبة الأحكام الفقهية\n" +
      "📿 التسابيح — مسبحة إلكترونية\n" +
      "🕌 مواقيت الصلاة — للكويت مع عدّاد تنازلي\n" +
      "🧭 القبلة — اتجاه الكعبة المشرفة\n\n" +
      "استخدم القائمة الجانبية للتنقل بين الأقسام.",
  },
  {
    test: HELP_RX,
    answer:
      "للاستفادة من المساعد العلمي اكتب سؤالك الشرعي أو العلمي مباشرة، مثل:\n" +
      "• «ما حكم قراءة القرآن بدون وضوء؟»\n" +
      "• «اذكر فضل صلاة الفجر»\n" +
      "• «ما هي أذكار الصباح؟»\n\n" +
      "للتنقل في المنصة استخدم القائمة الجانبية أو شريط التنقل السفلي.",
  },
];

function buildSmartStaticResponse(query) {
  const q = String(query || "");
  for (const { test, answer } of STATIC_RESPONSES) {
    if (test.test(q)) return answer;
  }
  return (
    "أنا المساعد العلمي لمنصة المجلس العلمي. أُجيب على الأسئلة الشرعية والعلمية " +
    "من المصادر الموثقة. اكتب سؤالك الديني وسأبذل ما في الوسع للإجابة."
  );
}

// ─── Anthropic (اختياري — تحسين عند توفر المفتاح) ─────────────────────────

function hasAnthropicApiKey() {
  return Boolean((process.env.ANTHROPIC_API_KEY || "").trim());
}

async function tryCallAnthropic(message) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: ASSISTANT_MODEL,
        max_tokens: 1000,
        system: `${ISLAMIC_SYSTEM_PROMPT} ${FOUNDER_SYSTEM_NOTE}`,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      console.error("[assistant] Anthropic error:", response.status);
      return null;
    }

    const data = await response.json().catch(() => null);
    const text = data?.content?.[0]?.text;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch (err) {
    console.error("[assistant] Anthropic call failed:", err?.message || err);
    return null;
  }
}

// ─── Body helpers ─────────────────────────────────────────────────────────────

async function parseBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== "") {
    if (typeof req.body === "object") return req.body;
    if (typeof req.body === "string") {
      try { return JSON.parse(req.body); } catch { return null; }
    }
  }

  let rawBody = "";
  if (typeof req.on === "function") {
    for await (const chunk of req) rawBody += chunk;
  }
  if (!rawBody) return {};

  try { return JSON.parse(rawBody); } catch { return null; }
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  const sanitized = messages
    .map((m) => ({
      role: m?.role === "assistant" ? "assistant" : "user",
      content: String(m?.content || "").trim().slice(0, 4000),
    }))
    .filter((m) => m.content.length > 0)
    .slice(-8);
  while (sanitized[0]?.role === "assistant") sanitized.shift();
  return sanitized;
}

function extractUserMessage(body) {
  const direct = String(body?.message || body?.question || "").trim();
  if (direct) return direct;
  const messages = sanitizeMessages(body?.messages);
  return [...messages].reverse().find((m) => m.role === "user")?.content || "";
}

function successPayload(answer, extra = {}) {
  return { ok: true, answer, reply: answer, ...extra };
}

// ─── معالج الطلب الرئيسي ──────────────────────────────────────────────────────

async function handleAssistantRequest(req, res) {
  if (req.method === "OPTIONS") { endEmpty(res, 204); return; }

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, available: true });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  const body = await parseBody(req);
  if (body === null) {
    sendJson(res, 400, { ok: false, message: "اكتب سؤالك أولًا." });
    return;
  }

  const userMessage = extractUserMessage(body);
  if (!userMessage) {
    sendJson(res, 400, { ok: false, message: "اكتب سؤالك أولًا." });
    return;
  }

  // 1. إعادة توجيه للعالم (محلي)
  const safetyClassification = classifyIslamicQuery(userMessage);
  const scholarRedirect = buildScholarRedirectAnswer(safetyClassification);
  if (scholarRedirect) {
    sendJson(res, 200, successPayload(scholarRedirect, {
      grounded: true,
      safety_classification: safetyClassification,
      citations: [],
      confidence: 0,
      disclaimer: "هذه إجابة تعليمية مختصرة وليست فتوى شخصية ملزمة.",
    }));
    return;
  }

  // 2. أسئلة المؤسس (محلي)
  const founderAnswer = resolveFounderQuestion(userMessage);
  if (founderAnswer) {
    sendJson(res, 200, successPayload(founderAnswer, {
      safety_classification: "general_guidance",
      disclaimer: "هذه إجابة تعليمية مختصرة وليست فتوى شخصية ملزمة.",
    }));
    return;
  }

  const isIslamicQuery =
    looksLikeIslamicKnowledgeQuery(userMessage) ||
    shouldBlockUnsourcedIslamicFallback(userMessage);

  // 3. الأسئلة الإسلامية — محرك الاستدلال الداخلي (Supabase)
  if (isIslamicQuery) {
    try {
      const grounded = await runReasoningQuery({
        query: userMessage,
        synthesize: hasAnthropicApiKey(),
        expandGraph: true,
        limit: 20,
      });

      if (grounded.ok && !grounded.answer?.noEvidence) {
        const payload = buildGroundedPayload(
          grounded.answer.summary,
          grounded.answer.citations,
          grounded.confidence ?? 0,
          safetyClassification === "general_guidance" ? "fiqh_answer" : safetyClassification,
        );
        sendJson(res, 200, successPayload(payload.answer, {
          ...payload,
          retrieval_mode: grounded.retrievalMode,
        }));
        return;
      }
    } catch (groundedErr) {
      console.error("[assistant] Reasoning engine error:", groundedErr?.message || groundedErr);
    }

    const payload = buildInsufficientSourcesPayload(userMessage);
    sendJson(res, 200, successPayload(payload.answer, payload));
    return;
  }

  // 4. الأسئلة العامة — جرّب Anthropic إن توفّر المفتاح، ثم ارجع للردود الثابتة
  const anthropicAnswer = await tryCallAnthropic(userMessage);
  if (anthropicAnswer) {
    sendJson(res, 200, successPayload(anthropicAnswer, {
      safety_classification: "general_guidance",
      disclaimer: "هذه إجابة تعليمية مختصرة وليست فتوى شخصية ملزمة.",
      citations: [],
      confidence: 0.5,
      grounded: false,
    }));
    return;
  }

  // 5. الردود الثابتة الذكية — دائماً تعمل بدون أي API خارجي
  const staticAnswer = buildSmartStaticResponse(userMessage);
  sendJson(res, 200, successPayload(staticAnswer, {
    safety_classification: "general_guidance",
    disclaimer: "هذه إجابة تعليمية مختصرة وليست فتوى شخصية ملزمة.",
    citations: [],
    confidence: 0.3,
    grounded: false,
  }));
}

export default async function handler(req, res) {
  try {
    await handleAssistantRequest(req, res);
  } catch (error) {
    console.error("[assistant] Route error:", error?.message || error);
    if (!res.headersSent && !res.writableEnded) {
      // حتى في حالة الخطأ الكامل — نُعيد رداً مفيداً لا رسالة فشل
      sendJson(res, 200, {
        ok: true,
        answer: "يسعدني مساعدتك. اكتب سؤالك الشرعي وسأجيب من المصادر الموثقة.",
        reply: "يسعدني مساعدتك. اكتب سؤالك الشرعي وسأجيب من المصادر الموثقة.",
        safety_classification: "general_guidance",
        disclaimer: "هذه إجابة تعليمية مختصرة وليست فتوى شخصية ملزمة.",
        citations: [],
        confidence: 0.1,
        grounded: false,
      });
    }
  }
}
