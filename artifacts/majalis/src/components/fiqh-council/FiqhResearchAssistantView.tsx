import { useState } from "react";
import { useFiqhResearchChat } from "@/hooks/useFiqhResearchChat";
import { FiqhResearchCitations } from "./FiqhResearchCitations";
import type { FiqhResearchFilters } from "@/lib/fiqh-research-assistant-api";

const QUICK_PROMPTS = [
  "العملات الرقمية",
  "التبرع بالأعضاء",
  "زكاة الأسهم",
  "حقوق الأقليات المسلمة",
];

type Props = {
  filters?: FiqhResearchFilters;
};

export function FiqhResearchAssistantView({ filters = {} }: Props) {
  const { messages, loading, ask, reset } = useFiqhResearchChat();
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    ask(input, filters);
    setInput("");
  };

  return (
    <div className="fiqh-research-assistant-view ui-card">
      {messages.length === 0 && (
        <div className="fiqh-research-prompts">
          <span className="fiqh-research-label">ابدأ بسؤال أو اختر موضوعاً:</span>
          <div className="content-hub-chips">
            {QUICK_PROMPTS.map((p) => (
              <button key={p} type="button" className="content-hub-chip" onClick={() => ask(p, filters)}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="fiqh-research-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.role === "user" ? "fiqh-research-msg fiqh-research-msg--user" : "fiqh-research-msg fiqh-research-msg--assistant"}
          >
            <p>{msg.content}</p>
            {msg.disclaimer && (
              <p className="fiqh-research-msg-disclaimer">{msg.disclaimer}</p>
            )}
            {msg.citations && msg.citations.length > 0 && (
              <FiqhResearchCitations citations={msg.citations} />
            )}
          </div>
        ))}
        {loading && <p className="fiqh-research-hint">جارٍ البحث في المواد المنشورة...</p>}
      </div>

      <form onSubmit={handleSubmit} className="fiqh-research-form" aria-label="البحث الفقهي">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="سؤالك الفقهي"
          placeholder="اسأل عن قرار أو فتوى أو موضوع فقهي..."
          className="fiqh-research-input"
          rows={3}
          disabled={loading}
        />
        <div className="fiqh-research-form-actions">
          <button type="submit" disabled={loading || !input.trim()} className="fiqh-research-submit">
            بحث
          </button>
          {messages.length > 0 && (
            <button type="button" onClick={reset} className="content-detail-action-btn">
              محادثة جديدة
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
