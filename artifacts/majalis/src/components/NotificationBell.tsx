import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      setNotifications(data || []);
    };
    fetchNotifications();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => setNotifications((prev) => [payload.new as any, ...prev])
      )
      .subscribe();

    // إشعار تلقائي عند إضافة درس جديد
    const lessonChannel = supabase
      .channel("kuwait-lessons-auto-notify")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "kuwait_lessons" },
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(lessonChannel);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="الإشعارات"
        aria-expanded={open}
        aria-haspopup="true"
        className="notif-bell-btn"
      >
        <svg className="notif-bell-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v2.1c0 .9-.3 1.8-.9 2.5L4.8 14.2A1 1 0 0 0 5.7 16H18.3a1 1 0 0 0 .9-1.5l-1.3-2.6a4 4 0 0 1-.9-2.5V7a5 5 0 0 0-5-5zm0 20a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22z"/>
        </svg>
        {unread > 0 && (
          <span className="notif-badge" aria-label={`${unread} إشعارات غير مقروءة`}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          dir="rtl"
          role="menu"
          aria-label="قائمة الإشعارات"
          className="notif-panel"
        >
          <div className="notif-panel__head">
            <h3 className="notif-panel__title">الإشعارات</h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="notif-panel__mark-all"
              >
                تعليم الكل كمقروء
              </button>
            )}
          </div>
          <div className="notif-panel__list" role="list">
            {notifications.length === 0 ? (
              <p className="notif-panel__empty">لا توجد إشعارات</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  role="menuitem"
                  className={`notif-item${!n.is_read ? " notif-item--unread" : ""}`}
                >
                  <p className="notif-item__title">{n.title}</p>
                  {n.body && <p className="notif-item__body">{n.body}</p>}
                  <p className="notif-item__date">
                    {new Date(n.created_at).toLocaleDateString("ar-KW")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
