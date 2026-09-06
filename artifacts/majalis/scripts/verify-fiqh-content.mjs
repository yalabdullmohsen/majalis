#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const booksPath = resolve(root, "content/fiqh/books.json");
const deferredPath = resolve(root, "content/fiqh/deferred-nawazil.json");
const auditPath = resolve(root, "fiqh-content-audit.md");
const errors = [];
const fail = (m) => errors.push(m);

function sourcesOk(sources) {
  return Array.isArray(sources) && sources.length > 0 &&
    sources.every((s) => s?.book?.trim() && s?.author?.trim() && s?.ref?.trim());
}
function isPublishedLesson(lesson) {
  return lesson.status === "published" && lesson.needsReview !== true &&
    Boolean(lesson.bookId) && Boolean(lesson.chapterId) &&
    Boolean(lesson.summary?.trim()) && Boolean(lesson.evidence?.trim()) &&
    Boolean(lesson.preferred?.trim()) && sourcesOk(lesson.sources);
}

const books = JSON.parse(readFileSync(booksPath, "utf8")).books || [];
const lessonIds = new Set();
const chapterKeys = new Set();
const bookIds = new Set();
let publishedCount = 0;
let needsReviewCount = 0;

for (const book of books) {
  if (!book.id?.trim()) fail("كتاب بلا id");
  if (bookIds.has(book.id)) fail(`slug كتاب مكرر: ${book.id}`);
  bookIds.add(book.id);
  if (!book.title?.trim()) fail(`كتاب بلا عنوان: ${book.id}`);
  if (!sourcesOk(book.sources)) fail(`مصادر كتاب ناقصة: ${book.id}`);
  const chapters = book.chapters || [];
  if (!chapters.length) fail(`كتاب بلا أبواب: ${book.id}`);
  for (const chapter of chapters) {
    const ck = `${book.id}/${chapter.id}`;
    if (!chapter.id?.trim()) fail(`باب بلا id في ${book.id}`);
    if (chapterKeys.has(ck)) fail(`slug باب مكرر: ${ck}`);
    chapterKeys.add(ck);
    if ((chapter.order ?? 0) < 1) fail(`ترتيب باب غير صالح: ${ck}`);
    const lessons = chapter.lessons || [];
    if (!lessons.length) fail(`باب بلا مسائل: ${ck}`);
    for (const lesson of lessons) {
      if (!lesson.id?.trim()) fail(`مسألة بلا id في ${ck}`);
      if (lessonIds.has(lesson.id)) fail(`slug مسألة مكرر: ${lesson.id}`);
      lessonIds.add(lesson.id);
      if (!lesson.title?.trim()) fail(`مسألة بلا عنوان: ${lesson.id}`);
      const hasSummary = Boolean(lesson.practicalSummary?.trim() || lesson.preferred?.trim() || lesson.summary?.trim());
      if (!hasSummary) fail(`مسألة بلا خلاصة: ${lesson.id}`);
      if (!sourcesOk(lesson.sources)) fail(`مصادر فارغة/ناقصة: ${lesson.id}`);
      if (lesson.bookId !== book.id) fail(`bookId غير مطابق: ${lesson.id}`);
      if (lesson.chapterId !== chapter.id) fail(`chapterId غير مطابق: ${lesson.id}`);
      if (lesson.needsReview === true || lesson.status === "draft") {
        needsReviewCount += 1;
        if (isPublishedLesson(lesson)) fail(`needsReview يظهر كمنشور: ${lesson.id}`);
      }
      if (lesson.needsReview === true && lesson.status === "published") {
        fail(`needsReview بحالة published في الكتالوج العام: ${lesson.id}`);
      }
      if (isPublishedLesson(lesson)) publishedCount += 1;
    }
  }
}
if (!existsSync(auditPath)) fail("ملف fiqh-content-audit.md غير موجود");

