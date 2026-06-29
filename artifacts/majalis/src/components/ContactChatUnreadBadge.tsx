import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";

async function fetchUnread(): Promise<number> {
  try {
    const headers: Record<string, string> = {};
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch("/api/contact-chat?action=unread", { credentials: "same-origin", headers });
    const data = await res.json();
    if (data.ok) return data.user_unread || 0;
  } catch {
    /* ignore */
  }
  return 0;
}

export function ContactChatUnreadBadge() {
  const { isLoggedIn } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      setCount(0);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const n = await fetchUnread();
      if (!cancelled) setCount(n);
    };
    void load();
    const id = window.setInterval(() => void load(), 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [isLoggedIn]);

  if (!isLoggedIn || count <= 0) return null;

  return (
    <Link href="/contact-chat" className="contact-chat-nav-badge" aria-label={`${count} رسائل غير مقروءة في التواصل`}>
      تواصل
      <span className="contact-chat-nav-badge__count">{count > 99 ? "99+" : count}</span>
    </Link>
  );
}

export default ContactChatUnreadBadge;
