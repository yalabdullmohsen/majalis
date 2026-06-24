import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-3-5-haiku-latest";

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

function setJsonHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function getApiKey() {
  return (process.env.ANTHROPIC_API_KEY || "").trim();
}

function fallbackPayload(message = FAILURE_MESSAGE) {
  return { ok: false, message, fallback: true };
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
    }
  }

  if (!rawBody) {
    return {};
  }

  if (typeof rawBody === "string") {
    try {
      return JSON.parse(rawBody);
    } catch {
      return null;
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
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({ ok: true, available: Boolean(getApiKey()) });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("[assistant] Service unavailable: API key not configured");
    res.status(200).json(fallbackPayload(UNAVAILABLE_MESSAGE));
    return;
  }

  const body = await parseBody(req);
  if (body === null) {
    res.status(400).json({ ok: false, message: "اكتب سؤالك أولًا." });
    return;
  }

  const userMessage = extractUserMessage(body);
  if (!userMessage) {
    res.status(400).json({ ok: false, message: "اكتب سؤالك أولًا." });
    return;
  }

  if (looksLikeDefinitiveFatwaRequest(userMessage)) {
    res.status(200).json(
      successPayload(
        'هذه مسألة تحتاج إلى عالم مختص. يمكنني مساعدتك بإرشاد عام: ابحث في المنصة عن كلمات المسألة أو اسم الشيخ المناسب، ثم اعرض الواقعة بتفاصيلها على عالم مؤهل.',
      ),
    );
    return;
  }

  try {
    const client = createAnthropicClient(apiKey);
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const answer =
      extractAnthropicText(message) || "لم أتمكن من توليد إجابة الآن. حاول لاحقًا.";

    res.status(200).json(successPayload(answer));
  } catch (error) {
    console.error("[assistant] Anthropic API failed:", error);
    res.status(200).json(fallbackPayload(FAILURE_MESSAGE));
  }
}

export default async function handler(req, res) {
  try {
    setJsonHeaders(res);
    await handleAssistantRequest(req, res);
  } catch (error) {
    console.error("[assistant] Route error:", error);
    if (!res.headersSent) {
      res.status(200).json(fallbackPayload(FAILURE_MESSAGE));
    }
  }
}
