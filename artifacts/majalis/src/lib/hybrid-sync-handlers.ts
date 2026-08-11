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
      const page = Number(item.payload.page);
      if (!userId || !Number.isFinite(page)) return true;
      const { saveResumePosition } = await import("@/lib/user-profile-service");
      await saveResumePosition(userId, {
        content_type: "mushaf_page",
        content_id: String(page),
        content_title: `المصحف — صفحة ${page}`,
        content_url: `/mushaf?page=${page}`,
        thumbnail_icon: "BookOpen",
        position: { item_index: page },
      });
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
