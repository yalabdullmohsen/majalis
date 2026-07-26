import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  isLocalBookmarked,
  toggleLocalBookmark,
} from "@/lib/local-bookmarks";

type Props = {
  contentType: string;
  contentId: string;
  title?: string;
  className?: string;
  compact?: boolean;
};

export function FavoriteButton({
  contentType,
  contentId,
  title,
  className = "",
  compact = false,
}: Props) {
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"local" | "cloud">("local");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const local = isLocalBookmarked(contentType, contentId);
      if (!cancelled) setBookmarked(local);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        if (!cancelled) setMode("local");
        return;
      }
      if (!cancelled) setMode("cloud");
      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .maybeSingle();
      if (!cancelled) setBookmarked(Boolean(data) || local);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [contentType, contentId]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const next = toggleLocalBookmark({
          contentType,
          contentId,
          title,
          href: `${window.location.pathname}${window.location.search}`,
        });
        setBookmarked(next);
        setMode("local");
        return;
      }

      setMode("cloud");
      if (bookmarked) {
        await supabase
          .from("bookmarks")
          .delete()
          .match({ user_id: user.id, content_type: contentType, content_id: contentId });
        // أزل النسخة المحلية إن وُجدت لتفادي ازدواج الحالة
        if (isLocalBookmarked(contentType, contentId)) {
          toggleLocalBookmark({ contentType, contentId });
        }
        setBookmarked(false);
      } else {
        await supabase.from("bookmarks").insert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
          title: title ?? null,
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
      title={mode === "local" ? "يُحفظ على هذا الجهاز" : "يُحفظ في حسابك"}
    >
      {bookmarked ? (compact ? "محفوظ" : "في المفضلة") : compact ? "حفظ" : "إضافة للمفضلة"}
    </button>
  );
}

export default FavoriteButton;
