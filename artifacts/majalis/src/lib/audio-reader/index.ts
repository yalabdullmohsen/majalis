/**
 * Sunnah Interactive Audio Reader — P0 public API.
 * Brand: سُنّة. Playback flags default OFF.
 */

export * from "./types";
export * from "./feature-flags";
export * from "./privacy";
export * from "./eligibility-policy";
export * from "./protected-text";
export * from "./narration-pipeline";
export * from "./content-versioning";
export {
  getAudioReaderState,
  getAudioReaderManifest,
  subscribeAudioReader,
  prepareAudioReaderSession,
  requestAudioReaderPlayback,
  stopAudioReader,
  forceStopAudioReaderFromBus,
  __resetAudioReaderForTests,
} from "./audio-reader-service";
