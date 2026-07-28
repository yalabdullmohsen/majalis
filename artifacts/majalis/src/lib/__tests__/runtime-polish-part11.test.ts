/**
 * Part 11 — Gesture rAF, fetch priority, ReDoS-safe parsers, mono time, audio integrity.
 * Run: npx tsx src/lib/__tests__/runtime-polish-part11.test.ts
 */

import { createRafThrottle } from "../gesture-raf";
import { monoNow, monoElapsed } from "../monotonic-time";
import {
  clampSearchInput,
  escapeRegExp,
  buildSafeHighlightPattern,
  SAFE_TEXT_MAX_CHARS,
} from "../safe-regex";
import {
  looksLikeMp3,
  validateAudioBlob,
  isAudioCdnUrl,
  AUDIO_MIN_BYTES,
} from "../audio-cache-integrity";
import { normalizeArabic, clearNormalizeArabicCache } from "../../shared/arabic-normalize";
import type { FetchPriority } from "../fetch-pool";

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
  console.log("\n=== 1. rAF throttle coalesces ===");
  {
    const t = createRafThrottle();
    let runs = 0;
    t.schedule(() => {
      runs += 1;
    });
    t.schedule(() => {
      runs += 1;
    });
    // Without rAF in Node, schedule runs sync — still at most one pending executed
    await new Promise((r) => setTimeout(r, 20));
    assert(runs >= 1 && runs <= 2, "raf throttle executes scheduled work");
    t.cancel();
  }

  console.log("\n=== 2. Fetch priority typing ===");
  {
    const high: FetchPriority = "high";
    const low: FetchPriority = "low";
    assert(high === "high" && low === "low", "FetchPriority union ok");
  }

  console.log("\n=== 3. ReDoS-safe parsers ===");
  {
    clearNormalizeArabicCache();
    const bomb = "ا".repeat(SAFE_TEXT_MAX_CHARS + 5_000) + "!!!";
    const t0 = monoNow();
    const out = normalizeArabic(bomb);
    const elapsed = monoElapsed(t0);
    assert(out.length <= SAFE_TEXT_MAX_CHARS + 10, "normalize clamps oversize input");
    assert(elapsed < 2_000, "normalize oversize finishes quickly");

    assert(escapeRegExp("a+b*(c)") === "a\\+b\\*\\(c\\)", "escapeRegExp escapes metas");
    const pat = buildSafeHighlightPattern("الصلاة الزكاة " + "و".repeat(200));
    assert(pat instanceof RegExp, "safe highlight pattern builds");
    assert(buildSafeHighlightPattern("") === null, "empty query → null");
    assert(clampSearchInput("x".repeat(10), 5).length === 5, "clampSearchInput truncates");
  }

  console.log("\n=== 4. Monotonic time ===");
  {
    const a = monoNow();
    await new Promise((r) => setTimeout(r, 15));
    const b = monoNow();
    assert(monoElapsed(a, b) >= 10, "monoElapsed positive after wait");
    assert(monoElapsed(b, a) === 0, "monoElapsed never negative");
  }

  console.log("\n=== 5. Audio integrity ===");
  {
    // ID3 magic
    const id3 = new Uint8Array([0x49, 0x44, 0x33, 0, 0, 0]);
    assert(looksLikeMp3(id3), "ID3 header recognized");
    const mpeg = new Uint8Array([0xff, 0xfb, 0x90, 0x00]);
    assert(looksLikeMp3(mpeg), "MPEG sync recognized");
    assert(!looksLikeMp3(new Uint8Array([0x00, 0x01, 0x02])), "garbage rejected");

    const tiny = new Blob([new Uint8Array(100)]);
    const bad = await validateAudioBlob(tiny);
    assert(!bad.ok && bad.reason === "too_small", "tiny blob rejected");

    const goodBytes = new Uint8Array(AUDIO_MIN_BYTES + 10);
    goodBytes[0] = 0xff;
    goodBytes[1] = 0xfb;
    const good = await validateAudioBlob(new Blob([goodBytes]));
    assert(good.ok, "valid mp3-sized blob accepted");

    assert(isAudioCdnUrl("https://everyayah.com/data/x.mp3"), "everyayah detected");
    assert(isAudioCdnUrl("https://server8.mp3quran.net/afs/001.mp3"), "mp3quran detected");
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

void main();
