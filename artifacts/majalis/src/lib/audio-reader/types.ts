/**
 * Sunnah Interactive Audio Reader — P0 types.
 * Brand: سُنّة. No TTS for protected religious source text.
 */

export type AudioReaderPhase =
  | "idle"
  | "preparing"
  | "ready"
  | "playing"
  | "paused"
  | "buffering"
  | "seeking"
  | "interrupted"
  | "completed"
  | "failed";

export type AudioReaderEligibilityStatus =
  | "eligible"
  | "partially_eligible"
  | "protected"
  | "blocked"
  | "needs_content_cleanup"
  | "audio_ready"
  | "audio_failed";

export type ContentFamily =
  | "prophets_stories"
  | "seerah_editorial"
  | "islamic_history"
  | "articles_general"
  | "definitions"
  | "educational"
  | "fiqh_reviewed"
  | "aqidah_reviewed"
  | "institution"
  | "lesson_description"
  | "help"
  | "quran"
  | "mushaf"
  | "hadith_reference"
  | "adhkar_reference"
  | "adhan_text"
  | "unpublished"
  | "needs_review"
  | "unknown";

export type SegmentType =
  | "title"
  | "introduction"
  | "heading"
  | "paragraph"
  | "listItem"
  | "quotation"
  | "protectedQuran"
  | "protectedHadith"
  | "protectedDhikr"
  | "protectedAdhan"
  | "sourceSummary"
  | "conclusion"
  | "skip";

export type ProtectedKind =
  | "none"
  | "quran"
  | "hadith"
  | "dhikr"
  | "adhan"
  | "unpublished"
  | "needs_review";

export type NarrationSource = "local_tts" | "cloud_tts" | "human_recording" | "none";

export type CacheStatus = "none" | "partial" | "ready" | "stale" | "corrupt";

export interface ProtectedSpan {
  kind: Exclude<ProtectedKind, "none">;
  start: number;
  end: number;
  reason: string;
  excerpt: string;
}

export interface NarrationSegment {
  segmentId: string;
  contentId: string;
  sectionId: string;
  paragraphId: string;
  text: string;
  displayText: string;
  normalizedPronunciationText: string;
  segmentType: SegmentType;
  protectedStatus: ProtectedKind;
  order: number;
  estimatedDurationMs: number;
  sourceReference?: string;
  /** TTS must never speak when true */
  ttsForbidden: boolean;
}

export interface NarrationManifest {
  contentId: string;
  contentType: ContentFamily;
  contentVersion: string;
  readerVersion: string;
  language: "ar";
  segments: NarrationSegment[];
  protectedSpanCount: number;
  eligibleSpeakableSegmentCount: number;
  preparedAt: string;
  checksum: string;
}

export interface AudioReaderSessionState {
  phase: AudioReaderPhase;
  contentId: string | null;
  contentType: ContentFamily | null;
  sectionId: string | null;
  paragraphId: string | null;
  currentSegment: number;
  currentSentence: number;
  currentPositionMs: number;
  durationMs: number;
  playbackRate: number;
  voiceId: string | null;
  audioSource: NarrationSource;
  cacheStatus: CacheStatus;
  contentVersion: string | null;
  readerVersion: string;
  activeSourceId: string | null;
  requestToken: string | null;
  errorCode: string | null;
  lastUpdatedAt: string;
}

export interface AudioReaderEligibilityInput {
  contentId: string;
  family: ContentFamily;
  published: boolean;
  needsReview: boolean;
  incomplete: boolean;
  missingMandatorySource: boolean;
  contentVersion: string;
  audioVersion?: string | null;
  containsProtectedText: boolean;
  canSafelySeparateProtected: boolean;
  unsupportedElements: boolean;
}

export interface AudioReaderEligibilityResult {
  status: AudioReaderEligibilityStatus;
  audioReaderEligible: boolean;
  /** Prepare manifest only — never implies playback is live */
  mayPrepareNarration: boolean;
  /** Playback requires flags + P1+ enablement; always false in P0 product surface */
  mayStartPlayback: boolean;
  showListenButton: boolean;
  reasons: string[];
  narrationSource: NarrationSource;
  contentLanguage: "ar";
  containsProtectedText: boolean;
  protectedKinds: ProtectedKind[];
}

export interface AudioReaderPrivacyPolicy {
  preferLocalNarration: boolean;
  cloudNarrationAllowed: boolean;
  sendUserPrivateNotes: false;
  sendUnpublishedContent: false;
  sendProtectedText: false;
  logFullNarrationText: false;
  userCanDisableCloud: boolean;
}

export const AUDIO_READER_VERSION = "audio-reader-p0.1.0";

export const AUDIO_READER_PLAYBACK_RATES = [
  0.75, 1, 1.15, 1.25, 1.5, 1.75, 2,
] as const;
