import type { RefObject } from "react";
import { BookOpen, Globe, Landmark, Library, Scale, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

const SUGGESTED_CATEGORIES: { Icon: LucideIcon; label: string; questions: string[] }[] = [
  {
    Icon: Landmark,
    label: "عبادات",
    questions: [
      "ما هي أذكار الصباح والمساء؟",
      "كيف أؤدي صلاة الفجر في وقتها؟",
      "ما حكم قراءة القرآن بدون وضوء؟",
    ],
  },
  {
    Icon: Scale,
    label: "فقه",
    questions: [
      "ما حكم القروض البنكية بفائدة؟",
      "ما هي شروط الزكاة؟",
      "ما حكم صيام القضاء بعد رمضان؟",
    ],
  },
  {
    Icon: Scale,
    label: "معاملات",
    questions: [
      "ما حكم البيع والشراء عبر الإنترنت؟",
      "هل يجوز العمل في البنوك؟",
      "ما حكم التأمين التجاري؟",
    ],
  },
  {
    Icon: BookOpen,
    label: "قرآن وسنة",
    questions: [
      "ما فضل قراءة القرآن يومياً؟",
      "كيف أحفظ القرآن الكريم؟",
      "ما هي أحاديث فضل ذكر الله؟",
    ],
  },
  {
    Icon: Users,
    label: "أسرة",
    questions: [
      "ما حقوق الوالدين في الإسلام؟",
      "كيف أربّي أبنائي تربية إسلامية؟",
      "ما آداب الزواج في الإسلام؟",
    ],
  },
  {
    Icon: Globe,
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
    <a href={cite.href} target="_blank" rel="noopener noreferrer" className="acv-cite-card">
      <span className="acv-cite-card__icon"><Library size={16} /></span>
      <span className="acv-cite-card__body">
        <strong className="acv-cite-card__title">{cite.title}</strong>
        {cite.source_name && (
          <span className="acv-cite-card__source">{cite.source_name}</span>
        )}
      </span>
      {cite.trust_score != null && (
        <span className="acv-cite-card__score">{cite.trust_score}%</span>
      )}
      <span className="acv-cite-card__arrow">←</span>
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
        <div className="acv-suggestions">
          {SUGGESTED_CATEGORIES.map((cat) => (
            <div key={cat.label} className="acv-cat">
              <div className="acv-cat__head">
                <span>{(() => { const I = cat.Icon; return <I size={15} />; })()}</span> {cat.label}
              </div>
              <div className="acv-cat__pills">
                {cat.questions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={loading}
                    onClick={() => onQuickPrompt(q)}
                    className="assistant-quick-prompt-chip"
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
                  <div className="acv-safety-row">
                    <span className={`acv-safety-badge${message.grounded ? " acv-safety-badge--grounded" : ""}`}>
                      {safetyLabel(message.safetyClassification)}
                    </span>
                    {message.confidence != null && message.grounded && message.confidence > 0 && (
                      <span className="acv-confidence">
                        ثقة: {Math.round(message.confidence * (message.confidence <= 1 ? 100 : 1))}%
                      </span>
                    )}
                  </div>
                )}

                {/* Citation cards */}
                {message.citations && message.citations.length > 0 && (
                  <div className="acv-citations">
                    <div className="acv-citations__head">
                      المصادر ({message.citations.length})
                    </div>
                    <div className="acv-citations__list">
                      {message.citations.slice(0, 5).map((cite, i) => (
                        <CitationCard key={`${cite.href}-${i}`} cite={cite} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <p className="assistant-disclaimer">
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
