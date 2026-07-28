/**
 * Unit tests — Quran core structure façades (no UI, no IndexedDB required).
 * Run: npx tsx tests/unit/quran-core-structure.test.ts
 */
import { getQuranEngineContext } from "../../src/core/quran/QuranEngineContext";
import { getDatabaseManager } from "../../src/core/quran/DatabaseManager";
import { getResourceManager } from "../../src/core/quran/ResourceManager";
import { getIndexingService } from "../../src/core/quran/IndexingService";
import { resetQuranEngineState } from "../../src/lib/quran-engine-store";
import {
  __resetLifecycleFlagsForTests,
  setQuranIndexingSuspended,
} from "../../src/lib/quran-offline/lifecycle-flags";

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
  console.log("═══ Quran core singletons ═══");
  {
    const ctx = getQuranEngineContext();
    check(ctx.db === getDatabaseManager(), "context.db is DatabaseManager singleton");
    check(ctx.resources === getResourceManager(), "context.resources is ResourceManager");
    check(ctx.indexing === getIndexingService(), "context.indexing is IndexingService");
  }

  console.log("═══ QuranEngineContext state ═══");
  {
    resetQuranEngineState();
    const ctx = getQuranEngineContext();
    ctx.setPage(2);
    check(ctx.getState().page === 2, "setPage updates store");
    ctx.setActiveVerse({ surah: 2, ayah: 255, page: 42 });
    const s = ctx.getState();
    check(s.surah === 2 && s.ayah === 255 && s.verseKey === "2:255", "setActiveVerse");
    check(s.page === 42, "setActiveVerse can set page");
    ctx.setAudio({ playerState: "playing", reciterId: "alafasy" });
    check(ctx.getState().playerState === "playing", "setAudio playerState");
    ctx.clearActiveVerse();
    check(ctx.getState().ayah == null && ctx.getState().verseKey == null, "clearActiveVerse");
    let notified = false;
    const unsub = ctx.subscribe(() => {
      notified = true;
    });
    ctx.setPage(3);
    check(notified === true, "subscribe receives patches");
    unsub();
    resetQuranEngineState();
  }

  console.log("═══ IndexingService (main-thread fallback) ═══");
  {
    __resetLifecycleFlagsForTests();
    const indexing = getIndexingService();
    const rows = await indexing.flattenMutashabihatIndex(
      { "1:1": [{ surah: 1, ayah: 2 }] },
      { "1:1": ["sabr"] },
    );
    check(rows.length >= 1, "flatten returns rows");
    const row = rows.find((r) => r.ayah_key === "1:1");
    check(!!row && row.similar_ayah_keys.includes("1:2"), "similar keys flattened");
    check(!!row && row.theme_ids.includes("sabr"), "themes merged");

    const notes = await indexing.analyzeTajweedTimings([
      {
        ref: { index: 0, raw: "قال" },
        heard: { word: "قال", startSec: 0, endSec: 0.05 },
      },
    ]);
    check(notes.some((n) => n.rule === "madd_tabeei_short"), "tajweed short madd note");

    setQuranIndexingSuspended(true);
    const empty = await indexing.flattenMutashabihatIndex({ "1:1": [{ surah: 1, ayah: 2 }] });
    check(empty.length === 0, "indexing suspended ⇒ empty flatten");
    __resetLifecycleFlagsForTests();
  }

  console.log("═══ ResourceManager budget defaults ═══");
  {
    const rm = getResourceManager();
    check(rm.defaultBudgetBytes === 500 * 1024 * 1024, "500MB default budget");
    check(typeof rm.isPrefetchSuspended() === "boolean", "prefetch flag readable");
  }

  console.log("═══ DatabaseManager schema contract ═══");
  {
    const {
      CORE_QURAN_DB_NAME,
      CORE_QURAN_DB_VERSION,
      CORE_STORE_INDEXES,
      DatabaseManager,
    } = await import("../../src/core/quran/DatabaseManager");
    check(CORE_QURAN_DB_NAME === "majalis-quran-engine-db", "core DB name");
    check(CORE_QURAN_DB_VERSION === 2, "core DB version 2");
    check(
      CORE_STORE_INDEXES.user_reflections_store.includes("[surah_id+ayah_id]"),
      "reflections composite index",
    );
    check(
      CORE_STORE_INDEXES.khatmah_store.startsWith("id,"),
      "khatmah primary id",
    );
    check(
      CORE_STORE_INDEXES.offline_assets_store.startsWith("asset_id"),
      "assets primary asset_id",
    );
    check(
      DatabaseManager.getInstance() === getDatabaseManager(),
      "getInstance === getDatabaseManager",
    );
    // No IndexedDB in Node — initialize must fail soft
    const ready = await getDatabaseManager().initialize();
    check(ready === false, "initialize soft-fails without IndexedDB");
  }

  console.log("═══ Reading progress persistence API ═══");
  {
    const {
      getQuranEngineContext,
      ACTIVE_READING_KHATMAH_ID,
    } = await import("../../src/core/quran/QuranEngineContext");
    const engine = getQuranEngineContext();
    check(typeof engine.updateReadingProgress === "function", "updateReadingProgress exists");
    check(typeof engine.loadLastReadingProgress === "function", "loadLastReadingProgress exists");
    check(ACTIVE_READING_KHATMAH_ID === "core-active-reading", "stable khatmah id");
    // Without IndexedDB, upsert must soft-fail (null) — never throw
    let threw = false;
    let row = null as unknown;
    try {
      row = await engine.updateReadingProgress({ surah: 1, ayah: 1, page: 1 });
    } catch {
      threw = true;
    }
    check(threw === false, "updateReadingProgress never throws");
    check(row === null, "updateReadingProgress returns null without IDB");
    // In-memory state still updates via setActiveVerse(persist:false)
    engine.setActiveVerse({ surah: 18, ayah: 1, page: 293 }, { persist: false });
    check(engine.getState().verseKey === "18:1", "setActiveVerse persist:false updates memory");
    resetQuranEngineState();
  }

  console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
  if (failed > 0) process.exit(1);
}

void main();
