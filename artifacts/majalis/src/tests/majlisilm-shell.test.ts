/**
 * MajlisIlm Flutter shell modules — Node smoke.
 * Run: npx tsx src/tests/majlisilm-shell.test.ts
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEducationalProgressController } from "../lib/educational-progress-controller";
import { QuranRepository } from "../lib/quran-repository";
import {
  filterSmartSearch,
  SEARCH_CATEGORY_LABELS,
  SMART_SEARCH_DATABASE,
} from "../lib/smart-search-engine";
import * as services from "../quran/services";
import * as hooks from "../quran/hooks";

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
  console.log("═══ MajlisIlm Flutter shell ═══");

  const edu = createEducationalProgressController();
  const snap0 = edu.getSnapshot();
  check(Object.keys(snap0.courseProgress).length === 3, "3 courses");
  check(snap0.dailyAdhkar["أذكار الصباح"] === true, "morning adhkar done");
  edu.toggleAdhkar("أذكار الصباح");
  check(edu.getSnapshot().dailyAdhkar["أذكار الصباح"] === false, "toggle adhkar");
  edu.updateCourseProgress("فقه العبادات للمبتدئين", 0.5);
  check(edu.getSnapshot().courseProgress["فقه العبادات للمبتدئين"] === 0.5, "course 50%");
  edu.updateCourseProgress("فقه العبادات للمبتدئين", 2);
  check(edu.getSnapshot().courseProgress["فقه العبادات للمبتدئين"] === 1, "clamp 1");

  check(QuranRepository.getVerses().length === 7, "repo 7 verses");
  check(Boolean(QuranRepository.getTafsir(0)), "tafsir for 0");
  check(QuranRepository.getVerseTexts()[0]?.startsWith("بِسْمِ"), "bismillah");

  check(SMART_SEARCH_DATABASE.length === 4, "search db 4");
  check(filterSmartSearch("بدر", "all").length === 1, "search badr");
  check(filterSmartSearch("", "fiqh").length === 1, "fiqh filter");
  check(filterSmartSearch("نيات", "hadith").length === 1, "hadith filter");
  check(SEARCH_CATEGORY_LABELS.quran === "القرآن", "label quran");

  check(typeof services.createEducationalProgressController === "function", "services edu");
  check(typeof services.filterSmartSearch === "function", "services search");
  check(typeof services.QuranRepository === "object", "services repo");
  check(typeof hooks.useEducationalProgress === "function", "hooks edu");

  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  for (const f of [
    "components/majlis/MainNavigationScreen.tsx",
    "components/majlis/EducationalCoursesWidget.tsx",
    "components/majlis/SmartSearchPanel.tsx",
    "components/majlis/QuranReaderWidget.tsx",
    "components/quran/TafsirModalViewer.tsx",
    "majlis/index.ts",
  ]) {
    check(existsSync(join(root, f)), f);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
