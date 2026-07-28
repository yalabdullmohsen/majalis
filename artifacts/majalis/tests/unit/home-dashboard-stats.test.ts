/**
 * Smoke tests — HomeDashboard data façades on DatabaseManager.
 * Run: npx tsx tests/unit/home-dashboard-stats.test.ts
 */
import {
  getDatabaseManager,
  localDateKey,
  DAILY_READING_STATS_KEY_PREFIX,
  ACTIVE_READING_KHATMAH_ID,
} from "../../src/core/quran";

let passed = 0;
let failed = 0;

function check(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

async function main() {
  console.log("═══ Dashboard stats helpers ═══");
  {
    const key = localDateKey(new Date("2026-07-28T12:00:00"));
    check(key === "2026-07-28", "localDateKey formats YYYY-MM-DD");
    check(
      DAILY_READING_STATS_KEY_PREFIX === "daily_reading_stats:",
      "daily stats key prefix",
    );
    check(
      typeof ACTIVE_READING_KHATMAH_ID === "string" &&
        ACTIVE_READING_KHATMAH_ID.length > 0,
      "ACTIVE_READING_KHATMAH_ID exported",
    );
  }

  console.log("═══ DatabaseManager dashboard APIs ═══");
  {
    const db = getDatabaseManager();
    check(typeof db.getDashboardStats === "function", "getDashboardStats");
    check(typeof db.listRecentReflections === "function", "listRecentReflections");
    check(typeof db.recordDailyPageRead === "function", "recordDailyPageRead");
    check(typeof db.addDailyReadingTimeMs === "function", "addDailyReadingTimeMs");
    check(typeof db.getDailyReadingRecord === "function", "getDailyReadingRecord");

    // Methods must never throw even without IndexedDB in Node
    const stats = await db.getDashboardStats(ACTIVE_READING_KHATMAH_ID);
    check(stats != null && typeof stats.pages_read_today === "number", "getDashboardStats returns shape");
    check(typeof stats.streak_days === "number", "streak_days number");
    check(typeof stats.total_time_ms === "number", "total_time_ms number");
    check(stats.daily_wird_target >= 1, "daily_wird_target >= 1");

    const notes = await db.listRecentReflections(3);
    check(Array.isArray(notes), "listRecentReflections returns array");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
