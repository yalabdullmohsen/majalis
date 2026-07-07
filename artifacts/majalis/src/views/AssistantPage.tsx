import { Link } from "wouter";
import { useAssistantChat } from "@/hooks/useAssistantChat";
import { AssistantChatView } from "@/components/assistant/AssistantChatView";

export { ASSISTANT_FAILURE_MESSAGE as FAILURE_MESSAGE } from "@/hooks/useAssistantChat";

const QUICK_PROMPTS = [
  "ما فضل قراءة القرآن الكريم؟",
  "ما هي شروط صحة الصلاة؟",
  "ما حكم صيام يوم عرفة؟",
  "ما حكم الميراث في الإسلام؟",
  "ما هي أركان الإيمان الستة؟",
  "ما فضل الصلاة على النبي ﷺ؟",
];

const RESEARCHER_LINKS = [
  { href: "/fiqh-council/research-assistant", label: "الباحث الفقهي" },
  { href: "/scholarly-research", label: "البحث الشرعي" },
  { href: "/fatwa", label: "الفتاوى" },
  { href: "/rulings", label: "الأحكام" },
];

export default function AssistantPage() {
  const chat = useAssistantChat();

  return (
    <div className="assistant-page">
      <header className="assistant-header">
        <div className="assistant-header-top">
          <h1 className="assistant-title">المساعد العلمي</h1>
        </div>
        <p className="assistant-intro">
          مساعد ذكي يرشدك في المسائل العلمية العامة داخل المجلس العلمي. الفتوى الشخصية تُعرض على
          عالم مختص.
        </p>

        <div className="asp-researcher-links">
          {RESEARCHER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="asp-researcher-link"
            >
              {link.label} ←
            </Link>
          ))}
        </div>

        {chat.messages.length === 0 && (
          <div className="asp-quick-prompts">
            <p className="asp-quick-prompts__label">
              أسئلة مقترحة:
            </p>
            <div className="asp-quick-prompts__grid">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => chat.sendQuestion(prompt)}
                  className="asp-quick-btn"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <section className="assistant-chat" aria-label="محادثة المساعد العلمي">
        <AssistantChatView
          messages={chat.messages}
          input={chat.input}
          loading={chat.loading}
          onInputChange={chat.setInput}
          onSubmit={chat.submit}
          bottomRef={chat.bottomRef}
          onQuickPrompt={chat.sendQuestion}
        />
      </section>

      <footer className="asp-footer">
        ⚠️ الإجابات مولَّدة آليًا وتحتمل الخطأ — راجع أهل العلم في المسائل الشخصية الدقيقة.
      </footer>
    </div>
  );
}
