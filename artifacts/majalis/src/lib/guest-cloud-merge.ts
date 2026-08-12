/**
 * Guest → account hybrid merge: local IndexedDB/LS first, then cloud upsert.
 * Conflict policy: keep the newest by timestamp; never delete remote-only rows.
 */

import { listLocalBookmarks } from "@/lib/local-bookmarks";
import { loadLastPageSync } from "@/lib/quran-last-page";
import { loadKhatmahGoal } from "@/lib/quran-khatmah-tracker";
import { getUserStreak } from "@/lib/user-streak";

export type GuestMergeResult = {
  bookmarksMerged: number;
  resumeSynced: boolean;
  khatmahSynced: boolean;
  streakDays: number;
  errors: string[];
};

const MERGE_FLAG_KEY = "majalis-guest-merge-done-v1";

function alreadyMergedFor(userId: string): boolean {
  try {
    return localStorage.getItem(MERGE_FLAG_KEY) === userId;
  } catch {
    return false;
  }
}

function markMerged(userId: string): void {
  try {
    localStorage.setItem(MERGE_FLAG_KEY, userId);
  } catch {
    /* ignore */
  }
}

/** Idempotent merge of guest local state into the signed-in Supabase profile. */
export async function mergeGuestStateToAccount(userId: string): Promise<GuestMergeResult> {
  const result: GuestMergeResult = {
    bookmarksMerged: 0,
    resumeSynced: false,
    khatmahSynced: false,
    streakDays: 0,
    errors: [],
  };
  if (!userId) return result;
  const firstMerge = !alreadyMergedFor(userId);

  const { getSupabaseClient } = await import("@/lib/supabase-bootstrap");
  const supabase = getSupabaseClient();

  // 1) Bookmarks — upsert local into cloud (skip duplicates)
  try {
    const local = listLocalBookmarks();
    if (local.length) {
      const { data: remote } = await supabase
        .from("bookmarks")
        .select("content_type,content_id")
        .eq("user_id", userId);
      const remoteKeys = new Set(
        (remote ?? []).map((r) => `${r.content_type}::${r.content_id}`),
      );
      for (const b of local) {
        const key = `${b.contentType}::${b.contentId}`;
        if (remoteKeys.has(key)) continue;
        const { error } = await supabase.from("bookmarks").insert({
          user_id: userId,
          content_type: b.contentType,
          content_id: b.contentId,
          title: b.title || null,
        });
        if (!error) {
          result.bookmarksMerged += 1;
          remoteKeys.add(key);
        } else {
          result.errors.push(`bookmark:${key}`);
        }
      }
    }
  } catch {
    result.errors.push("bookmarks");
  }

  // 2) Mushaf last page → reading_resume
  try {
    const page = loadLastPageSync();
    if (page != null) {
      const { saveResumePosition } = await import("@/lib/user-profile-service");
      await saveResumePosition(userId, {
        content_type: "mushaf_page",
        content_id: String(page),
        content_title: `المصحف — صفحة ${page}`,
        content_url: `/mushaf?page=${page}`,
        thumbnail_icon: "BookOpen",
        position: { item_index: page },
      });
      result.resumeSynced = true;
    }
  } catch {
    result.errors.push("resume");
  }

  // 3) Khatmah goal snapshot in user metadata via preference_patch outbox / LS mirror
  try {
    const goal = loadKhatmahGoal();
    const { enqueueOutbox } = await import("@/lib/sync-outbox");
    await enqueueOutbox("preference_patch", `khatmah:${userId}`, {
      userId,
      pagesPerDay: goal.pagesPerDay,
      pagesCompleted: goal.pagesCompleted,
      targetDate: goal.targetDate ?? null,
      updatedAt: goal.updatedAt,
    });
    result.khatmahSynced = true;
  } catch {
    result.errors.push("khatmah");
  }

  // 4) Streak — keep local as source of truth; enqueue for future cloud column
  try {
    const streak = getUserStreak();
    result.streakDays = streak.currentStreak;
    const { enqueueOutbox } = await import("@/lib/sync-outbox");
    await enqueueOutbox("preference_patch", `streak:${userId}`, {
      userId,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    result.errors.push("streak");
  }

  // 5) Text highlights → vault notes once (avoid duplicates on every login)
  if (firstMerge) {
    try {
      const { listTextHighlights } = await import("@/lib/text-highlights");
      const { addNote } = await import("@/lib/vault-service");
      const highlights = listTextHighlights().slice(0, 40);
      for (const h of highlights) {
        const body = [h.quote, h.note ? `\n— ${h.note}` : "", `\n(${h.sourceTitle})`]
          .filter(Boolean)
          .join("");
        if (!body.trim()) continue;
        await addNote(userId, { note_text: body.slice(0, 4000) });
      }
    } catch {
      result.errors.push("highlights");
    }
  }

  markMerged(userId);
  try {
    const { flushOutbox } = await import("@/lib/sync-outbox");
    await flushOutbox();
  } catch {
    /* online flush optional */
  }

  return result;
}

/** Fire-and-forget from AuthProvider when a session appears. */
export function scheduleGuestCloudMerge(userId: string): void {
  if (!userId || typeof window === "undefined") return;
  const run = () => {
    void mergeGuestStateToAccount(userId).catch(() => undefined);
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 4_000 });
  } else {
    window.setTimeout(run, 1_200);
  }
}
