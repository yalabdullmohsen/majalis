import { requestFetch } from "@/lib/request-manager";
import type { FiqhResearchCitation } from "./fiqh-citation";

export type { FiqhResearchCitation };

export type FiqhResearchResponse = {
  ok: boolean;
  answer?: {
    summary: string;
    citations: FiqhResearchCitation[];
    disclaimer: string;
    noResults?: boolean;
    personalFatwaRedirect?: boolean;
  };
  citations?: FiqhResearchCitation[];
  retrievalMode?: string;
  fallback?: boolean;
  message?: string;
};

export type FiqhResearchFilters = {
  type?: string;
  category?: string;
  source?: string;
  year?: number | string;
};

export async function callFiqhResearchAssistant(payload: {
  query: string;
  filters?: FiqhResearchFilters;
  sessionId?: string;
}): Promise<FiqhResearchResponse> {
  const res = await requestFetch("/api/fiqh-research-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json().catch(() => ({ ok: false, message: "تعذّر الاتصال." }));
}

export async function checkFiqhResearchAvailable() {
  try {
    const res = await requestFetch("/api/fiqh-research-assistant");
    const data = await res.json();
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}
