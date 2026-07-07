import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "الآن";
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `منذ ${d} يوم`;
  return new Date(iso).toLocaleDateString("ar-KW", { month: "short", day: "numeric" });
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      setNotifications(data || []);
    };
    fetch();

    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => setNotifications((prev) => [payload.new as any, ...prev]))
      .subscribe();

    const lessonChannel = supabase
      .channel("kuwait-lessons-auto-notify")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "kuwait_lessons" },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const lesson = payload.new as Record<string, unknown>;
          await supabase.from("notifications").insert({
            user_id: user.id,
            title: "درس جديد أُضيف تلقائياً",
            body: `"${String(lesson.title || "درس جديد")}" — ${String(lesson.mosque || lesson.governorate || "").trim()}`.replace(/ — $/, ""),
            is_read: false,
          });
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(lessonChannel);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="nb-wrap" ref={panelRef}>
      {/* ── زر الجرس ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="الإشعارات"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`nb-btn${unread > 0 ? " nb-btn--live" : ""}${open ? " nb-btn--open" : ""}`}
      >
        <svg className="nb-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v2.1c0 .9-.3 1.8-.9 2.5L4.8 14.2A1 1 0 0 0 5.7 16H18.3a1 1 0 0 0 .9-1.5l-1.3-2.6a4 4 0 0 1-.9-2.5V7a5 5 0 0 0-5-5zm0 20a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22z"/>
        </svg>
        {unread > 0 && (
          <span className="nb-badge" aria-label={`${unread} إشعارات غير مقروءة`}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ── اللوحة المنسدلة ── */}
      {open && (
        <div dir="rtl" role="dialog" aria-label="الإشعارات" className="nb-panel">

          {/* رأس */}
          <div className="nb-head">
            <div className="nb-head__info">
              <span className="nb-head__title">الإشعارات</span>
              {unread > 0 && <span className="nb-head__count">{unread} جديد</span>}
            </div>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="nb-head__clear">
                قراءة الكل
              </button>
            )}
          </div>

          {/* قائمة */}
          <div className="nb-list" role="list">
            {notifications.length === 0 ? (
              <div className="nb-empty">
                <div className="nb-empty__ring" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2a5 5 0 0 0-5 5v2.1c0 .9-.3 1.8-.9 2.5L4.8 14.2A1 1 0 0 0 5.7 16H18.3a1 1 0 0 0 .9-1.5l-1.3-2.6a4 4 0 0 1-.9-2.5V7a5 5 0 0 0-5-5zm0 20a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22z"/>
                  </svg>
                </div>
                <p className="nb-empty__msg">لا توجد إشعارات</p>
                <p className="nb-empty__sub">سنُخبرك بكل جديد</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} role="listitem" className={`nb-item${!n.is_read ? " nb-item--new" : ""}`}>
                  <div className="nb-item__dot" aria-hidden="true" />
                  <div className="nb-item__body">
                    <p className="nb-item__title">{n.title}</p>
                    {n.body && <p className="nb-item__text">{n.body}</p>}
                    <p className="nb-item__time">{relativeTime(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* تذييل */}
          <div className="nb-foot">
            <Link href="/notifications" className="nb-foot__link" onClick={() => setOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
              إعدادات الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
