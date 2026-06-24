import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AssistantResponse = {
  ok?: boolean;
  available?: boolean;
  answer?: string;
  reply?: string;
  message?: string;
  fallback?: boolean;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "مرحبًا بك في المساعد العلمي. اسألني عن الدروس أو المشايخ أو الكتب داخل منصة مجالس العلم، وسأجيب بإرشاد علمي عام دون ادعاء الإفتاء.",
};

const UNAVAILABLE_BANNER = "المساعد العلمي غير متاح حالياً. نعمل على تفعيله قريبًا.";
const FAILURE_MESSAGE = "تعذر تشغيل المساعد الآن، حاول لاحقًا.";

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

function buildFallbackGuidance(question: string): string {
  const hints: string[] = [];

  if (/درس|دروس|محاض|دورة|إعلان/.test(question)) {
    hints.push("تصفّح قسم الدروس (/lessons) أو إعلانات الدروس (/announcements).");
  }
  if (/شيخ|مشايخ|داع|عالم/.test(question)) {
    hints.push("راجع قسم المشايخ (/sheikhs) للتعرف على العلماء المعتمدين.");
  }
  if (/كتاب|مكتبة|متن|تفسير|فقه/.test(question)) {
    hints.push("زُر المكتبة العلمية (/library) للكتب والمتون.");
  }
  if (/سؤال|فتو|حكم|يجوز/.test(question)) {
    hints.push("للأسئلة الشرعية العامة راجع قسم الأسئلة والأجوبة (/qa).");
  }

  if (hints.length === 0) {
    return [
      "يمكنك البحث داخل المنصة عبر قسم البحث (/search)،",
      "أو تصفّح الدروس (/lessons) والمكتبة (/library) والمشايخ (/sheikhs).",
      "",
      "تذكّر: الفتوى الخاصة تُعرض على عالم مختص.",
    ].join("\n");
  }

  return [
    ...hints,
    "",
    "يمكنك أيضًا استخدام البحث (/search) للعثور على محتوى محدد.",
    "",
    "تذكّر: الفتوى الخاصة تُعرض على عالم مختص.",
  ].join("\n");
}

function pickAnswer(data: AssistantResponse): string | null {
  const text = data.answer || data.reply;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assistantAvailable, setAssistantAvailable] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    fetch("/api/assistant")
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as AssistantResponse;
        setAssistantAvailable(Boolean(data.available));
      })
      .catch(() => setAssistantAvailable(false));
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
          message: trimmed,
          messages: nextMessages
            .filter((message) => message.id !== WELCOME_MESSAGE.id)
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as AssistantResponse;

      if (response.status === 429) {
        setError("تم تجاوز الحد المسموح. يرجى الانتظار دقيقة ثم المحاولة مجددًا.");
        return;
      }

      if (response.status === 400) {
        setError(data.message || "اكتب سؤالك أولًا.");
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

      const userMessageText = data.message || FAILURE_MESSAGE;
      const guidance = data.fallback ? buildFallbackGuidance(trimmed) : userMessageText;

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: data.fallback
            ? `${userMessageText}\n\n${guidance}`
            : userMessageText,
        },
      ]);

      if (data.fallback && data.message === UNAVAILABLE_BANNER) {
        setAssistantAvailable(false);
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: `${FAILURE_MESSAGE}\n\n${buildFallbackGuidance(trimmed)}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await sendQuestion(input);
  };

  const showUnavailableBanner = assistantAvailable === false;

  return (
    <div className="assistant-page">
      <section className="assistant-hero" aria-labelledby="assistant-title">
        <p className="assistant-eyebrow">المساعد الذكي</p>
        <h1 id="assistant-title">المساعد العلمي</h1>
        <p>
          رفيق بحث عربي يساعدك في الوصول إلى الدروس والمشايخ والكتب والفوائد داخل مجالس العلم، مع التزام واضح بأن الفتوى الخاصة تُحال إلى أهل العلم المختصين.
        </p>

        {showUnavailableBanner && (
          <div className="assistant-unavailable" role="alert">
            <p>{UNAVAILABLE_BANNER}</p>
            <Link href="/" className="assistant-home-btn">
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
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