let deferredCount = 0;
if (!existsSync(deferredPath)) {
  fail("ملف content/fiqh/deferred-nawazil.json غير موجود");
} else {
  const deferred = JSON.parse(readFileSync(deferredPath, "utf8"));
  if (deferred.visibility !== "internal_review_only") {
    fail("deferred-nawazil يجب أن يكون visibility=internal_review_only");
  }
  if (deferred.method?.publicCatalog !== false) {
    fail("deferred-nawazil يجب أن يصرّح publicCatalog=false");
  }
  const topics = deferred.topics || [];
  if (topics.length < 4) fail(`deferred-nawazil ينقص موضوعات (الفعلي ${topics.length})`);
  const booksRaw = readFileSync(booksPath, "utf8");
  for (const topic of topics) {
    deferredCount += 1;
    if (!topic.id?.trim()) fail("موضوع مؤجّل بلا id");
    if (!topic.title?.trim()) fail(`موضوع مؤجّل بلا عنوان: ${topic.id}`);
    if (topic.status !== "draft") fail(`موضوع مؤجّل يجب أن يكون draft: ${topic.id}`);
    if (topic.needsReview !== true) fail(`موضوع مؤجّل يجب needsReview=true: ${topic.id}`);
    if (!topic.summary?.trim() || topic.summary.trim().length < 120) {
      fail(`خلاصة مؤجّلة قصيرة/فارغة: ${topic.id}`);
    }
    if (!topic.classicalFrame?.trim() || topic.classicalFrame.trim().length < 80) {
      fail(`إطار مذهبي ناقص في المؤجّل: ${topic.id}`);
    }
    if (!topic.preferred?.trim() || topic.preferred.trim().length < 40) {
      fail(`معتمد ناقص في المؤجّل: ${topic.id}`);
    }
    if (!Array.isArray(topic.boundaries) || topic.boundaries.length < 2) {
      fail(`حدود النازلة ناقصة: ${topic.id}`);
    }
    if (!Array.isArray(topic.openIssues) || topic.openIssues.length < 2) {
      fail(`مسائل مفتوحة ناقصة: ${topic.id}`);
    }
    if (!Array.isArray(topic.editorialChecklist) || topic.editorialChecklist.length < 2) {
      fail(`قائمة تحريرية ناقصة: ${topic.id}`);
    }
    const stage = topic.reviewStage;
    if (stage !== "review_ready" && stage !== "hold") {
      fail(`reviewStage غير صالح في المؤجّل: ${topic.id}`);
    }
    if (stage === "review_ready") {
      const resolutions = topic.proposedResolutions;
      if (!Array.isArray(resolutions) || resolutions.length < 2) {
        fail(`proposedResolutions ناقصة لـ review_ready: ${topic.id}`);
      } else {
        for (const [i, item] of resolutions.entries()) {
          if (!item?.issue?.trim() || !item?.proposal?.trim()) {
            fail(`proposedResolutions[${i}] ناقصة في ${topic.id}`);
          }
        }
      }
      if (!topic.nextAction?.trim()) fail(`nextAction ناقصة لـ review_ready: ${topic.id}`);
      const candidate = topic.lessonCandidate;
      if (!candidate || typeof candidate !== "object") {
        fail(`lessonCandidate مطلوب لـ review_ready: ${topic.id}`);
      } else {
        const requiredText = [
          "id", "title", "bookId", "chapterId", "definition", "summary",
          "preferred", "ruling", "evidence", "practicalSummary",
        ];
        for (const key of requiredText) {
          if (!candidate[key]?.trim()) {
            fail(`lessonCandidate.${key} ناقص في ${topic.id}`);
          }
        }
        if (candidate.status !== "draft") {
          fail(`lessonCandidate.status يجب draft: ${topic.id}`);
        }
        if (candidate.needsReview !== true) {
          fail(`lessonCandidate.needsReview يجب true: ${topic.id}`);
        }
        if (candidate.promotionApproved !== false) {
          fail(`lessonCandidate.promotionApproved يجب false حتى الاعتماد: ${topic.id}`);
        }
        if ((candidate.summary?.trim().length || 0) < 120) {
          fail(`lessonCandidate.summary قصيرة: ${topic.id}`);
        }
        if ((candidate.evidence?.trim().length || 0) < 40) {
          fail(`lessonCandidate.evidence قصيرة: ${topic.id}`);
        }
        if (!sourcesOk(candidate.sources)) {
          fail(`مصادر lessonCandidate ناقصة: ${topic.id}`);
        }
        if (!chapterKeys.has(`${candidate.bookId}/${candidate.chapterId}`)) {
          fail(`lessonCandidate يشير لباب غير موجود: ${topic.id} → ${candidate.bookId}/${candidate.chapterId}`);
        }
        if (lessonIds.has(candidate.id) || booksRaw.includes(`"${candidate.id}"`)) {
          fail(`lessonCandidate تسرب إلى books.json: ${candidate.id}`);
        }
        if (isPublishedLesson(candidate)) {
          fail(`lessonCandidate يظهر كمنشور: ${candidate.id}`);
        }
      }
      const review = topic.promotionReview;
      if (!review || typeof review !== "object") {
        fail(`promotionReview مطلوب لـ review_ready: ${topic.id}`);
      } else {
        if (review.packetStatus !== "awaiting_human_signoff" &&
            review.packetStatus !== "signed_pending_promotion") {
          fail(`promotionReview.packetStatus غير صالح: ${topic.id}`);
        }
        if (!review.recommendedMode?.trim()) {
          fail(`promotionReview.recommendedMode ناقص: ${topic.id}`);
        }
        if (!Array.isArray(review.relatedPublishedLessons) ||
            review.relatedPublishedLessons.length < 1) {
          fail(`relatedPublishedLessons ناقصة: ${topic.id}`);
        } else {
          for (const [i, rel] of review.relatedPublishedLessons.entries()) {
            if (!rel?.id?.trim() || !rel?.relation?.trim()) {
              fail(`relatedPublishedLessons[${i}] ناقصة في ${topic.id}`);
            } else if (!lessonIds.has(rel.id)) {
              fail(`relatedPublishedLesson غير موجود في الكتالوج: ${rel.id}`);
            }
          }
        }
        if (!Array.isArray(review.catalogConsistency) || review.catalogConsistency.length < 2) {
          fail(`catalogConsistency ناقصة: ${topic.id}`);
        }
        if (!Array.isArray(review.riskFlags) || review.riskFlags.length < 1) {
          fail(`riskFlags ناقصة: ${topic.id}`);
        }
        const example = review.appliedExampleDraft;
        if (!example?.title?.trim() || !example?.scenario?.trim() ||
            !example?.teachingPoint?.trim() || example.notFatwa !== true) {
          fail(`appliedExampleDraft ناقص/غير تعليمي: ${topic.id}`);
        }
        const checklist = review.signOffChecklist;
        if (!Array.isArray(checklist) || checklist.length < 3) {
          fail(`signOffChecklist ناقصة: ${topic.id}`);
        } else {
          for (const [i, row] of checklist.entries()) {
            if (!row?.item?.trim() || typeof row.checked !== "boolean") {
              fail(`signOffChecklist[${i}] ناقصة في ${topic.id}`);
            }
          }
        }
        const decision = review.humanDecision;
        if (!decision || typeof decision !== "object") {
          fail(`humanDecision ناقصة: ${topic.id}`);
        } else if (decision.promotionApproved === true) {
          // الترقية الفعلية لـ books.json ما زالت يدوية؛ لكن نسمح بالتوقيع المسجّل
          if (!decision.decidedBy?.trim() || !decision.decidedAt?.trim()) {
            fail(`توقيع ترقية بلا decidedBy/decidedAt: ${topic.id}`);
          }
          if (checklist.some((row) => row.checked !== true)) {
            fail(`promotionApproved مع checklist غير مكتملة: ${topic.id}`);
          }
        } else if (decision.promotionApproved !== false) {
          fail(`humanDecision.promotionApproved يجب boolean: ${topic.id}`);
        }
        // منع التسريب: لا يُعتبر المرشّح معتمدًا للترقية الآلية في هذه الحزمة
        if (topic.lessonCandidate?.promotionApproved === true &&
            decision.promotionApproved !== true) {
          fail(`تعارض promotionApproved بين المرشّح وhumanDecision: ${topic.id}`);
        }
      }
      const preview = topic.promotionPreview;
      if (!preview || typeof preview !== "object") {
        fail(`promotionPreview مطلوب لـ review_ready: ${topic.id}`);
      } else {
        if (preview.previewOnly !== true) {
          fail(`promotionPreview.previewOnly يجب true: ${topic.id}`);
        }
        if (preview.insertedIntoBooksJson !== false) {
          fail(`promotionPreview ما زال غير مُدرج ويجب insertedIntoBooksJson=false: ${topic.id}`);
        }
        if (!preview.mode?.trim()) fail(`promotionPreview.mode ناقص: ${topic.id}`);
        if (!preview.finalLessonId?.trim()) {
          fail(`promotionPreview.finalLessonId ناقص: ${topic.id}`);
        }
        const lesson = preview.lesson;
        if (!lesson || typeof lesson !== "object") {
          fail(`promotionPreview.lesson مطلوب: ${topic.id}`);
        } else {
          const requiredText = [
            "id", "title", "bookId", "chapterId", "definition", "summary",
            "preferred", "ruling", "evidence", "practicalSummary",
          ];
          for (const key of requiredText) {
            if (!lesson[key]?.trim()) {
              fail(`promotionPreview.lesson.${key} ناقص في ${topic.id}`);
            }
          }
          if (lesson.id !== preview.finalLessonId) {
            fail(`finalLessonId لا يطابق lesson.id في ${topic.id}`);
          }
          if (!["مبتدئ", "متوسط", "متقدم"].includes(lesson.level)) {
            fail(`مستوى معاينة غير صالح: ${topic.id}`);
          }
          if (!sourcesOk(lesson.sources)) {
            fail(`مصادر معاينة الترقية ناقصة: ${topic.id}`);
          }
          if (!chapterKeys.has(`${lesson.bookId}/${lesson.chapterId}`)) {
            fail(`معاينة تشير لباب غير موجود: ${topic.id}`);
          }
          if (lessonIds.has(lesson.id) || booksRaw.includes(`"${lesson.id}"`)) {
            fail(`معاينة الترقية تسربت/موجودة في books.json: ${lesson.id}`);
          }
          // المعاينة تعرض الشكل النهائي المقترح، لكن يجب ألا تُحسب ضمن الكتالوج العام
          if (lesson.status !== "published" || lesson.needsReview !== false) {
            fail(`معاينة الترقية يجب أن تعرض الشكل النهائي published/needsReview=false: ${topic.id}`);
          }
        }
        if (preview.insertAfterLessonId && !lessonIds.has(preview.insertAfterLessonId)) {
          fail(`insertAfterLessonId غير موجود: ${preview.insertAfterLessonId}`);
        }
        if (preview.insertBeforeLessonId && !lessonIds.has(preview.insertBeforeLessonId)) {
          fail(`insertBeforeLessonId غير موجود: ${preview.insertBeforeLessonId}`);
        }
        for (const [i, patch] of (preview.patchHints || []).entries()) {
          if (!patch?.lessonId?.trim() || !lessonIds.has(patch.lessonId)) {
            fail(`patchHints[${i}].lessonId غير صالح في ${topic.id}`);
          }
          if (!patch?.field?.trim() || !patch?.action?.trim()) {
            fail(`patchHints[${i}] ناقصة في ${topic.id}`);
          }
        }
        const req = preview.applyRequires;
        if (!req || typeof req !== "object") {
          fail(`applyRequires مطلوب: ${topic.id}`);
        } else {
          if (!req.explicitCommand?.trim()) {
            fail(`applyRequires.explicitCommand مطلوب: ${topic.id}`);
          }
          if (req["humanDecision.promotionApproved"] !== true) {
            fail(`applyRequires يجب أن يشترط humanDecision.promotionApproved=true: ${topic.id}`);
          }
          if (req.allSignOffChecked !== true) {
            fail(`applyRequires يجب أن يشترط allSignOffChecked=true: ${topic.id}`);
          }
        }
      }
    }
    if (stage === "hold") {
      if (!Array.isArray(topic.holdReasons) || topic.holdReasons.length < 2) {
        fail(`holdReasons ناقصة لـ hold: ${topic.id}`);
      }
      if (!topic.nextAction?.trim()) fail(`nextAction ناقصة لـ hold: ${topic.id}`);
      if (topic.lessonCandidate) {
        fail(`موضوع hold لا يجوز أن يحمل lessonCandidate: ${topic.id}`);
      }
      if (topic.promotionReview) {
        fail(`موضوع hold لا يجوز أن يحمل promotionReview: ${topic.id}`);
      }
      if (topic.promotionPreview) {
        fail(`موضوع hold لا يجوز أن يحمل promotionPreview: ${topic.id}`);
      }
    }
    if (!sourcesOk(topic.sources)) fail(`مصادر مؤجّلة ناقصة: ${topic.id}`);
    if (lessonIds.has(topic.id)) fail(`موضوع مؤجّل تسرب إلى books.json: ${topic.id}`);
    if (booksRaw.includes(`"${topic.id}"`)) {
      fail(`معرّف مؤجّل موجود داخل books.json: ${topic.id}`);
    }
    // لا فتوى عملياتية/تنزيلية معاصرة في حزمة الجهاد التعليمية
    if (topic.id === "nawazil-jihad-muasira") {
      if (stage !== "hold") fail("نازلة الجهاد المعاصرة يجب أن تبقى hold");
      const blob = `${topic.summary}\n${topic.practicalSummary}\n${(topic.boundaries || []).join("\n")}`;
      if (!/تعليم|تاريخ|عزل|دون تنزيل|لا تنزيل/.test(blob)) {
        fail("نازلة الجهاد تفتقد تصريح العزل التعليمي عن التنزيل المعاصر");
      }
    }
  }
}

