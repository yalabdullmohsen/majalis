const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-sonnet-4-20250514";

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

async function parseBody(req) {
  let rawBody = req.body;

  if (rawBody === undefined) {
    rawBody = "";
    for await (const chunk of req) {
      rawBody += chunk;
    }
  }

  if (!rawBody) {
    return {};
  }

  if (typeof rawBody === "string") {
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

function parseAnthropicResponseBody(responseBody) {
  try {
    return JSON.parse(responseBody);
  } catch {
    return {};
  }
}

function getErrorStatus(error) {
  return Number.isInteger(error?.statusCode) ? error.statusCode : 500;
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

async function handleAssistantRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "الطريقة غير مدعومة." });
    return;
  }

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

  if (!process.env.ANTHROPIC_API_KEY) {
    throw createHttpError(500, "لم يتم ضبط مفتاح Anthropic في متغير البيئة ANTHROPIC_API_KEY.");
  }

  try {
    const anthropicResponse = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: lastUserMessage.content }],
      }),
    });

    const responseBody = await anthropicResponse.text();
    const data = parseAnthropicResponseBody(responseBody);

    if (!anthropicResponse.ok) {
      logAssistantError("Anthropic request failed", new Error(data?.error?.message || "Anthropic request failed"), {
        status: anthropicResponse.status,
        body: responseBody,
      });

      res.status(anthropicResponse.status).json({
        error: data?.error?.message || "تعذر الاتصال بخدمة المساعد الذكي.",
      });
      return;
    }

    const reply = extractAnthropicText(data);

    if (!reply) {
      res.status(502).json({ error: "لم يرجع المساعد ردًا صالحًا." });
      return;
    }

    res.status(200).json({ reply });
  } catch (error) {
    throw createHttpError(502, getErrorMessage(error));
  }
}

export default async function handler(req, res) {
  try {
    setJsonHeaders(res);
    await handleAssistantRequest(req, res);
  } catch (error) {
    const status = getErrorStatus(error);
    logAssistantError("Assistant API route failed", error, {
      status,
      method: req?.method,
      hasAnthropicApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
    });
    res.status(status).json({ error: getErrorMessage(error) });
  }
}
