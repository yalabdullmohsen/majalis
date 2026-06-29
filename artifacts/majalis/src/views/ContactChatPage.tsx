import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { PageHeader, Card, Loading } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";
import { C } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import {
  MESSAGE_TYPES,
  type ContactMessage,
  type ContactThread,
  type MessageType,
  type PageContext,
  autoPriority,
  buildContactChatUrl,
  detectPageType,
  loadGuestThreads,
  loadPageContext,
  saveGuestThread,
  clearPageContext,
} from "@/lib/contact-chat";

async function authHeaders(): Promise<Record<string, string>> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
  } catch {
    /* guest */
  }
  return h;
}

async function api<T>(action: string, body?: Record<string, unknown>, query?: Record<string, string>): Promise<T> {
  const params = new URLSearchParams({ action, ...query });
  const headers = await authHeaders();
  const res = await fetch(`/api/contact-chat?${params}`, {
    method: body ? "POST" : "GET",
    headers,
    credentials: "same-origin",
    body: body ? JSON.stringify({ action, ...body }) : undefined,
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.message || data.error || "failed");
  return data as T;
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-KW", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function ContactChatPage() {
  const search = useSearch();
  const [location] = useLocation();
  const { user, isLoggedIn } = useAuth();
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const [threads, setThreads] = useState<ContactThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(params.get("thread"));
  const [token, setToken] = useState<string | null>(params.get("token"));
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(!params.get("thread"));

  const [messageType, setMessageType] = useState<MessageType>(
    (params.get("type") as MessageType) || "أخرى",
  );
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [reply, setReply] = useState("");
  const [trackUrl, setTrackUrl] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<{ file_name: string; mime_type: string; data_url: string }[]>([]);

  const pageContext: PageContext = useMemo(() => {
    const saved = loadPageContext();
    const from = params.get("from");
    const errorId = params.get("error");
    return {
      pageUrl: from || saved?.pageUrl || (typeof window !== "undefined" ? window.location.origin + location : location),
      pageType: saved?.pageType || detectPageType(location),
      contentTitle: saved?.contentTitle || document.title,
      errorId: errorId || saved?.errorId,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };
  }, [location, params]);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q: Record<string, string> = {};
      if (token) q.token = token;
      const data = await api<{ threads: ContactThread[] }>("threads", undefined, q);
      let list = data.threads || [];
      if (!isLoggedIn && !token) {
        const guest = loadGuestThreads();
        const ids = new Set(list.map((t) => t.id));
        for (const g of guest) {
          if (!ids.has(g.id)) {
            try {
              const d = await api<{ threads: ContactThread[] }>("threads", undefined, { token: g.token });
              list = [...(d.threads || []), ...list];
            } catch {
              /* skip */
            }
          }
        }
      }
      setThreads(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحميل المحادثات");
    } finally {
      setLoading(false);
    }
  }, [token, isLoggedIn]);

  const loadMessages = useCallback(async (threadId: string, accessToken?: string | null) => {
    try {
      const q: Record<string, string> = { thread_id: threadId };
      if (accessToken) q.token = accessToken;
      const data = await api<{ messages: ContactMessage[]; thread: ContactThread }>("messages", undefined, q);
      setMessages(data.messages || []);
      setActiveId(threadId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحميل الرسائل");
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (activeId) {
      const t = threads.find((x) => x.id === activeId);
      void loadMessages(activeId, token || t?.access_token);
    }
  }, [activeId, threads, token, loadMessages]);

  useEffect(() => {
    if (!activeId || showNew) return;
    const t = threads.find((x) => x.id === activeId);
    const accessToken = token || t?.access_token;
    const id = window.setInterval(() => {
      void loadMessages(activeId, accessToken);
      void loadThreads();
    }, 15_000);
    return () => window.clearInterval(id);
  }, [activeId, showNew, token, threads, loadMessages, loadThreads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreate = async () => {
    if (newMessage.trim().length < 3) {
      setError("اكتب رسالة أوضح (3 أحرف على الأقل).");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        message_type: messageType,
        message: newMessage,
        guest_name: guestName || undefined,
        guest_email: guestEmail || undefined,
        context_page_url: pageContext.pageUrl,
        context_page_type: pageContext.pageType,
        context_content_title: pageContext.contentTitle,
        context_meta: pageContext,
        priority: autoPriority(messageType, newMessage),
        attachments: pendingFiles,
      };
      if (pageContext.errorId) {
        body.subject = `إبلاغ خطأ — ${pageContext.errorId}`;
      }
      const data = await api<{ thread: ContactThread; access_token: string; track_url: string }>(
        "create_thread",
        body,
      );
      saveGuestThread(data.thread.id, data.access_token);
      setToken(data.access_token);
      setTrackUrl(data.track_url);
      setShowNew(false);
      setNewMessage("");
      setPendingFiles([]);
      clearPageContext();
      await loadThreads();
      setActiveId(data.thread.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر إنشاء المحادثة");
    } finally {
      setSending(false);
    }
  };

  const handleUserThreadStatus = async (status: "مغلقة" | "مفتوحة") => {
    if (!activeId) return;
    setSending(true);
    try {
      await api("user_update_thread", {
        thread_id: activeId,
        token: token || threads.find((t) => t.id === activeId)?.access_token,
        status,
      });
      await loadThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحديث المحادثة");
    } finally {
      setSending(false);
    }
  };

  const insertCurrentPage = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    setReply((prev) => (prev ? `${prev}\n${url}` : url));
  };

  const handleSend = async () => {
    if (!activeId || reply.trim().length < 1) return;
    setSending(true);
    try {
      await api("send", {
        thread_id: activeId,
        token: token || threads.find((t) => t.id === activeId)?.access_token,
        message: reply,
        page_url: typeof window !== "undefined" ? window.location.href : undefined,
        attachments: pendingFiles,
      });
      setReply("");
      setPendingFiles([]);
      await loadMessages(activeId, token);
      await loadThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر الإرسال");
    } finally {
      setSending(false);
    }
  };

  const onPickFile = async (file: File) => {
    if (file.size > 400_000) {
      setError("الملف كبير جداً (الحد 400KB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingFiles((prev) => [
        ...prev,
        {
          file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          data_url: String(reader.result || ""),
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const activeThread = threads.find((t) => t.id === activeId);

  return (
    <div className="page-shell contact-chat-page" dir="rtl">
      <PageHeader
        eyebrow="تواصل"
        title="تواصل مع صاحب المنصة"
        subtitle="للاقتراحات والشكاوى والملاحظات — دردشة داخلية دون مغادرة الموقع"
      />

      {error && (
        <div className="contact-alert contact-alert--error" role="alert">{error}</div>
      )}

      {trackUrl && (
        <Card className="contact-chat-track">
          <p>تم إنشاء محادثتك. احفظ رابط المتابعة:</p>
          <code dir="ltr">{typeof window !== "undefined" ? window.origin + trackUrl : trackUrl}</code>
        </Card>
      )}

      <div className="contact-chat-layout">
        <aside className="contact-chat-sidebar">
          <button type="button" className="ds-btn ds-btn--primary contact-chat-new-btn" onClick={() => setShowNew(true)}>
            + محادثة جديدة
          </button>
          {loading ? (
            <Loading />
          ) : threads.length === 0 ? (
            <p className="contact-chat-empty">لا توجد محادثات بعد.</p>
          ) : (
            <ul className="contact-chat-thread-list">
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={`contact-chat-thread-item${t.id === activeId ? " is-active" : ""}`}
                    onClick={() => { setActiveId(t.id); setShowNew(false); setToken(t.access_token); }}
                  >
                    <strong>{t.subject || t.message_type}</strong>
                    <span>{t.status} · {formatTime(t.last_message_at)}</span>
                    {t.unread_user > 0 && <em className="contact-chat-badge">{t.unread_user}</em>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!isLoggedIn && (
            <p className="contact-chat-hint">
              <Link href="/register">أنشئ حساباً</Link> لحفظ محادثاتك على جميع الأجهزة.
            </p>
          )}
        </aside>

        <section className="contact-chat-main">
          {showNew ? (
            <Card className="contact-chat-compose">
              <h2>بدء محادثة جديدة</h2>
              <label className="contact-field">
                <span>نوع الرسالة</span>
                <select value={messageType} onChange={(e) => setMessageType(e.target.value as MessageType)}>
                  {MESSAGE_TYPES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>
              {!isLoggedIn && (
                <>
                  <label className="contact-field">
                    <span>الاسم (اختياري)</span>
                    <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="اسمك" />
                  </label>
                  <label className="contact-field">
                    <span>البريد (اختياري)</span>
                    <input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="email@example.com" dir="ltr" />
                  </label>
                </>
              )}
              {pageContext.pageUrl && (
                <p className="contact-chat-context">
                  مرتبط بالصفحة: <a href={pageContext.pageUrl}>{pageContext.contentTitle || pageContext.pageUrl}</a>
                </p>
              )}
              <label className="contact-field">
                <span>رسالتك</span>
                <textarea rows={5} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="اكتب اقتراحك أو شكواك..." />
              </label>
              <div className="contact-chat-actions">
                <input ref={fileRef} type="file" hidden accept="image/*,.pdf,.txt" onChange={(e) => e.target.files?.[0] && void onPickFile(e.target.files[0])} />
                <button type="button" className="ds-btn ds-btn--ghost" onClick={() => fileRef.current?.click()}>إرفاق</button>
                <button type="button" className="ds-btn ds-btn--primary" disabled={sending} onClick={() => void handleCreate()}>
                  {sending ? "جارٍ الإرسال..." : "إرسال"}
                </button>
              </div>
            </Card>
          ) : activeThread ? (
            <>
              <header className="contact-chat-header">
                <div>
                  <h2>{activeThread.subject}</h2>
                  <p>{activeThread.message_type} · {activeThread.status} · أولوية {activeThread.priority}</p>
                </div>
                <div className="contact-chat-header-actions">
                  {activeThread.status === "مغلقة" || activeThread.status === "مؤرشفة" ? (
                    <button type="button" className="ds-btn ds-btn--ghost" disabled={sending} onClick={() => void handleUserThreadStatus("مفتوحة")}>
                      إعادة فتح
                    </button>
                  ) : (
                    <button type="button" className="ds-btn ds-btn--ghost" disabled={sending} onClick={() => void handleUserThreadStatus("مغلقة")}>
                      إغلاق المحادثة
                    </button>
                  )}
                </div>
              </header>
              <div className="contact-chat-messages">
                {messages.map((m) => (
                  <div key={m.id} className={`contact-chat-bubble contact-chat-bubble--${m.sender_role}`}>
                    <p>{m.body}</p>
                    {m.attachments?.map((a) => (
                      a.mime_type.startsWith("image/") && a.data_url ? (
                        <img key={a.id} src={a.data_url} alt={a.file_name} className="contact-chat-attach-img" />
                      ) : (
                        <span key={a.id} className="contact-chat-attach-file">📎 {a.file_name}</span>
                      )
                    ))}
                    <time>{formatTime(m.created_at)}</time>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              {activeThread.status !== "مغلقة" && activeThread.status !== "مؤرشفة" ? (
                <footer className="contact-chat-reply">
                  <textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="اكتب ردك..." />
                  <div className="contact-chat-actions">
                    <button type="button" className="ds-btn ds-btn--ghost" onClick={insertCurrentPage}>رابط الصفحة</button>
                    <input ref={fileRef} type="file" hidden accept="image/*,.pdf,.txt" onChange={(e) => e.target.files?.[0] && void onPickFile(e.target.files[0])} />
                    <button type="button" className="ds-btn ds-btn--ghost" onClick={() => fileRef.current?.click()}>إرفاق</button>
                    <button type="button" className="ds-btn ds-btn--primary" disabled={sending} onClick={() => void handleSend()}>إرسال</button>
                  </div>
                </footer>
              ) : (
                <p className="contact-chat-closed">المحادثة مغلقة. يمكنك فتح محادثة جديدة.</p>
              )}
            </>
          ) : (
            <Card className="contact-chat-welcome">
              <h2>مرحباً بك</h2>
              <p>اختر محادثة من القائمة أو ابدأ محادثة جديدة للتواصل مع إدارة المنصة.</p>
              <button type="button" className="ds-btn ds-btn--primary" onClick={() => setShowNew(true)}>بدء محادثة</button>
            </Card>
          )}
        </section>
      </div>

      <p className="contact-back">
        <Link href="/contact" style={{ color: C.emeraldDeep }}>صفحة التواصل التقليدية</Link>
        {" · "}
        <Link href="/" style={{ color: C.emeraldDeep }}>الرئيسية</Link>
      </p>
    </div>
  );
}
