export * from "./pronunciation-lexicon";
export * from "./ssml-builder";
export * from "./neural-tts-client";
export * from "./ai-reader-orchestrator";

// Stable aliases for gates / callers
export {
  ARABIC_PRONUNCIATION_LEXICON as ARABIC_PRONUNCIATION_LEXICON,
  applyPronunciationLexicon as applyPronunciationLexicon,
  lexiconWordCount as lexiconWordCount,
  PRONUNCIATION_LEXICON_VERSION as PRONUNCIATION_LEXICON_VERSION,
} from "./pronunciation-lexicon";

export {
  buildArabicSsml as buildArabicSsml,
  segmentEditorialText as segmentEditorialText,
  assertSegmentsPreserveText as assertSegmentsPreserveText,
  SSML_VERSION as SSML_VERSION,
} from "./ssml-builder";

export {
  prepareNarrationForPlayback as prepareNarrationForPlayback,
  playAiNarration as playAiNarration,
  stopAiNarration as stopAiNarration,
} from "./ai-reader-orchestrator";
