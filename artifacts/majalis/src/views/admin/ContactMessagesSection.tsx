import { useCallback, useEffect, useState } from "react";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";
import { C } from "@/lib/theme";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  read: "مقروء",
  replied: "تم الرد",
  archived: "مؤرشف",
};

export function ContactMessagesSection() {
  const { showSuccess, showError } = useAdminShell();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter !== "all" ? `?action=list&status=${filter}` : "?action=list";
      const res = await fetch(`/api/contact${qs}`, { credentials: "same-origin" });
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages || []);
      } else {
        showError("تعذّر تحميل الرسائل.");
      }
    } catch {
      showError("تعذّر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }, [filter, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/contact?action=update", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, admin_notes: notes }),
      });
      const data = await res.json();
      if (data.ok) {
        showSuccess("تم تحديث الرسالة.");
        setSelected(null);
        setNotes("");
        load();
      } else {
        showError("تعذّر التحديث.");
      }
    } catch {
      showError("تعذّر الاتصال بالخادم.");
    }
  };

  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <div>
      <AdminSectionToolbar
        title="رسائل التواصل"
        badge={
          newCount > 0 ? (
            <span style={{ background: C.brass, color: "#fff", padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.75rem" }}>
              {newCount} جديد
            </span>
          ) : undefined
        }
        actions={
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: "0.35rem 0.5rem", borderRadius: "0.375rem" }}>
            <option value="all">كل الرسائل</option>
            <option value="new">جديد</option>
            <option value="read">مقروء</option>
            <option value="replied">تم الرد</option>
            <option value="archived">مؤرشف</option>
          </select>
        }
      />

      {loading ? (
        <p>جارٍ التحميل...</p>
      ) : messages.length === 0 ? (
        <p style={{ color: C.inkSoft }}>لا توجد رسائل بعد.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                border: `1px solid ${msg.status === "new" ? C.emerald : C.line}`,
                borderRadius: "0.5rem",
                padding: "1rem",
                background: msg.status === "new" ? "rgba(31,110,84,0.04)" : "#fff",
                cursor: "pointer",
              }}
              onClick={() => {
                setSelected(msg);
                setNotes(msg.admin_notes || "");
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <strong>{msg.subject}</strong>
                <span style={{ fontSize: "0.8rem", color: C.inkSoft }}>
                  {STATUS_LABELS[msg.status] || msg.status} · {new Date(msg.created_at).toLocaleDateString("ar-KW")}
                </span>
              </div>
              <p style={{ margin: "0.35rem 0", fontSize: "0.9rem" }}>
                {msg.name} — <a href={`mailto:${msg.email}`}>{msg.email}</a>
              </p>
              <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.85rem" }}>{msg.message.slice(0, 120)}{msg.message.length > 120 ? "…" : ""}</p>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: "#fff", borderRadius: "0.75rem", padding: "1.5rem", maxWidth: "32rem", width: "100%", maxHeight: "90vh", overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>{selected.subject}</h3>
            <p><strong>{selected.name}</strong> — <a href={`mailto:${selected.email}`}>{selected.email}</a></p>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{selected.message}</p>
            <p style={{ fontSize: "0.8rem", color: C.inkSoft }}>{new Date(selected.created_at).toLocaleString("ar-KW")}</p>
            <label style={{ display: "block", marginTop: "1rem" }}>
              <span>ملاحظات الإدارة</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%", marginTop: "0.35rem" }} />
            </label>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm" onClick={() => updateStatus(selected.id, "read")}>مقروء</button>
              <button type="button" className="ds-btn ds-btn--primary ds-btn--sm" onClick={() => updateStatus(selected.id, "replied")}>تم الرد</button>
              <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm" onClick={() => updateStatus(selected.id, "archived")}>أرشفة</button>
              <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm" onClick={() => setSelected(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
