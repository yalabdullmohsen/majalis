/**
 * ترحيل بيانات مستخدم المصحف — versioned و idempotent.
 * لا يمسح بيانات؛ يتحقق من القيم ويستخدم fallback آمنًا.
 */

import { getMyBookmarks } from "@/lib/quran-my-bookmarks";
import { clampMushafPage, loadLastPageSync, saveLastPage } from "@/lib/quran-last-page";
import { loadReciterId, saveReciterId } from "@/lib/quran-audio";
import { MUSHAF_V2_FEATURES } from "./flags";

export const MUSHAF_USER_DATA_MIGRATION_VERSION = 1;
const MIGRATION_KEY = "ssunnah-mushaf-user-data-migration-v";

export type MushafUserDataMigrationResult = {
  version: number;
  ran: boolean;
  lastPage: number | null;
  bookmarkCount: number;
  reciterId: string;
};

function readMigrationVersion(): number {
  try {
    if (typeof localStorage === "undefined") return 0;
    const raw = localStorage.getItem(MIGRATION_KEY);
    const n = raw != null ? Number(raw) : 0;
    return Number.isFinite(n) ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeMigrationVersion(v: number): void {
  try {
    localStorage.setItem(MIGRATION_KEY, String(v));
  } catch {
    /* ignore */
  }
}

/**
 * تشغيل الترحيل. آمن عند التكرار — لا يضاعف الفواصل.
 * getMyBookmarks() نفسه يهجّر السجلات القديمة إلى ayahKey.
 */
export function migrateMushafUserData(): MushafUserDataMigrationResult {
  if (!MUSHAF_V2_FEATURES.userDataMigration) {
    return {
      version: readMigrationVersion(),
      ran: false,
      lastPage: loadLastPageSync(),
      bookmarkCount: getMyBookmarks().length,
      reciterId: loadReciterId(),
    };
  }

  const current = readMigrationVersion();
  const bookmarks = getMyBookmarks();
  let lastPage = loadLastPageSync();
  if (lastPage != null) {
    const clamped = clampMushafPage(lastPage);
    if (clamped !== lastPage) {
      void saveLastPage(clamped);
      lastPage = clamped;
    }
  }

  const reciterId = loadReciterId();
  saveReciterId(reciterId);

  if (current >= MUSHAF_USER_DATA_MIGRATION_VERSION) {
    return {
      version: current,
      ran: false,
      lastPage,
      bookmarkCount: bookmarks.length,
      reciterId,
    };
  }

  writeMigrationVersion(MUSHAF_USER_DATA_MIGRATION_VERSION);
  return {
    version: MUSHAF_USER_DATA_MIGRATION_VERSION,
    ran: true,
    lastPage,
    bookmarkCount: bookmarks.length,
    reciterId,
  };
}
