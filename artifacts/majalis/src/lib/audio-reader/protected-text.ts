/**
 * Protected text detection — Quran / hadith / dhikr / adhan must never be TTS'd.
 * Heuristic + explicit markers; false negatives stay conservative (mark protected).
 */

import type { ProtectedKind, ProtectedSpan } from "./types";

const QURAN_MARKERS = [
  /﴿[^﴾]+﴾/g,
  /\[\s*سورة\s+[^\]]+\]/g,
  /(?:الآية|آية)\s*(?:\d+|[\u0660-\u0669]+)/g,
  /(?:Quran|القرآن)\s*\d+:\d+/gi,
];

const HADITH_MARKERS = [
  /(?:قال\s+رسول\s+الله|عن\s+[^\n]{2,40}\s+قال\s*:)/g,
  /(?:صحيح\s+البخاري|صحيح\s+مسلم|سنن\s+أبي\s+داود|جامع\s+الترمذي)/g,
  /(?:Hadith|الحديث)\s*(?:رقم|:)?\s*\d+/gi,
];

const DHIKR_MARKERS = [
  /(?:سبحان\s+الله\s+والحمد\s+لله|لا\s+إله\s+إلا\s+الله\s+والله\s+أكبر)/g,
  /(?:أستغفر\s+الله|اللهم\s+صل\s+على\s+محمد)/g,
];

const ADHAN_MARKERS = [
  /(?:الله\s+أكبر\s+الله\s+أكبر|أشهد\s+أن\s+لا\s+إله\s+إلا\s+الله)/g,
  /(?:حي\s+على\s+الصلاة|حي\s+على\s+الفلاح)/g,
];

export interface ProtectedDetectionResult {
  containsProtectedText: boolean;
  spans: ProtectedSpan[];
  kinds: ProtectedKind[];
}

function collect(
  text: string,
  kind: Exclude<ProtectedKind, "none">,
  patterns: RegExp[],
  reason: string,
): ProtectedSpan[] {
  const spans: ProtectedSpan[] = [];
  for (const re of patterns) {
    const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
    const global = new RegExp(re.source, flags);
    let m: RegExpExecArray | null;
    while ((m = global.exec(text)) !== null) {
      spans.push({
        kind,
        start: m.index,
        end: m.index + m[0].length,
        reason,
        excerpt: m[0].slice(0, 80),
      });
    }
  }
  return spans;
}

export function detectProtectedText(text: string): ProtectedDetectionResult {
  const spans = [
    ...collect(text, "quran", QURAN_MARKERS, "quran_marker"),
    ...collect(text, "hadith", HADITH_MARKERS, "hadith_marker"),
    ...collect(text, "dhikr", DHIKR_MARKERS, "dhikr_marker"),
    ...collect(text, "adhan", ADHAN_MARKERS, "adhan_marker"),
  ].sort((a, b) => a.start - b.start);

  const kinds = [...new Set(spans.map((s) => s.kind))] as ProtectedKind[];
  return {
    containsProtectedText: spans.length > 0,
    spans,
    kinds: kinds.length ? kinds : ["none"],
  };
}

export type PartitionPiece =
  | { type: "speakable"; text: string; start: number; end: number }
  | {
      type: "protected";
      text: string;
      start: number;
      end: number;
      kind: Exclude<ProtectedKind, "none">;
    };

/** Split text so protected spans are isolated from TTS-eligible parts. */
export function partitionProtectedText(text: string): PartitionPiece[] {
  const { spans } = detectProtectedText(text);
  if (!spans.length) {
    return text
      ? [{ type: "speakable", text, start: 0, end: text.length }]
      : [];
  }

  const merged: ProtectedSpan[] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s.start <= last.end) {
      last.end = Math.max(last.end, s.end);
      if (s.kind !== last.kind) last.kind = "quran"; // escalate mixed
    } else {
      merged.push({ ...s });
    }
  }

  const pieces: PartitionPiece[] = [];
  let cursor = 0;
  for (const s of merged) {
    if (s.start > cursor) {
      pieces.push({
        type: "speakable",
        text: text.slice(cursor, s.start),
        start: cursor,
        end: s.start,
      });
    }
    pieces.push({
      type: "protected",
      text: text.slice(s.start, s.end),
      start: s.start,
      end: s.end,
      kind: s.kind,
    });
    cursor = s.end;
  }
  if (cursor < text.length) {
    pieces.push({
      type: "speakable",
      text: text.slice(cursor),
      start: cursor,
      end: text.length,
    });
  }
  return pieces.filter((p) => p.text.trim().length > 0);
}

/** Hard gate: never allow TTS for protected kinds. */
export function assertTtsAllowed(
  protectedStatus: ProtectedKind,
): { ok: true } | { ok: false; reason: string } {
  if (protectedStatus === "none") return { ok: true };
  return {
    ok: false,
    reason: `tts_forbidden_for_${protectedStatus}`,
  };
}
