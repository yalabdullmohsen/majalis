#!/usr/bin/env node
/**
 * Gated apply for deferred fiqh promotion previews.
 *
 * Default: refuse, write nothing.
 * Real apply requires ALL of:
 *   1) --topic=<id>
 *   2) --approve="<exact applyRequires.explicitCommand>"
 *   3) humanDecision.promotionApproved === true (+ decidedBy/decidedAt)
 *   4) every signOffChecklist[].checked === true
 *
 * «اكمل» / «أكمل» are never valid --approve values.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const deferredPath = resolve(root, "content/fiqh/deferred-nawazil.json");
const booksPath = resolve(root, "content/fiqh/books.json");

function parseArgs(argv) {
  const out = { topic: null, approve: null, dryRun: false, help: false };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else if (a.startsWith("--topic=")) out.topic = a.slice("--topic=".length);
    else if (a.startsWith("--approve=")) out.approve = a.slice("--approve=".length);
  }
  return out;
}

function usage() {
  return `Usage:
  node scripts/apply-fiqh-promotion.mjs --topic=<topicId> --approve="<explicitCommand>" [--dry-run]

Refuses by default. Does not modify books.json unless every gate passes and --dry-run is absent.
«اكمل» is not a valid approval command.
`;
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function findChapter(books, bookId, chapterId) {
  const book = (books || []).find((b) => b.id === bookId) || null;
  const chapter = book ? (book.chapters || []).find((c) => c.id === chapterId) || null : null;
  return { book, chapter };
}

function ensureContains(value, text) {
  const base = value || "";
  if (base.includes(text)) return base;
  if (!base.trim()) return text;
  const sep = /[.؟!]$/u.test(base.trim()) ? " " : ". ";
  return `${base.trim()}${sep}${text}`.trim();
}

function applyPatchList(chapter, patches) {
  const applied = [];
  for (const patch of patches || []) {
    const lesson = (chapter.lessons || []).find((l) => l.id === patch.lessonId);
    if (!lesson) {
      if (patch.optional) continue;
      throw new Error(`patch target missing: ${patch.lessonId}`);
    }
    const field = patch.field;
    if (patch.action === "ensure_contains") {
      const before = lesson[field] || "";
      lesson[field] = ensureContains(before, patch.text);
      applied.push({
        lessonId: patch.lessonId,
        field,
        action: patch.action,
        changed: before !== lesson[field],
      });
    } else if (patch.action === "replace_phrase") {
      const before = lesson[field] || "";
      if (!before.includes(patch.from)) {
        if (patch.optional) continue;
        throw new Error(`replace_phrase from-text not found in ${patch.lessonId}.${field}`);
      }
      lesson[field] = before.replace(patch.from, patch.to);
      applied.push({ lessonId: patch.lessonId, field, action: patch.action, changed: true });
    } else {
      throw new Error(`unknown patch action: ${patch.action}`);
    }
  }
  return applied;
}

function insertLesson(chapter, lesson, { afterId, beforeId }) {
  const lessons = chapter.lessons || [];
  if (lessons.some((l) => l.id === lesson.id)) {
    throw new Error(`lesson already exists: ${lesson.id}`);
  }
  let idx = lessons.length;
  if (afterId) {
    const afterIdx = lessons.findIndex((l) => l.id === afterId);
    if (afterIdx < 0) throw new Error(`insertAfterLessonId missing: ${afterId}`);
    idx = afterIdx + 1;
  }
  if (beforeId) {
    const beforeIdx = lessons.findIndex((l) => l.id === beforeId);
    if (beforeIdx < 0) throw new Error(`insertBeforeLessonId missing: ${beforeId}`);
    if (afterId && idx > beforeIdx) {
      throw new Error(`insert position invalid: after ${afterId} is not before ${beforeId}`);
    }
    if (!afterId) idx = beforeIdx;
  }
  lessons.splice(idx, 0, lesson);
  chapter.lessons = lessons;
  return idx;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(usage());
  process.exit(0);
}

const report = {
  tool: "apply-fiqh-promotion",
  modifiesBooksJson: false,
  refused: true,
  applied: false,
  reasons: [],
  topicId: args.topic,
  dryRun: args.dryRun,
  gatesOk: false,
};

if (!existsSync(deferredPath) || !existsSync(booksPath)) {
  report.reasons.push("deferred-nawazil.json or books.json missing");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!args.topic) report.reasons.push("missing --topic");
if (!args.approve) report.reasons.push("missing --approve (exact explicitCommand required)");
if (args.approve && /^(اكمل|أكمل)$/u.test(args.approve.trim())) {
  report.reasons.push("«اكمل» is not a valid promotion approval command");
}

const deferred = loadJson(deferredPath);
const topic = (deferred.topics || []).find((t) => t.id === args.topic) || null;
if (args.topic && !topic) report.reasons.push(`topic not found: ${args.topic}`);

if (topic) {
  if (topic.reviewStage !== "review_ready") {
    report.reasons.push(`topic stage is ${topic.reviewStage}, expected review_ready`);
  }
  const preview = topic.promotionPreview;
  const review = topic.promotionReview;
  if (!preview) report.reasons.push("missing promotionPreview");
  if (!review) report.reasons.push("missing promotionReview");

  if (preview) {
    report.explicitCommand = preview.applyRequires?.explicitCommand || null;
    report.finalLessonId = preview.finalLessonId || preview.lesson?.id || null;
    report.mode = preview.mode || null;
    if (preview.insertedIntoBooksJson === true) {
      report.reasons.push("already marked insertedIntoBooksJson=true");
    }
    if (
      args.approve &&
      preview.applyRequires?.explicitCommand &&
      args.approve !== preview.applyRequires.explicitCommand
    ) {
      report.reasons.push("--approve does not match applyRequires.explicitCommand");
    }
  }

  if (review) {
    const decision = review.humanDecision || {};
    const checklist = review.signOffChecklist || [];
    if (decision.promotionApproved !== true) {
      report.reasons.push("humanDecision.promotionApproved is not true in deferred JSON");
    }
    if (decision.promotionApproved === true) {
      if (!decision.decidedBy?.trim()) report.reasons.push("humanDecision.decidedBy missing");
      if (!decision.decidedAt?.trim()) report.reasons.push("humanDecision.decidedAt missing");
    }
    if (!checklist.length || checklist.some((row) => row.checked !== true)) {
      report.reasons.push("signOffChecklist is incomplete");
    }
  }
}

report.gatesOk = report.reasons.length === 0;
if (!report.gatesOk) {
  console.log(JSON.stringify(report, null, 2));
  console.error(usage());
  process.exit(1);
}

const preview = topic.promotionPreview;
const booksDoc = loadJson(booksPath);
const { book, chapter } = findChapter(booksDoc.books || [], preview.bookId, preview.chapterId);
if (!book || !chapter) {
  report.reasons.push(`catalog target missing: ${preview.bookId}/${preview.chapterId}`);
  report.gatesOk = false;
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

report.plan = {
  bookId: preview.bookId,
  chapterId: preview.chapterId,
  mode: preview.mode,
  preferredPath: preview.preferredPath || null,
  insertAfterLessonId: preview.insertAfterLessonId || null,
  insertBeforeLessonId: preview.insertBeforeLessonId || null,
  finalLessonId: preview.finalLessonId,
  patchHints: (preview.patchHints || []).length,
  postInsertEdits: (preview.postInsertEdits || []).length,
};

if (args.dryRun) {
  report.refused = false;
  report.modifiesBooksJson = false;
  report.applied = false;
  report.message = "gates passed; dry-run only — books.json not modified";
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const preferAlignOnly =
  preview.mode === "align_existing_then_optional_insert" &&
  preview.preferredPath === "align_existing";

report.patchesApplied = applyPatchList(chapter, preview.patchHints || []);
if (preferAlignOnly) {
  report.insertedLesson = false;
} else {
  report.insertedIndex = insertLesson(chapter, { ...preview.lesson }, {
    afterId: preview.insertAfterLessonId,
    beforeId: preview.insertBeforeLessonId,
  });
  report.insertedLesson = true;
  report.postInsertEditsApplied = applyPatchList(chapter, preview.postInsertEdits || []);
}

preview.insertedIntoBooksJson = true;
preview.previewOnly = false;
preview.appliedAt = new Date().toISOString();
if (topic.promotionReview) {
  topic.promotionReview.packetStatus = "applied_to_catalog";
}

writeFileSync(booksPath, `${JSON.stringify(booksDoc, null, 2)}\n`, "utf8");
writeFileSync(deferredPath, `${JSON.stringify(deferred, null, 2)}\n`, "utf8");

report.refused = false;
report.modifiesBooksJson = true;
report.applied = true;
console.log(JSON.stringify(report, null, 2));
