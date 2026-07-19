import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, X } from "lucide-react";
import { useAssistantChat } from "@/hooks/useAssistantChat";
import { AssistantChatView } from "./AssistantChatView";

export function AssistantFloatingWidget() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const chat = useAssistantChat();
  const closeRef = useRef<HTMLButtonElement>(null);

  // /mushaf: قارئ غامر مخصَّص (وضع هادئ خاص به) — زر عائم فوق نص المصحف
  // يكسر تجربة القراءة ويُشعر بأنها صفحة ويب لا تطبيق قراءة مخصَّص.
  const hiddenOnPage = location === "/assistant" || location.startsWith("/admin") || location.startsWith("/mushaf");

  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    if (hiddenOnPage) {
      document.body.classList.remove("has-assistant-fab");
      return;
    }
    document.body.classList.add("has-assistant-fab");
    return () => document.body.classList.remove("has-assistant-fab");
  }, [hiddenOnPage]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.classList.add("assistant-panel-open");
    window.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => {
      document.body.classList.remove("assistant-panel-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (hiddenOnPage) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          className="assistant-fab"
          onClick={() => setOpen(true)}
          aria-label="فتح المساعد العلمي"
          title="المساعد العلمي"
        >
          <Sparkles size={22} strokeWidth={2} aria-hidden="true" />
          <span className="assistant-fab__label">المساعد</span>
        </button>
      )}

      {open && (
        <div className="assistant-panel-root" role="presentation">
          <button
            type="button"
            className="assistant-panel-backdrop"
            aria-label="إغلاق المساعد"
            onClick={() => setOpen(false)}
          />
          <section
            className="assistant-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assistant-panel-title"
          >
            <header className="assistant-panel__head">
              <div>
                <p className="assistant-panel__eyebrow">إرشاد علمي</p>
                <h2 id="assistant-panel-title">المساعد العلمي</h2>
              </div>
              <div className="assistant-panel__actions">
                <Link href="/assistant" className="assistant-panel__full-link" onClick={() => setOpen(false)}>
                  صفحة كاملة
                </Link>
                <button
                  ref={closeRef}
                  type="button"
                  className="assistant-panel__close"
                  onClick={() => setOpen(false)}
                  aria-label="إغلاق"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
            </header>
            <p className="assistant-panel__intro">
              مساعد ذكي للإرشاد العلمي العام. الفتوى الخاصة تُعرض على عالم مختص.
            </p>
            <AssistantChatView
              compact
              messages={chat.messages}
              input={chat.input}
              loading={chat.loading}
              onInputChange={chat.setInput}
              onSubmit={chat.submit}
              onQuickPrompt={chat.submitQuestion}
              onRetry={chat.retryLast}
              bottomRef={chat.bottomRef}
            />
          </section>
        </div>
      )}
    </>
  );
}

export default AssistantFloatingWidget;
