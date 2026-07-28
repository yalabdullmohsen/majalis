/**
 * Contextual Mutashabihat (Verse Comparison) Engine.
 * Cross-references similar verses and highlights word/letter discrepancies
 * (e.g. presence/absence of و). Pairs with vocabulary hints for Huffaz.
 */

import { MUTASHABIHAT, type MutashabihatPair } from "@/lib/mutashabihat-data";
import {
  loadMutashabihatIndex,
  getSimilarAyahs,
} from "@/lib/recitation-ai/mutashabihat";
import { normalizeArabic } from "@/shared/arabic-normalize";
import { normalizeQuranWord } from "@/lib/recitation-ai/quran-normalize";

export type WordDiscrepancyKind =
  | "missing"
  | "extra"
  | "substituted"
  | "waw_presence"
  | "match";

export type ComparedWord = {
  index: number;
  left: string | null;
  right: string | null;
  kind: WordDiscrepancyKind;
  note?: string;
};

export type VerseComparisonResult = {
  left: { surah: number; ayah: number; text: string };
  right: { surah: number; ayah: number; text: string };
  words: ComparedWord[];
  discrepancyCount: number;
  similarityRatio: number;
  vocabularyHints: VocabularyHint[];
  pairId?: string;
  title?: string;
  hint?: string;
};

export type VocabularyHint = {
  word: string;
  meaning: string;
  reason: string;
};

/** Compact vocabulary for common mutashabihat confusers. */
const HUFFAZ_VOCAB: Array<{ word: string; meaning: string }> = [
  { word: "و", meaning: "واو العطف — غالبًا موضع الالتباس في المتشابه" },
  { word: "الذين", meaning: "اسم موصول للجمع" },
  { word: "الذي", meaning: "اسم موصول للمفرد" },
  { word: "عليهم", meaning: "جار ومجرور — صيغة جمع" },
  { word: "عليه", meaning: "جار ومجرور — صيغة مفرد" },
  { word: "بما", meaning: "باء + ما" },
  { word: "مما", meaning: "من + ما" },
  { word: "العليم", meaning: "من أسماء الله — كثير في خواتيم الآيات" },
  { word: "الحكيم", meaning: "من أسماء الله — يشتبه مع العليم" },
  { word: "القدير", meaning: "من أسماء الله — يشتبه مع الحكيم" },
  { word: "الأواه", meaning: "كثير التأوّه / الدعاء" },
  { word: "الحليم", meaning: "ذو الحلم" },
];

function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function classifyPair(left: string | null, right: string | null): WordDiscrepancyKind {
  if (left && right) {
    const ln = normalizeQuranWord(left);
    const rn = normalizeQuranWord(right);
    if (ln === rn) return "match";
    const lBare = normalizeArabic(left).replace(/^و/, "");
    const rBare = normalizeArabic(right).replace(/^و/, "");
    if (lBare === rBare && normalizeArabic(left) !== normalizeArabic(right)) {
      return "waw_presence";
    }
    return "substituted";
  }
  if (left && !right) return "extra";
  if (!left && right) return "missing";
  return "match";
}

function discrepancyNote(kind: WordDiscrepancyKind, left: string | null, right: string | null): string | undefined {
  if (kind === "waw_presence") {
    const hasWawLeft = !!left && normalizeArabic(left).startsWith("و");
    return hasWawLeft
      ? `الكلمة اليسرى تبدأ بواو، واليمنى ${right || "—"} بلا واو`
      : `الكلمة اليمنى تبدأ بواو، واليسرى ${left || "—"} بلا واو`;
  }
  if (kind === "missing") return `زيادة في النص الأيمن: «${right}»`;
  if (kind === "extra") return `زيادة في النص الأيسر: «${left}»`;
  if (kind === "substituted") return `اختلاف: «${left}» ↔ «${right}»`;
  return undefined;
}

/**
 * Align two verse texts and list word-level discrepancies.
 */
