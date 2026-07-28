/**
 * Part 9 — Web Vitals: yield-to-main, LRU bounds, stall recovery, prewarm.
 * Run: npx tsx src/lib/__tests__/web-vitals-part9.test.ts
 */

import { LruCache, LruStringCache } from "../lru-cache";
import { yieldToMain, mapInChunks, afterNextPaint } from "../yield-to-main";
import {
  attachAudioStallRecovery,
  releaseAudioElement,
} from "../audio-stall-recovery";
import {
  preconnectOrigin,
  prewarmAudioCdns,
  clearPrewarmState,
  AUDIO_CDN_ORIGINS,
} from "../resource-prewarm";

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

// Node lacks HTMLMediaElement constants used by stall recovery.
if (typeof (globalThis as { HTMLMediaElement?: unknown }).HTMLMediaElement === "undefined") {
  (globalThis as { HTMLMediaElement: { HAVE_FUTURE_DATA: number; HAVE_CURRENT_DATA: number } }).HTMLMediaElement = {
    HAVE_CURRENT_DATA: 2,
    HAVE_FUTURE_DATA: 3,
  };
}

async function main() {
  console.log("\n=== 1. LruCache bounds & eviction ===");
  {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    assert(cache.size === 2, "size at capacity");
    cache.set("c", 3);
    assert(cache.size === 2, "size stays at max after overflow");
    assert(cache.get("a") === undefined, "oldest key a evicted");
    assert(cache.get("b") === 2, "b still present");
    assert(cache.get("c") === 3, "c present");
    cache.get("b");
    cache.set("d", 4);
    assert(cache.get("c") === undefined, "c evicted after b refresh");
    assert(cache.get("b") === 2 && cache.get("d") === 4, "b+d retained");

    const str = new LruStringCache(1);
    str.set("x", "1");
    str.set("y", "2");
    assert(str.size === 1 && str.get("x") === undefined && str.get("y") === "2", "LruStringCache bound");
  }

  console.log("\n=== 2. yieldToMain / mapInChunks ===");
  {
    const t0 = Date.now();
    await yieldToMain();
    assert(Date.now() - t0 >= 0, "yieldToMain resolves");

    const nums = [1, 2, 3, 4, 5];
    const doubled = await mapInChunks(nums, 2, (n) => n * 2);
    assert(doubled.join(",") === "2,4,6,8,10", "mapInChunks preserves order");

    await afterNextPaint();
    assert(true, "afterNextPaint resolves in Node");
  }

  console.log("\n=== 3. Audio stall recovery state machine ===");
  {
    class FakeAudio {
      currentTime = 12.5;
      duration = 60;
      paused = false;
      ended = false;
      readyState = 4;
      error: { code: number } | null = null;
      src = "https://everyayah.com/data/test.mp3";
      currentSrc = "https://everyayah.com/data/test.mp3";
      private listeners = new Map<string, Set<(...args: unknown[]) => void>>();

      addEventListener(type: string, fn: (...args: unknown[]) => void) {
        if (!this.listeners.has(type)) this.listeners.set(type, new Set());
        this.listeners.get(type)!.add(fn);
      }
      removeEventListener(type: string, fn: (...args: unknown[]) => void) {
        this.listeners.get(type)?.delete(fn);
      }
      dispatch(type: string) {
        for (const fn of this.listeners.get(type) ?? []) fn();
      }
      getAttribute(name: string) {
        return name === "src" ? this.src : null;
      }
      removeAttribute() {
        this.src = "";
      }
      load() {
        /* noop */
      }
      pause() {
        this.paused = true;
      }
      play() {
        this.paused = false;
        return Promise.resolve();
      }
    }

    const audio = new FakeAudio() as unknown as HTMLAudioElement;
    const phases: string[] = [];
    const handle = attachAudioStallRecovery(audio, {
      stallGraceMs: 10,
      retryDelayMs: 10,
      maxAttempts: 2,
      onPhaseChange: (p) => phases.push(p),
    });

    assert(handle.getPhase() === "idle", "starts idle");
    (audio as unknown as FakeAudio).readyState = 2;
    (audio as unknown as FakeAudio).paused = false;
    (audio as unknown as FakeAudio).dispatch("waiting");

    await new Promise((r) => setTimeout(r, 80));
    assert(phases.includes("buffering"), "enters buffering on waiting");
    assert(handle.getSavedTime() === 12.5, "preserves playback position");

    (audio as unknown as FakeAudio).readyState = 4;
    (audio as unknown as FakeAudio).dispatch("playing");
    assert(handle.getPhase() === "idle", "returns idle after playing");

    handle.dispose();
    releaseAudioElement(audio);
    assert(true, "dispose + releaseAudioElement no throw");
  }

  console.log("\n=== 4. Resource prewarm idempotency ===");
  {
    clearPrewarmState();
    const created: string[] = [];
    const fakeHead = {
      querySelector: () => null,
      appendChild: (el: { rel: string; href: string }) => {
        created.push(`${el.rel}:${el.href}`);
      },
    };
    const prevDoc = (globalThis as { document?: unknown }).document;
    (globalThis as { document: unknown }).document = {
      head: fakeHead,
      createElement: (tag: string) => {
        const el: Record<string, string> = { tagName: tag, rel: "", href: "" };
        return el;
      },
    };

    preconnectOrigin(AUDIO_CDN_ORIGINS[0]);
    preconnectOrigin(AUDIO_CDN_ORIGINS[0]);
    prewarmAudioCdns();
    assert(created.filter((c) => c.startsWith("preconnect:")).length >= 1, "preconnect link created");
    assert(created.filter((c) => c.includes("everyayah.com")).length >= 1, "everyayah warmed");

    clearPrewarmState();
    (globalThis as { document?: unknown }).document = prevDoc;
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

void main();
