import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  contentType: string;
  contentId: string;
  className?: string;
  compact?: boolean;
};

export function FavoriteButton({ contentType, contentId, className = "", compact = false }: Props) {
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .maybeSingle();
      if (!cancelled) setBookmarked(Boolean(data));
    };
    load();
    return () => { cancelled = true; };
  }, [contentType, contentId]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("يرجى تسجيل الدخول أولاً");
        return;
      }
      if (bookmarked) {
        await supabase
          .from("bookmarks")
          .delete()
          .match({ user_id: user.id, content_type: contentType, content_id: contentId });
        setBookmarked(false);
      } else {
        await supabase.from("bookmarks").insert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
        });
        setBookmarked(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`favorite-btn${bookmarked ? " favorite-btn--active" : ""}${compact ? " favorite-btn--compact" : ""} ${className}`.trim()}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "إزالة من المفضلة" : "إضافة للمفضلة"}
    >
      {bookmarked ? "في المفضلة" : "إضافة للمفضلة"}
    </button>
  );
}

export default FavoriteButton;
