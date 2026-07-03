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

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.75rem" }}>
          {RESEARCHER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "inline-block",
                padding: "0.3rem 0.75rem",
                borderRadius: "2rem",
                background: "rgba(6,78,59,0.08)",
                border: "1px solid rgba(6,78,59,0.2)",
                fontSize: "0.78rem",
                color: "var(--ds-emerald-deep, #064e3b)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {link.label} ←
            </Link>
          ))}
        </div>

        {chat.messages.length === 0 && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "var(--majalis-ink-soft, #5c564c)" }}>
              أسئلة مقترحة:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => chat.sendQuestion(prompt)}
                  style={{
                    padding: "0.35rem 0.8rem",
                    borderRadius: "2rem",
                    background: "#fff",
                    border: "1px solid var(--ds-line-color, #e5e1d9)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    color: "var(--majalis-ink, #2c2412)",
                    transition: "background 0.15s",
                  }}
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

      <footer style={{
        padding: "0.75rem 1rem",
        fontSize: "0.75rem",
        color: "var(--majalis-ink-soft, #5c564c)",
        borderTop: "1px solid var(--ds-line-color, #e5e1d9)",
        textAlign: "center",
        direction: "rtl",
      }}>
        ⚠️ الإجابات مولَّدة آليًا وتحتمل الخطأ — راجع أهل العلم في المسائل الشخصية الدقيقة.
      </footer>
    </div>
  );
}
