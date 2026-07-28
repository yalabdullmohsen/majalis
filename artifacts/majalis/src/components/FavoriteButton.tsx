import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  isLocalBookmarked,
  toggleLocalBookmark,
} from "@/lib/local-bookmarks";
import { scheduleInputAck } from "@/lib/yield-to-main";
import { enqueueOutbox } from "@/lib/offline-outbox";

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
    const next = !bookmarked;
    // Optimistic UI within the same frame (<16ms INP)
    setBookmarked(next);
    setBusy(true);
    try {
      await scheduleInputAck(async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          const persisted = toggleLocalBookmark({
            contentType,
            contentId,
            title,
            href: `${window.location.pathname}${window.location.search}`,
          });
          setBookmarked(persisted);
          setMode("local");
          return;
        }

        setMode("cloud");
        if (!next) {
          await supabase
            .from("bookmarks")
            .delete()
            .match({ user_id: user.id, content_type: contentType, content_id: contentId });
          if (isLocalBookmarked(contentType, contentId)) {
            toggleLocalBookmark({ contentType, contentId });
          }
          enqueueOutbox("bookmark_delete", { contentType, contentId, userId: user.id });
        } else {
          await supabase.from("bookmarks").insert({
            user_id: user.id,
            content_type: contentType,
            content_id: contentId,
            title: title ?? null,
          });
          enqueueOutbox("bookmark_upsert", {
            contentType,
            contentId,
            title: title ?? null,
            userId: user.id,
          });
        }
      });
    } catch {
      setBookmarked(!next);
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
