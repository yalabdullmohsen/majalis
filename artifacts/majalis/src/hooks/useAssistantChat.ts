import { useEffect, useRef, useState, type FormEvent } from "react";
import { callAssistantApi, type AssistantResponse, type SafetyClassification } from "@/lib/assistant-api";
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

export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([ASSISTANT_WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  // آخر سؤال أُرسل — يُستخدم لزر «إعادة المحاولة» عند فشل الطلب.
  const lastQuestionRef = useRef<string>("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const appendFailureMessage = () => {
    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: "assistant",
        content: ASSISTANT_FAILURE_MESSAGE,
        isFailure: true,
      },
    ]);
  };

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

      if (response.status === 429 || response.status === 400) {
        appendFailureMessage();
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

      appendFailureMessage();
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

  return {
    messages,
    input,
    setInput,
    loading,
    // الاسم القانوني الموحّد + اسم متوافق مع الاستخدام القائم.
    submitQuestion,
    sendQuestion: submitQuestion,
    retryLast,
    submit,
    bottomRef,
  };
}
