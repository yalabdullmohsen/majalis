#!/usr/bin/env node
/**
 * Dry-run only: prints promotionPreview plans from deferred-nawazil.json.
 * Does NOT modify books.json.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const deferred = JSON.parse(
  readFileSync(resolve(root, "content/fiqh/deferred-nawazil.json"), "utf8"),
);
const booksRaw = readFileSync(resolve(root, "content/fiqh/books.json"), "utf8");
const books = JSON.parse(booksRaw).books || [];
const lessonIds = new Set();
for (const book of books) {
  for (const chapter of book.chapters || []) {
    for (const lesson of chapter.lessons || []) lessonIds.add(lesson.id);
  }
}

const rows = [];
for (const topic of deferred.topics || []) {
  if (topic.reviewStage !== "review_ready") continue;
  const preview = topic.promotionPreview;
  if (!preview) {
    rows.push({ topicId: topic.id, ok: false, error: "missing promotionPreview" });
    continue;
  }
  const finalId = preview.finalLessonId || preview.lesson?.id;
  const already = finalId ? lessonIds.has(finalId) || booksRaw.includes(`"${finalId}"`) : false;
  rows.push({
    topicId: topic.id,
    mode: preview.mode,
    finalLessonId: finalId,
    insertAfterLessonId: preview.insertAfterLessonId || null,
    insertBeforeLessonId: preview.insertBeforeLessonId || null,
    preferredPath: preview.preferredPath || null,
    previewOnly: preview.previewOnly === true,
    insertedIntoBooksJson: preview.insertedIntoBooksJson === true,
    alreadyInCatalog: already,
    promotionApproved:
      topic.promotionReview?.humanDecision?.promotionApproved === true,
    explicitCommand: preview.applyRequires?.explicitCommand || null,
    patchHints: (preview.patchHints || []).length,
    ok:
      preview.previewOnly === true &&
      preview.insertedIntoBooksJson === false &&
      !already &&
      Boolean(preview.lesson?.id) &&
      Boolean(preview.applyRequires?.explicitCommand),
  });
}

const ok = rows.length > 0 && rows.every((r) => r.ok);
console.log(JSON.stringify({
  dryRun: true,
  modifiesBooksJson: false,
  deferredVersion: deferred.version ?? null,
  previews: rows,
  ok,
}, null, 2));
if (!ok) process.exit(1);
