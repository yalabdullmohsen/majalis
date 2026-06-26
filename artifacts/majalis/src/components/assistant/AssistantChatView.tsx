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

const DEFAULT_QUICK_PROMPTS = [
  "ما حكم صيام يوم عرفة؟",
  "ما هي أذكار الصباح؟",
  "كيف أبدأ طلب العلم؟",
];

export function AssistantChatView({
  messages,
  input,
  loading,
  onInputChange,
  onSubmit,
  bottomRef,
  compact = false,
  onQuickPrompt,
  quickPrompts = DEFAULT_QUICK_PROMPTS,
}: Props) {
  const showPrompts = compact && onQuickPrompt && messages.length <= 1;

  return (
    <div className={`assistant-chat-view${compact ? " assistant-chat-view--compact" : ""}`}>
      {showPrompts && (
        <div className="assistant-quick-prompts assistant-quick-prompts--panel">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={loading}
              onClick={() => onQuickPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
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
                {message.citations && message.citations.length > 0 && (
                  <div className="assistant-citations" style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
                    <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>المراجع ({message.citations.length})</p>
                    <ul style={{ margin: 0, paddingRight: "1.25rem" }}>
                      {message.citations.slice(0, 6).map((cite, i) => (
                        <li key={`${cite.href}-${i}`}>
                          <a href={cite.href}>{cite.title}</a>
                          {cite.source_name && ` — ${cite.source_name}`}
                          {cite.trust_score != null && ` (${Math.round(cite.trust_score)}%)`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
          placeholder="اكتب سؤالك هنا..."
          rows={compact ? 2 : 3}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "جار الإرسال..." : "إرسال"}
        </button>
      </form>
    </div>
  );
}

export default AssistantChatView;
