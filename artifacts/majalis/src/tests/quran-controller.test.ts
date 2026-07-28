/**
 * Flutter QuranController ChangeNotifier — Node unit smoke.
 * Run: npx tsx src/tests/quran-controller.test.ts
 */
import {
  QuranController,
  createQuranController,
} from "../lib/quran-controller";
import * as services from "../quran/services";
import { VERSE_SELECTED_BROWN, IMMERSIVE_LIST_PAD_Y_PX } from "../lib/quran-immersive";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
  console.log("═══ QuranController (ChangeNotifier) ═══");

  const c = createQuranController();
  check(c instanceof QuranController, "createQuranController");
  check(c.getSnapshot().selectedIndex === null, "initial selected null");
  check(c.getSnapshot().isPlaying === false, "initial not playing");

  let ticks = 0;
  const unsub = c.subscribe(() => {
    ticks += 1;
  });

  const snap0 = c.getSnapshot();
  c.selectVerse(2);
  check(c.selectedIndex === 2, "selectVerse 2");
  check(c.getSnapshot().selectedIndex === 2, "snapshot selected 2");
  check(c.getSnapshot() !== snap0, "new snap after select");
  check(ticks === 1, "notify on select");

  c.togglePlayback();
  check(c.isPlaying === true, "toggle → playing");
  check(ticks === 2, "notify on toggle");
  c.togglePlayback();
  check(c.isPlaying === false, "toggle → stopped");

  c.setPlaying(true);
  check(c.isPlaying === true, "setPlaying true");
  c.setPlaying(true);
  check(ticks === 4, "no notify when setPlaying same"); // select+2 toggles+1 set = 4

  c.clearSelection();
  check(c.selectedIndex === null, "clearSelection");
  check(ticks === 5, "notify on clear");

  unsub();
  c.selectVerse(0);
  check(ticks === 5, "unsubscribed — no notify");
  check(c.selectedIndex === 0, "select still mutates after unsub");

  check(typeof services.createQuranController === "function", "services export");
  check(VERSE_SELECTED_BROWN.toUpperCase() === "#795548", "Colors.brown");
  check(IMMERSIVE_LIST_PAD_Y_PX === 50, "list pad Y 50");

  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  check(
    existsSync(join(root, "components/quran/ImmersiveQuranPage.tsx")),
    "ImmersiveQuranPage.tsx",
  );
  check(
    existsSync(join(root, "hooks/useQuranController.ts")),
    "useQuranController.ts",
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
