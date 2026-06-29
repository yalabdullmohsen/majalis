import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { useAdminShell } from "@/views/admin/AdminShell";
import { AdminSectionToolbar } from "@/views/admin/AdminSectionToolbar";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { getAdminAuthHeaders } from "@/lib/admin-api";
import { MESSAGE_TYPES, PRIORITIES, THREAD_STATUSES, type ContactMessage, type ContactThread } from "@/lib/contact-chat";

async function adminChatApi(action: string, body?: Record<string, unknown>, query?: Record<string, string>) {
  const params = new URLSearchParams({ action, ...query });
  const headers = await getAdminAuthHeaders();
  const res = await fetch(`/api/contact-chat?${params}`, {
    method: body ? "POST" : "GET",
    headers,
    credentials: "same-origin",
    body: body ? JSON.stringify({ action, ...body }) : undefined,
  });
  return res.json();
}

export function ContactChatSection() {
  const { showSuccess, showError } = useAdminShell();
  const [threads, setThreads] = useState<ContactThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactThread | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [unreadAdmin, setUnreadAdmin] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q: Record<string, string> = { admin: "1" };
      if (statusFilter !== "all") q.status = statusFilter;
      if (typeFilter !== "all") q.type = typeFilter;
      if (priorityFilter !== "all") q.priority = priorityFilter;
      if (search) q.search = search;
      const data = await adminChatApi("admin_threads", undefined, q);
      if (data.ok) setThreads(data.threads || []);
      const ur = await adminChatApi("unread");
      if (ur.ok) setUnreadAdmin(ur.admin_unread || 0);
    } catch {
      showError("تعذر تحميل المحادثات");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, priorityFilter, search, showError]);

  useEffect(() => { void load(); }, [load]);

  const openThread = async (t: ContactThread) => {
    setSelected(t);
    const data = await adminChatApi("messages", undefined, { thread_id: t.id });
    if (data.ok) setMessages(data.messages || []);
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    const data = await adminChatApi("admin_reply", { thread_id: selected.id, message: reply });
    if (data.ok) {
      setReply("");
      showSuccess("تم إرسال الرد");
      await openThread(selected);
      await load();
    } else showError(data.message || "فشل الإرسال");
  };

  const updateThread = async (updates: Record<string, unknown>) => {
    if (!selected) return;
    const data = await adminChatApi("update_thread", { thread_id: selected.id, ...updates });
    if (data.ok) {
      setSelected(data.thread);
      showSuccess("تم التحديث");
      await load();
    } else showError("فشل التحديث");
  };

  const saveNote = async () => {
    if (!selected || !internalNote.trim()) return;
    const data = await adminChatApi("internal_note", { thread_id: selected.id, body: internalNote });
    if (data.ok) {
      setInternalNote("");
      showSuccess("تم حفظ الملاحظة الداخلية");
    } else showError("فشل حفظ الملاحظة");
  };

  return (
    <div>
      <AdminSectionToolbar
        title="تواصل — الدردشة الداخلية"
        badge={unreadAdmin > 0 ? `${unreadAdmin} غير مقروء` : undefined}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        <input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "0.5rem", borderRadius: 8, border: `1px solid ${C.line}` }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">كل الحالات</option>
          {THREAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">كل الأنواع</option>
          {MESSAGE_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="all">كل الأولويات</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button type="button" className="page-action-btn" onClick={() => void load()}>تحديث</button>
        <Link href="/contact-chat" className="page-action-btn">فتح واجهة المستخدم</Link>
      </div>

      <div className="contact-chat-admin-grid">
        <div className="contact-chat-admin-list">
          {loading ? <Loading /> : threads.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`contact-chat-thread-item${selected?.id === t.id ? " is-active" : ""}`}
              onClick={() => void openThread(t)}
            >
              <strong>{t.subject}</strong>
              <span>{t.message_type} · {t.status} · {t.priority}</span>
              {t.unread_admin > 0 && <em className="contact-chat-badge">{t.unread_admin}</em>}
            </button>
          ))}
        </div>

        {selected && (
          <div className="contact-chat-admin-detail">
            <header style={{ marginBottom: "0.75rem" }}>
              <h3>{selected.subject}</h3>
              <p style={{ fontSize: "0.85rem", color: C.inkSoft }}>
                {selected.guest_name || "مستخدم"} · {selected.guest_email || "—"} · {selected.context_page_url || "—"}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                <select value={selected.status} onChange={(e) => void updateThread({ status: e.target.value })}>
                  {THREAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={selected.priority} onChange={(e) => void updateThread({ priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <button type="button" onClick={() => void updateThread({ status: "مغلقة" })}>إغلاق</button>
                <button type="button" onClick={() => void updateThread({ status: "مفتوحة" })}>إعادة فتح</button>
                <button type="button" onClick={() => void updateThread({ status: "مؤرشفة" })}>أرشفة</button>
                <button type="button" onClick={async () => {
                  if (!selected || !window.confirm("حذف المحادثة نهائياً؟")) return;
                  const data = await adminChatApi("delete_thread", { thread_id: selected.id });
                  if (data.ok) {
                    setSelected(null);
                    showSuccess("تم الحذف");
                    await load();
                  } else showError("فشل الحذف");
                }}>حذف</button>
              </div>
            </header>

            <div className="contact-chat-messages" style={{ maxHeight: 320, overflowY: "auto", marginBottom: "1rem" }}>
              {messages.map((m) => (
                <div key={m.id} className={`contact-chat-bubble contact-chat-bubble--${m.sender_role}`}>
                  <p>{m.body}</p>
                </div>
              ))}
            </div>

            <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="رد الإدارة..." />
            <button type="button" className="ds-btn ds-btn--primary" style={{ marginTop: "0.5rem" }} onClick={() => void sendReply()}>إرسال رد</button>

            <hr style={{ margin: "1rem 0" }} />
            <h4>ملاحظة داخلية (لا يراها المستخدم)</h4>
            <textarea rows={2} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
            <button type="button" className="ds-btn ds-btn--ghost" style={{ marginTop: "0.5rem" }} onClick={() => void saveNote()}>حفظ ملاحظة</button>
          </div>
        )}
      </div>
    </div>
  );
}
