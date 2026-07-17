import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Bell, Settings2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { createNotification } from "@/lib/notification-service";
import { buildErrorReport, createErrorId, logClientError } from "@/lib/error-report";

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

    // Realtime هو تحسين تدريجي (تحديث فوري بلا إعادة تحميل) لا وظيفة
    // أساسية — فشل اتصال WebSocket (شائع على iOS Safari: "operation is
    // insecure" أثناء تنقّل الصفحة) يجب ألا يُسقِط الشجرة كاملة عبر
    // ErrorBoundary. try/catch + status callback بدل fire-and-forget
    // (عطل حقيقي على الإنتاج، 2026-07-17: MJL-20260717-191326-NR11UV).
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let lessonChannel: ReturnType<typeof supabase.channel> | null = null;
    const onChannelError = (source: string) => (status: string, err?: Error) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        void logClientError(
          buildErrorReport(err || new Error(`Realtime ${status}`), {
            errorId: createErrorId("RT"),
            component: "NotificationBell",
            section: source,
          }),
        );
      }
    };
    try {
      channel = supabase
        .channel("notifications")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" },
          (payload) => setNotifications((prev) => [payload.new as any, ...prev]))
        .subscribe(onChannelError("notifications"));

      lessonChannel = supabase
        .channel("kuwait-lessons-auto-notify")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "kuwait_lessons" },
          async (payload) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const lesson = payload.new as Record<string, unknown>;
            await createNotification({
              userId: user.id,
              title: "درس جديد أُضيف تلقائياً",
              body: [String(lesson.title || "درس جديد"), String(lesson.mosque || lesson.governorate || "").trim()].filter(Boolean).join(" · "),
              type: "lesson",
              actionUrl: lesson.id != null ? `/lessons/${lesson.id}` : null,
            });
          })
        .subscribe(onChannelError("kuwait-lessons-auto-notify"));
    } catch (err) {
      void logClientError(
        buildErrorReport(err instanceof Error ? err : new Error(String(err)), {
          errorId: createErrorId("RT"),
          component: "NotificationBell",
          section: "channel-setup",
        }),
      );
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (lessonChannel) supabase.removeChannel(lessonChannel);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const mouseHandler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", mouseHandler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", mouseHandler);
      document.removeEventListener("keydown", keyHandler);
    };
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

  const markOneRead = async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
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
        <Bell className="nb-icon" size={22} strokeWidth={1.8} aria-hidden="true" />
        {unread > 0 && (
          <span className="nb-badge" aria-label={`${unread} إشعارات غير مقروءة`}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ── اللوحة المنسدلة ── */}
      {open && (
        <div dir="rtl" role="dialog" aria-modal="true" aria-label="الإشعارات" className="nb-panel">

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
                  <Bell size={28} strokeWidth={1.5} />
                </div>
                <p className="nb-empty__msg">لا توجد إشعارات</p>
                <p className="nb-empty__sub">سنُخبرك بكل جديد</p>
              </div>
            ) : (
              notifications.map((n) => {
                const content = (
                  <>
                    <div className="nb-item__dot" aria-hidden="true" />
                    <div className="nb-item__body">
                      <p className="nb-item__title">{n.title}</p>
                      {n.body && <p className="nb-item__text">{n.body}</p>}
                      <p className="nb-item__time">{relativeTime(n.created_at)}</p>
                    </div>
                  </>
                );
                return n.action_url ? (
                  <Link
                    key={n.id}
                    href={n.action_url}
                    role="listitem"
                    className={`nb-item${!n.is_read ? " nb-item--new" : ""}`}
                    onClick={() => { setOpen(false); if (!n.is_read) markOneRead(n.id); }}
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={n.id}
                    role="listitem"
                    className={`nb-item${!n.is_read ? " nb-item--new" : ""}`}
                    onClick={() => { if (!n.is_read) markOneRead(n.id); }}
                  >
                    {content}
                  </div>
                );
              })
            )}
          </div>

          {/* تذييل */}
          <div className="nb-foot">
            <Link href="/notification-settings" className="nb-foot__link" onClick={() => setOpen(false)}>
              <Settings2 size={14} strokeWidth={2} aria-hidden="true" />
              إعدادات الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
