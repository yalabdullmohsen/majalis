import { requestFetch } from "@/lib/request-manager";

const ASSISTANT_PATH = "/api/assistant";
const ASSISTANT_HEALTH_PATH = "/api/assistant/health";

/** Absolute URL for assistant API (works with SPA + Vercel). */
export function getAssistantEndpoint(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return new URL(ASSISTANT_PATH, window.location.origin).href;
  }
  return ASSISTANT_PATH;
}

function getAssistantHealthEndpoint(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return new URL(ASSISTANT_HEALTH_PATH, window.location.origin).href;
  }
  return ASSISTANT_HEALTH_PATH;
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
  ai?: boolean;
  mode?: "ai" | "local";
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

export type AssistantHealth = {
  available: boolean;
  ai: boolean;
  mode: "ai" | "local" | "offline";
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

/** يفضّل /health لمعرفة دعم الذكاء الاصطناعي، مع احتياطي GET الرئيسي. */
export async function checkAssistantHealth(): Promise<AssistantHealth> {
  try {
    const healthRes = await requestFetch(getAssistantHealthEndpoint(), {
      timeoutMs: 8_000,
      label: "assistant:health",
    } as RequestInit);
    const healthType = healthRes.headers.get("content-type") || "";
    if (healthRes.ok && healthType.includes("application/json")) {
      const data = (await healthRes.json()) as AssistantResponse & { available?: boolean };
      const ai = Boolean(data.available);
      return { available: true, ai, mode: ai ? "ai" : "local" };
    }
  } catch {
    /* جرّب المسار الرئيسي */
  }

  try {
    const response = await requestFetch(getAssistantEndpoint(), {
      timeoutMs: 8_000,
      label: "assistant:ping",
    } as RequestInit);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return { available: false, ai: false, mode: "offline" };
    }
    const data = (await response.json()) as AssistantResponse;
    if (!data.ok && data.available === false) {
      return { available: false, ai: false, mode: "offline" };
    }
    const ai = Boolean(data.ai ?? data.available);
    return {
      available: data.available !== false,
      ai,
      mode: ai ? "ai" : "local",
    };
  } catch {
    return { available: false, ai: false, mode: "offline" };
  }
}

export async function checkAssistantAvailability(): Promise<boolean> {
  const health = await checkAssistantHealth();
  return health.available;
}
