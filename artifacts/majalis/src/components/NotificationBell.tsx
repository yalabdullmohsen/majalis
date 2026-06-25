import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="الإشعارات"
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors notification-bell-btn"
      >
        <svg className="notification-bell-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path fill="currentColor" d="M12 2a5 5 0 0 0-5 5v2.1c0 .9-.3 1.8-.9 2.5L4.8 14.2A1 1 0 0 0 5.7 16H18.3a1 1 0 0 0 .9-1.5l-1.3-2.6a4 4 0 0 1-.9-2.5V7a5 5 0 0 0-5-5zm0 20a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22z"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div dir="rtl" className="absolute left-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-bold text-gray-800">الإشعارات</h3>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-green-600 text-sm hover:underline">
                تعليم الكل كمقروء
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 py-8">لا توجد إشعارات</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 border-b last:border-0 ${!n.is_read ? "bg-green-50" : ""}`}
                >
                  <p className="font-medium text-gray-800 text-sm">{n.title}</p>
                  {n.body && <p className="text-gray-500 text-xs mt-1">{n.body}</p>}
                  <p className="text-gray-400 text-xs mt-2">
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
