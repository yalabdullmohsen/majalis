/**
 * Register outbox flush handlers for reading_progress / favorite_toggle / preference_patch.
 */

import { registerOutboxHandler, type OutboxItem } from "@/lib/sync-outbox";

let registered = false;

export function ensureHybridSyncOutboxHandlers(): void {
  if (registered) return;
  registered = true;

  registerOutboxHandler("reading_progress", async (item: OutboxItem) => {
    try {
      const userId = String(item.payload.userId || "");
      if (!userId) return true;
      const page = item.payload.page != null ? Number(item.payload.page) : NaN;
      const surah = item.payload.surah != null ? Number(item.payload.surah) : NaN;
      const ayah = item.payload.ayah != null ? Number(item.payload.ayah) : NaN;
      const { saveResumePosition } = await import("@/lib/user-profile-service");
      if (Number.isFinite(page)) {
        await saveResumePosition(userId, {
          content_type: "mushaf_page",
          content_id: String(page),
          content_title: `المصحف — صفحة ${page}`,
          content_url: `/mushaf?page=${page}`,
          thumbnail_icon: "BookOpen",
          position: { item_index: page },
        });
        return true;
      }
      if (Number.isFinite(surah)) {
        const ayahNum = Number.isFinite(ayah) ? ayah : 1;
        await saveResumePosition(userId, {
          content_type: "quran_surah",
          content_id: `${surah}:${ayahNum}`,
          content_title: `القرآن — سورة ${surah}`,
          content_url: `/quran/offline-player?surah=${surah}`,
          thumbnail_icon: "BookOpen",
          position: { item_index: surah, section: String(ayahNum) },
        });
        return true;
      }
      return true;
    } catch {
      return false;
    }
  });

  registerOutboxHandler("favorite_toggle", async (item: OutboxItem) => {
    try {
      const userId = String(item.payload.userId || "");
      const contentType = String(item.payload.contentType || "");
      const contentId = String(item.payload.contentId || "");
      const title = item.payload.title != null ? String(item.payload.title) : null;
      const wantOn = item.payload.on === true;
      if (!userId || !contentType || !contentId) return true;
      const { getSupabaseClient } = await import("@/lib/supabase-bootstrap");
      const supabase = getSupabaseClient();
      if (wantOn) {
        await supabase.from("bookmarks").upsert(
          {
            user_id: userId,
            content_type: contentType,
            content_id: contentId,
            title,
          },
          { onConflict: "user_id,content_type,content_id" },
        );
      } else {
        await supabase
          .from("bookmarks")
          .delete()
          .match({ user_id: userId, content_type: contentType, content_id: contentId });
      }
      return true;
    } catch {
      return false;
    }
  });

  registerOutboxHandler("preference_patch", async (item: OutboxItem) => {
    // Preference patches are mirrored locally; accept flush as success
    // until a dedicated user_prefs table is available.
    void item;
    return true;
  });
}
