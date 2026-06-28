import { useEffect, useState } from "react";
import { C } from "@/lib/theme";

type ContactMessage = {
  id: string;
  name: string;
  email?: string;
  subject?: string;
  message: string;
  created_at: string;
};

export function ContactMessagesSection() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  useEffect(() => {
    try {
      setMessages(JSON.parse(localStorage.getItem("majlis_contact_messages") || "[]"));
    } catch {
      setMessages([]);
    }
  }, []);

  return (
    <div>
      <h2 style={{ margin: "0 0 1rem", color: C.emeraldDeep }}>رسائل التواصل ({messages.length})</h2>
      {messages.length === 0 ? (
        <p style={{ color: C.inkSoft }}>لا توجد رسائل بعد.</p>
      ) : (
        messages.map((m) => (
          <div key={m.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem", marginBottom: "0.75rem" }}>
            <strong>{m.name}</strong>
            {m.email && <span style={{ marginInlineStart: "0.5rem", color: C.inkSoft }}>{m.email}</span>}
            <div style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "0.25rem 0" }}>{m.subject} · {new Date(m.created_at).toLocaleString("ar-KW")}</div>
            <p style={{ margin: "0.5rem 0 0", whiteSpace: "pre-wrap" }}>{m.message}</p>
          </div>
        ))
      )}
    </div>
  );
}