export function compareVerseTexts(
  leftText: string,
  rightText: string,
  refs: {
    left: { surah: number; ayah: number };
    right: { surah: number; ayah: number };
  },
): VerseComparisonResult {
  const L = tokenize(leftText);
  const R = tokenize(rightText);
  const max = Math.max(L.length, R.length);
  const words: ComparedWord[] = [];
  let matches = 0;

  for (let i = 0; i < max; i++) {
    const left = L[i] ?? null;
    const right = R[i] ?? null;
    const kind = classifyPair(left, right);
    if (kind === "match") matches += 1;
    words.push({
      index: i,
      left,
      right,
      kind,
      note: discrepancyNote(kind, left, right),
    });
  }

  const discrepancyCount = words.filter((w) => w.kind !== "match").length;
  const vocabularyHints = buildVocabHints(words);

  return {
    left: { ...refs.left, text: leftText },
    right: { ...refs.right, text: rightText },
    words,
    discrepancyCount,
    similarityRatio: max > 0 ? matches / max : 0,
    vocabularyHints,
  };
}

function buildVocabHints(words: ComparedWord[]): VocabularyHint[] {
  const hints: VocabularyHint[] = [];
  const seen = new Set<string>();
  for (const w of words) {
    if (w.kind === "match") continue;
    for (const token of [w.left, w.right]) {
      if (!token) continue;
      const n = normalizeArabic(token);
      for (const v of HUFFAZ_VOCAB) {
        const vn = normalizeArabic(v.word);
        if ((n === vn || n.includes(vn) || vn.includes(n)) && !seen.has(v.word)) {
          seen.add(v.word);
          hints.push({
            word: v.word,
            meaning: v.meaning,
            reason: w.note || "موضع اختلاف في المتشابه",
          });
        }
      }
      if (normalizeArabic(token).startsWith("و") && !seen.has("و")) {
        seen.add("و");
        hints.push({
          word: "و",
          meaning: "واو العطف — غالبًا موضع الالتباس في المتشابه",
          reason: w.note || "تحقق من وجود الواو",
        });
      }
    }
  }
  return hints.slice(0, 8);
}

export function findCuratedPairsForAyah(surah: number, ayah: number): MutashabihatPair[] {
  return MUTASHABIHAT.filter((p) =>
    p.refs.some((r) => r.surah === surah && r.ayah === ayah),
  );
}

export type MutashabihatCandidate = {
  surah: number;
  ayah: number;
  score: number;
  source: "curated" | "computed";
  pairId?: string;
  title?: string;
  hint?: string;
};

/** List similar ayah refs for an active ayah (curated + computed index). */
export async function listMutashabihatCandidates(
  surah: number,
  ayah: number,
  limit = 10,
): Promise<MutashabihatCandidate[]> {
  const byKey = new Map<string, MutashabihatCandidate>();

  for (const pair of findCuratedPairsForAyah(surah, ayah)) {
    for (const ref of pair.refs) {
      if (ref.surah === surah && ref.ayah === ayah) continue;
      const key = `${ref.surah}:${ref.ayah}`;
      byKey.set(key, {
        surah: ref.surah,
        ayah: ref.ayah,
        score: 0.9,
        source: "curated",
        pairId: pair.id,
        title: pair.title,
        hint: pair.hint,
      });
    }
  }

  try {
    const index = await loadMutashabihatIndex();
    for (const m of getSimilarAyahs(index, surah, ayah)) {
      const key = `${m.surah}:${m.ayah}`;
      const prev = byKey.get(key);
      const score = Math.max(prev?.score ?? 0, Number(m.overlapRatio) || 0);
      byKey.set(key, {
        surah: m.surah,
        ayah: m.ayah,
        score,
        source: prev?.source === "curated" ? "curated" : "computed",
        pairId: prev?.pairId,
        title: prev?.title,
        hint: prev?.hint,
      });
    }
  } catch {
    /* curated only */
  }

  return [...byKey.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Compare active ayah text against a similar ayah text with full discrepancy map.
 */
export function compareMutashabihVerses(opts: {
  leftSurah: number;
  leftAyah: number;
  leftText: string;
  rightSurah: number;
  rightAyah: number;
  rightText: string;
  pairId?: string;
  title?: string;
  hint?: string;
}): VerseComparisonResult {
  const result = compareVerseTexts(opts.leftText, opts.rightText, {
    left: { surah: opts.leftSurah, ayah: opts.leftAyah },
    right: { surah: opts.rightSurah, ayah: opts.rightAyah },
  });
  return {
    ...result,
    pairId: opts.pairId,
    title: opts.title,
    hint: opts.hint,
  };
}
