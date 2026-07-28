/**
 * Unit tests — Quran resource lifecycle (LRU score, flags, budget config).
 * Run: npx tsx tests/unit/quran-resource-lifecycle.test.ts
 */
import {
  DEFAULT_INACTIVE_DAYS,
  DEFAULT_STORAGE_BUDGET_BYTES,
  evictionScore,
  getLifecycleBudgetConfig,
} from "../../src/lib/quran-offline/lifecycle-config";
import {
  __resetLifecycleFlagsForTests,
  isQuranIndexingSuspended,
  isQuranPrefetchSuspended,
  setQuranIndexingSuspended,
  setQuranPrefetchSuspended,
} from "../../src/lib/quran-offline/lifecycle-flags";
import { purgeEphemeralMediaResources } from "../../src/lib/quran-offline/ephemeral-registry";

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

console.log("═══ Lifecycle config ═══");
{
  const cfg = getLifecycleBudgetConfig();
  check(cfg.budgetBytes === DEFAULT_STORAGE_BUDGET_BYTES, "default budget 500MiB");
  check(cfg.inactiveDays === DEFAULT_INACTIVE_DAYS, "default inactive 14 days");
  check(DEFAULT_STORAGE_BUDGET_BYTES === 500 * 1024 * 1024, "500MB constant");
}

console.log("═══ LRU/LFU eviction score ═══");
{
  const now = 1_000_000;
  const cold = evictionScore({
    lastAccessedAt: now - 10 * 24 * 60 * 60 * 1000,
    accessCount: 0,
    sizeBytes: 10_000_000,
    now,
  });
  const hot = evictionScore({
    lastAccessedAt: now - 60_000,
    accessCount: 20,
    sizeBytes: 10_000_000,
    now,
  });
  check(cold > hot, "cold unused scores higher (evict first)");
  const rare = evictionScore({
    lastAccessedAt: now - 60_000,
    accessCount: 0,
    sizeBytes: 1_000,
    now,
  });
  const frequent = evictionScore({
    lastAccessedAt: now - 60_000,
    accessCount: 50,
    sizeBytes: 1_000,
    now,
  });
  check(rare > frequent, "LFU: lower access_count evicts first when age equal");
}

console.log("═══ Prefetch / indexing suspend flags ═══");
{
  __resetLifecycleFlagsForTests();
  check(isQuranPrefetchSuspended() === false, "prefetch starts unsuspended");
  setQuranPrefetchSuspended(true);
  check(isQuranPrefetchSuspended() === true, "prefetch suspends");
  setQuranIndexingSuspended(true);
  check(isQuranIndexingSuspended() === true, "indexing suspends");
  setQuranPrefetchSuspended(false);
  setQuranIndexingSuspended(false);
  check(
    !isQuranPrefetchSuspended() && !isQuranIndexingSuspended(),
    "flags resume",
  );
}

console.log("═══ Ephemeral purge (no canvases) ═══");
{
  const r = purgeEphemeralMediaResources();
  check(typeof r.canvases === "number", "purge returns canvas count");
  check(r.audioDisposers === 0, "no audio disposers by default");
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
