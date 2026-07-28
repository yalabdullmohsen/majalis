/**
 * Admin Review Hub store — Node smoke tests.
 * Run: npx tsx src/tests/admin-review-hub.test.ts
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REVIEW_HUB_SEED,
  __resetReviewHubStoreForTests,
  countByFilter,
  createReviewHubStore,
  filterReviewItems,
  matchesSearch,
} from "../lib/admin-review-hub";

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

function installMemoryStorage(): void {
  const map = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
      setItem: (k: string, v: string) => {
        map.set(k, String(v));
      },
      removeItem: (k: string) => {
        map.delete(k);
      },
      clear: () => map.clear(),
    },
    configurable: true,
  });
}

function main() {
  console.log("═══ Admin Review Hub ═══");
  installMemoryStorage();
  __resetReviewHubStoreForTests();

  check(REVIEW_HUB_SEED.length === 12, "seed 12 items");
  check(
    REVIEW_HUB_SEED.filter((i) => i.stream === "recitation").length === 6,
    "6 recitations",
  );
  check(REVIEW_HUB_SEED.filter((i) => i.stream === "content").length === 6, "6 content");

  const pending = countByFilter(REVIEW_HUB_SEED, "pending");
  check(pending >= 4, `pending count ${pending}`);

  check(matchesSearch(REVIEW_HUB_SEED[0], "u-1042"), "search user id");
  check(matchesSearch(REVIEW_HUB_SEED[0], "الفاتحة"), "search verse");

  const store = createReviewHubStore();
  const id = REVIEW_HUB_SEED.find((i) => i.status === "pending")!.id;
  store.approve(id);
  check(
    store.getSnapshot().items.find((i) => i.id === id)?.status === "approved",
    "approve item",
  );

  const rejectId = REVIEW_HUB_SEED.find(
    (i) => i.status === "pending" && i.id !== id,
  )!.id;
  store.reject(rejectId, "غير مكتمل");
  check(
    store.getSnapshot().items.find((i) => i.id === rejectId)?.feedback ===
      "غير مكتمل",
    "reject with feedback",
  );

  const rec = REVIEW_HUB_SEED.find((i) => i.stream === "recitation")!;
  store.overrideAiScore(rec.id, 88);
  const after = store.getSnapshot().items.find((i) => i.id === rec.id);
  check(
    after?.stream === "recitation" &&
      after.stream === "recitation" &&
      (after as { overriddenScore?: number }).overriddenScore === 88,
    "override AI score",
  );

  store.selectMany([id, rejectId]);
  check(store.getSnapshot().selectedIds.length === 2, "multi select");
  store.bulkUpdateStatus([id], "rejected", "جماعي");
  check(store.getSnapshot().selectedIds.length === 0, "bulk clears selection");

  store.setFilter("approved");
  store.setSearchQuery("يوسف");
  const visible = filterReviewItems(store.getSnapshot().items, {
    filter: store.getSnapshot().filter,
    streamFocus: "all",
    searchQuery: store.getSnapshot().searchQuery,
  });
  check(visible.length >= 1, "filter+search");

  store.setDarkMode(true);
  store.toggleSidebar();
  check(store.getSnapshot().darkMode === true, "dark mode");
  check(store.getSnapshot().sidebarCollapsed === true, "sidebar collapse");

  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  for (const f of [
    "views/admin/ReviewHubPage.tsx",
    "components/admin/review-hub/ReviewHubShell.tsx",
    "components/admin/review-hub/ReviewHubHeaderBar.tsx",
    "components/admin/review-hub/LinearAudioReviewPlayer.tsx",
    "components/admin/review-hub/WaveformAudioPlayer.tsx",
    "lib/admin-review-hub/store.ts",
    "styles/pages/admin-review-hub.css",
  ]) {
    check(existsSync(join(root, f)), f);
  }

  const flutterSample = REVIEW_HUB_SEED.find((i) => i.id === "rec-003");
  check(
    flutterSample?.stream === "recitation" &&
      flutterSample.userName.includes("أحمد") &&
      flutterSample.aiScore === 82,
    "flutter sample verse card",
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
