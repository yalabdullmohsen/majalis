/**
 * AppController + audio tracking cursor — Node unit smoke.
 * Run: npx tsx src/tests/quran-master-architecture.test.ts
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AppController,
  createAppController,
  __resetAppControllerForTests,
} from "../lib/app-controller";
import { createQuranController } from "../lib/quran-controller";
import * as services from "../quran/services";
import * as hooks from "../quran/hooks";
import { VERSE_SELECTED_BG } from "../lib/quran-immersive";

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
  console.log("═══ Quran master architecture ═══");
  __resetAppControllerForTests();

  const app = createAppController();
  check(app instanceof AppController, "createAppController");
  check(app.getSnapshot().immersive === false, "immersive off");
  check(app.getSnapshot().keepAwake === true, "keepAwake default");

  let ticks = 0;
  const unsub = app.subscribe(() => {
    ticks += 1;
  });
  await app.enterImmersive("#F5F5DC");
  check(app.immersive === true, "enterImmersive");
  check(app.paperBg === "#F5F5DC", "paper set");
  check(ticks === 1, "notify enter");
  await app.exitImmersive();
  check(app.immersive === false, "exitImmersive");
  unsub();

  const q = createQuranController();
  q.selectVerse(1);
  q.togglePlayback();
  check(q.selectedIndex === 1 && q.isPlaying, "QuranController still works");

  check(VERSE_SELECTED_BG.includes("0.2"), "brown@0.2 wash");
  check(typeof services.createAppController === "function", "services AppController");
  check(typeof services.createQuranController === "function", "services QuranController");
  check(typeof hooks.useAppController === "function", "hooks.useAppController");
  check(typeof hooks.useAudioTrackingCursor === "function", "hooks.useAudioTrackingCursor");
  check(typeof hooks.useQuranController === "function", "hooks.useQuranController");

  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  check(existsSync(join(root, "quran/MASTER_ARCHITECTURE.md")), "MASTER_ARCHITECTURE.md");
  check(existsSync(join(root, "components/quran/ImmersivePrefsDrawer.tsx")), "prefs drawer");
  check(existsSync(join(root, "components/quran/ImmersiveQuranPage.tsx")), "immersive page");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main();
