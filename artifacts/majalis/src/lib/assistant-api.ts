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

export type AssistantErrorCode =
  | "AI_PROVIDER_NOT_CONFIGURED"
  | "AI_PROVIDER_ERROR"
  | "AI_EMPTY_RESPONSE"
  | "METHOD_NOT_ALLOWED"
  | "EMPTY_MESSAGE"
  | "INVALID_JSON"
  | "INTERNAL_ERROR"
  | "NON_JSON_RESPONSE"
  | "NETWORK_ERROR";

export type AssistantResponse = {
  ok?: boolean;
  available?: boolean;
  answer?: string;
  reply?: string;
  message?: string;
  fallback?: boolean;
  error_code?: AssistantErrorCode | string;
  grounded?: boolean;
  no_evidence?: boolean;
  confidence?: number;
  safety_classification?: SafetyClassification;
  disclaimer?: string;
  provider?: string;
  model?: string;
  citations?: Array<{
    title: string;
    href: string;
    source_name?: string | null;
    trust_score?: number;
  }>;
  retrieval_mode?: string;
};

export type AssistantCallResult = {
  response: Response;
  data: AssistantResponse;
  endpoint: string;
};

export function logAssistantFailure(
  context: string,
  details: {
    endpoint: string;
    status: number;
    data?: AssistantResponse;
    reason?: string;
    error?: unknown;
  },
) {
  console.error(`[assistant-ui:${context}]`, {
    endpoint: details.endpoint,
    status: details.status,
    error_code: details.data?.error_code,
    responseBody: details.data,
    reason: details.reason,
    error: details.error instanceof Error ? details.error.message : details.error,
  });
}

export async function callAssistantApi(
  body: { message: string; messages: { role: string; content: string }[] },
): Promise<AssistantCallResult> {
  const endpoint = getAssistantEndpoint();

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    logAssistantFailure("network", {
      endpoint,
      status: 0,
      reason: "fetch_failed",
      error,
    });
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  let data: AssistantResponse;

  if (contentType.includes("application/json")) {
    try {
      data = (await response.json()) as AssistantResponse;
    } catch (error) {
      logAssistantFailure("json-parse", {
        endpoint,
        status: response.status,
        reason: "invalid_json_body",
        error,
      });
      data = {
        ok: false,
        error_code: "NON_JSON_RESPONSE",
        message: "تعذر تشغيل المساعد حالياً بسبب مشكلة تقنية، وتم تسجيل الخطأ.",
        fallback: true,
      };
    }
  } else {
    const raw = await response.text().catch(() => "");
    logAssistantFailure("non-json", {
      endpoint,
      status: response.status,
      data: { message: raw.slice(0, 200) },
      reason: "expected_json_got_html_or_text",
    });
    data = {
      ok: false,
      error_code: "NON_JSON_RESPONSE",
      message: "تعذر تشغيل المساعد حالياً بسبب مشكلة تقنية، وتم تسجيل الخطأ.",
      fallback: true,
    };
  }

  if (!response.ok || data.ok === false) {
    logAssistantFailure("api-error", {
      endpoint,
      status: response.status,
      data,
      reason: data.error_code || "request_failed",
    });
  }

  return { response, data, endpoint };
}

export async function checkAssistantAvailability(): Promise<boolean> {
  const endpoint = getAssistantEndpoint();

  try {
    const response = await fetch(endpoint);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      logAssistantFailure("health-non-json", {
        endpoint,
        status: response.status,
        reason: "health_check_non_json",
      });
      return false;
    }
    const data = (await response.json()) as AssistantResponse;
    return Boolean(data.available ?? data.ok);
  } catch (error) {
    logAssistantFailure("health", { endpoint, status: 0, reason: "health_check_failed", error });
    return false;
  }
}
