import Anthropic from "@anthropic-ai/sdk";
import {
  ASSISTANT_MODEL,
  createAnthropicClient,
  readAnthropicApiKey,
} from "./anthropic-config.js";
import { sendJson, endEmpty } from "./_http.js";

export const maxDuration = 30;

const UNAVAILABLE_MESSAGE = "المساعد العلمي غير متاح حالياً. نعمل على تفعيله قريبًا.";
const FAILURE_MESSAGE = "تعذر تشغيل المساعد الآن، حاول لاحقًا.";

const SYSTEM_PROMPT = `
أنت "المساعد العلمي" في منصة مجالس العلم.
أجب بالعربية الفصحى الواضحة وبأسلوب علمي منضبط ومتواضع.
ساعد المستخدم في البحث عن الدروس والمشايخ والكتب والفوائد داخل منصة مجالس العلم، واقترح كلمات بحث مناسبة وروابط أقسام مثل /lessons و/sheikhs و/library و/search.
قدّم إجابات عامة ومفيدة في المسائل العلمية والتربوية دون ادعاء الإفتاء.
لا تصدر فتوى قطعية ولا تحكم على واقعة خاصة. عند طلب فتوى أو حكم شرعي ملزم قل نصًا: "هذه مسألة تحتاج إلى عالم مختص"، ثم قدّم إرشادًا عامًا للبحث أو سؤال أهل العلم.
إن كان السؤال خارج اختصاص المنصة فأجب باختصار ووجّه المستخدم إلى مصدر موثوق.
`.trim();

const DEFINITIVE_FATWA_PATTERNS = [
  /فتوى/,
  /أفتني/,
  /ما حكم/,
  /هل يجوز/,
  /يجوز لي/,
  /حلال/,
  /حرام/,
  /واجب/,
  /فرض/,
  /تبطل/,
  /صحة صلات/,
  /طلاق/,
  /زكاة/,
];

function fallbackPayload(message = FAILURE_MESSAGE) {
  return { ok: false, message, fallback: true };
}

async function parseBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== "") {
    if (typeof req.body === "object") return req.body;
    if (typeof req.body === "string") {
      try {
        return JSON.parse(req.body);
      } catch {
        return null;
      }
    }
  }

  let rawBody = "";
  if (typeof req.on === "function") {
    for await (const chunk of req) {
      rawBody += chunk;
    }
  }

  if (!rawBody) return {};

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  const sanitized = messages
    .map((message) => ({
      role: message?.role === "assistant" ? "assistant" : "user",
      content: String(message?.content || "").trim().slice(0, 4000),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-8);

  while (sanitized[0]?.role === "assistant") {
    sanitized.shift();
  }

  return sanitized;
}

function extractUserMessage(body) {
  const direct = String(body?.message || "").trim();
  if (direct) return direct;

  const messages = sanitizeMessages(body?.messages);
  return [...messages].reverse().find((message) => message.role === "user")?.content || "";
}

function looksLikeDefinitiveFatwaRequest(text) {
  return DEFINITIVE_FATWA_PATTERNS.some((pattern) => pattern.test(text));
}

function extractAnthropicText(data) {
  return (data?.content || [])
    .filter((block) => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function successPayload(answer) {
  return { ok: true, answer, reply: answer };
}

async function handleAssistantRequest(req, res) {
  const hasKey = Boolean(readAnthropicApiKey());

  console.log("[assistant] request received", {
    method: req.method,
    hasApiKey: hasKey,
    url: req.url,
  });

  if (req.method === "OPTIONS") {
    endEmpty(res, 204);
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, available: hasKey });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  if (!hasKey) {
    console.error("[assistant] Service unavailable: API key not configured");
    sendJson(res, 200, fallbackPayload(UNAVAILABLE_MESSAGE));
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

  console.log("[assistant] processing message", {
    length: userMessage.length,
    preview: userMessage.slice(0, 80),
  });

  if (looksLikeDefinitiveFatwaRequest(userMessage)) {
    sendJson(
      res,
      200,
      successPayload(
        'هذه مسألة تحتاج إلى عالم مختص. يمكنني مساعدتك بإرشاد عام: ابحث في المنصة عن كلمات المسألة أو اسم الشيخ المناسب، ثم اعرض الواقعة بتفاصيلها على عالم مؤهل.',
      ),
    );
    return;
  }

  try {
    const client = createAnthropicClient(Anthropic);
    const message = await client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const answer =
      extractAnthropicText(message) || "لم أتمكن من توليد إجابة الآن. حاول لاحقًا.";

    console.log("[assistant] success", { answerLength: answer.length });
    sendJson(res, 200, successPayload(answer));
  } catch (error) {
    console.error("[assistant] Anthropic API failed:", error);
    sendJson(res, 200, fallbackPayload(FAILURE_MESSAGE));
  }
}

export default async function handler(req, res) {
  try {
    await handleAssistantRequest(req, res);
  } catch (error) {
    console.error("[assistant] Route error:", error);
    if (!res.headersSent && !res.writableEnded) {
      sendJson(res, 200, fallbackPayload(FAILURE_MESSAGE));
    }
  }
}
