import { useEffect } from "react";
import { AlertTriangle, BookOpen, Scale, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useAssistantChat } from "@/hooks/useAssistantChat";
import { AssistantChatView } from "@/components/assistant/AssistantChatView";
import { applyPageSeo } from "@/lib/seo";
import { useReadingScrollMemory } from "@/hooks/useReadingScrollMemory";
import "@/styles/pages/assistant.css";
import "@/styles/pages/assistant-shell.css";

import { SITE_URL } from "@/lib/site-config";
export { ASSISTANT_FAILURE_MESSAGE as FAILURE_MESSAGE } from "@/hooks/useAssistantChat";

const RESEARCHER_LINKS = [
  { href: "/fiqh-council/research-assistant", label: "الباحث الفقهي", Icon: Scale },
  { href: "/fiqh", label: "الفقه والأحكام", Icon: BookOpen },
];

export default function AssistantPage() {
  useReadingScrollMemory("assistant");
  const chat = useAssistantChat();

  useEffect(() => {
    applyPageSeo({
      path: "/assistant",
      title: "المساعد العلمي الذكي | سُنّة",
      description:
        "مساعد شرعي ذكي يجيب على أسئلتك في الفقه والعقيدة والقرآن والحديث، مدعوم بالذكاء الاصطناعي.",
      keywords: ["مساعد إسلامي", "مساعد شرعي", "أسئلة شرعية", "الذكاء الاصطناعي الإسلامي"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "المساعد العلمي الذكي",
          url: `${SITE_URL}/assistant`,
          description: "مساعد شرعي ذكي يجيب على أسئلتك في الفقه والعقيدة والقرآن والحديث",
          applicationCategory: "EducationalApplication",
          inLanguage: "ar",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      ],
    });
  }, []);

  return (
    <div className="assistant-page assistant-page--modern">
      <header className="assistant-header assistant-header--modern">
        <div className="asp-hero">
          <div className="asp-hero__glow" aria-hidden="true" />
          <div className="asp-hero__icon" aria-hidden="true">
            <Sparkles size={26} strokeWidth={2} />
          </div>
          <div className="asp-hero__copy">
            <p className="asp-hero__eyebrow">ذكاء اصطناعي · إرشاد علمي</p>
            <h1 className="assistant-title">المساعد العلمي</h1>
            <p className="assistant-intro">
              اسأل في القرآن والسنة والفقه والعقيدة. نفضّل الإجابات المستندة إلى مصادر المنصة،
              والفتوى الشخصية تُعرض على عالم مختص.
            </p>
          </div>
        </div>

        <div className="asp-researcher-links">
          {RESEARCHER_LINKS.map((link) => {
            const Icon = link.Icon;
            return (
              <Link key={link.href} href={link.href} className="asp-researcher-link">
                <Icon size={14} aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>

      <section className="assistant-chat assistant-chat--modern" aria-label="محادثة المساعد العلمي">
        <AssistantChatView
          messages={chat.messages}
          input={chat.input}
          loading={chat.loading}
          onInputChange={chat.setInput}
          onSubmit={chat.submit}
          bottomRef={chat.bottomRef}
          onQuickPrompt={chat.submitQuestion}
          onRetry={chat.retryLast}
          onClear={chat.clearChat}
          health={chat.health}
        />
      </section>

      <footer className="asp-footer">
        <AlertTriangle size={13} className="inline ms-1" aria-hidden="true" />
        الإجابات مولَّدة آليًا وتحتمل الخطأ، راجع أهل العلم في المسائل الشخصية الدقيقة.
      </footer>
    </div>
  );
}
