import type { RefObject } from "react";
import type { ChatMessage } from "@/hooks/useAssistantChat";
import { AssistantReply } from "./AssistantReply";

type Props = {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  bottomRef: RefObject<HTMLDivElement | null>;
  compact?: boolean;
  onQuickPrompt?: (text: string) => void;
  quickPrompts?: string[];
};

const SUGGESTED_CATEGORIES = [
  {
    icon: "🕌",
    label: "عبادات",
    questions: [
      "ما هي أذكار الصباح والمساء؟",
      "كيف أؤدي صلاة الفجر في وقتها؟",
      "ما حكم قراءة القرآن بدون وضوء؟",
    ],
  },
  {
    icon: "⚖️",
    label: "فقه",
    questions: [
      "ما حكم القروض البنكية بفائدة؟",
      "ما هي شروط الزكاة؟",
      "ما حكم صيام القضاء بعد رمضان؟",
    ],
  },
  {
    icon: "💰",
    label: "معاملات",
    questions: [
      "ما حكم البيع والشراء عبر الإنترنت؟",
      "هل يجوز العمل في البنوك؟",
      "ما حكم التأمين التجاري؟",
    ],
  },
  {
    icon: "📖",
    label: "قرآن وسنة",
    questions: [
      "ما فضل قراءة القرآن يومياً؟",
      "كيف أحفظ القرآن الكريم؟",
      "ما هي أحاديث فضل ذكر الله؟",
    ],
  },
  {
    icon: "👨‍👩‍👧",
    label: "أسرة",
    questions: [
      "ما حقوق الوالدين في الإسلام؟",
      "كيف أربّي أبنائي تربية إسلامية؟",
      "ما آداب الزواج في الإسلام؟",
    ],
  },
  {
    icon: "🌍",
    label: "معاصر",
    questions: [
      "ما حكم متابعة مسلسلات التلفزيون؟",
      "هل يجوز الاستماع للموسيقى؟",
      "ما حكم العمل في شركات غير مسلمة؟",
    ],
  },
];

function safetyLabel(classification: string): string {
  switch (classification) {
    case "fiqh_answer": return "إجابة فقهية مستندة";
    case "requires_scholar": return "تحتاج أهل العلم";
    case "insufficient_sources": return "جرى توجيهك للمصادر";
    case "blocked_sensitive_fatwa": return "مسألة شخصية — راجع عالماً";
    default: return "إرشاد عام";
  }
}

function CitationCard({ cite }: { cite: { title: string; href: string; source_name?: string | null; trust_score?: number } }) {
  return (
    <a
      href={cite.href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.4rem 0.75rem",
        borderRadius: "0.375rem",
        background: "var(--ds-parchment, #FAF7F2)",
        border: "1px solid var(--ds-line, #E5DDD0)",
        textDecoration: "none",
        color: "var(--ds-ink, #2C2416)",
        fontSize: "0.8rem",
        transition: "background 0.15s",
      }}
    >
      <span style={{ fontSize: "1rem" }}>📚</span>
      <span style={{ flex: 1 }}>
        <strong style={{ display: "block", fontSize: "0.8125rem" }}>{cite.title}</strong>
        {cite.source_name && (
          <span style={{ fontSize: "0.7rem", color: "var(--ds-ink-soft, #8A7560)" }}>{cite.source_name}</span>
        )}
      </span>
      {cite.trust_score != null && (
        <span style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 700 }}>{cite.trust_score}%</span>
      )}
      <span style={{ fontSize: "0.75rem", color: "var(--ds-ink-soft, #8A7560)" }}>←</span>
    </a>
  );
}

export function AssistantChatView({
  messages,
  input,
  loading,
  onInputChange,
  onSubmit,
  bottomRef,
  compact = false,
  onQuickPrompt,
}: Props) {
  const showSuggestions = onQuickPrompt && messages.length <= 1;

  return (
    <div className={`assistant-chat-view${compact ? " assistant-chat-view--compact" : ""}`}>

      {/* Categorized suggestions shown only on empty chat */}
      {showSuggestions && (
        <div style={{ marginBottom: "1rem" }}>
          {SUGGESTED_CATEGORIES.map((cat) => (
            <div key={cat.label} style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ds-ink-soft, #8A7560)", marginBottom: "0.375rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span>{cat.icon}</span> {cat.label}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {cat.questions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={loading}
                    onClick={() => onQuickPrompt(q)}
                    className="assistant-quick-prompt-chip"
                    style={{
                      padding: "0.3rem 0.625rem",
                      borderRadius: "99px",
                      border: "1px solid var(--ds-line, #E5DDD0)",
                      background: "var(--ds-panel, #FFFFFF)",
                      color: "var(--ds-ink, #2C2416)",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "right",
                      transition: "background 0.15s",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="assistant-messages" aria-live="polite">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`assistant-message assistant-message-${message.role}${
              message.isFailure ? " assistant-message-failure" : ""
            }${
              message.role === "assistant" && !message.isFailure
                ? " assistant-message-reply assistant-message-bubble"
                : ""
            }`}
          >
            <span className="assistant-message-label">
              {message.role === "user" ? "أنت" : "المساعد العلمي"}
            </span>
            {message.role === "assistant" && !message.isFailure ? (
              <>
                <AssistantReply content={message.content} />

                {/* Safety + confidence badge */}
                {message.safetyClassification && (
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "0.7rem",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "99px",
                      background: message.grounded ? "#D1FAE5" : "#FEF3C7",
                      color: message.grounded ? "#065F46" : "#92400E",
                      fontWeight: 600,
                    }}>
                      {safetyLabel(message.safetyClassification)}
                    </span>
                    {message.confidence != null && message.grounded && message.confidence > 0 && (
                      <span style={{ fontSize: "0.7rem", color: "var(--ds-ink-soft, #8A7560)" }}>
                        ثقة: {Math.round(message.confidence * (message.confidence <= 1 ? 100 : 1))}%
                      </span>
                    )}
                  </div>
                )}

                {/* Citation cards */}
                {message.citations && message.citations.length > 0 && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ds-ink-soft, #8A7560)", marginBottom: "0.375rem" }}>
                      المصادر ({message.citations.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {message.citations.slice(0, 5).map((cite, i) => (
                        <CitationCard key={`${cite.href}-${i}`} cite={cite} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <p className="assistant-disclaimer" style={{
                  marginTop: "0.625rem",
                  fontSize: "0.75rem",
                  color: "var(--majalis-brass-deep, #7A5C1E)",
                  borderTop: "1px solid var(--ds-line, #E5DDD0)",
                  paddingTop: "0.375rem",
                }}>
                  ⚠️ {message.disclaimer || "هذه إجابة تعليمية مختصرة وليست فتوى شخصية ملزمة."}
                </p>
              </>
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

      <form onSubmit={onSubmit} className="assistant-form">
        <textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="اكتب سؤالك الشرعي هنا..."
          rows={compact ? 2 : 3}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "جارٍ البحث..." : "إرسال"}
        </button>
      </form>
    </div>
  );
}

export default AssistantChatView;
