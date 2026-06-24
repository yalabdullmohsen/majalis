import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "مرحبًا بك في المساعد العلمي. اسألني عن الدروس أو المشايخ أو الكتب داخل منصة مجالس، وسأجيب بإرشاد علمي عام دون ادعاء الإفتاء.",
};

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const question = input.trim();
    if (!question || loading) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: question,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.id !== WELCOME_MESSAGE.id)
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "تعذر الحصول على رد من المساعد الذكي.");
      }

      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: data?.reply || "لم يرجع المساعد ردًا واضحًا.",
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assistant-page">
      <section className="assistant-hero" aria-labelledby="assistant-title">
        <p className="assistant-eyebrow">المساعد الذكي</p>
        <h1 id="assistant-title">المساعد العلمي</h1>
        <p>
          رفيق بحث عربي يساعدك في الوصول إلى الدروس والمشايخ والكتب والفوائد داخل مجالس، مع التزام واضح بأن الفتوى الخاصة تُحال إلى أهل العلم المختصين.
        </p>
        <div className="assistant-links" aria-label="روابط سريعة">
          <Link href="/lessons">الدروس</Link>
          <Link href="/sheikhs">المشايخ</Link>
          <Link href="/library">المكتبة</Link>
          <Link href="/search">البحث</Link>
        </div>
      </section>

      <section className="assistant-chat" aria-label="محادثة المساعد العلمي">
        <div className="assistant-guidelines">
          <strong>تنبيه منهجي</strong>
          <span>يعطي المساعد إرشادًا عامًا، وعند طلب فتوى قطعية سيقول: "هذه مسألة تحتاج إلى عالم مختص".</span>
        </div>

        <div className="assistant-messages" aria-live="polite">
          {messages.map((message) => (
            <article key={message.id} className={`assistant-message assistant-message-${message.role}`}>
              <span>{message.role === "user" ? "أنت" : "المساعد العلمي"}</span>
              <p>{message.content}</p>
            </article>
          ))}

          {loading && (
            <div className="assistant-loading" role="status">
              المساعد يراجع السؤال...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="assistant-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={submit} className="assistant-form">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="اكتب سؤالك هنا: أرشدني إلى دروس في العقيدة، أو شيخ متخصص، أو كتاب مناسب..."
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
