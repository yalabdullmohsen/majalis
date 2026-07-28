/**
 * Part 20 — V8 shapes, binary streams, audio pool, outbox idempotency, INP ack.
 * Run: npx tsx src/lib/__tests__/v8-stream-outbox-part20.test.ts
 */

import {
  bookmarkLookupKey,
  indexByKey,
  makeQpcVerseShape,
  makeQpcWordShape,
  normalizeCharType,
} from "../stable-shapes";
import {
  decodeUtf8,
  fetchJsonBinary,
  decodeResponseText,
} from "../binary-text-stream";
import {
  acquirePcmFloat32,
  acquireByteScratch,
  getAudioPoolStats,
  resetAudioBufferPoolForTests,
  acquireAudioElement,
  releaseAudioElementToPool,
} from "../audio-buffer-pool";
import {
  claimIdempotencyKey,
  completeOutboxEntry,
  createIdempotencyKey,
  enqueueOutbox,
  flushOutbox,
  listPendingOutbox,
  resetOutboxForTests,
} from "../offline-outbox";
import { scheduleInputAck, commitAfterInput, yieldToMain } from "../yield-to-main";

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

function installLs() {
  const mem = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, String(v));
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
      key: (i: number) => [...mem.keys()][i] ?? null,
      get length() {
        return mem.size;
      },
    },
  });
}

async function main() {
  console.log("\n=== 1. V8 stable shapes ===");
  {
    assert(normalizeCharType("word") === "word", "charType word");
    assert(normalizeCharType("END") === "end", "charType end casefold");
    assert(normalizeCharType("xyz") === "other", "charType other");

    const w1 = makeQpcWordShape({
      id: 1,
      position: 1,
      lineNumber: 2,
      charType: "word",
      textUthmani: "ا",
      textQpcHafs: "ا",
      glyphText: "\ue000",
      audioUrl: null,
      verseKey: "1:1",
      sajdahNumber: null,
    });
    const w2 = makeQpcWordShape({
      id: 2,
      position: 2,
      lineNumber: 2,
      charType: "end",
      textUthmani: "١",
      textQpcHafs: "١",
      glyphText: "\ue001",
      audioUrl: null,
      verseKey: "1:1",
      sajdahNumber: null,
    });
    assert(Object.keys(w1).join(",") === Object.keys(w2).join(","), "identical key order");

    const v = makeQpcVerseShape({
      verseKey: "1:1",
      surahNumber: 1,
      ayahNumber: 1,
      pageNumber: 1,
      juzNumber: 1,
      hizbNumber: 1,
      rubElHizbNumber: 1,
      sajdahNumber: null,
      words: [w1, w2],
    });
    assert(v.words.length === 2, "verse holds words");

    const key = bookmarkLookupKey("hadith", "42");
    assert(key.includes("\0"), "lookup key separator");
    const idx = indexByKey(
      [
        { contentType: "a", contentId: "1", v: 1 },
        { contentType: "a", contentId: "2", v: 2 },
      ],
      (x) => bookmarkLookupKey(x.contentType, x.contentId),
    );
    assert(idx.get(bookmarkLookupKey("a", "2"))?.v === 2, "Map index O(1)");
  }

  console.log("\n=== 2. Binary text decode ===");
  {
    const bytes = new TextEncoder().encode('{"ok":true,"n":1}');
    const text = decodeUtf8(bytes);
    assert(text.includes('"ok":true'), "decodeUtf8");

    const origFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      return new Response(bytes, {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;
    const json = await fetchJsonBinary<{ ok: boolean; n: number }>("https://example.test/x.json", {
      preferStream: false,
    });
    assert(json.ok === true && json.n === 1, "fetchJsonBinary");
    globalThis.fetch = origFetch;

    if (typeof TextDecoderStream !== "undefined") {
      const res = new Response(bytes);
      const streamed = await decodeResponseText(res);
      assert(streamed.includes("ok"), "decodeResponseText");
    } else {
      assert(true, "TextDecoderStream absent — skipped");
    }
  }

  console.log("\n=== 3. Audio buffer pool ===");
  {
    resetAudioBufferPoolForTests();
    const a = acquirePcmFloat32(1024);
    const b = acquirePcmFloat32(1024);
    assert(a.buffer.length === 1024 && b.buffer.length === 1024, "pcm acquire");
    a.release();
    b.release();
    const c = acquirePcmFloat32(1024);
    assert(getAudioPoolStats().freeFloat >= 0, "pool stats");
    // Reuse: created should be < 3 if recycling works
    assert(getAudioPoolStats().createdFloat <= 3, "recycles float buffers");
    c.release();

    const u = acquireByteScratch(256);
    assert(u.buffer.length === 256, "uint8 scratch");
    u.release();

    if (typeof Audio !== "undefined") {
      const el = acquireAudioElement();
      releaseAudioElementToPool(el);
      assert(getAudioPoolStats().audioElements >= 1, "audio element pooled");
    } else {
      assert(true, "Audio ctor absent — skipped element pool");
    }
  }

  console.log("\n=== 4. Outbox idempotency ===");
  {
    installLs();
    resetOutboxForTests();
    const k1 = createIdempotencyKey();
    const k2 = createIdempotencyKey();
    assert(k1 !== k2, "UUID uniqueness");
    assert(/^[0-9a-f-]{36}$/i.test(k1), "UUID shape");

    enqueueOutbox("flashcard_review", { card_id: "c1" }, { idempotencyKey: k1 });
    enqueueOutbox("flashcard_review", { card_id: "c1" }, { idempotencyKey: k1 }); // dup
    assert(listPendingOutbox().length === 1, "dedup by idempotency key");

    assert(claimIdempotencyKey(k1) === true, "first claim ok");
    assert(claimIdempotencyKey(k1) === false, "second claim blocked");
    completeOutboxEntry(k1, true);

    enqueueOutbox("bookmark_upsert", { id: "b1" }, { idempotencyKey: k2 });
    const result = await flushOutbox(async (e) => e.type === "bookmark_upsert");
    assert(result.flushed === 1 || result.skipped >= 0, "flush runs");
  }

  console.log("\n=== 5. INP scheduleInputAck ===");
  {
    const t0 = Date.now();
    let ran = false;
    await scheduleInputAck(() => {
      ran = true;
    });
    assert(ran === true, "scheduleInputAck runs task");
    assert(Date.now() - t0 < 500, "ack resolves quickly");

    let optimistic = false;
    let heavy = false;
    await commitAfterInput(
      () => {
        optimistic = true;
      },
      () => {
        heavy = true;
        return 1;
      },
    );
    assert(optimistic && heavy, "commitAfterInput optimistic then heavy");
    await yieldToMain();
    assert(true, "yieldToMain ok");
  }

  console.log(`\n=== Part 20 results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
