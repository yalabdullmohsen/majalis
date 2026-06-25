import { sendJson, endEmpty } from "./_http.js";
import {
  FOUNDER_SYSTEM_NOTE,
  resolveFounderQuestion,
} from "../lib/assistant-founder.mjs";

export const maxDuration = 30;

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const ASSISTANT_MODEL = "claude-haiku-4-5";

const UNAVAILABLE_MESSAGE = "المساعد العلمي غير متاح حالياً. نعمل على تفعيله قريبًا.";
const FAILURE_MESSAGE = "تعذر تشغيل المساعد الآن، حاول لاحقًا.";

const SYSTEM_PROMPT =
  `أنت المساعد الذكي الرسمي لمنصة المجلس العلمي. أجب بأدب واختصار، ولا تصدر فتوى خاصة، وانصح بسؤال أهل العلم في النوازل. ${FOUNDER_SYSTEM_NOTE}`;

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

function hasAnthropicApiKey() {
  return Boolean((process.env.ANTHROPIC_API_KEY || "").trim());
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

function successPayload(answer) {
  return { ok: true, answer, reply: answer };
}

async function callAnthropic(message) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

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
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error("[assistant] Anthropic API failed:", {
      status: response.status,
      responseText,
    });
    throw new Error(`Anthropic request failed with status ${response.status}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (error) {
    console.error("[assistant] Anthropic invalid JSON:", {
      status: response.status,
      responseText,
      error,
    });
    throw error;
  }

  const answer = data?.content?.[0]?.text;
  return typeof answer === "string" ? answer.trim() : "";
}

async function handleAssistantRequest(req, res) {
  const hasKey = hasAnthropicApiKey();

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
    console.error("[assistant] Service unavailable: ANTHROPIC_API_KEY not configured");
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

  const founderAnswer = resolveFounderQuestion(userMessage);
  if (founderAnswer) {
    sendJson(res, 200, successPayload(founderAnswer));
    return;
  }

  try {
    const answer = await callAnthropic(userMessage);

    if (!answer) {
      console.error("[assistant] Anthropic returned empty answer");
      sendJson(res, 200, fallbackPayload(FAILURE_MESSAGE));
      return;
    }

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
