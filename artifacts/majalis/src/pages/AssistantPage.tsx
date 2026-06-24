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
    "مرحبًا بك في المساعد العلمي. اسألني عن الدروس أو المشايخ أو الكتب داخل منصة مجالس العلم، وسأجيب بإرشاد علمي عام دون ادعاء الإفتاء.",
};

const QUICK_PROMPTS = [
  "أرشدني إلى دروس في العقيدة",
  "من أبرز المشايخ في التفسير؟",
  "اقترح كتبًا للمبتدئين في طلب العلم",
  "كيف أبحث عن درس في الفقه؟",
];

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function extractError(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (typeof record.error === "string") return record.error;
  if (record.error && typeof record.error === "object") {
    const nested = record.error as Record<string, unknown>;
    if (typeof nested.message === "string") return nested.message;
  }
  return null;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serviceReady, setServiceReady] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    fetch("/api/healthz")
      .then((res) => setServiceReady(res.ok))
      .catch(() => setServiceReady(false));
  }, []);

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
      const serverError = extractError(data);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(serverError || "تم تجاوز الحد المسموح. يرجى الانتظار دقيقة ثم المحاولة مجددًا.");
        }
        if (response.status === 502 || response.status === 500) {
          throw new Error(serverError || "خدمة المساعد غير متاحة حاليًا. تحقق من إعدادات الخادم.");
        }
        throw new Error(serverError || "تعذر الحصول على رد من المساعد الذكي.");
      }

      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: typeof data?.reply === "string" && data.reply.trim()
          ? data.reply
          : "لم يرجع المساعد ردًا واضحًا.",
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (caughtError) {
      if (caughtError instanceof TypeError) {
        setError("تعذر الاتصال بخدمة المساعد. تأكد أن الخادم يعمل وأن المفتاح ANTHROPIC_API_KEY مضبوط.");
      } else {
        setError(caughtError instanceof Error ? caughtError.message : "حدث خطأ غير متوقع.");
      }
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
      <section className="assistant-hero" aria-labelledby="assistant-title">
        <p className="assistant-eyebrow">المساعد الذكي</p>
        <h1 id="assistant-title">المساعد العلمي</h1>
        <p>
          رفيق بحث عربي يساعدك في الوصول إلى الدروس والمشايخ والكتب والفوائد داخل مجالس العلم، مع التزام واضح بأن الفتوى الخاصة تُحال إلى أهل العلم المختصين.
        </p>
        {serviceReady === false && (
          <p className="assistant-service-warning" role="alert">
            خدمة المساعد غير متصلة حاليًا. تأكد من تشغيل الخادم وضبط ANTHROPIC_API_KEY.
          </p>
        )}
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

        <div className="assistant-quick-prompts" aria-label="أسئلة مقترحة">
          {QUICK_PROMPTS.map((prompt) => (
            <button key={prompt} type="button" disabled={loading} onClick={() => sendQuestion(prompt)}>
              {prompt}
            </button>
          ))}
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
          <div className="assistant-error-wrap" role="alert">
            <p className="assistant-error">{error}</p>
            <button type="button" className="assistant-retry-btn" onClick={() => setError("")}>
              إغلاق
            </button>
          </div>
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
