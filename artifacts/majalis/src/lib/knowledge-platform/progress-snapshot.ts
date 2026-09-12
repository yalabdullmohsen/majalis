/**
 * لقطة تقدّم موحّدة — تقرأ المخازن الحالية دون استبدال مفاتيح المصحف.
 */

import { listLocalBookmarks, type LocalBookmark } from "@/lib/local-bookmarks";
import { listRecentActivity, type ActivityEvent } from "./activity-model";
import { resolveContentRef } from "./content-resolver";
import type { ContentEntityCard } from "./content-entity";
import { listLocalSearchHistory } from "./privacy";

export type ProgressSnapshot = {
  mushaf: {
    lastPage: number | null;
    href: string | null;
    card: ContentEntityCard | null;
  };
  bookmarks: LocalBookmark[];
  recentActivity: ActivityEvent[];
  recentSearches: string[];
  measured: {
    mushafPage: boolean;
    bookmarks: boolean;
    activity: boolean;
  };
};

async function readLastMushafPage(): Promise<number | null> {
  try {
    const { loadLastPage } = await import("@/lib/quran-last-page");
    return await loadLastPage();
  } catch {
    return null;
  }
}

export async function buildProgressSnapshot(): Promise<ProgressSnapshot> {
  const lastPage = await readLastMushafPage();
  const card =
    lastPage != null
      ? resolveContentRef({ kind: "quran_page", id: String(lastPage) }, `صفحة ${lastPage}`)
      : null;
  const bookmarks = listLocalBookmarks().slice(0, 12);
  const recentActivity = listRecentActivity(12);
  const recentSearches = listLocalSearchHistory().slice(0, 8);

  return {
    mushaf: {
      lastPage,
      href: card?.href ?? null,
      card,
    },
    bookmarks,
    recentActivity,
    recentSearches,
    measured: {
      mushafPage: lastPage != null,
      bookmarks: bookmarks.length > 0,
      activity: recentActivity.length > 0,
    },
  };
}
