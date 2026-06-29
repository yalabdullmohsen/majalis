/** @fileoverview تحويل سؤال v2 إلى صيغة اللعبة */

import { ideaFingerprint, questionFingerprint } from './dedup.mjs';

/**
 * @param {object} v2
 * @returns {object}
 */
export function toGameQuestion(v2) {
  const options = [...(v2.options || [])];
  const correctIdx = options.findIndex(
    (o) => o.trim() === (v2.correctAnswer || '').trim(),
  );

  return {
    id: v2.id,
    title: v2.title,
    category_slug: v2.categorySlug,
    subcategory_slug: v2.subCategory,
    question_type: v2.questionType || 'multiple_choice',
    question: v2.questionText,
    options,
    correct_index: correctIdx >= 0 ? correctIdx : 0,
    correct_answer: v2.correctAnswer,
    explanation: v2.explanation,
    difficulty: v2.difficulty,
    source: v2.source,
    reference: v2.reference,
    evidence: v2.evidence,
    book_name: v2.bookName,
    hadith_or_ayah_ref: v2.referenceNumber || null,
    keywords: v2.keywords || [],
    points: v2.points,
    time_seconds: v2.timeLimit,
    version: v2.version,
    content_hash: v2.contentHash || questionFingerprint(v2),
    semantic_hash: v2.contentHash,
    idea_hash: ideaFingerprint(v2),
    review_status: v2.status === 'approved' ? 'approved' : 'pending',
    created_at: v2.createdAt,
    updated_at: v2.lastReviewedAt || v2.createdAt,
    last_reviewed_at: v2.lastReviewedAt,
  };
}

/**
 * @param {object[]} v2Questions
 * @returns {object[]}
 */
export function toGameBank(v2Questions) {
  return v2Questions.map(toGameQuestion);
}

/**
 * @param {object} gameQ — صيغة اللعبة
 * @returns {object} v2
 */
export function fromGameQuestion(gameQ) {
  const correctAnswer =
    gameQ.correct_answer ||
    (gameQ.options?.[gameQ.correct_index ?? 0] ?? '');

  return {
    id: gameQ.id,
    title: gameQ.title || gameQ.question?.slice(0, 60),
    questionText: gameQ.question,
    options: gameQ.options || [],
    correctAnswer,
    explanation: gameQ.explanation || '',
    evidence: gameQ.evidence || '',
    reference: gameQ.reference || gameQ.source || '',
    source: gameQ.source || '',
    bookName: gameQ.book_name || gameQ.source || '',
    referenceNumber: gameQ.hadith_or_ayah_ref || null,
    categorySlug: gameQ.category_slug,
    subCategory: gameQ.subcategory_slug || '',
    difficulty: gameQ.difficulty,
    keywords: gameQ.keywords || [],
    timeLimit: gameQ.time_seconds || 30,
    points: gameQ.points || 10,
    createdAt: gameQ.created_at,
    lastReviewedAt: gameQ.last_reviewed_at || gameQ.updated_at,
    version: gameQ.version || 2,
    contentHash: gameQ.content_hash,
    status: gameQ.review_status === 'approved' ? 'approved' : 'pending',
  };
}
