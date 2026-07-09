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
  classifyIslamicQuery,
  ISLAMIC_DISCLAIMER,
} from "../../lib/islamic-answer-guardrails.mjs";

export const maxDuration = 30;

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const ASSISTANT_MODEL = "claude-haiku-4-5-20251001";

// ─── System Prompt المحسَّن ────────────────────────────────────────────────────
const RICH_ISLAMIC_SYSTEM_PROMPT = `أنت المساعد العلمي لمنصة مجالس — منصة إسلامية عربية موثوقة.

مهمتك: نقل أقوال العلماء في كل مسألة تُطرح عليك.

قواعد الإجابة:
1. استشهد بآيات القرآن الكريم والأحاديث الصحيحة بالنص الكامل عند الإمكان.
2. أذكر أقوال العلماء بأسمائهم صراحةً: الإمام الشافعي، أبو حنيفة، مالك، أحمد بن حنبل، ابن تيمية، ابن القيم، النووي، ابن حجر العسقلاني، الشوكاني، ابن باز، ابن عثيمين، الألباني، القرضاوي، وسائر علماء أهل السنة المعروفين.
3. إذا كانت المسألة خلافية: وضّح مذاهب العلماء ووجهات نظرهم المختلفة بموضوعية وأمانة.
4. لا تتحاشَ ذكر أي عالم معروف مهما كان مذهبه أو بلده — نقل الأقوال العلمية واجب.
5. للمسائل الشخصية البحتة (طلاق بعينه، نزاع مالي شخصي): اذكر الحكم العام ثم وجّه للمختص.
6. اكتب بأسلوب علمي واضح ومنظم، استخدم الترقيم والعناوين عند الحاجة.
7. لا تضع في نهاية الإجابة أي تحذيرات أو تنبيهات — الإجابة العلمية تتكلم عن نفسها.

${FOUNDER_SYSTEM_NOTE}`;

// ─── الردود الثابتة الأساسية ────────────────────────────────────────────────
const GREETING_RX = /^(السلام|وعليكم|أهلا|أهلًا|مرحبا|مرحبًا|هلا|هلاً|صباح|مساء|كيف حالك|بسم الله)/i;
const IDENTITY_RX = /(من أنت|ما أنت|عرّف نفسك|من أنا أتحدث|ما دورك|قدرات|ماذا تستطيع|مهامك|وظيفتك)/;
const PLATFORM_RX = /(موقع|منصة|مجلس|كيف أستخدم|ميزات|خدمات|أقسام|ماذا يوجد|محتويات|ماذا تقدم)/;
const HELP_RX = /(مساعدة|help|كيف أبدأ|من أين|دليل|تعليمات)/;
const THANKS_RX = /(شكر|جزاك الله|بارك الله|أحسنت|جيد|ممتاز|رائع)/;

const STATIC_RESPONSES = [
  {
    test: GREETING_RX,
    answer:
      "وعليكم السلام ورحمة الله وبركاته، أهلاً بك في المساعد العلمي لمنصة مجالس.\n" +
      "يسعدني الإجابة على أسئلتك الشرعية والعلمية بأقوال العلماء من المذاهب المختلفة.",
  },
  {
    test: THANKS_RX,
    answer: "بارك الله فيك وجزاك خيراً. إن كان لديك سؤال آخر فأنا هنا لمساعدتك.",
  },
  {
    test: IDENTITY_RX,
    answer:
      "أنا المساعد العلمي لمنصة مجالس. أُجيب على أسئلتك الإسلامية بأقوال العلماء:\n\n" +
      "• أذكر نصوص القرآن الكريم والسنة النبوية\n" +
      "• أستشهد بأقوال العلماء المعروفين (الشافعي، ابن تيمية، النووي، ابن باز، ابن عثيمين، وغيرهم)\n" +
      "• أوضح الخلافات الفقهية بين المذاهب الأربعة\n" +
      "• أساعدك في العقيدة، الفقه، التفسير، السيرة، الأذكار وغيرها\n\n" +
      "ملاحظة: للفتوى الشخصية راجع عالمًا مختصًا.",
  },
  {
    test: PLATFORM_RX,
    answer:
      "منصة مجالس تضم:\n" +
      "📚 الدروس والمحاضرات — دروس المشايخ\n" +
      "📖 المصحف الشريف — قراءة وبحث\n" +
      "🤲 الأذكار والأدعية اليومية\n" +
      "⚖️ الأحكام الشرعية والفتاوى\n" +
      "📿 التسابيح — مسبحة إلكترونية\n" +
      "🕌 مواقيت الصلاة للكويت\n\n" +
      "استخدم القائمة الجانبية للتنقل.",
  },
  {
    test: HELP_RX,
    answer:
      "اكتب سؤالك الشرعي مباشرة وسأجيب بأقوال العلماء، مثل:\n" +
      "• «ما قول الإمام الشافعي في قراءة الفاتحة؟»\n" +
      "• «ما حكم الصوم مع المرض عند المذاهب الأربعة؟»\n" +
      "• «ما قاله ابن تيمية في صفات الله؟»",
  },
];

