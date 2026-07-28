/**
 * اختبارات — مسارات تعلم، ربط فقهي، سجل أخطاء، وسم دلالي، نسخ احتياطي
 * تشغيل: npx tsx src/lib/__tests__/learning-tracks-fiqh-backup.test.ts
 */

import {
  listLearningTracks,
  completeTrackLesson,
  computeTrackCompletionPercent,
  getResumePointers,
  loadTrackProgress,
  snapshotTrack,
  getTrackDefinition,
} from "../learning-track-tracker";
import {
  buildFiqhCrossLinkPayload,
  searchFiqhCrossLinks,
  flattenFiqhReferences,
} from "../fiqh-cross-linker";
import { RULINGS_ENCYCLOPEDIA_SEED } from "../rulings-data-loader";
import {
  logMistake,
  logMistakeCorrect,
  getPrioritizedMistakes,
  listMistakes,
} from "../mistake-log-manager";
import {
  suggestSemanticTags,
  mergeTags,
  searchVaultSemantic,
} from "../semantic-vault-tagging";
import { upsertAnnotation } from "../personal-knowledge-vault";
import {
  createLocalBackup,
  serializeBackupEnvelope,
  validateAndDecodeBackup,
  restoreFromBackupFile,
  BACKUP_MAGIC,
} from "../local-backup-migration";

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
} as Storage;

console.log("\n=== 1. Learning track tracker ===");
{
  const tracks = listLearningTracks();
  assert(tracks.length >= 3, "builtin tracks present");
  const fiqh = getTrackDefinition("fiqh:ubudah-stages");
  assert(!!fiqh && fiqh.lessons.length === 5, "fiqh stages track");
  const snap0 = snapshotTrack(fiqh!);
  assert(snap0.completionPercent === 0, "starts at 0%");
  completeTrackLesson("fiqh:ubudah-stages", "fq-1");
  const p = loadTrackProgress("fiqh:ubudah-stages");
  assert(p.completedLessonIds.includes("fq-1"), "lesson completed");
  assert(computeTrackCompletionPercent(fiqh!, p) === 20, "20% after one lesson");
  assert(getResumePointers().some((r) => r.track.id === "fiqh:ubudah-stages"), "resume pointer");
}

console.log("\n=== 2. Fiqh cross-linker ===");
{
  const sample =
    RULINGS_ENCYCLOPEDIA_SEED.find(
      (r) => (r.quran_evidence?.length || 0) > 0 || (r.sunnah_evidence?.length || 0) > 0,
    ) || RULINGS_ENCYCLOPEDIA_SEED[0];
  assert(!!sample, "seed ruling available");
  const payload = buildFiqhCrossLinkPayload(sample);
  assert(payload.rulingId === sample.id, "payload ruling id");
  const flat = flattenFiqhReferences(payload);
  assert(Array.isArray(flat), "flat refs");
  const hits = searchFiqhCrossLinks(sample.title.slice(0, 8) || "صلاة", 3);
  assert(hits.length >= 1, "search finds rulings");
}

console.log("\n=== 3. Mistake log ===");
{
  logMistake({
    source: "flashcard",
    itemId: "lesson:card-1",
    prompt: "ما أركان الإسلام؟",
    expectedAnswer: "خمسة",
    userAnswer: "أربعة",
  });
  logMistake({ source: "flashcard", itemId: "lesson:card-1" });
  const q = getPrioritizedMistakes();
  assert(q.some((m) => m.itemId === "lesson:card-1" && m.missCount >= 2), "priority queue");
  logMistakeCorrect("flashcard", "lesson:card-1");
  logMistakeCorrect("flashcard", "lesson:card-1");
  logMistakeCorrect("flashcard", "lesson:card-1");
  const mastered = listMistakes(true).find((m) => m.itemId === "lesson:card-1");
  assert(!!mastered && mastered.mastered, "mastery after 3 corrects");
}

console.log("\n=== 4. Semantic vault tagging ===");
{
  const tags = suggestSemanticTags("حكم فقه في الصلاة والزكاة من مسائل الفقه");
  assert(tags.includes("Fiqh"), "suggests Fiqh");
  assert(mergeTags(["قديم"], ["Fiqh", "Fiqh"]).includes("Fiqh"), "merge unique");
  await upsertAnnotation({
    kind: "other",
    targetId: "note-1",
    body: "فائدة في تفسير سورة البقرة وتدبر الآيات",
    tags: [],
  });
  const docs = await searchVaultSemantic({ text: "تفسير", limit: 10 });
  assert(docs.length >= 1, "vault semantic search");
  assert(docs[0].suggestedTags.length >= 1, "suggested tags on docs");
}

console.log("\n=== 5. Local backup migration ===");
{
  mem.set("majalis-user-streak-v1", JSON.stringify({ currentStreak: 5, longestStreak: 5 }));
  const env = await createLocalBackup();
  assert(env.magic === BACKUP_MAGIC && !!env.data, "backup envelope");
  const raw = serializeBackupEnvelope(env);
  const validated = await validateAndDecodeBackup(raw);
  assert(validated.ok && !!validated.payload, "validate decode");
  mem.clear();
  const restored = await restoreFromBackupFile(raw);
  assert(restored.ok && restored.restored.includes("userStreak"), "restore streak");
  assert(mem.has("majalis-user-streak-v1"), "streak key written");

  // encrypted round-trip when subtle available
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encEnv = await createLocalBackup({ passphrase: "test-pass-123" });
    assert(encEnv.encrypted === true, "encrypted flag");
    const encRaw = serializeBackupEnvelope(encEnv);
    const bad = await validateAndDecodeBackup(encRaw, "wrong");
    assert(bad.ok === false, "wrong passphrase fails");
    const good = await validateAndDecodeBackup(encRaw, "test-pass-123");
    assert(good.ok === true, "correct passphrase works");
  }
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
