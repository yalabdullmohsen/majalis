/**
 * Part 12 — Audio rAF sync, worker supervisor, permissions, streams, media GC.
 * Run: npx tsx src/lib/__tests__/audio-sync-workers-part12.test.ts
 */

import { attachAudioRafClock } from "../audio-raf-clock";
import { SupervisedWorker, createCountingWorkerFactory } from "../worker-supervisor";
import { probeFeature, tryAutoplay } from "../feature-permission-shield";
import {
  extractCompletedJsonObjects,
  readResponseTextStreaming,
} from "../stream-json";
import {
  createTrackedObjectUrl,
  getTrackedObjectUrlCount,
  releaseMediaElement,
  resetMediaGcForTests,
  revokeObjectUrl,
  trackAudioContext,
  closeAudioContext,
} from "../media-gc";
import { monoNow, wallNowMs } from "../monotonic-time";

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

if (typeof (globalThis as { HTMLMediaElement?: unknown }).HTMLMediaElement === "undefined") {
  (globalThis as { HTMLMediaElement: { HAVE_FUTURE_DATA: number; HAVE_CURRENT_DATA: number } }).HTMLMediaElement = {
    HAVE_CURRENT_DATA: 2,
    HAVE_FUTURE_DATA: 3,
  };
}

class FakeAudio {
  currentTime = 1.0;
  duration = 10;
  paused = false;
  ended = false;
  readyState = 4;
  playbackRate = 1;
  src = "https://example.com/a.mp3";
  currentSrc = "https://example.com/a.mp3";
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
    this.currentSrc = "";
  }
  load() {}
  pause() {
    this.paused = true;
  }
  play() {
    this.paused = false;
    return Promise.resolve();
  }
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("\n=== 1. Monotonic time ===");
  {
    const a = monoNow();
    const b = wallNowMs();
    assert(Number.isFinite(a) && a >= 0, "monoNow finite");
    assert(Number.isFinite(b) && b > 1_700_000_000_000, "wallNowMs looks like epoch ms");
  }

  console.log("\n=== 2. rAF audio clock interpolation ===");
  {
    const audio = new FakeAudio() as unknown as HTMLAudioElement;
    const samples: number[] = [];
    // Polyfill rAF with setTimeout for Node
    const origRaf = globalThis.requestAnimationFrame;
    const origCancel = globalThis.cancelAnimationFrame;
    (globalThis as { requestAnimationFrame: typeof requestAnimationFrame }).requestAnimationFrame = (cb) =>
      setTimeout(() => cb(monoNow()), 8) as unknown as number;
    (globalThis as { cancelAnimationFrame: typeof cancelAnimationFrame }).cancelAnimationFrame = (id) =>
      clearTimeout(id as unknown as ReturnType<typeof setTimeout>);

    const clock = attachAudioRafClock(audio, {
      minEmitMs: 5,
      onSample: (s) => samples.push(s.mediaTime),
    });
    audio.currentTime = 1.0;
    (audio as unknown as FakeAudio).dispatch("play");
    await sleep(40);
    const s = clock.getSample();
    assert(s.mediaTime >= 1.0, "interpolated mediaTime >= raw anchor");
    assert(s.playing === true, "playing while not paused");
    assert(samples.length >= 1, "onSample emitted");
    clock.stop();
    if (origRaf) globalThis.requestAnimationFrame = origRaf;
    else delete (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame;
    if (origCancel) globalThis.cancelAnimationFrame = origCancel;
    else delete (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame;
  }

  console.log("\n=== 3. Worker supervisor auto-restart ===");
  {
    const factory = createCountingWorkerFactory(
      (msg) => {
        if (msg.type === "echo") return msg.payload;
        throw new Error("bad");
      },
      { failFirstN: 1 },
    );
    const sw = new SupervisedWorker(factory, { name: "test", restartDelayMs: 10, maxRestarts: 3 });
    const result = await sw.request<string>("echo", "hello", 2_000);
    assert(result === "hello", "request succeeds after crash+restart");
    assert(sw.restartCount >= 1, "restartCount incremented");
    sw.terminate();
  }

  console.log("\n=== 4. Feature permission shield ===");
  {
    const mic = await probeFeature("microphone");
    assert(mic.key === "microphone", "probe returns key");
    assert(["ok", "unsupported", "denied", "blocked", "unavailable"].includes(mic.fallback), "fallback code");
    const auto = await probeFeature("autoplay");
    assert(auto.canUse === true, "autoplay soft-available");

    const el = new FakeAudio() as unknown as HTMLMediaElement;
    const ok = await tryAutoplay(el);
    assert(ok === true, "tryAutoplay resolves true on FakeAudio");
  }

  console.log("\n=== 5. Stream JSON progressive extract ===");
  {
    const partial = '{"code":200,"data":{"ayahs":[{"numberInSurah":1,"text":"a"},{"numberInSurah":2,"text":"b"';
    const { items } = extractCompletedJsonObjects(partial);
    assert(items.length === 1, "one complete object from partial buffer");
    const more = '{"code":200,"data":{"ayahs":[{"numberInSurah":1,"text":"a"},{"numberInSurah":2,"text":"b"}]}}';
    const full = extractCompletedJsonObjects(more);
    assert(full.items.length === 2, "two objects when both complete");

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"ayahs":['));
        controller.enqueue(new TextEncoder().encode('{"numberInSurah":1,"text":"x"}'));
        controller.enqueue(new TextEncoder().encode("]}"));
        controller.close();
      },
    });
    const res = new Response(stream);
    let saw = false;
    const text = await readResponseTextStreaming(res, () => {
      saw = true;
    });
    assert(saw && text.includes("ayahs"), "streaming text reader works");
  }

  console.log("\n=== 6. Media GC — Object URLs + AudioContext ===");
  {
    resetMediaGcForTests();
    const blob = new Blob(["abc"], { type: "audio/mpeg" });
    // Node may lack URL.createObjectURL — polyfill lightly
    if (typeof URL.createObjectURL !== "function") {
      (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = () =>
        `blob:nodedummy-${Math.random()}`;
      (URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = () => {};
    }
    const url = createTrackedObjectUrl(blob);
    assert(url.startsWith("blob:"), "tracked url is blob");
    assert(getTrackedObjectUrlCount() === 1, "one tracked url");
    revokeObjectUrl(url);
    assert(getTrackedObjectUrlCount() === 0, "revoked clears track");

    const audio = new FakeAudio() as unknown as HTMLAudioElement;
    (audio as unknown as FakeAudio).src = url;
    (audio as unknown as FakeAudio).currentSrc = url;
    // re-track for release test
    const url2 = createTrackedObjectUrl(blob);
    (audio as unknown as FakeAudio).src = url2;
    (audio as unknown as FakeAudio).currentSrc = url2;
    releaseMediaElement(audio);
    assert(!(audio as unknown as FakeAudio).src || (audio as unknown as FakeAudio).src === "", "src cleared");

    // AudioContext may be missing in Node
    if (typeof AudioContext !== "undefined") {
      const ctx = trackAudioContext(new AudioContext());
      await closeAudioContext(ctx);
      assert(ctx.state === "closed", "AudioContext closed");
    } else {
      assert(true, "AudioContext unavailable in Node — skipped close test");
    }
    resetMediaGcForTests();
  }

  console.log(`\n=== Part 12 results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
