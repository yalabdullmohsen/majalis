/**
 * Unit smoke — DatabaseManager with fake-indexeddb.
 * Run: npx tsx src/tests/database-manager.test.ts
 */
import "fake-indexeddb/auto";
import Dexie from "dexie";
import {
  DatabaseManager,
  getDatabaseManager,
  databaseManager,
  QURAN_APP_DB_NAME,
  ACTIVE_PROGRESS_ID,
} from "../core/quran/DatabaseManager";

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

async function resetDb() {
  DatabaseManager.__resetInstanceForTests();
  try {
    await Dexie.delete(QURAN_APP_DB_NAME);
  } catch {
    /* ignore */
  }
}

async function main() {
  console.log("═══ DatabaseManager singleton ═══");
  check(getDatabaseManager() === databaseManager, "getDatabaseManager === databaseManager");
  check(DatabaseManager.getInstance() === databaseManager, "getInstance is singleton");

  console.log("═══ initialize + progress ═══");
  await resetDb();
  const db = getDatabaseManager();
  check((await db.initialize()) === true, "initialize opens IDB");
  check((await db.getReadingProgress()) === null, "no progress yet");

  const saved = await db.saveProgress({ lastSurah: 2, lastAyah: 255, lastPage: 42 });
  check(saved?.id === ACTIVE_PROGRESS_ID, "saveProgress writes active row");
  check(saved?.lastSurah === 2 && saved?.lastAyah === 255, "progress fields");

  const loaded = await db.getReadingProgress();
  check(loaded?.lastPage === 42, "getReadingProgress returns last page");

  // reopen
  DatabaseManager.__resetInstanceForTests();
  const db2 = getDatabaseManager();
  await db2.initialize();
  const again = await db2.getReadingProgress();
  check(again?.lastSurah === 2 && again?.lastPage === 42, "progress survives reopen");

  console.log("═══ bookmarks ═══");
  const bm = await db2.addBookmark({ surahId: 1, ayahId: 1, note: "افتتاح" });
  check(bm?.verseKey === "1:1" && bm?.note === "افتتاح", "addBookmark");
  const listed = await db2.listBookmarks();
  check(listed.length === 1, "listBookmarks");
  await db2.addBookmark({ surahId: 1, ayahId: 1, note: "محدَّث" });
  const listed2 = await db2.listBookmarks();
  check(listed2.length === 1 && listed2[0]?.note === "محدَّث", "addBookmark upserts same ayah");

  console.log("═══ settings + tafseer cache ═══");
  check((await db2.setSetting("isTajweedEnabled", true)) === true, "setSetting");
  check((await db2.getSetting<boolean>("isTajweedEnabled")) === true, "getSetting");

  check((await db2.getCachedTafseer("2:255")) === null, "tafseer miss");
  const cached = await db2.cacheTafseer({
    ayahId: "2:255",
    source: "ar-muyassar",
    content: "تفسير تجريبي",
  });
  check(cached?.content === "تفسير تجريبي", "cacheTafseer");
  const hit = await db2.getCachedTafseer("2:255", "ar-muyassar");
  check(hit?.content === "تفسير تجريبي", "getCachedTafseer hit");

  await resetDb();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
