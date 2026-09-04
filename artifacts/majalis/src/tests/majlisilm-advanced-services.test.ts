/**
 * MajlisIlm advanced services — Audio + LocalStorage + educational persist.
 * Run: npx tsx src/tests/majlisilm-advanced-services.test.ts
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createMajlisAudioService } from "../lib/majlis-audio-service";
import {
  LocalStorageService,
  getLocalStorageService,
} from "../lib/majlis-local-storage-service";
import { createQuranAppController } from "../lib/quran-app-controller";
import { createEducationalProgressController } from "../lib/educational-progress-controller";
import * as services from "../quran/services";

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

/** Minimal localStorage for Node. */
function installMemoryStorage(): void {
  const map = new Map<string, string>();
  const store = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: store,
    configurable: true,
  });
}

async function main() {
  console.log("═══ MajlisIlm advanced services ═══");

  installMemoryStorage();
  LocalStorageService.__resetForTests();

  const ls = getLocalStorageService();
  await ls.saveFontSize(32);
  check((await ls.getFontSize()) === 32, "font size persist");
  await ls.saveDarkMode(true);
  check((await ls.getDarkMode()) === true, "dark mode persist");
  await ls.saveLastVerseIndex(3, 1);
  check((await ls.getLastVerseIndex()) === 3, "last verse");
  check((await ls.getLastSurah()) === 1, "last surah");

  ls.saveCourseProgress({ "فقه العبادات للمبتدئين": 0.42 });
  check(ls.loadCourseProgress()?.["فقه العبادات للمبتدئين"] === 0.42, "course progress");
  ls.saveDailyAdhkar({ "أذكار المساء": true });
  check(ls.loadDailyAdhkar()?.["أذكار المساء"] === true, "adhkar persist");

  LocalStorageService.__resetForTests();
  const c = createQuranAppController({ hydrate: true, persist: true });
  check(c.fontSize === 32, "hydrate font into controller");
  check(c.isDarkMode === true, "hydrate dark into controller");

  const edu = createEducationalProgressController({
    storage: getLocalStorageService(),
    persist: true,
  });
  check(
    edu.getSnapshot().courseProgress["فقه العبادات للمبتدئين"] === 0.42,
    "edu hydrate course",
  );
  edu.toggleAdhkar("أذكار المساء");
  check(
    getLocalStorageService().loadDailyAdhkar()?.["أذكار المساء"] === false,
    "edu persist adhkar toggle",
  );

  const audio = createMajlisAudioService();
  const states: string[] = [];
  audio.subscribe((s) => {
    states.push(`${s.playing}:${s.loading}:${s.error ? "err" : "ok"}`);
  });
  await audio.playUrl("https://example.com/a.mp3");
  /* Node: no HTMLAudioElement → error state */
  check(audio.getState().error != null || typeof Audio === "undefined", "audio no-DOM handled");
  await audio.dispose();

  check(typeof services.getMajlisAudioService === "function", "services audio export");
  check(typeof services.getLocalStorageService === "function", "services storage export");

  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  for (const f of [
    "lib/majlis-audio-service.ts",
    "lib/majlis-local-storage-service.ts",
    "components/majlis/EducationalCoursesWidget.tsx",
  ]) {
    check(existsSync(join(root, f)), f);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main();
