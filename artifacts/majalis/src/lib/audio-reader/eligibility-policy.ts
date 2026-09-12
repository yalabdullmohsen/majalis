/**
 * Eligibility Policy — what may be prepared / played by Audio Reader.
 * P0: prepare allowed for editorial families; playback always gated OFF.
 */

import { isFamilyPlaybackFlagOn, getAudioReaderFlags } from "./feature-flags";
import type {
  AudioReaderEligibilityInput,
  AudioReaderEligibilityResult,
  ContentFamily,
  ProtectedKind,
  NarrationSource,
} from "./types";

const ALWAYS_BLOCKED: ReadonlySet<ContentFamily> = new Set([
  "quran",
  "mushaf",
  "hadith_reference",
  "adhkar_reference",
  "adhan_text",
  "unpublished",
  "needs_review",
]);

/** Families that may enter the narration *preparation* pipeline in P0 (no live play). */
const PREPARE_ALLOWED: ReadonlySet<ContentFamily> = new Set([
  "prophets_stories",
  "seerah_editorial",
  "islamic_history",
  "articles_general",
  "definitions",
  "educational",
  "help",
  "lesson_description",
  "institution",
  "fiqh_reviewed",
  "aqidah_reviewed",
]);

export function isAlwaysBlockedFamily(family: ContentFamily): boolean {
  return ALWAYS_BLOCKED.has(family);
}

export function isPrepareAllowedFamily(family: ContentFamily): boolean {
  return PREPARE_ALLOWED.has(family);
}

export function evaluateAudioReaderEligibility(
  input: AudioReaderEligibilityInput,
): AudioReaderEligibilityResult {
  const reasons: string[] = [];
  const protectedKinds: ProtectedKind[] = [];
  const narrationSource: NarrationSource = "local_tts";
  const flags = getAudioReaderFlags();

  if (!input.published || input.family === "unpublished") {
    reasons.push("content_not_published");
    return blocked("blocked", reasons, input, protectedKinds);
  }
  if (input.needsReview || input.family === "needs_review") {
    reasons.push("needs_review");
    return blocked("blocked", reasons, input, protectedKinds);
  }
  if (ALWAYS_BLOCKED.has(input.family)) {
    reasons.push(`family_blocked:${input.family}`);
    protectedKinds.push(
      input.family === "quran" || input.family === "mushaf"
        ? "quran"
        : input.family === "hadith_reference"
          ? "hadith"
          : input.family === "adhkar_reference"
            ? "dhikr"
            : input.family === "adhan_text"
              ? "adhan"
              : "needs_review",
    );
    return blocked("protected", reasons, input, protectedKinds);
  }
  if (input.incomplete) {
    reasons.push("content_incomplete");
    return blocked("needs_content_cleanup", reasons, input, protectedKinds);
  }
  if (input.missingMandatorySource) {
    reasons.push("missing_mandatory_source");
    return blocked("blocked", reasons, input, protectedKinds);
  }
  if (input.unsupportedElements) {
    reasons.push("unsupported_elements");
    return blocked("needs_content_cleanup", reasons, input, protectedKinds);
  }
  if (
    input.audioVersion &&
    input.contentVersion &&
    input.audioVersion !== input.contentVersion
  ) {
    reasons.push("audio_version_mismatch");
    return {
      status: "audio_failed",
      audioReaderEligible: false,
      mayPrepareNarration: false,
      mayStartPlayback: false,
      showListenButton: false,
      reasons,
      narrationSource: "none",
      contentLanguage: "ar",
      containsProtectedText: input.containsProtectedText,
      protectedKinds,
    };
  }
  if (!PREPARE_ALLOWED.has(input.family)) {
    reasons.push(`family_not_in_phase:${input.family}`);
    return blocked("blocked", reasons, input, protectedKinds);
  }

  if (input.containsProtectedText) {
    protectedKinds.push("quran"); // generic signal; detector fills specifics
    if (!input.canSafelySeparateProtected) {
      reasons.push("protected_text_not_separable");
      return blocked("needs_content_cleanup", reasons, input, protectedKinds);
    }
    reasons.push("partially_eligible_protected_spans");
    const mayPrepare = true;
    const mayPlay =
      flags.audioReaderEnabled && isFamilyPlaybackFlagOn(input.family, flags);
    return {
      status: "partially_eligible",
      audioReaderEligible: true,
      mayPrepareNarration: mayPrepare,
      mayStartPlayback: mayPlay,
      showListenButton: mayPlay,
      reasons,
      narrationSource,
      contentLanguage: "ar",
      containsProtectedText: true,
      protectedKinds,
    };
  }

  const mayPrepare = true;
  const mayPlay =
    flags.audioReaderEnabled && isFamilyPlaybackFlagOn(input.family, flags);
  reasons.push(mayPlay ? "eligible_playback_armed" : "eligible_prepare_only_p0");

  return {
    status: mayPlay ? "eligible" : "eligible",
    audioReaderEligible: true,
    mayPrepareNarration: mayPrepare,
    mayStartPlayback: mayPlay,
    showListenButton: mayPlay,
    reasons,
    narrationSource,
    contentLanguage: "ar",
    containsProtectedText: false,
    protectedKinds,
  };
}

function blocked(
  status: AudioReaderEligibilityResult["status"],
  reasons: string[],
  input: AudioReaderEligibilityInput,
  protectedKinds: ProtectedKind[],
): AudioReaderEligibilityResult {
  return {
    status,
    audioReaderEligible: false,
    mayPrepareNarration: false,
    mayStartPlayback: false,
    showListenButton: false,
    reasons,
    narrationSource: "none",
    contentLanguage: "ar",
    containsProtectedText: input.containsProtectedText,
    protectedKinds,
  };
}
