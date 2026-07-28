/**
 * Unit — TafseerService surface + ActionBar drawer wiring (no network/IDB).
 * Run: npx tsx tests/unit/tafseer-service.test.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  getTafseerService,
  TAFSEER_SOURCES,
  __resetTafseerServiceForTests,
} from "../../src/core/tafseer/TafseerService";

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

const root = resolve(import.meta.dirname, "../..");

console.log("═══ Tafseer files ═══");
check(existsSync(resolve(root, "src/core/tafseer/TafseerService.ts")), "TafseerService.ts");
check(existsSync(resolve(root, "src/components/TafseerDrawer.tsx")), "TafseerDrawer.tsx");
check(existsSync(resolve(root, "src/styles/tafseer-drawer.css")), "tafseer-drawer.css");

const svc = readFileSync(resolve(root, "src/core/tafseer/TafseerService.ts"), "utf8");
check(svc.includes("getAsset") && svc.includes("upsertAsset"), "caches via DatabaseManager assets");
check(svc.includes("fetchTafsirAyahs"), "fetches from AlQuran Cloud helper");
check(svc.includes("ar.jalalayn") && svc.includes("en.ibnukathir"), "multiple sources");

const drawer = readFileSync(resolve(root, "src/components/TafseerDrawer.tsx"), "utf8");
check(drawer.includes("framer-motion") || drawer.includes("AnimatePresence"), "Framer Motion drawer");
check(drawer.includes("getTafseerService"), "drawer uses TafseerService");
check(drawer.includes("role=\"tablist\"") || drawer.includes("sources"), "source switcher");

const bar = readFileSync(resolve(root, "src/components/QuranActionBar.tsx"), "utf8");
check(bar.includes("TafseerDrawer"), "ActionBar opens TafseerDrawer");
check(!bar.includes("fetchTafsirAyahs"), "ActionBar no longer inline-fetches tafsir");

console.log("═══ TafseerService singleton ═══");
{
  __resetTafseerServiceForTests();
  const a = getTafseerService();
  const b = getTafseerService();
  check(a === b, "singleton");
  check(a.listSources().length >= 4, "lists multiple sources");
  check(TAFSEER_SOURCES.some((s) => s.id === "ar.jalalayn"), "includes Jalalayn");
  check(TAFSEER_SOURCES.some((s) => s.id === "en.ibnukathir"), "includes Ibn Kathir");
  check(a.getDefaultEdition() === "ar.muyassar", "default muyassar");
  __resetTafseerServiceForTests();
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
