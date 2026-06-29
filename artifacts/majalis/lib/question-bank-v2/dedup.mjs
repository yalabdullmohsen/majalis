/** @fileoverview كشف التكرار — content hash + semantic similarity */

import { combinedSimilarity, contentHash, normalizeArabic } from './normalize.mjs';
import { MAX_SIMILARITY } from './constants.mjs';

export function questionFingerprint(q) {
  return contentHash([
    q.questionText,
    ...(q.options || []).sort(),
    q.correctAnswer,
    q.evidence,
  ]);
}

export function ideaFingerprint(q) {
  return contentHash([q.questionText, q.correctAnswer, q.evidence]);
}

export function evidenceFingerprint(q) {
  return contentHash([q.evidence, q.referenceNumber]);
}

/**
 * @param {object} candidate
 * @param {object[]} existing
 * @returns {{ duplicate: boolean, reason?: string, similarity?: number, matchId?: string }}
 */
export function findDuplicate(candidate, existing) {
  const candHash = questionFingerprint(candidate);
  const candIdea = ideaFingerprint(candidate);
  const candEvidence = evidenceFingerprint(candidate);

  for (const q of existing) {
    if (questionFingerprint(q) === candHash) {
      return { duplicate: true, reason: 'content-hash', matchId: q.id };
    }
    if (ideaFingerprint(q) === candIdea) {
      return { duplicate: true, reason: 'idea-hash', matchId: q.id };
    }
    if (evidenceFingerprint(q) === candEvidence && q.evidence) {
      return { duplicate: true, reason: 'evidence-hash', matchId: q.id };
    }

    const simText = combinedSimilarity(
      candidate.questionText,
      q.questionText,
    );
    if (simText >= MAX_SIMILARITY) {
      return { duplicate: true, reason: 'text-similarity', similarity: simText, matchId: q.id };
    }

    const simAnswer = combinedSimilarity(
      candidate.correctAnswer,
      q.correctAnswer,
    );
    if (simAnswer >= MAX_SIMILARITY && simText > 0.5) {
      return { duplicate: true, reason: 'answer-similarity', similarity: simAnswer, matchId: q.id };
    }

    const optsA = (candidate.options || []).join(' ');
    const optsB = (q.options || []).join(' ');
    const simOpts = combinedSimilarity(optsA, optsB);
    if (simOpts >= MAX_SIMILARITY && simText > 0.4) {
      return { duplicate: true, reason: 'options-similarity', similarity: simOpts, matchId: q.id };
    }
  }

  return { duplicate: false };
}

/**
 * @param {object[]} questions
 * @returns {{ unique: object[], rejected: object[], duplicateRate: number }}
 */
export function deduplicateBank(questions) {
  const unique = [];
  const rejected = [];

  for (const q of questions) {
    const dup = findDuplicate(q, unique);
    if (dup.duplicate) {
      rejected.push({ question: q, ...dup });
    } else {
      unique.push(q);
    }
  }

  const duplicateRate = questions.length
    ? rejected.length / questions.length
    : 0;

  return { unique, rejected, duplicateRate };
}

export function auditDuplicates(questions) {
  const pairs = [];
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const sim = combinedSimilarity(
        questions[i].questionText,
        questions[j].questionText,
      );
      if (sim >= MAX_SIMILARITY) {
        pairs.push({
          a: questions[i].id,
          b: questions[j].id,
          similarity: sim,
        });
      }
    }
  }
  return pairs;
}
