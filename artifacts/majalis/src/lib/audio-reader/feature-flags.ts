/**
 * Feature flags — all playback OFF in P0.
 * Development scaffolding only; no user-facing enablement.
 */

export interface AudioReaderFeatureFlags {
  audioReaderEnabled: boolean;
  prophetsStoriesAudioEnabled: boolean;
  seerahAudioEnabled: boolean;
  historyAudioEnabled: boolean;
  knowledgeAudioEnabled: boolean;
  cloudNarrationEnabled: boolean;
  synchronizedReadingEnabled: boolean;
  audioDownloadEnabled: boolean;
}

/** P0 defaults: architecture only — never enable section playback. */
export const AUDIO_READER_FLAGS_P0: Readonly<AudioReaderFeatureFlags> = {
  audioReaderEnabled: false,
  prophetsStoriesAudioEnabled: false,
  seerahAudioEnabled: false,
  historyAudioEnabled: false,
  knowledgeAudioEnabled: false,
  cloudNarrationEnabled: false,
  synchronizedReadingEnabled: false,
  audioDownloadEnabled: false,
};

let runtimeFlags: AudioReaderFeatureFlags = { ...AUDIO_READER_FLAGS_P0 };

export function getAudioReaderFlags(): Readonly<AudioReaderFeatureFlags> {
  return runtimeFlags;
}

/** Test / internal override only. Never call from product UI in P0. */
export function setAudioReaderFlagsForTests(
  partial: Partial<AudioReaderFeatureFlags>,
): void {
  runtimeFlags = { ...runtimeFlags, ...partial };
}

export function resetAudioReaderFlags(): void {
  runtimeFlags = { ...AUDIO_READER_FLAGS_P0 };
}

export function isFamilyPlaybackFlagOn(
  family: string,
  flags: Readonly<AudioReaderFeatureFlags> = getAudioReaderFlags(),
): boolean {
  if (!flags.audioReaderEnabled) return false;
  switch (family) {
    case "prophets_stories":
      return flags.prophetsStoriesAudioEnabled;
    case "seerah_editorial":
      return flags.seerahAudioEnabled;
    case "islamic_history":
      return flags.historyAudioEnabled;
    case "articles_general":
    case "definitions":
    case "educational":
    case "help":
    case "lesson_description":
    case "institution":
    case "fiqh_reviewed":
    case "aqidah_reviewed":
      return flags.knowledgeAudioEnabled;
    default:
      return false;
  }
}
