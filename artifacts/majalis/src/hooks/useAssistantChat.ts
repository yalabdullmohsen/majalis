import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  callAssistantApi,
  logAssistantFailure,
  type AssistantResponse,
  type SafetyClassification,
} from "@/lib/assistant-api";
import { resolveFounderQuestion } from "@/lib/assistant-founder";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isFailure?: boolean;
  retryQuestion?: string;
  citations?: AssistantResponse["citations"];
  grounded?: boolean;
  confidence?: number;
  safetyClassification?: SafetyClassification;
  disclaimer?: string;
};

export const ASSISTANT_FAILURE_MESSAGE =
  "تعذر تشغيل المساعد حالياً بسبب مشكلة تقنية، وتم تسجيل الخطأ.";

export const ASSISTANT_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "مرحبًا بك في المساعد العلمي. اكتب سؤالك وسأجيب بإرشاد علمي عام دون ادعاء الإفتاء.",
};

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pickAnswer(data: AssistantResponse): string | null {
  const text = data.answer || data.reply;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

function pickUserFacingError(data: AssistantResponse, status: number): string {
  const answer = pickAnswer(data);
  if (answer && data.fallback) return answer;

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message.trim();
  }

  if (status === 429) {
    return "محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.";
  }

  return ASSISTANT_FAILURE_MESSAGE;
}

export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([ASSISTANT_WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const appendFailureMessage = (content: string, retryQuestion?: string) => {
    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: "assistant",
        content,
        isFailure: true,
        retryQuestion,
      },
    ]);
  };

  const sendQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
    };
    const history = [...messages, userMessage].filter((message) => message.id !== ASSISTANT_WELCOME_MESSAGE.id);

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    const founderAnswer = resolveFounderQuestion(trimmed);
    if (founderAnswer) {
      setMessages((current) => [
        ...current,
        { id: createId(), role: "assistant", content: founderAnswer },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { response, data, endpoint } = await callAssistantApi({
        message: trimmed,
        messages: history.map(({ role, content }) => ({ role, content })),
      });

      const answer = pickAnswer(data);

      if (data.ok !== false && answer) {
        setMessages((current) => [
          ...current,
          {
            id: createId(),
            role: "assistant",
            content: answer,
            citations: data.citations,
            grounded: data.grounded,
            confidence: data.confidence,
            safetyClassification: data.safety_classification,
            disclaimer: data.disclaimer,
          },
        ]);
        return;
      }

      const errorText = pickUserFacingError(data, response.status);
      logAssistantFailure("send-question", {
        endpoint,
        status: response.status,
        data,
        reason: data.error_code || "no_answer_in_response",
      });
      appendFailureMessage(errorText, trimmed);
    } catch (caughtError) {
      logAssistantFailure("send-question-catch", {
        endpoint: "/api/assistant",
        status: 0,
        reason: "network_or_fetch_error",
        error: caughtError,
      });
      appendFailureMessage(ASSISTANT_FAILURE_MESSAGE, trimmed);
    } finally {
      setLoading(false);
    }
  };

  const retryLastFailure = async (question: string) => {
    await sendQuestion(question);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await sendQuestion(input);
  };

  return {
    messages,
    input,
    setInput,
    loading,
    sendQuestion,
    retryLastFailure,
    submit,
    bottomRef,
  };
}
