import Anthropic from "@anthropic-ai/sdk";
import { VERSION as ANTHROPIC_SDK_VERSION } from "@anthropic-ai/sdk/version";

const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-haiku-4-5";
const MAX_BODY_BYTES = 32 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const rateLimitBuckets = new Map();

const SYSTEM_PROMPT = `
أنت "المساعد العلمي" في منصة مجالس.
أجب بالعربية الفصحى الواضحة وبأسلوب علمي منضبط ومتواضع.
ساعد المستخدم في البحث عن الدروس والمشايخ والكتب والفوائد داخل منصة مجالس، واقترح كلمات بحث مناسبة وروابط أقسام مثل /lessons و/sheikhs و/library و/search.
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

function setJsonHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getHeader(req, name) {
  const headers = req?.headers;
  if (!headers) return "";
  if (typeof headers.get === "function") return headers.get(name) || "";
  return headers[name] || headers[name.toLowerCase()] || "";
}

function getClientIp(req) {
  const forwarded = getHeader(req, "x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req?.socket?.remoteAddress || "unknown";
}

function enforceRateLimit(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  bucket.count += 1;
  rateLimitBuckets.set(ip, bucket);

  if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
    const error = createHttpError(429, "طلبات كثيرة، حاول لاحقًا.");
    error.retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    throw error;
  }
}

function getAnthropicApiKey() {
  const rawApiKey = process.env.ANTHROPIC_API_KEY || "";
  const apiKey = rawApiKey.trim();

  if (!apiKey) {
    throw createHttpError(500, "لم يتم ضبط مفتاح Anthropic في متغير البيئة ANTHROPIC_API_KEY.");
  }

  return {
    apiKey,
    hadSurroundingWhitespace: rawApiKey !== apiKey,
  };
}

function createAnthropicClient(apiKey) {
  return new Anthropic({
    apiKey,
    maxRetries: 0,
    defaultHeaders: {
      "anthropic-version": ANTHROPIC_VERSION,
    },
  });
}

async function parseBody(req) {
  let rawBody = req.body;

  if (rawBody === undefined) {
    rawBody = "";
    for await (const chunk of req) {
      rawBody += chunk;
      if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
        throw createHttpError(413, "حجم الطلب كبير جدًا.");
      }
    }
  }

  if (!rawBody) {
    return {};
  }

  if (typeof rawBody === "string") {
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      throw createHttpError(413, "حجم الطلب كبير جدًا.");
    }
    try {
      return JSON.parse(rawBody);
    } catch {
      throw createHttpError(400, "صيغة الطلب غير صالحة. أرسل JSON يحتوي على messages.");
    }
  }

  return rawBody;
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

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

function getErrorStatus(error) {
  if (Number.isInteger(error?.statusCode)) {
    return error.statusCode;
  }

  if (Number.isInteger(error?.status)) {
    return error.status;
  }

  return 500;
}

function getErrorMessage(error) {
  return error instanceof Error && error.message ? error.message : "حدث خطأ غير معروف في خدمة المساعد الذكي.";
}

function logAssistantError(message, error, details = {}) {
  console.error(message, {
    ...details,
    error: getErrorMessage(error),
  });
}

function getAnthropicErrorBody(error) {
  return error && typeof error === "object" && "error" in error ? error.error : undefined;
}

async function verifyAnthropicModel(client) {
  await client.models.retrieve(MODEL);
}

async function handleAssistantRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "الطريقة غير مدعومة." });
    return;
  }

  enforceRateLimit(req);

  const body = await parseBody(req);
  const messages = sanitizeMessages(body.messages);
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");

  if (!lastUserMessage) {
    throw createHttpError(400, "أرسل سؤالًا واضحًا للمساعد.");
  }

  if (looksLikeDefinitiveFatwaRequest(lastUserMessage.content)) {
    res.status(200).json({
      reply:
        'هذه مسألة تحتاج إلى عالم مختص. يمكنني مساعدتك بإرشاد عام: ابحث في المنصة عن كلمات المسألة أو اسم الشيخ المناسب، ثم اعرض الواقعة بتفاصيلها على عالم مؤهل.',
    });
    return;
  }

  const { apiKey, hadSurroundingWhitespace } = getAnthropicApiKey();
  const client = createAnthropicClient(apiKey);

  try {
    await verifyAnthropicModel(client);

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: lastUserMessage.content }],
    });

    const reply = extractAnthropicText(message);

    if (!reply) {
      res.status(502).json({ error: "لم يرجع المساعد ردًا صالحًا." });
      return;
    }

    res.status(200).json({ reply });
  } catch (error) {
    const status = getErrorStatus(error) === 500 ? 502 : getErrorStatus(error);
    const anthropicErrorBody = getAnthropicErrorBody(error);

    logAssistantError("Anthropic request failed", error, {
      status,
      model: MODEL,
      anthropicVersion: ANTHROPIC_VERSION,
      anthropicSdkVersion: ANTHROPIC_SDK_VERSION,
      hasAnthropicApiKey: Boolean(apiKey),
      apiKeyHadSurroundingWhitespace: hadSurroundingWhitespace,
      body: anthropicErrorBody ?? getErrorMessage(error),
    });

    res.status(status).json(anthropicErrorBody ?? { error: getErrorMessage(error) });
  }
}

export default async function handler(req, res) {
  try {
    setJsonHeaders(res);
    await handleAssistantRequest(req, res);
  } catch (error) {
    const status = getErrorStatus(error);
    if (status === 429 && Number.isInteger(error?.retryAfter)) {
      res.setHeader("Retry-After", String(error.retryAfter));
    }
    logAssistantError("Assistant API route failed", error, {
      status,
      method: req?.method,
      hasAnthropicApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
      anthropicSdkVersion: ANTHROPIC_SDK_VERSION,
    });
    res.status(status).json({ error: getErrorMessage(error) });
  }
}
