import { requestFetch } from "@/lib/request-manager";
const ASSISTANT_PATH = "/api/assistant";

/** Absolute URL for assistant API (works with SPA + Vercel). */
export function getAssistantEndpoint(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return new URL(ASSISTANT_PATH, window.location.origin).href;
  }
  return ASSISTANT_PATH;
}

export type SafetyClassification =
  | "general_guidance"
  | "fiqh_answer"
  | "requires_scholar"
  | "insufficient_sources"
  | "blocked_sensitive_fatwa";

export type AssistantResponse = {
  ok?: boolean;
  available?: boolean;
  answer?: string;
  reply?: string;
  message?: string;
  fallback?: boolean;
  grounded?: boolean;
  no_evidence?: boolean;
  confidence?: number;
  safety_classification?: SafetyClassification;
  disclaimer?: string;
  citations?: Array<{
    title: string;
    href: string;
    source_name?: string | null;
    trust_score?: number;
  }>;
  retrieval_mode?: string;
};

export async function callAssistantApi(
  body: { message: string; messages: { role: string; content: string }[] },
): Promise<{ response: Response; data: AssistantResponse; endpoint: string }> {
  const endpoint = getAssistantEndpoint();

  const response = await requestFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    timeoutMs: 30_000,
    label: "assistant:chat",
  } as RequestInit);

  const contentType = response.headers.get("content-type") || "";
  let data: AssistantResponse;

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
    const response = await requestFetch(endpoint);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return false;
    const data = (await response.json()) as AssistantResponse;
    return Boolean(data.available);
  } catch {
    return false;
  }
}
