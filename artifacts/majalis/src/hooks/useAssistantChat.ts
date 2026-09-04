import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  callAssistantApi,
  checkAssistantHealth,
  type AssistantHealth,
  type AssistantResponse,
  type SafetyClassification,
} from "@/lib/assistant-api";
import { resolveFounderQuestion } from "@/lib/assistant-founder";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isFailure?: boolean;
  citations?: AssistantResponse["citations"];
  grounded?: boolean;
  confidence?: number;
  safetyClassification?: SafetyClassification;
  disclaimer?: string;
};

export const ASSISTANT_FAILURE_MESSAGE = "تعذر تشغيل المساعد الآن، حاول لاحقًا.";
export const ASSISTANT_RATE_LIMIT_MESSAGE =
  "وصلت إلى حد الأسئلة لهذه الدقيقة. انتظر قليلًا ثم أعد المحاولة.";

export const ASSISTANT_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "مرحبًا بك في المساعد العلمي. اكتب سؤالك وسأجيب بإرشاد علمي عام دون ادعاء الإفتاء.",
};

const STORAGE_KEY = "majalis.assistant.chat.v1";

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pickAnswer(data: AssistantResponse): string | null {
  const text = data.answer || data.reply;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

function loadStoredMessages(): ChatMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim(),
    );
  } catch {
    return null;
  }
}

function persistMessages(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    const toStore = messages.filter((m) => m.id !== ASSISTANT_WELCOME_MESSAGE.id && !m.isFailure);
    if (toStore.length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore.slice(-40)));
  } catch {
    /* تجاهل امتلاء التخزين */
  }
}

export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = loadStoredMessages();
    return stored && stored.length > 0 ? stored : [ASSISTANT_WELCOME_MESSAGE];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<AssistantHealth>({
    available: true,
    ai: true,
    mode: "ai",
  });
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastQuestionRef = useRef<string>("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    persistMessages(messages);
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    checkAssistantHealth().then((next) => {
      if (!cancelled) setHealth(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const appendFailureMessage = (content = ASSISTANT_FAILURE_MESSAGE) => {
    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: "assistant",
        content,
        isFailure: true,
      },
    ]);
  };

  const clearChat = useCallback(() => {
    lastQuestionRef.current = "";
    setMessages([ASSISTANT_WELCOME_MESSAGE]);
    setInput("");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  /**
   * المسار الموحّد لإرسال أي سؤال (كتابة يدوية، سؤال مقترح، إعادة طرح).
   * يستقبل نص السؤال مباشرةً ولا يعتمد على قيمة `input` في الحالة،
   * تفاديًا لأي مشكلة stale state أو race condition.
   */
  const submitQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    lastQuestionRef.current = trimmed;

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
      const { response, data } = await callAssistantApi({
        message: trimmed,
        messages: history.map(({ role, content }) => ({ role, content })),
      });

      if (response.status === 429) {
        appendFailureMessage(ASSISTANT_RATE_LIMIT_MESSAGE);
        return;
      }

      if (response.status === 400) {
        appendFailureMessage(data.message || ASSISTANT_FAILURE_MESSAGE);
        return;
      }

      const answer = pickAnswer(data);

      if (data.ok && answer) {
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

      appendFailureMessage(data.message || ASSISTANT_FAILURE_MESSAGE);
    } catch (caughtError) {
      console.error("[assistant-ui] fetch error", caughtError);
      appendFailureMessage();
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await submitQuestion(input);
  };

  /** إعادة إرسال آخر سؤال بعد فشل، مع إزالة رسائل الفشل السابقة. */
  const retryLast = async () => {
    const question = lastQuestionRef.current;
    if (!question || loading) return;
    setMessages((current) => current.filter((message) => !message.isFailure));
    await submitQuestion(question);
  };

  const hasConversation = messages.some(
    (m) => m.role === "user" || (m.role === "assistant" && m.id !== ASSISTANT_WELCOME_MESSAGE.id),
  );

  return {
    messages,
    input,
    setInput,
    loading,
    health,
    hasConversation,
    clearChat,
    submitQuestion,
    sendQuestion: submitQuestion,
    retryLast,
    submit,
    bottomRef,
  };
}