function buildSmartStaticResponse(query) {
  const q = String(query || "");
  for (const { test, answer } of STATIC_RESPONSES) {
    if (test.test(q)) return answer;
  }
  return null;
}

// ─── Anthropic — مع system prompt غني بالعلماء ────────────────────────────

function hasAnthropicApiKey() {
  return Boolean((process.env.ANTHROPIC_API_KEY || "").trim());
}

async function tryCallAnthropic(message, history = []) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const sanitizedHistory = Array.isArray(history)
    ? history
        .filter((m) => m.role && m.content)
        .map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content).slice(0, 2000),
        }))
        .slice(-10)
    : [];

  while (sanitizedHistory[0]?.role === "assistant") sanitizedHistory.shift();

  const messages = [...sanitizedHistory, { role: "user", content: message }];

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
        max_tokens: 1500,
        system: RICH_ISLAMIC_SYSTEM_PROMPT,
        messages,
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
    .slice(-10);
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

// ─── الإجابة الاحتياطية الغنية ─────────────────────────────────────────────

function buildFallbackAnswer(query) {
  const q = String(query || "");
  const topics = {
    صلاة: "الصلاة فريضة عظيمة. قال الإمام ابن القيم: «الصلاة عمود الدين وقرة أعين المتقين». لمعرفة أحكام تفصيلية اكتب سؤالك.",
    زكاة: "الزكاة ركن من أركان الإسلام. قال ابن قدامة في المغني: «الزكاة واجبة في أموال مخصوصة...». سلني عن حالتك بالتفصيل.",
    صيام: "الصيام ركن عظيم. قال النووي في المجموع: «الصوم في الشرع إمساك عن المفطرات...». سلني عما يهمك.",
    حج: "الحج فريضة على المستطيع. قال ابن تيمية: «الحج أحد أركان الإسلام الخمسة». سلني عن مناسكه أو أحكامه.",
    طهارة: "الطهارة شرط الصلاة. قال الشافعي: «من أراد الصلاة فلا بد له من الطهارة». سلني عن حكم بعينه.",
  };
  for (const [topic, hint] of Object.entries(topics)) {
    if (q.includes(topic)) return hint;
  }
  return "أنا المساعد العلمي لمنصة مجالس. اكتب سؤالك الشرعي وسأجيب بأقوال العلماء من المصادر الموثقة.";
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

  const conversationHistory = sanitizeMessages(body?.messages || []);

  // 1. ردود ثابتة سريعة (تحيات، هوية، مساعدة)
  const staticReply = buildSmartStaticResponse(userMessage);
  if (staticReply) {
    sendJson(res, 200, successPayload(staticReply, {
      safety_classification: "general_guidance",
      citations: [],
      confidence: 1,
      grounded: false,
      disclaimer: "",
    }));
    return;
  }

  // 2. أسئلة المؤسس (محلي)
  const founderAnswer = resolveFounderQuestion(userMessage);
  if (founderAnswer) {
    sendJson(res, 200, successPayload(founderAnswer, {
      safety_classification: "general_guidance",
      disclaimer: "",
    }));
    return;
  }

  // 3. المسائل الشخصية الحساسة — نجيب بالحكم العام ونوجّه للمختص
  const safetyClassification = classifyIslamicQuery(userMessage);
  if (safetyClassification === "blocked_sensitive_fatwa") {
    // لا نرفض الإجابة — نجيب عن الحكم العام عبر Anthropic أو الاحتياطية
    if (hasAnthropicApiKey()) {
      const anthropicAnswer = await tryCallAnthropic(userMessage, conversationHistory);
      if (anthropicAnswer) {
        sendJson(res, 200, successPayload(anthropicAnswer, {
          safety_classification: "fiqh_answer",
          citations: [],
          confidence: 0.8,
          grounded: false,
          disclaimer: "",
        }));
        return;
      }
    }
    const redirectAnswer =
      "هذه المسألة تتشعب بتشعب الأحوال. الحكم العام فيها ما قرره الفقهاء من أهل العلم،\n" +
      "وللبت في حالتك بعينها يلزم سؤال عالم يعلم تفاصيلها.\n\n" +
      "📌 إسلام سؤال وجواب: islamqa.info\n" +
      "📌 وزارة الأوقاف الكويتية: 22442200";

    sendJson(res, 200, successPayload(redirectAnswer, {
      safety_classification: "blocked_sensitive_fatwa",
      citations: [],
      confidence: 0,
      grounded: false,
      disclaimer: "",
    }));
    return;
  }

  // 4. Anthropic أولاً — يجيب بأقوال العلماء (الأولوية الحقيقية)
  if (hasAnthropicApiKey()) {
    const anthropicAnswer = await tryCallAnthropic(userMessage, conversationHistory);
    if (anthropicAnswer) {
      sendJson(res, 200, successPayload(anthropicAnswer, {
        safety_classification: safetyClassification,
        disclaimer: "",
        citations: [],
        confidence: 0.85,
        grounded: false,
      }));
      return;
    }
  }

  // 5. محرك الاستدلال الداخلي (Supabase) — يبحث في قاعدة المعرفة
  const isIslamicQuery = looksLikeIslamicKnowledgeQuery(userMessage);
  if (isIslamicQuery) {
    try {
      const grounded = await runReasoningQuery({
        query: userMessage,
        synthesize: false,
        expandGraph: true,
        limit: 15,
      });

      if (grounded.ok && !grounded.answer?.noEvidence && grounded.answer?.summary) {
        const summary = grounded.answer.summary;
        const citations = Array.isArray(grounded.answer.citations) ? grounded.answer.citations : [];
        sendJson(res, 200, successPayload(
          summary,
          {
            citations,
            confidence: grounded.confidence ?? 0.6,
            safety_classification: "fiqh_answer",
            disclaimer: "",
            grounded: true,
            retrieval_mode: grounded.retrievalMode,
          }
        ));
        return;
      }
    } catch (groundedErr) {
      console.error("[assistant] Reasoning engine error:", groundedErr?.message || groundedErr);
    }
  }

  // 6. الإجابة الاحتياطية الغنية — دائماً تعمل
  const fallback = buildFallbackAnswer(userMessage);
  sendJson(res, 200, successPayload(fallback, {
    safety_classification: "general_guidance",
    disclaimer: "",
    citations: [],
    confidence: 0.4,
    grounded: false,
  }));
}

export default async function handler(req, res) {
  try {
    await handleAssistantRequest(req, res);
  } catch (error) {
    console.error("[assistant] Route error:", error?.message || error);
    if (!res.headersSent && !res.writableEnded) {
      sendJson(res, 200, {
        ok: true,
        answer: "يسعدني مساعدتك. اكتب سؤالك الشرعي وسأجيب بأقوال العلماء من المصادر الموثقة.",
        reply: "يسعدني مساعدتك. اكتب سؤالك الشرعي وسأجيب بأقوال العلماء من المصادر الموثقة.",
        safety_classification: "general_guidance",
        disclaimer: "",
        citations: [],
        confidence: 0.1,
        grounded: false,
      });
    }
  }
}
