/**
 * Narration preparation pipeline (P0) — manifests only, no synthesis.
 * Derived copy for audio; never mutates source content.
 */

import {
  AUDIO_READER_VERSION,
  type ContentFamily,
  type NarrationManifest,
  type NarrationSegment,
  type ProtectedKind,
  type SegmentType,
} from "./types";
import { evaluateAudioReaderEligibility } from "./eligibility-policy";
import { partitionProtectedText } from "./protected-text";

export type PrepareNarrationInput = {
  contentId: string;
  family: ContentFamily;
  contentVersion: string;
  title?: string;
  body: string;
  published?: boolean;
  needsReview?: boolean;
  incomplete?: boolean;
  missingMandatorySource?: boolean;
  unsupportedElements?: boolean;
  sectionId?: string;
};

function stripUiNoise(raw: string): string {
  return raw
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\b[a-z0-9_-]+\.(tsx?|jsx?|mjs|css)\b/gi, " ")
    .replace(/[✦★☆•●○◆◇]/g, " ")
    .replace(/\u200f|\u200e|\ufeff/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function estimateDurationMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(800, Math.round(words * 420));
}

function mapProtectedToSegmentType(kind: ProtectedKind): SegmentType {
  if (kind === "quran") return "protectedQuran";
  if (kind === "hadith") return "protectedHadith";
  if (kind === "dhikr") return "protectedDhikr";
  if (kind === "adhan") return "protectedAdhan";
  return "paragraph";
}

/** Browser-safe FNV-1a hex — no node:crypto in client bundle. */
export function hashNarrationPayload(payload: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Build a narration manifest. Never mutates source content; derived only.
 * Does not generate audio files or speak.
 */
export function prepareNarrationManifest(
  input: PrepareNarrationInput,
): NarrationManifest {
  const cleaned = stripUiNoise(input.body || "");
  const pieces = partitionProtectedText(cleaned);
  const containsProtectedText = pieces.some((p) => p.type === "protected");
  const canSafelySeparateProtected =
    !containsProtectedText ||
    pieces.some((p) => p.type === "speakable" && p.text.trim().length > 0);

  const eligibility = evaluateAudioReaderEligibility({
    contentId: input.contentId,
    family: input.family,
    published: input.published !== false,
    needsReview: Boolean(input.needsReview),
    incomplete: input.incomplete ?? !cleaned,
    missingMandatorySource: Boolean(input.missingMandatorySource),
    contentVersion: input.contentVersion,
    containsProtectedText,
    canSafelySeparateProtected,
    unsupportedElements: Boolean(input.unsupportedElements),
  });

  const emptyManifest = (checksumSeed: string): NarrationManifest => ({
    contentId: input.contentId,
    contentType: input.family,
    contentVersion: input.contentVersion,
    readerVersion: AUDIO_READER_VERSION,
    language: "ar",
    segments: [],
    protectedSpanCount: 0,
    eligibleSpeakableSegmentCount: 0,
    preparedAt: new Date().toISOString(),
    checksum: hashNarrationPayload(checksumSeed),
  });

  if (!eligibility.mayPrepareNarration) {
    return emptyManifest(`${input.contentId}:blocked:${eligibility.status}`);
  }

  const segments: NarrationSegment[] = [];
  let order = 0;

  if (input.title?.trim()) {
    segments.push({
      segmentId: `${input.contentId}:title`,
      contentId: input.contentId,
      sectionId: input.sectionId ?? "root",
      paragraphId: "title",
      text: input.title.trim(),
      displayText: input.title.trim(),
      normalizedPronunciationText: input.title.trim(),
      segmentType: "title",
      protectedStatus: "none",
      order: order++,
      estimatedDurationMs: estimateDurationMs(input.title),
      ttsForbidden: false,
    });
  }

  for (const part of pieces) {
    const paragraphs = part.text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (let i = 0; i < paragraphs.length; i++) {
      const text = paragraphs[i];
      if (part.type === "protected") {
        segments.push({
          segmentId: `${input.contentId}:s${order}`,
          contentId: input.contentId,
          sectionId: input.sectionId ?? "root",
          paragraphId: `p${order}`,
          text,
          displayText: text,
          normalizedPronunciationText: "",
          segmentType: mapProtectedToSegmentType(part.kind),
          protectedStatus: part.kind,
          order: order++,
          estimatedDurationMs: 0,
          ttsForbidden: true,
        });
      } else {
        segments.push({
          segmentId: `${input.contentId}:s${order}`,
          contentId: input.contentId,
          sectionId: input.sectionId ?? "root",
          paragraphId: `p${order}`,
          text,
          displayText: text,
          normalizedPronunciationText: text,
          segmentType: "paragraph",
          protectedStatus: "none",
          order: order++,
          estimatedDurationMs: estimateDurationMs(text),
          ttsForbidden: false,
        });
      }
    }
  }

  const speakable = segments.filter((s) => !s.ttsForbidden);
  const protectedCount = segments.filter((s) => s.ttsForbidden).length;
  const checksum = hashNarrationPayload(
    JSON.stringify({
      contentId: input.contentId,
      contentVersion: input.contentVersion,
      readerVersion: AUDIO_READER_VERSION,
      segments: segments.map((s) => ({
        order: s.order,
        type: s.segmentType,
        protected: s.protectedStatus,
        text: s.text,
      })),
    }),
  );

  return {
    contentId: input.contentId,
    contentType: input.family,
    contentVersion: input.contentVersion,
    readerVersion: AUDIO_READER_VERSION,
    language: "ar",
    segments,
    protectedSpanCount: protectedCount,
    eligibleSpeakableSegmentCount: speakable.length,
    preparedAt: new Date().toISOString(),
    checksum,
  };
}

/** True when a cached audio artifact may be reused. */
export function narrationCacheMatchesContent(opts: {
  contentVersion: string;
  cachedContentVersion: string;
  manifestChecksum: string;
  cachedManifestChecksum: string;
}): boolean {
  return (
    opts.contentVersion === opts.cachedContentVersion &&
    opts.manifestChecksum === opts.cachedManifestChecksum
  );
}

/** Segments that must never be sent to TTS. */
export function listTtsForbiddenSegments(
  manifest: NarrationManifest,
): NarrationSegment[] {
  return manifest.segments.filter((s) => s.ttsForbidden);
}
