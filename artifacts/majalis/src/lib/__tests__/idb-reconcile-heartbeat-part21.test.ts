/**
 * Part 21 — IDB cursor streaming, storage reconciler, adaptive heartbeat,
 * canvas/WebGL cleanup, CLS layout reserve.
 * Run: npx tsx src/lib/__tests__/idb-reconcile-heartbeat-part21.test.ts
 */

import {
  clampCursorBatchSize,
  filterInChunks,
  IDB_CURSOR_DEFAULT_BATCH,
  streamPagedQuery,
} from "../idb-cursor-stream";
import {
  detectDrift,
  extractPayloadVersion,
  getMemoryStorageCache,
  resetStorageReconcilerForTests,
  setMemoryStorageCache,
  type StorageSnapshot,
} from "../storage-reconciler";
import {
  computeHeartbeatInterval,
  computeJitteredDelay,
  createAdaptiveHeartbeat,
} from "../adaptive-heartbeat";
import { releaseCanvasResources } from "../canvas-gl-cleanup";
import {
  clsBeginLoad,
  clsCommit,
  clsDisplayValue,
  clsFail,
  clsShouldMountContent,
  createClsReserveSlot,
  holdPreviousWhileLoading,
  reserveAspect,
} from "../cls-layout-reserve";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

async function main() {
  console.log("\n=== 1. IDB cursor batch streaming ===");
  {
    assert(IDB_CURSOR_DEFAULT_BATCH === 50, "default batch 50");
    assert(clampCursorBatchSize(0) === 1, "batch min 1");
    assert(clampCursorBatchSize(9999) === 500, "batch max 500");

    const pages: number[][] = [];
    const data = Array.from({ length: 120 }, (_, i) => i);
    const total = await streamPagedQuery(
      async (offset, limit) => data.slice(offset, offset + limit),
      async (batch) => {
        pages.push([...batch]);
      },
      { batchSize: 50 },
    );
    assert(total === 120, "streamed 120 items");
    assert(pages.length === 3, "3 batches of 50");
    assert(pages[0]!.length === 50 && pages[2]!.length === 20, "last batch remainder");

    const filtered = await filterInChunks(
      data,
      (n) => n % 10 === 0,
      { batchSize: 50 },
    );
    assert(filtered.length === 12, "chunked filter count");
  }

  console.log("\n=== 2. Storage drift reconciler ===");
  {
    resetStorageReconcilerForTests();
    setMemoryStorageCache("k1", [{ id: "a", updatedAt: "2026-01-01T00:00:00.000Z" }], Date.parse("2026-01-01T00:00:00.000Z"));
    assert(!!getMemoryStorageCache("k1"), "memory cache set");

    const older = JSON.stringify([{ id: "a", updatedAt: "2026-01-01T00:00:00.000Z" }]);
    const newer = JSON.stringify([{ id: "a", updatedAt: "2026-06-01T00:00:00.000Z" }]);
    assert(extractPayloadVersion(newer) > extractPayloadVersion(older), "version from updatedAt");

    const layers: StorageSnapshot[] = [
      { layer: "local", version: extractPayloadVersion(older), payload: older },
      { layer: "idb", version: extractPayloadVersion(newer), payload: newer },
      { layer: "session", version: extractPayloadVersion(older), payload: older },
    ];
    const finding = detectDrift("k1", layers, "idb");
    assert(finding.drifted === true, "drift detected");
    assert(finding.authoritative === "idb", "IDB wins LWW");
    assert(finding.resolvedPayload === newer, "resolved to newer payload");

    const same = detectDrift("k2", [
      { layer: "local", version: 1, payload: older },
      { layer: "session", version: 1, payload: older },
    ]);
    assert(same.drifted === false, "identical payloads no drift");
  }

  console.log("\n=== 3. Adaptive heartbeat + jitter ===");
  {
    const healthy = computeHeartbeatInterval({
      network: { online: true, effectiveType: "4g" },
      battery: { level: 0.9, charging: true },
      hidden: false,
    });
    assert(healthy.intervalMs === 30 * 60 * 1000, "healthy base 30m");
    assert(healthy.reasons.includes("healthy"), "healthy reason");

    const lowBat = computeHeartbeatInterval({
      network: { online: true },
      battery: { level: 0.05, charging: false },
      hidden: false,
    });
    assert(lowBat.intervalMs > healthy.intervalMs, "low battery stretches interval");

    const slow = computeHeartbeatInterval({
      network: { online: true, effectiveType: "2g", saveData: true },
      battery: { level: null, charging: null },
      hidden: true,
    });
    assert(slow.intervalMs >= healthy.intervalMs, "2g+hidden stretches");

    const delays = new Set<number>();
    for (let i = 0; i < 20; i++) {
      delays.add(
        computeJitteredDelay(1000, 3, {
          minMs: 100,
          maxMs: 60_000,
          random: () => i / 20,
        }),
      );
    }
    assert(delays.size > 5, "jitter produces varied delays");

    let ticks = 0;
    const hb = createAdaptiveHeartbeat({
      baseIntervalMs: 50,
      minIntervalMs: 10,
      maxIntervalMs: 200,
      random: () => 0.5,
      getNetwork: () => ({ online: true }),
      getBattery: () => ({ level: 1, charging: true }),
      getHidden: () => false,
      onTick: () => {
        ticks += 1;
        return true;
      },
    });
    hb.start();
    assert(hb.isRunning() === true, "heartbeat running");
    hb.notifyReconnect();
    const policy = hb.getPolicy();
    assert(policy.backoffStep >= 2, "reconnect raises backoff");
    hb.stop();
    assert(hb.isRunning() === false, "heartbeat stopped");
    // Allow any pending timer to settle without asserting tick count (race-free)
    void ticks;
  }

  console.log("\n=== 4. Canvas / WebGL cleanup ===");
  {
    // jsdom / node may lack canvas — simulate minimal element
    const fake = {
      width: 100,
      height: 80,
      getContext: () => null,
    } as unknown as HTMLCanvasElement;
    const result = releaseCanvasResources(fake);
    assert(result.cleared === true, "zeroed dimensions");
    assert(fake.width === 0 && fake.height === 0, "width/height = 0");
    const nullResult = releaseCanvasResources(null);
    assert(nullResult.cleared === false, "null canvas safe");
  }

  console.log("\n=== 5. CLS layout reserve ===");
  {
    let slot = createClsReserveSlot<string>(null);
    slot = clsBeginLoad(slot);
    assert(clsDisplayValue(slot) === null, "no committed yet");
    assert(clsShouldMountContent(slot, "defer-mount") === false, "defer until ready");

    slot = clsCommit(slot, "تفسير سابق", slot.generation);
    assert(clsDisplayValue(slot) === "تفسير سابق", "committed visible");

    slot = clsBeginLoad(slot);
    assert(clsDisplayValue(slot) === "تفسير سابق", "hold previous while loading");
    assert(clsShouldMountContent(slot, "hold") === true, "hold strategy mounts");

    const staleGen = slot.generation - 1;
    slot = clsCommit(slot, "stale", staleGen);
    assert(clsDisplayValue(slot) === "تفسير سابق", "stale generation ignored");

    slot = clsCommit(slot, "تفسير جديد", slot.generation);
    assert(clsDisplayValue(slot) === "تفسير جديد", "new commit");

    slot = clsBeginLoad(slot);
    slot = clsFail(slot, slot.generation);
    assert(clsDisplayValue(slot) === "تفسير جديد", "error keeps committed");

    assert(holdPreviousWhileLoading("a", null, true) === "a", "hold on load");
    assert(holdPreviousWhileLoading("a", null, false) === null, "clear when idle");
    assert(reserveAspect(16, 9).ratio === 16 / 9, "aspect meta");
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Part 21: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
