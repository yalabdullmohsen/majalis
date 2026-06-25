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
};

export function AssistantChatView({
  messages,
  input,
  loading,
  onInputChange,
  onSubmit,
  bottomRef,
  compact = false,
}: Props) {
  return (
    <div className={`assistant-chat-view${compact ? " assistant-chat-view--compact" : ""}`}>
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
