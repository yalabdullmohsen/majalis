/**
 * Immersive reader helpers — khatma presets + word audio URL.
 * Run: npx tsx --test src/lib/__tests__/immersive-reader.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pagesPerDayForKhatmahDays, KHATMAH_PRESETS } from "../khatmah-presets";
import { resolveWordAudioUrl } from "../mushaf-v2-data";
import { normalizeArabic } from "../../shared/arabic-normalize";
import { normalizeArabicBatch } from "../normalize-arabic-batch";

describe("khatmah presets", () => {
  it("maps 30/60/90 days to whole pages/day covering 604", () => {
    assert.equal(pagesPerDayForKhatmahDays(30), 21); // ceil(604/30)=21
    assert.equal(pagesPerDayForKhatmahDays(60), 11);
    assert.equal(pagesPerDayForKhatmahDays(90), 7);
    assert.ok(KHATMAH_PRESETS.length >= 3);
  });
});

describe("word audio URL", () => {
  it("prefixes CDN for relative wbw paths", () => {
    assert.equal(
      resolveWordAudioUrl("wbw/002_004_001.mp3"),
      "https://audio.qurancdn.com/wbw/002_004_001.mp3",
    );
    assert.equal(resolveWordAudioUrl("https://cdn.example/a.mp3"), "https://cdn.example/a.mp3");
    assert.equal(resolveWordAudioUrl(null), null);
  });
});

describe("normalize batch fallback", () => {
  it("matches main-thread normalize for small batches", async () => {
    const samples = ["بِسْمِ ٱللَّهِ", "الحمد لله", "يُوسُف"];
    const viaBatch = await normalizeArabicBatch(samples);
    assert.deepEqual(
      viaBatch,
      samples.map((s) => normalizeArabic(s)),
    );
  });
});