if (errors.length) {
  console.error("❌ verify-fiqh-content failed:");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
const deferredStats = (() => {
  try {
    const d = JSON.parse(readFileSync(deferredPath, "utf8"));
    const topics = d.topics || [];
    return {
      deferredReviewReady: topics.filter((t) => t.reviewStage === "review_ready").length,
      deferredHold: topics.filter((t) => t.reviewStage === "hold").length,
      lessonCandidates: topics.filter((t) => t.lessonCandidate).length,
      promotionReviews: topics.filter((t) => t.promotionReview).length,
      promotionPreviews: topics.filter((t) => t.promotionPreview).length,
      insertedPreviews: topics.filter((t) => t.promotionPreview?.insertedIntoBooksJson === true).length,
      promotionApproved: topics.filter((t) =>
        t.lessonCandidate?.promotionApproved === true ||
        t.promotionReview?.humanDecision?.promotionApproved === true
      ).length,
      deferredVersion: d.version ?? null,
    };
  } catch {
    return {
      deferredReviewReady: 0,
      deferredHold: 0,
      lessonCandidates: 0,
      promotionReviews: 0,
      promotionPreviews: 0,
      insertedPreviews: 0,
      promotionApproved: 0,
      deferredVersion: null,
    };
  }
})();

console.log(JSON.stringify({
  ok: true,
  books: books.length,
  chapters: chapterKeys.size,
  lessons: lessonIds.size,
  publishedLessons: publishedCount,
  needsReviewOrDraft: needsReviewCount,
  deferredNawazil: deferredCount,
  ...deferredStats,
}, null, 2));
