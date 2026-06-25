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
): Promise<{ response: Response; data: AssistantResponse; endpoint: string }> {
  const endpoint = getAssistantEndpoint();

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
    await response.text().catch(() => "");
    data = {
      ok: false,
      message: "تعذر تشغيل المساعد الآن، حاول لاحقًا.",
      fallback: true,
    };
  }

  return { response, data, endpoint };
}

export async function checkAssistantAvailability(): Promise<boolean> {
  const endpoint = getAssistantEndpoint();

  try {
    const response = await fetch(endpoint);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return false;
    const data = (await response.json()) as AssistantResponse;
    return Boolean(data.available);
  } catch {
    return false;
  }
}
