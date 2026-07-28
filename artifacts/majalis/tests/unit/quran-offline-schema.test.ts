/**
 * Unit tests — Quran offline schema transforms + contract (no UI).
 * Run: npx tsx tests/unit/quran-offline-schema.test.ts
 */
import {
  ayahKey,
  flattenMutashabihatToKeys,
  invertTopicsToAyahMap,
  mergeKnowledgeMaps,
} from "../../src/lib/quran-offline/knowledge-store";
import {
  makeAudioSurahAssetId,
  makeAyahAudioAssetId,
  makeFontCacheAssetId,
  makeTafseerAssetId,
} from "../../src/lib/quran-offline/assets-store";
import { reflectionId } from "../../src/lib/quran-offline/reflections-store";
import {
  QURAN_OFFLINE_DB_NAME,
  QURAN_OFFLINE_DB_VERSION,
} from "../../src/lib/quran-offline/types";
import { QURAN_OFFLINE_STORE_INDEXES } from "../../src/lib/quran-offline/db";

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

console.log("═══ Quran Offline Schema — pure transforms ═══");

{
  check(ayahKey(2, 255) === "2:255", "ayahKey formats surah:ayah");
  const flat = flattenMutashabihatToKeys({
    "1:1": [
      { surah: 1, ayah: 2 },
      { surah: 2, ayah: 1 },
    ],
  });
  check(
    flat["1:1"]?.join(",") === "1:2,2:1",
    "flattenMutashabihatToKeys maps to similar_ayah_keys",
  );

  const themes = invertTopicsToAyahMap([
    { id: "sabr", verses: [{ surah: 2, ayah: 153 }, { surah: 103, ayah: 3 }] },
    { id: "tawba", verses: [{ surah: 2, ayah: 153 }] },
  ]);
  check(themes["2:153"]?.includes("sabr") === true, "theme sabr on 2:153");
  check(themes["2:153"]?.includes("tawba") === true, "theme tawba on 2:153");
  check(themes["103:3"]?.join(",") === "sabr", "theme only sabr on 103:3");

  const merged = mergeKnowledgeMaps(flat, themes);
  const row = merged.find((r) => r.ayah_key === "1:1");
  check(!!row && row.similar_ayah_keys.length === 2, "merge keeps similar keys");
  const row2153 = merged.find((r) => r.ayah_key === "2:153");
  check(!!row2153 && row2153.theme_ids.length === 2, "merge keeps theme ids");
  check(
    merged.some((r) => r.ayah_key === "1:1") && merged.some((r) => r.ayah_key === "2:153"),
    "merge unions keys from both maps",
  );
}

console.log("═══ Asset / reflection id helpers ═══");
{
  check(
    makeAudioSurahAssetId("alafasy", 1) === "audio_surah:alafasy:1",
    "audio surah asset id",
  );
  check(
    makeAyahAudioAssetId("alafasy", 1, 1) === "ayah_audio:alafasy:1:1",
    "ayah audio asset id",
  );
  check(makeFontCacheAssetId("qpc-v2") === "font_cache:qpc-v2", "font cache asset id");
  check(makeTafseerAssetId("ar-tafsir") === "tafseer_db:ar-tafsir", "tafseer asset id");
  check(reflectionId(2, 255) === "2:255", "reflection id ayah-level");
  check(reflectionId(2, 255, 3) === "2:255:w3", "reflection id word-level");
}

console.log("═══ Schema contract ═══");
{
  check(QURAN_OFFLINE_DB_NAME === "majalis-quran-engine-db", "DB name stable");
  check(QURAN_OFFLINE_DB_VERSION === 1, "schema version is 1");
  check(
    QURAN_OFFLINE_STORE_INDEXES.user_reflections_store.includes("[surah_id+ayah_id]"),
    "reflections composite index [surah_id+ayah_id]",
  );
  check(
    QURAN_OFFLINE_STORE_INDEXES.quran_knowledge_store.startsWith("ayah_key"),
    "knowledge primary ayah_key",
  );
  check(
    QURAN_OFFLINE_STORE_INDEXES.offline_assets_store.startsWith("asset_id"),
    "assets primary asset_id",
  );
  check(
    QURAN_OFFLINE_STORE_INDEXES.outbox_sync_store.includes("++id") &&
      QURAN_OFFLINE_STORE_INDEXES.outbox_sync_store.includes("[status+created_at]"),
    "outbox auto-id + chronological compound index",
  );
  check(
    QURAN_OFFLINE_STORE_INDEXES.khatmah_store.includes("[type+is_completed]"),
    "khatmah compound active-profile index",
  );
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
