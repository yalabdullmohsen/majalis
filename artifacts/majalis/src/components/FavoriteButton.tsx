import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  isLocalBookmarked,
  toggleLocalBookmark,
} from "@/lib/local-bookmarks";
import { triggerHaptic } from "@/lib/haptics";

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
  const [errorHint, setErrorHint] = useState<string | null>(null);

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
    setErrorHint(null);
    const prev = bookmarked;
    // واجهة متفائلة — حفظ/مفضلة فقط (آمن للتراجع)
    setBookmarked(!prev);
    triggerHaptic("selection");

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
      if (prev) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .match({ user_id: user.id, content_type: contentType, content_id: contentId });
        if (error) throw error;
        if (isLocalBookmarked(contentType, contentId)) {
          toggleLocalBookmark({ contentType, contentId });
        }
        setBookmarked(false);
      } else {
        const { error } = await supabase.from("bookmarks").insert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
          title: title ?? null,
        });
        if (error) throw error;
        setBookmarked(true);
      }
    } catch {
      setBookmarked(prev);
      setErrorHint("تعذّر الحفظ — أعد المحاولة");
      triggerHaptic("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`favorite-btn mj-pressable mj-touch-target${bookmarked ? " favorite-btn--active" : ""}${compact ? " favorite-btn--compact" : ""} ${className}`.trim()}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "إزالة من المفضلة" : "إضافة للمفضلة"}
      title={
        errorHint
          ? errorHint
          : mode === "local"
            ? "يُحفظ على هذا الجهاز"
            : "يُحفظ في حسابك"
      }
    >
      {bookmarked ? (compact ? "محفوظ" : "في المفضلة") : compact ? "حفظ" : "إضافة للمفضلة"}
    </button>
  );
}

export default FavoriteButton;
