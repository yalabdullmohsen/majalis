import { useEffect, useRef, useState, type FormEvent } from "react";
import { callAssistantApi, type AssistantResponse } from "@/lib/assistant-api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isFailure?: boolean;
};

export const FAILURE_MESSAGE = "تعذر تشغيل المساعد الآن، حاول لاحقًا.";

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pickAnswer(data: AssistantResponse): string | null {
  const text = data.answer || data.reply;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const appendFailureMessage = () => {
    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: "assistant",
        content: FAILURE_MESSAGE,
        isFailure: true,
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
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const { response, data } = await callAssistantApi({
        message: trimmed,
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
      });

      if (response.status === 429 || response.status === 400) {
        appendFailureMessage();
        return;
      }

      const answer = pickAnswer(data);

      if (data.ok && answer) {
        setMessages((current) => [
          ...current,
          { id: createId(), role: "assistant", content: answer },
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
    await sendQuestion(input);
  };

  return (
    <div className="assistant-page assistant-page-minimal">
      <section className="assistant-chat" aria-label="المساعد العلمي">
        {messages.length > 0 && (
          <div className="assistant-messages" aria-live="polite">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`assistant-message assistant-message-${message.role}${
                  message.isFailure ? " assistant-message-failure" : ""
                }`}
              >
                <p>{message.content}</p>
              </article>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {loading && (
          <div className="assistant-loading" role="status">
            جار الإرسال...
          </div>
        )}

        <form onSubmit={submit} className="assistant-form">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="اكتب سؤالك هنا..."
            rows={2}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? "..." : "إرسال"}
          </button>
        </form>
      </section>
    </div>
  );
}
