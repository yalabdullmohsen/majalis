import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isFavorite, toggleFavorite, type FavoriteType } from "@/lib/local-favorites";

const LOCAL_TYPE_MAP: Record<string, FavoriteType> = {
  qa: "qa",
  lesson: "lesson",
  book: "book",
  "surah-story": "surah-story",
  faida: "faida",
  "quran-ayah": "ayah",
  ayah: "ayah",
};

type Props = {
  contentType: string;
  contentId: string;
  title?: string;
  href?: string;
  className?: string;
  compact?: boolean;
};

export function FavoriteButton({
  contentType,
  contentId,
  title = "محتوى محفوظ",
  href = typeof window !== "undefined" ? window.location.pathname : "/",
  className = "",
  compact = false,
}: Props) {
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);
  const localType = LOCAL_TYPE_MAP[contentType];

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (localType && !cancelled) setBookmarked(isFavorite(localType, contentId));
        return;
      }
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
    const onLocal = () => {
      if (localType) setBookmarked(isFavorite(localType, contentId));
    };
    window.addEventListener("majalis-favorites-updated", onLocal);
    return () => {
      cancelled = true;
      window.removeEventListener("majalis-favorites-updated", onLocal);
    };
  }, [contentType, contentId, localType]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!localType) {
          alert("يرجى تسجيل الدخول أولاً");
          return;
        }
        setBookmarked(toggleFavorite({ type: localType, id: contentId, title, href }));
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
      {bookmarked ? (compact ? "محفوظ" : "في المفضلة") : compact ? "حفظ" : "إضافة للمفضلة"}
    </button>
  );
}

export default FavoriteButton;
