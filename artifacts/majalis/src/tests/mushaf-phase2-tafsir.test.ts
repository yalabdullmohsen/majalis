/**
 * مرحلة ٢ — كتالوج التفاسير/الترجمات وتفضيلات الترحيل.
 * Run: npx tsx src/tests/mushaf-phase2-tafsir.test.ts
 */
import {
  MUSHAF_TAFSIR_EDITIONS,
  DEFAULT_MUSHAF_TAFSIR_EDITION,
  resolveMushafTafsirEditionId,
  getMushafTafsirEdition,
} from "../features/mushaf/tafsir-editions";
import {
  MUSHAF_TRANSLATION_EDITIONS,
  resolveMushafTranslationEditionId,
} from "../features/mushaf/translation-editions";
import { MUSHAF_FEATURES, MUSHAF_SOURCES } from "../features/mushaf/config";

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

function main() {
  console.log("═══ Mushaf phase 2 tafsir/translation ═══");

  check(MUSHAF_TAFSIR_EDITIONS.length === 5, "five core tafsirs");
  const labels = MUSHAF_TAFSIR_EDITIONS.map((e) => e.label).join("|");
  check(labels.includes("الميسّر"), "includes Muyassar");
  check(labels.includes("السعدي"), "includes Saadi");
  check(labels.includes("ابن كثير"), "includes Ibn Kathir");
  check(labels.includes("البغوي"), "includes Baghawi");
  check(labels.includes("الطبري"), "includes Tabari");

  check(
    resolveMushafTafsirEditionId("ar.muyassar") === "ar-tafsir-muyassar",
    "legacy ar.muyassar maps",
  );
  check(
    resolveMushafTafsirEditionId("ar.baghawi") === "ar-tafsir-al-baghawi",
    "legacy ar.baghawi maps",
  );
  check(
    resolveMushafTafsirEditionId("ar.jalalayn") === DEFAULT_MUSHAF_TAFSIR_EDITION,
    "unknown legacy falls back to default",
  );
  check(
    getMushafTafsirEdition("ar-tafsir-ibn-kathir")?.quranComSlug === "ar-tafsir-ibn-kathir",
    "ibn kathir slug",
  );

  check(MUSHAF_TRANSLATION_EDITIONS.length >= 2, "translation editions present");
  check(resolveMushafTranslationEditionId("en.sahih") === "en.sahih", "sahih translation id");
  check(resolveMushafTranslationEditionId("nope") === "en.sahih", "bad translation falls back");

  check(!("pageImages" in MUSHAF_FEATURES), "pageImages flag removed");
  check(!("imagePolygons" in MUSHAF_FEATURES), "imagePolygons flag removed");
  check(
    !MUSHAF_SOURCES.some((s) => s.id === "visual-page-images" || s.id === "coords-image-polygons"),
    "dead image adapters removed",
  );
  check(
    MUSHAF_SOURCES.some((s) => s.id === "visual-qpc-v2" && s.enabled),
    "QPC V2 visual enabled",
  );
  check(
    MUSHAF_SOURCES.some((s) => s.id === "tafsir-qurancom" && s.enabled),
    "tafsir source registered",
  );
  check(MUSHAF_FEATURES.offlineTafsirPacks === true, "offline tafsir packs enabled");
  check(
    MUSHAF_TAFSIR_EDITIONS.some((e) => e.brief && e.id === DEFAULT_MUSHAF_TAFSIR_EDITION),
    "default edition is brief (الميسّر)",
  );
  check(
    MUSHAF_TAFSIR_EDITIONS.every((e) => Boolean(e.sourceNoteAr)),
    "every edition has documented source",
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
