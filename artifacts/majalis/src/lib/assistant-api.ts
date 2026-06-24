const ASSISTANT_PATH = "/api/assistant";

/** Absolute URL for assistant API (works with SPA + Vercel). */
export function getAssistantEndpoint(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return new URL(ASSISTANT_PATH, window.location.origin).href;
  }
  return ASSISTANT_PATH;
}

export type AssistantResponse = {
  ok?: boolean;
  available?: boolean;
  answer?: string;
  reply?: string;
  message?: string;
  fallback?: boolean;
};

export async function callAssistantApi(
  body: { message: string; messages: { role: string; content: string }[] },
  logPrefix = "[assistant-ui]",
): Promise<{ response: Response; data: AssistantResponse; endpoint: string }> {
  const endpoint = getAssistantEndpoint();

  console.log(`${logPrefix} before fetch`, { endpoint, method: "POST", message: body.message });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";
  let data: AssistantResponse = {};

  if (contentType.includes("application/json")) {
    data = (await response.json().catch(() => ({}))) as AssistantResponse;
  } else {
    const raw = await response.text().catch(() => "");
    console.error(`${logPrefix} non-JSON response`, {
      status: response.status,
      contentType,
      preview: raw.slice(0, 120),
    });
    data = {
      ok: false,
      message: "تعذر تشغيل المساعد الآن، حاول لاحقًا.",
      fallback: true,
    };
  }

  console.log(`${logPrefix} after fetch`, {
    endpoint,
    status: response.status,
    ok: data.ok,
    fallback: data.fallback,
    hasAnswer: Boolean(data.answer || data.reply),
  });

  return { response, data, endpoint };
}

export async function checkAssistantAvailability(logPrefix = "[assistant-ui]"): Promise<boolean> {
  const endpoint = getAssistantEndpoint();
  console.log(`${logPrefix} checking availability`, { endpoint });

  try {
    const response = await fetch(endpoint);
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      console.warn(`${logPrefix} availability check returned non-JSON`, {
        status: response.status,
        contentType,
      });
      return false;
    }

    const data = (await response.json()) as AssistantResponse;
    console.log(`${logPrefix} availability`, { available: data.available });
    return Boolean(data.available);
  } catch (error) {
    console.error(`${logPrefix} availability check failed`, error);
    return false;
  }
}
