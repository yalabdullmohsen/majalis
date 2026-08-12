import { useCallback, useState } from "react";
import { callFiqhResearchAssistant, type FiqhResearchFilters } from "@/lib/fiqh-research-assistant-api";
import { searchForResearchAssistant, type FiqhResearchAnswer } from "@/lib/fiqh-research-assistant";
import type { FiqhResearchCitation } from "@/lib/fiqh-citation";

export type FiqhResearchMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: FiqhResearchCitation[];
  disclaimer?: string;
};

function createId() {
  return `fr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const SESSION_KEY = "fiqh-research-session";

function getSessionId() {
  if (typeof window === "undefined") return undefined;
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = createId();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useFiqhResearchChat() {
  const [messages, setMessages] = useState<FiqhResearchMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<FiqhResearchAnswer | null>(null);

  const ask = useCallback(async (query: string, filters: FiqhResearchFilters = {}) => {
    const q = query.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { id: createId(), role: "user", content: q }]);
    setLoading(true);

    try {
      const apiRes = await callFiqhResearchAssistant({
        query: q,
        filters,
        sessionId: getSessionId(),
      });

      let answer: FiqhResearchAnswer;

      if (apiRes.ok && apiRes.answer) {
        answer = {
          summary: apiRes.answer.summary,
          citations: apiRes.answer.citations,
          disclaimer: apiRes.answer.disclaimer,
          noResults: Boolean(apiRes.answer.noResults),
          personalFatwaRedirect: apiRes.answer.personalFatwaRedirect,
        };
      } else {
        const local = await searchForResearchAssistant(q, {
          type: filters.type as any,
          category: filters.category,
          source: filters.source,
          year: filters.year === "الكل" || !filters.year ? "الكل" : Number(filters.year),
        });
        answer = local.answer;
      }

      setLastAnswer(answer);
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: answer.summary,
          citations: answer.citations,
          disclaimer: answer.disclaimer,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: "تعذّر إتمام البحث. حاول مرة أخرى.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const reset = useCallback(() => {
    setMessages([]);
    setLastAnswer(null);
  }, []);

  return { messages, loading, ask, reset, lastAnswer };
}
