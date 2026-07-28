/**
 * Unit — QuranEngineContext state transitions + reading progress persistence.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getQuranEngineContext,
  ACTIVE_READING_KHATMAH_ID,
} from "@/core/quran";
import { resetQuranEngineState } from "@/lib/quran-engine-store";

describe("QuranEngineContext — state transitions", () => {
  beforeEach(() => {
    resetQuranEngineState();
  });

  afterEach(() => {
    resetQuranEngineState();
  });

  it("setPage clamps and updates store", () => {
    const ctx = getQuranEngineContext();
    ctx.setPage(2);
    expect(ctx.getState().page).toBe(2);
    ctx.setPage(0);
    expect(ctx.getState().page).toBe(1);
    ctx.setPage(9999);
    expect(ctx.getState().page).toBe(604);
  });

  it("setActiveVerse updates surah/ayah/verseKey and optional page", () => {
    const ctx = getQuranEngineContext();
    ctx.setActiveVerse({ surah: 2, ayah: 255, page: 42 }, { persist: false });
    const s = ctx.getState();
    expect(s.surah).toBe(2);
    expect(s.ayah).toBe(255);
    expect(s.verseKey).toBe("2:255");
    expect(s.page).toBe(42);
  });

  it("clearActiveVerse clears ayah fields but keeps page", () => {
    const ctx = getQuranEngineContext();
    ctx.setPage(10);
    ctx.setActiveVerse({ surah: 1, ayah: 1, page: 1 }, { persist: false });
    ctx.clearActiveVerse();
    const s = ctx.getState();
    expect(s.ayah).toBeNull();
    expect(s.verseKey).toBeNull();
    expect(s.page).toBe(1);
  });

  it("notifies subscribers on patch", () => {
    const ctx = getQuranEngineContext();
    let count = 0;
    const unsub = ctx.subscribe(() => {
      count += 1;
    });
    ctx.setPage(5);
    ctx.setPage(6);
    unsub();
    ctx.setPage(7);
    expect(count).toBeGreaterThanOrEqual(2);
    expect(ctx.getState().page).toBe(7);
  });

  it("toggleTajweed flips isTajweedEnabled", () => {
    const ctx = getQuranEngineContext();
    expect(ctx.getState().isTajweedEnabled).toBe(false);
    ctx.toggleTajweed();
    expect(ctx.getState().isTajweedEnabled).toBe(true);
    ctx.setTajweedEnabled(false);
    expect(ctx.getState().isTajweedEnabled).toBe(false);
  });

  it("setAudio updates player snapshot fields", () => {
    const ctx = getQuranEngineContext();
    ctx.setAudio({ playerState: "playing", reciterId: "alafasy" });
    expect(ctx.getState().playerState).toBe("playing");
    expect(ctx.getState().reciterId).toBe("alafasy");
  });
});

describe("QuranEngineContext — reading progress persistence", () => {
  beforeEach(async () => {
    resetQuranEngineState();
    const ctx = getQuranEngineContext();
    // Keep the same DatabaseManager instance bound to the context singleton.
    await ctx.db.initialize();
    const raw = ctx.db.getDb();
    if (raw) {
      await Promise.all([
        raw.khatmah_store.clear(),
        raw.user_reflections_store.clear(),
        raw.settings_store.clear().catch(() => undefined),
      ]);
    }
  });

  afterEach(() => {
    resetQuranEngineState();
  });

  it("updateReadingProgress writes khatmah and aligns in-memory state", async () => {
    const ctx = getQuranEngineContext();
    await ctx.db.initialize();

    const row = await ctx.updateReadingProgress({
      surah: 36,
      ayah: 1,
      page: 440,
      title: "ختمة محرك",
      daily_wird_target: 3,
    });

    expect(row).toBeTruthy();
    expect(row?.id).toBe(ACTIVE_READING_KHATMAH_ID);
    expect(row?.current_surah).toBe(36);
    expect(row?.current_ayah).toBe(1);
    expect(row?.current_page).toBe(440);

    const state = ctx.getState();
    expect(state.surah).toBe(36);
    expect(state.ayah).toBe(1);
    expect(state.verseKey).toBe("36:1");
    expect(state.page).toBe(440);

    const loaded = await ctx.db.getKhatmah(ACTIVE_READING_KHATMAH_ID);
    expect(loaded?.current_surah).toBe(36);
    expect(loaded?.current_page).toBe(440);

    // Resume path (may warn on boolean IDB indexes under fake-indexeddb).
    const resumed = await ctx.loadLastReadingProgress();
    expect(resumed?.id === ACTIVE_READING_KHATMAH_ID || resumed?.current_surah === 36).toBe(true);
  });

  it("switching pages then persisting keeps the latest page", async () => {
    const ctx = getQuranEngineContext();
    await ctx.db.initialize();
    ctx.setPage(1);
    ctx.setPage(2);
    await ctx.updateReadingProgress({ surah: 1, ayah: 1, page: 2 });
    ctx.setPage(3);
    await ctx.updateReadingProgress({ surah: 2, ayah: 1, page: 3 });

    const khatmah = await ctx.db.getKhatmah(ACTIVE_READING_KHATMAH_ID);
    expect(khatmah?.current_page).toBe(3);
    expect(khatmah?.current_surah).toBe(2);
    expect(ctx.getState().page).toBe(3);
  });
});
