import { useEffect, useRef, useState, type FormEvent } from "react";
import { callAssistantApi, type AssistantResponse } from "@/lib/assistant-api";
import { splitAssistantLines } from "@/lib/assistant-text";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isFailure?: boolean;
};

export const FAILURE_MESSAGE = "تعذر تشغيل المساعد الآن، حاول لاحقًا.";

const WELCOME_MESSAGE: ChatMessage = {
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

function AssistantReply({ content }: { content: string }) {
  const lines = splitAssistantLines(content);

  return (
    <div className="assistant-reply space-y-2">
      {lines.map((line, index) => {
        const isTitle = index === 0 && !line.startsWith("•");

        return (
          <p
            key={`${index}-${line.slice(0, 24)}`}
            className={isTitle ? "assistant-reply-title" : "assistant-reply-line"}
          >
            {line}
          </p>
        );
      })}
    </div>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
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
    const history = [...messages, userMessage].filter((message) => message.id !== WELCOME_MESSAGE.id);

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

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
    <div className="assistant-page">
      <header className="assistant-header">
        <div className="assistant-header-top">
          <h1 className="assistant-title">المساعد العلمي</h1>
        </div>
        <p className="assistant-intro">
          مساعد ذكي يرشدك في المسائل العلمية العامة داخل المجلس العلمي. الفتوى الخاصة تُعرض على
          عالم مختص.
        </p>
      </header>

      <section className="assistant-chat" aria-label="محادثة المساعد العلمي">
        <div className="assistant-messages" aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`assistant-message assistant-message-${message.role}${
                message.isFailure ? " assistant-message-failure" : ""
              }${
                message.role === "assistant" && !message.isFailure
                  ? " assistant-message-reply max-w-2xl w-full self-end rounded-2xl border border-[#E0D7C4] bg-white p-4 shadow-sm"
                  : ""
              }`}
            >
              <span>{message.role === "user" ? "أنت" : "المساعد العلمي"}</span>
              {message.role === "assistant" && !message.isFailure ? (
                <AssistantReply content={message.content} />
              ) : (
                <p>{message.content}</p>
              )}
            </article>
          ))}

          {loading && (
            <div className="assistant-loading" role="status">
              المساعد يراجع السؤال...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form onSubmit={submit} className="assistant-form">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="اكتب سؤالك هنا..."
            rows={3}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? "جار الإرسال..." : "إرسال"}
          </button>
        </form>
      </section>
    </div>
  );
}
