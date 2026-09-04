import type { KeyboardEvent, RefObject } from "react";
import {
  AlertTriangle,
  BookOpen,
  Eraser,
  Globe,
  Landmark,
  Library,
  RefreshCw,
  Scale,
  SendHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AssistantHealth } from "@/lib/assistant-api";
import type { ChatMessage } from "@/hooks/useAssistantChat";
import { ASSISTANT_WELCOME_MESSAGE } from "@/hooks/useAssistantChat";
import { AssistantReply } from "./AssistantReply";
import "@/styles/components/assistant-chat.css";
import "@/styles/pages/assistant-shell.css";

type Props = {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  bottomRef: RefObject<HTMLDivElement | null>;
  compact?: boolean;
  onQuickPrompt?: (text: string) => void;
  onRetry?: () => void;
  onClear?: () => void;
  health?: AssistantHealth;
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

/**
 * وسم «مستندة» لا يُعرض إلا بوجود مصادر فعلية — إجابة بلا citations ليست مستندة
 * مهما كان تصنيفها القادم من الخادم.
 */
function safetyLabel(classification: string, hasCitations: boolean): string {
  switch (classification) {
    case "fiqh_answer":
      return hasCitations ? "إجابة فقهية مستندة" : "إجابة تعليمية عامة";
    case "requires_scholar":
      return "تحتاج أهل العلم";
    case "insufficient_sources":
      return "جرى توجيهك للمصادر";
    case "blocked_sensitive_fatwa":
      return "مسألة شخصية، راجع عالماً";
    default:
      return "إرشاد عام";
  }
}

const DEFAULT_DISCLAIMER = "هذه إجابة تعليمية مختصرة وليست فتوى شخصية ملزمة.";

function CitationCard({
  cite,
}: {
  cite: { title: string; href: string; source_name?: string | null; trust_score?: number };
}) {
  return (
    <a href={cite.href} target="_blank" rel="noopener noreferrer" className="acv-cite-card">
      <span className="acv-cite-card__icon">
        <Library size={16} />
      </span>
      <span className="acv-cite-card__body">
        <strong className="acv-cite-card__title">{cite.title}</strong>
        {cite.source_name && <span className="acv-cite-card__source">{cite.source_name}</span>}
      </span>
      {cite.trust_score != null && <span className="acv-cite-card__score">{cite.trust_score}%</span>}
      <span className="acv-cite-card__arrow">←</span>
    </a>
  );
}

function TypingIndicator() {
  return (
    <div className="acv-typing" role="status" aria-live="polite">
      <span className="acv-typing__avatar" aria-hidden="true">
        <Sparkles size={14} />
      </span>
      <div className="acv-typing__bubble">
        <span className="acv-typing__label">المساعد يراجع السؤال</span>
        <span className="acv-typing__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

function EmptyState({
  compact,
  loading,
  onQuickPrompt,
}: {
  compact?: boolean;
  loading: boolean;
  onQuickPrompt?: (text: string) => void;
}) {
  if (!onQuickPrompt) return null;
  return (
    <div className={`acv-empty${compact ? " acv-empty--compact" : ""}`}>
      <div className="acv-empty__hero">
        <span className="acv-empty__icon" aria-hidden="true">
          <Sparkles size={compact ? 22 : 28} strokeWidth={2} />
        </span>
        <h3 className="acv-empty__title">اسأل المساعد العلمي</h3>
        <p className="acv-empty__desc">
          إرشاد علمي عام من القرآن والسنة وأقوال العلماء — دون ادعاء الفتوى الشخصية.
        </p>
      </div>
      <div className="acv-suggestions">
        {SUGGESTED_CATEGORIES.map((cat) => {
          const Icon = cat.Icon;
          return (
            <div key={cat.label} className="acv-cat">
              <div className="acv-cat__head">
                <Icon size={15} aria-hidden="true" />
                <span>{cat.label}</span>
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
          );
        })}
      </div>
    </div>
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
  onRetry,
  onClear,
  health,
}: Props) {
  const visibleMessages = messages.filter((m) => m.id !== ASSISTANT_WELCOME_MESSAGE.id);
  const showEmpty = visibleMessages.length === 0 && !loading;
  const canClear = Boolean(onClear) && visibleMessages.length > 0 && !loading;

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!loading && input.trim()) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  };

  return (
    <div className={`assistant-chat-view${compact ? " assistant-chat-view--compact" : ""}`}>
      {(health || canClear) && (
        <div className="acv-toolbar">
          {health && (
            <span
              className={`acv-status acv-status--${health.mode}`}
              title={
                health.mode === "ai"
                  ? "مدعوم بالذكاء الاصطناعي مع مصادر محلية"
                  : health.mode === "local"
                    ? "يعمل بالمصادر المحلية"
                    : "تعذر الاتصال بالخادم"
              }
            >
              <span className="acv-status__dot" aria-hidden="true" />
              {health.mode === "ai"
                ? "ذكاء اصطناعي نشط"
                : health.mode === "local"
                  ? "مصادر محلية"
                  : "غير متصل"}
            </span>
          )}
          {canClear && (
            <button type="button" className="acv-clear-btn" onClick={onClear} aria-label="محادثة جديدة">
              <Eraser size={14} aria-hidden="true" />
              محادثة جديدة
            </button>
          )}
        </div>
      )}

      <div className="assistant-messages" aria-live="polite">
        {showEmpty ? (
          <EmptyState compact={compact} loading={loading} onQuickPrompt={onQuickPrompt} />
        ) : (
          visibleMessages.map((message) => (
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
              <div className="assistant-message__meta">
                <span className="assistant-message-label" aria-hidden="true">
                  {message.role === "user" ? "أنت" : "المساعد"}
                </span>
                {message.role === "assistant" && !message.isFailure && (
                  <span className="assistant-message__badge" aria-hidden="true">
                    <Sparkles size={12} />
                  </span>
                )}
              </div>

              {message.role === "assistant" && !message.isFailure ? (
                (() => {
                  const hasCitations = Boolean(message.citations && message.citations.length > 0);
                  const isGrounded = Boolean(message.grounded) && hasCitations;

                  return (
                    <>
                      <AssistantReply content={message.content} />

                      {message.safetyClassification && (
                        <div className="acv-safety-row">
                          <span
                            className={`acv-safety-badge${isGrounded ? " acv-safety-badge--grounded" : ""}`}
                          >
                            {safetyLabel(message.safetyClassification, hasCitations)}
                          </span>
                          {message.confidence != null && isGrounded && message.confidence > 0 && (
                            <span className="acv-confidence">
                              ثقة: {Math.round(message.confidence * (message.confidence <= 1 ? 100 : 1))}%
                            </span>
                          )}
                        </div>
                      )}

                      {message.citations && message.citations.length > 0 && (
                        <div className="acv-citations">
                          <div className="acv-citations__head">المصادر ({message.citations.length})</div>
                          <div className="acv-citations__list">
                            {message.citations.slice(0, 5).map((cite, i) => (
                              <CitationCard key={`${cite.href}-${i}`} cite={cite} />
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="assistant-disclaimer">
                        <AlertTriangle size={13} className="inline ms-1" aria-hidden="true" />
                        {message.disclaimer || DEFAULT_DISCLAIMER}
                      </p>
                    </>
                  );
                })()
              ) : (
                <>
                  <p>{message.content}</p>
                  {message.isFailure && onRetry && (
                    <button
                      type="button"
                      className="assistant-retry-btn"
                      onClick={onRetry}
                      disabled={loading}
                    >
                      <RefreshCw size={14} aria-hidden="true" /> إعادة المحاولة
                    </button>
                  )}
                </>
              )}
            </article>
          ))
        )}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="assistant-form" aria-label="نموذج طرح السؤال">
        <div className="assistant-composer">
          <textarea
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onComposerKeyDown}
            aria-label="سؤالك الشرعي"
            placeholder="اكتب سؤالك الشرعي هنا... (Enter للإرسال)"
            rows={compact ? 2 : 3}
            disabled={loading}
          />
          <button
            type="submit"
            className="assistant-send-btn"
            disabled={loading || !input.trim()}
            aria-label={loading ? "جارٍ البحث" : "إرسال السؤال"}
          >
            {loading ? (
              <span className="assistant-send-btn__spinner" aria-hidden="true" />
            ) : (
              <SendHorizontal size={18} aria-hidden="true" />
            )}
            <span className="assistant-send-btn__label">{loading ? "جارٍ..." : "إرسال"}</span>
          </button>
        </div>
        <p className="assistant-composer-hint">Shift+Enter لسطر جديد · الإجابات تعليمية وليست فتوى شخصية</p>
      </form>
    </div>
  );
}

export default AssistantChatView;
