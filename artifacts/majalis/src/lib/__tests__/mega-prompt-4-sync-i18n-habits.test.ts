/**
 * Mega-Prompt 4 — hybrid sync, adaptive audio, highlights, milestones.
 * Run: npx tsx src/lib/__tests__/mega-prompt-4-sync-i18n-habits.test.ts
 */
import assert from "node:assert/strict";

const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: () => null,
  get length() {
    return mem.size;
  },
};

const { preferredAudioQualityBand, resolveAdaptiveReciterId } = await import("../adaptive-audio-quality");
const {
  addTextHighlight,
  listTextHighlights,
  removeTextHighlight,
  searchTextHighlights,
} = await import("../text-highlights");
const {
  addRecitationSuccessAyahs,
  loadLocalMilestones,
  markMorningAdhkarDone,
  markSurahCompleted,
} = await import("../local-milestones");
const { ar } = await import("../../locales/ar");
const { en } = await import("../../locales/en");
const { fr } = await import("../../locales/fr");
const { id } = await import("../../locales/id");
const { ur } = await import("../../locales/ur");

// Adaptive quality bands
assert.equal(preferredAudioQualityBand("2g", false), "low");
assert.equal(preferredAudioQualityBand("3g", false), "mid");
assert.equal(preferredAudioQualityBand("4g", false), "high");
assert.equal(preferredAudioQualityBand("4g", true), "low");

{
  const idResolved = resolveAdaptiveReciterId("alafasy");
  assert.equal(typeof idResolved, "string");
  assert.ok(idResolved.length > 0);
}

// Text highlights library
{
  const before = listTextHighlights().length;
  const row = addTextHighlight({
    color: "green",
    source: "tafsir",
    sourceId: "test-1",
    sourceTitle: "أصول التفسير",
    quote: "تفسير القرآن بالقرآن أصل عظيم من أصول التفسير",
    note: "فائدة منهجية",
    href: "/tafsir",
  });
  assert.ok(row.id.startsWith("hl-"));
  assert.equal(listTextHighlights().length, before + 1);
  const found = searchTextHighlights("أصول");
  assert.ok(found.some((h) => h.id === row.id));
  removeTextHighlight(row.id);
  assert.ok(!listTextHighlights().some((h) => h.id === row.id));
}

// Milestones
{
  const m1 = markSurahCompleted(2);
  assert.ok(m1.completedSurahs.includes(2));
  const m2 = markMorningAdhkarDone();
  assert.ok(m2.morningAdhkarStreak >= 1);
  const m3 = addRecitationSuccessAyahs(10);
  assert.ok(m3.recitationSuccessAyahs >= 10);
  const loaded = loadLocalMilestones();
  assert.ok(loaded.completedSurahs.includes(2));
}

// i18n keys present across primary locales
const required = [
  "vault_title",
  "vault_highlights",
  "vault_highlights_empty",
  "sync_guest_migrated",
  "streak_days",
  "lang_overlay_note",
] as const;

for (const key of required) {
  assert.ok(ar[key], `ar missing ${key}`);
  assert.ok(en[key], `en missing ${key}`);
  assert.ok(fr[key], `fr missing ${key}`);
  assert.ok(id[key], `id missing ${key}`);
  assert.ok(ur[key], `ur missing ${key}`);
}

// Guest merge module exports
{
  const merge = await import("../guest-cloud-merge");
  assert.equal(typeof merge.mergeGuestStateToAccount, "function");
  assert.equal(typeof merge.scheduleGuestCloudMerge, "function");
}

console.log("mega-prompt-4-sync-i18n-habits: ok");
