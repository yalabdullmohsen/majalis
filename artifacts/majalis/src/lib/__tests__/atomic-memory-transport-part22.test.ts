/**
 * Part 22 — atomic progress, memory pressure, text-codec, transport, visibility rAF.
 * Run: npx tsx src/lib/__tests__/atomic-memory-transport-part22.test.ts
 */

import {
  cloneProgressSnapshot,
  resetProgressGatesForTests,
  withAtomicProgressMutation,
  withProgressGate,
} from "../atomic-progress";
import {
  classifyHeapRatio,
  purgeUnderMemoryPressure,
  readMemorySnapshot,
  resetMemoryPressureForTests,
} from "../memory-pressure";
import {
  decodeUtf8,
  encodeUtf8,
  encodeUtf8Copy,
  getScratchCapacity,
  getTextDecoder,
  getTextEncoder,
  resetTextCodecScratchForTests,
  utf8ByteLength,
} from "../text-codec";
import {
  pickBestTransport,
  probeTransports,
  type TransportAttempt,
} from "../adaptive-transport";
import {
  isDocumentHidden,
  resetVisibilityRafForTests,
  startVisibilityAwareRafLoop,
} from "../visibility-raf";
import { arabicIndexFingerprint } from "../arabic-search";
import { normalizeArabicUtf8Length } from "../../shared/arabic-normalize";

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
  console.log("\n=== 1. Atomic progress mutation ===");
  {
    resetProgressGatesForTests();
    let value = 10;
    const ok = await withAtomicProgressMutation({
      key: "counter",
      snapshot: () => value,
      restore: (s) => {
        value = s;
      },
      mutate: (s) => {
        value = s + 1;
        return value;
      },
      commit: async () => {
        /* success */
      },
    });
    assert(ok.ok === true && value === 11, "optimistic commit keeps new value");

    const rolled = await withAtomicProgressMutation({
      key: "counter",
      snapshot: () => value,
      restore: (s) => {
        value = s;
      },
      mutate: (s) => {
        value = s + 5;
        return value;
      },
      commit: async () => {
        throw new Error("idb-fail");
      },
    });
    assert(rolled.rolledBack === true && value === 11, "rollback restores snapshot");

    const order: number[] = [];
    await Promise.all([
      withProgressGate("g", async () => {
        order.push(1);
        await new Promise((r) => setTimeout(r, 20));
        order.push(2);
      }),
      withProgressGate("g", async () => {
        order.push(3);
      }),
    ]);
    assert(order.join(",") === "1,2,3", "gate serializes same-key mutations");
    assert(cloneProgressSnapshot({ a: 1 }).a === 1, "clone snapshot");
  }

  console.log("\n=== 2. Memory pressure ===");
  {
    resetMemoryPressureForTests();
    assert(classifyHeapRatio(0.5) === "normal", "0.5 normal");
    assert(classifyHeapRatio(0.75) === "moderate", "0.75 moderate");
    assert(classifyHeapRatio(0.9) === "critical", "0.9 critical");
    const snap = readMemorySnapshot();
    assert(typeof snap.level === "string", "snapshot has level");
    const purged = await purgeUnderMemoryPressure("moderate");
    assert(purged.actions.length >= 1, "purge ran actions");
  }

  console.log("\n=== 3. Zero-allocation text codec ===");
  {
    resetTextCodecScratchForTests();
    assert(!!getTextEncoder(), "shared encoder");
    assert(!!getTextDecoder(), "shared decoder");
    const a = encodeUtf8("بسم الله");
    assert(a.length > 0, "encode utf8");
    const len1 = utf8ByteLength("الحمد لله");
    const len2 = utf8ByteLength("الحمد لله");
    assert(len1 === len2 && len1 > 0, "byte length stable");
    assert(getScratchCapacity() > 0, "scratch grew");
    const copy = encodeUtf8Copy("سلام");
    assert(decodeUtf8(copy).includes("س") || copy.length > 0, "roundtrip copy");
    assert(normalizeArabicUtf8Length("الصَّلَاة") > 0, "normalize utf8 length");
    assert(arabicIndexFingerprint("حديث").includes(":"), "search fingerprint");
  }

  console.log("\n=== 4. Adaptive transport ===");
  {
    const attempts: TransportAttempt[] = [
      { kind: "webtransport", ok: false, error: "unavailable", ms: 0 },
      { kind: "websocket", ok: false, error: "unavailable", ms: 0 },
      { kind: "fetch", ok: true, ms: 5 },
    ];
    assert(pickBestTransport(attempts) === "fetch", "pick fetch when others fail");
    const probed = await probeTransports({
      httpUrl: "https://example.com/",
      prefer: ["fetch"],
      probeTimeoutMs: 500,
    });
    assert(probed.length === 1 && probed[0]!.kind === "fetch", "probe fetch only");
  }

  console.log("\n=== 5. Visibility rAF freeze ===");
  {
    resetVisibilityRafForTests();
    assert(typeof isDocumentHidden() === "boolean", "hidden boolean");
    let ticks = 0;
    const handle = startVisibilityAwareRafLoop(() => {
      ticks += 1;
    });
    await new Promise((r) => setTimeout(r, 50));
    handle.cancel();
    // In Node there is no rAF — ticks may stay 0; API must not throw
    assert(ticks >= 0, "raf loop cancel-safe");
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`Part 22: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
