import { useAssistantChat } from "@/hooks/useAssistantChat";
import { AssistantChatView } from "@/components/assistant/AssistantChatView";

export { ASSISTANT_FAILURE_MESSAGE as FAILURE_MESSAGE } from "@/hooks/useAssistantChat";

export default function AssistantPage() {
  const chat = useAssistantChat();

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
        <AssistantChatView
          messages={chat.messages}
          input={chat.input}
          loading={chat.loading}
          onInputChange={chat.setInput}
          onSubmit={chat.submit}
          bottomRef={chat.bottomRef}
        />
      </section>
    </div>
  );
}
